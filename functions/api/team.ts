import { currentUser, json, type AuthEnv } from '../_shared/auth'

const MODULES = ['dashboard', 'search', 'favorites', 'collector', 'ppt', 'ai', 'organize', 'reimbursement', 'trash', 'files'] as const
type ModuleKey = (typeof MODULES)[number]

interface TeamEnv extends AuthEnv { DB: D1Database }
interface MemberRow { team_id: string; room_code: string; user_id: string; username: string; role: 'owner' | 'employee'; module: string | null; allowed: number | null }

function permissionsFromRows(rows: MemberRow[]): Record<string, boolean> {
  const permissions = Object.fromEntries(MODULES.map((module) => [module, true])) as Record<ModuleKey, boolean>
  for (const row of rows) if (row.module && row.allowed !== null) permissions[row.module as ModuleKey] = row.allowed === 1
  return permissions
}

async function loadTeam(db: D1Database, userId: string): Promise<unknown> {
  const rows = await db.prepare(`
    SELECT t.id AS team_id, t.room_code, u.id AS user_id, u.username, m.role, p.module, p.allowed
    FROM team_members m JOIN teams t ON t.id = m.team_id JOIN users u ON u.id = m.user_id
    LEFT JOIN team_permissions p ON p.team_id = m.team_id AND p.user_id = m.user_id
    WHERE m.team_id = (SELECT team_id FROM team_members WHERE user_id = ?)
    ORDER BY CASE m.role WHEN 'owner' THEN 0 ELSE 1 END, m.joined_at, u.username
  `).bind(userId).all<MemberRow>()
  const grouped = new Map<string, MemberRow[]>()
  for (const row of rows.results ?? []) grouped.set(row.user_id, [...(grouped.get(row.user_id) ?? []), row])
  const members = Array.from(grouped.values()).map((memberRows) => {
    const first = memberRows[0]
    return { userId: first.user_id, username: first.username, role: first.role, permissions: permissionsFromRows(memberRows) }
  })
  const self = members.find((member) => member.userId === userId)
  if (!self) return { membership: null, permissions: Object.fromEntries(MODULES.map((module) => [module, true])), members: [] }
  const first = (rows.results ?? []).find((row) => row.user_id === userId)!
  return {
    membership: { teamId: first.team_id, roomCode: first.room_code, role: self.role },
    permissions: self.permissions,
    members,
  }
}

export async function onRequestGet({ request, env }: { request: Request; env: TeamEnv }): Promise<Response> {
  if (!env.DB) return json({ error: '团队服务尚未配置' }, 503)
  const user = await currentUser(request, env)
  if (!user) return json({ error: '请先登录' }, 401)
  try { return json(await loadTeam(env.DB, user.id)) }
  catch { return json({ error: '读取团队信息失败，请先应用团队数据库迁移' }, 503) }
}

export async function onRequestPost({ request, env }: { request: Request; env: TeamEnv }): Promise<Response> {
  if (!env.DB) return json({ error: '团队服务尚未配置' }, 503)
  const user = await currentUser(request, env)
  if (!user) return json({ error: '请先登录' }, 401)
  try {
    const body = await request.json() as { action?: string; roomCode?: string }
    const existing = await env.DB.prepare('SELECT team_id, role FROM team_members WHERE user_id = ?').bind(user.id).first<{ team_id: string; role: string }>()

    if (body.action === 'employee') {
      if (existing?.role === 'owner') {
        const occupied = await env.DB.prepare("SELECT COUNT(*) AS count FROM team_members WHERE team_id = ? AND role = 'employee'").bind(existing.team_id).first<{ count: number }>()
        if (occupied && occupied.count > 0) return json({ error: `房间里还有 ${occupied.count} 位员工，暂不能切换身份。请先在“团队”中移除成员；房间清空后会自动删除。` }, 409)
        await env.DB.batch([
          env.DB.prepare('DELETE FROM team_permissions WHERE team_id = ?').bind(existing.team_id),
          env.DB.prepare('DELETE FROM team_members WHERE team_id = ?').bind(existing.team_id),
          env.DB.prepare('DELETE FROM teams WHERE id = ?').bind(existing.team_id),
        ])
        return json({ membership: null, permissions: Object.fromEntries(MODULES.map((module) => [module, true])), members: [] })
      }
      return json(await loadTeam(env.DB, user.id))
    }

    if (body.action === 'boss' || body.action === 'create') {
      if (existing?.role === 'owner') return json(await loadTeam(env.DB, user.id))
      if (existing?.role === 'employee') {
        await env.DB.batch([
          env.DB.prepare('DELETE FROM team_permissions WHERE team_id = ? AND user_id = ?').bind(existing.team_id, user.id),
          env.DB.prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?').bind(existing.team_id, user.id),
        ])
      }
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const random = new Uint32Array(1)
        crypto.getRandomValues(random)
        const roomCode = String(10000000 + (random[0] % 90000000))
        const teamId = crypto.randomUUID()
        try {
          await env.DB.batch([
            env.DB.prepare('INSERT INTO teams (id, room_code, owner_user_id, created_at) VALUES (?, ?, ?, ?)').bind(teamId, roomCode, user.id, new Date().toISOString()),
            env.DB.prepare("INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES (?, ?, 'owner', ?)").bind(teamId, user.id, new Date().toISOString()),
            ...MODULES.map((module) => env.DB.prepare('INSERT INTO team_permissions (team_id, user_id, module, allowed) VALUES (?, ?, ?, 1)').bind(teamId, user.id, module)),
          ])
          return json(await loadTeam(env.DB, user.id), 201)
        } catch { /* retry if room number collided */ }
      }
      return json({ error: '生成房间号失败，请重试' }, 503)
    }

    if (body.action === 'join') {
      if (existing) return json({ error: '这个账号已经加入团队' }, 409)
      const roomCode = typeof body.roomCode === 'string' ? body.roomCode.trim() : ''
      if (!/^\d{8}$/.test(roomCode)) return json({ error: '请输入 8 位房间号' }, 400)
      const now = Math.floor(Date.now() / 1000)
      const attempts = await env.DB.prepare('SELECT attempts, window_started FROM team_join_attempts WHERE user_id = ?').bind(user.id).first<{ attempts: number; window_started: number }>()
      if (attempts && now - attempts.window_started < 600 && attempts.attempts >= 5) return json({ error: '房间号尝试次数过多，请 10 分钟后再试' }, 429)
      const team = await env.DB.prepare('SELECT id FROM teams WHERE room_code = ?').bind(roomCode).first<{ id: string }>()
      if (!team) {
        await env.DB.prepare(`INSERT INTO team_join_attempts (user_id, attempts, window_started) VALUES (?, 1, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            attempts = CASE WHEN ? - window_started >= 600 THEN 1 ELSE attempts + 1 END,
            window_started = CASE WHEN ? - window_started >= 600 THEN ? ELSE window_started END`)
          .bind(user.id, now, now, now, now).run()
        return json({ error: '没有找到这个房间号' }, 404)
      }
      await env.DB.batch([
        env.DB.prepare("INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES (?, ?, 'employee', ?)").bind(team.id, user.id, new Date().toISOString()),
        ...MODULES.map((module) => env.DB.prepare('INSERT INTO team_permissions (team_id, user_id, module, allowed) VALUES (?, ?, ?, 1)').bind(team.id, user.id, module)),
        env.DB.prepare('DELETE FROM team_join_attempts WHERE user_id = ?').bind(user.id),
      ])
      return json(await loadTeam(env.DB, user.id), 201)
    }

    if (body.action === 'removeMember') {
      const owner = await env.DB.prepare("SELECT team_id FROM team_members WHERE user_id = ? AND role = 'owner'").bind(user.id).first<{ team_id: string }>()
      if (!owner) return json({ error: '只有房间创建者可以移除成员' }, 403)
      const memberId = typeof body.userId === 'string' ? body.userId : ''
      const member = await env.DB.prepare("SELECT 1 AS found FROM team_members WHERE team_id = ? AND user_id = ? AND role = 'employee'").bind(owner.team_id, memberId).first()
      if (!member) return json({ error: '团队成员不存在' }, 404)
      await env.DB.batch([
        env.DB.prepare('DELETE FROM team_permissions WHERE team_id = ? AND user_id = ?').bind(owner.team_id, memberId),
        env.DB.prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?').bind(owner.team_id, memberId),
      ])
      return json(await loadTeam(env.DB, user.id))
    }
    return json({ error: '无效的操作' }, 400)
  } catch (error) {
    const message = error instanceof Error && error.message.includes('UNIQUE') ? '你已经加入其他团队' : '团队操作失败，请稍后重试'
    return json({ error: message }, 500)
  }
}

export async function onRequestPut({ request, env }: { request: Request; env: TeamEnv }): Promise<Response> {
  if (!env.DB) return json({ error: '团队服务尚未配置' }, 503)
  const user = await currentUser(request, env)
  if (!user) return json({ error: '请先登录' }, 401)
  try {
    const body = await request.json() as { userId?: string; module?: string; allowed?: boolean }
    if (!body.userId || !MODULES.includes(body.module as ModuleKey) || typeof body.allowed !== 'boolean') return json({ error: '权限参数无效' }, 400)
    const owner = await env.DB.prepare("SELECT team_id FROM team_members WHERE user_id = ? AND role = 'owner'").bind(user.id).first<{ team_id: string }>()
    if (!owner) return json({ error: '只有房间创建者可以设置权限' }, 403)
    const member = await env.DB.prepare("SELECT 1 AS found FROM team_members WHERE team_id = ? AND user_id = ? AND role = 'employee'").bind(owner.team_id, body.userId).first()
    if (!member) return json({ error: '团队成员不存在' }, 404)
    await env.DB.prepare(`INSERT INTO team_permissions (team_id, user_id, module, allowed) VALUES (?, ?, ?, ?)
      ON CONFLICT(team_id, user_id, module) DO UPDATE SET allowed = excluded.allowed`)
      .bind(owner.team_id, body.userId, body.module, body.allowed ? 1 : 0).run()
    return json(await loadTeam(env.DB, user.id))
  } catch { return json({ error: '保存权限失败' }, 500) }
}
