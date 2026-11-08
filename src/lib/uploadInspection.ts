export interface UploadInspection {
  contentHash: string
  isEmpty: boolean
  emptyCheckSupported: boolean
}

interface ZipEntry {
  name: string
  method: number
  compressedSize: number
  localOffset: number
}

import type { WorkbookSheetMeta } from '@/types'

export type WorkbookSheetInspection = WorkbookSheetMeta

function arrayBufferOf(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

async function zipEntries(bytes: Uint8Array): Promise<ZipEntry[] | null> {
  if (bytes.length < 22) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const min = Math.max(0, bytes.length - 65_557)
  let eocd = -1
  for (let i = bytes.length - 22; i >= min; i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) return null
  const count = view.getUint16(eocd + 10, true)
  let offset = view.getUint32(eocd + 16, true)
  const decoder = new TextDecoder()
  const entries: ZipEntry[] = []
  for (let i = 0; i < count; i += 1) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) return null
    const method = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const nameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const localOffset = view.getUint32(offset + 42, true)
    const nameStart = offset + 46
    if (nameStart + nameLength > bytes.length) return null
    entries.push({ name: decoder.decode(bytes.slice(nameStart, nameStart + nameLength)), method, compressedSize, localOffset })
    offset = nameStart + nameLength + extraLength + commentLength
  }
  return entries
}

async function readZipEntry(bytes: Uint8Array, entry: ZipEntry): Promise<Uint8Array | null> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const offset = entry.localOffset
  if (offset + 30 > bytes.length || view.getUint32(offset, true) !== 0x04034b50) return null
  const nameLength = view.getUint16(offset + 26, true)
  const extraLength = view.getUint16(offset + 28, true)
  const start = offset + 30 + nameLength + extraLength
  const end = start + entry.compressedSize
  if (end > bytes.length) return null
  const compressed = bytes.slice(start, end)
  if (entry.method === 0) return compressed
  if (entry.method !== 8 || typeof DecompressionStream === 'undefined') return null
  try {
    const stream = new Blob([arrayBufferOf(compressed)]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
    return new Uint8Array(await new Response(stream).arrayBuffer())
  } catch {
    return null
  }
}

function parseXml(bytes: Uint8Array): Document | null {
  try {
    const xml = new TextDecoder().decode(bytes)
    const doc = new DOMParser().parseFromString(xml, 'application/xml')
    return doc.querySelector('parsererror') ? null : doc
  } catch {
    return null
  }
}

function nodes(doc: Document | Element, localName: string): Element[] {
  return Array.from(doc.getElementsByTagNameNS('*', localName))
}

function hasText(doc: Document, localName: string): boolean {
  return nodes(doc, localName).some((node) => Boolean(node.textContent?.trim()))
}

async function inspectXlsx(bytes: Uint8Array): Promise<boolean | null> {
  const entries = await zipEntries(bytes)
  if (!entries) return null
  const sheets = entries.filter((entry) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(entry.name))
  if (!sheets.length) return null
  const sharedEntry = entries.find((entry) => entry.name === 'xl/sharedStrings.xml')
  const sharedBytes = sharedEntry ? await readZipEntry(bytes, sharedEntry) : null
  const sharedDoc = sharedBytes ? parseXml(sharedBytes) : null
  const sharedStrings = sharedDoc ? nodes(sharedDoc, 'si').map((item) => nodes(item, 't').map((t) => t.textContent ?? '').join('')) : []

  for (const entry of sheets) {
    const sheetBytes = await readZipEntry(bytes, entry)
    const doc = sheetBytes ? parseXml(sheetBytes) : null
    if (!doc) return null
    for (const cell of nodes(doc, 'c')) {
      const formula = nodes(cell, 'f')[0]?.textContent?.trim()
      if (formula) return false
      const value = nodes(cell, 'v')[0]?.textContent
      if (value !== undefined && value !== '') {
        if (cell.getAttribute('t') === 's') {
          const shared = sharedStrings[Number(value)] ?? ''
          if (shared.trim()) return false
        } else if (cell.getAttribute('t') === 'str' && !value.trim()) {
          continue
        } else {
          return false
        }
      }
      const inline = nodes(cell, 'is')[0]
      if (inline && nodes(inline, 't').some((text) => Boolean(text.textContent?.trim()))) return false
    }
  }
  return true
}

async function inspectOfficeZip(bytes: Uint8Array, extension: string): Promise<boolean | null> {
  if (extension === 'xlsx') return inspectXlsx(bytes)
  const entries = await zipEntries(bytes)
  if (!entries) return null
  if (extension === 'docx') {
    const documentEntry = entries.find((entry) => entry.name === 'word/document.xml')
    const documentBytes = documentEntry ? await readZipEntry(bytes, documentEntry) : null
    const doc = documentBytes ? parseXml(documentBytes) : null
    if (!doc) return null
    if (hasText(doc, 't') || nodes(doc, 'drawing').length || nodes(doc, 'object').length || entries.some((entry) => entry.name.startsWith('word/media/'))) return false
    return true
  }
  if (extension === 'pptx') {
    const slides = entries.filter((entry) => /^ppt\/slides\/slide\d+\.xml$/i.test(entry.name))
    if (!slides.length) return null
    for (const entry of slides) {
      const slideBytes = await readZipEntry(bytes, entry)
      const doc = slideBytes ? parseXml(slideBytes) : null
      if (!doc) return null
      if (hasText(doc, 't') || nodes(doc, 'pic').length || nodes(doc, 'graphicFrame').length || nodes(doc, 'oleObj').length) return false
    }
    if (entries.some((entry) => entry.name.startsWith('ppt/media/'))) return false
    return true
  }
  return null
}

function normalizeZipPath(path: string): string {
  const parts: string[] = []
  for (const part of path.replace(/^\/+/, '').split('/')) {
    if (!part || part === '.') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }
  return parts.join('/')
}

function worksheetPath(target: string): string {
  if (target.startsWith('/')) return normalizeZipPath(target)
  if (target.startsWith('xl/')) return normalizeZipPath(target)
  return normalizeZipPath(`xl/${target}`)
}

function sharedStringValues(doc: Document | null): string[] {
  return doc ? nodes(doc, 'si').map((item) => nodes(item, 't').map((text) => text.textContent ?? '').join('')) : []
}

function cellValue(cell: Element, shared: string[]): string {
  const inline = nodes(cell, 'is')[0]
  if (inline) return nodes(inline, 't').map((text) => text.textContent ?? '').join('').trim()
  const value = nodes(cell, 'v')[0]?.textContent ?? ''
  if (cell.getAttribute('t') === 's') return (shared[Number(value)] ?? '').trim()
  return value.trim()
}

/** Read workbook sheet names, header rows, and a small in-memory sample. Never persists file bytes or sample rows. */
export async function inspectWorkbookSheets(file: File): Promise<WorkbookSheetInspection[]> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const entries = await zipEntries(bytes)
  if (!entries) throw new Error('无法读取这个 Excel 工作簿，请确认文件未损坏')
  const workbookEntry = entries.find((entry) => entry.name === 'xl/workbook.xml')
  const relsEntry = entries.find((entry) => entry.name === 'xl/_rels/workbook.xml.rels')
  const workbookBytes = workbookEntry ? await readZipEntry(bytes, workbookEntry) : null
  const relsBytes = relsEntry ? await readZipEntry(bytes, relsEntry) : null
  const workbook = workbookBytes ? parseXml(workbookBytes) : null
  const relationships = relsBytes ? parseXml(relsBytes) : null
  if (!workbook || !relationships) throw new Error('无法读取 Excel 工作表目录')

  const targets = new Map(nodes(relationships, 'Relationship').map((item) => [item.getAttribute('Id') ?? '', item.getAttribute('Target') ?? '']))
  const sharedEntry = entries.find((entry) => entry.name === 'xl/sharedStrings.xml')
  const sharedBytes = sharedEntry ? await readZipEntry(bytes, sharedEntry) : null
  const shared = sharedStringValues(sharedBytes ? parseXml(sharedBytes) : null)
  const sheets: WorkbookSheetInspection[] = []

  for (const sheetNode of nodes(workbook, 'sheet')) {
    const name = sheetNode.getAttribute('name')?.trim() || `工作表 ${sheets.length + 1}`
    const relationId = sheetNode.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id')
      || sheetNode.getAttribute('r:id') || ''
    const target = targets.get(relationId)
    if (!target) continue
    const path = worksheetPath(target)
    const entry = entries.find((item) => item.name === path)
    const sheetBytes = entry ? await readZipEntry(bytes, entry) : null
    const doc = sheetBytes ? parseXml(sheetBytes) : null
    if (!doc) continue

    const parsedRows = nodes(doc, 'row').map((row) => {
      const cells: string[] = []
      for (const cell of nodes(row, 'c')) {
        const ref = cell.getAttribute('r') ?? ''
        const letters = ref.match(/^[A-Z]+/i)?.[0] ?? ''
        let column = 0
        for (const letter of letters.toUpperCase()) column = column * 26 + letter.charCodeAt(0) - 64
        if (!column) continue
        cells[column - 1] = cellValue(cell, shared)
      }
      return cells
    }).filter((row) => row.some((cell) => Boolean(cell?.trim())))

    if (!parsedRows.length) {
      sheets.push({ name, title: '', headers: [], rowCount: 0 })
      continue
    }
    const candidates = parsedRows.slice(0, 20).map((row, index) => ({ row, index, filled: row.filter((cell) => Boolean(cell?.trim())).length }))
    const header = candidates.reduce((best, candidate) => candidate.filled > best.filled ? candidate : best, candidates[0])
    const titleRow = candidates.slice(0, header.index).find((candidate) => candidate.filled === 1)
    const headers = header.row.map((value, index) => value?.trim() || `列 ${index + 1}`).slice(0, 40)
    const dataRows = parsedRows.slice(header.index + 1).map((row) => row.slice(0, 40).map((value) => value?.trim() ?? ''))
    sheets.push({
      name,
      title: titleRow?.row.find((value) => Boolean(value?.trim()))?.trim() ?? '',
      headers,
      rowCount: dataRows.length,
    })
  }
  return sheets
}

async function isStructurallyEmpty(file: File, bytes: Uint8Array): Promise<{ empty: boolean; supported: boolean }> {
  if (file.size === 0) return { empty: true, supported: true }
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (extension === 'csv') return { empty: !new TextDecoder().decode(bytes).replace(/^\uFEFF/, '').trim(), supported: true }
  if (['xlsx', 'docx', 'pptx'].includes(extension)) {
    const empty = await inspectOfficeZip(bytes, extension)
    return empty === null ? { empty: false, supported: false } : { empty, supported: true }
  }
  return { empty: false, supported: false }
}

/** Hashes locally in memory, checks supported blank formats, and never uploads or persists file bytes. */
export async function inspectUploadFile(file: File): Promise<UploadInspection> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const digest = await crypto.subtle.digest('SHA-256', arrayBufferOf(bytes))
  const contentHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  const status = await isStructurallyEmpty(file, bytes)
  return { contentHash, isEmpty: status.empty, emptyCheckSupported: status.supported }
}
