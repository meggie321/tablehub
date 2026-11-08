"""表格汇 TableHub —— 本地静态站点服务（SPA 回退 + 正确 MIME 类型）。

两个 Windows 上的坑，这里都处理了：
1. Python 会从注册表读 MIME，常把 .js 映射成 text/plain，那会让浏览器拒绝加载
   ES Module，所以强制修正关键类型。
2. SO_REUSEADDR 在 Windows 上允许「抢占」已被占用的端口，会导致服务看似启动成功
   却收不到任何请求；所以 Windows 下关闭它，端口被占用时明确失败并自动顺延。

用法:
    python serve.py [port] [--open]
        port    起始端口，默认 5180；被占用时自动尝试 +1 … +9
        --open  绑定成功后自动打开浏览器
"""
import http.server
import mimetypes
import os
import socketserver
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")

_args = [a for a in sys.argv[1:] if not a.startswith("--")]
PORT = int(_args[0]) if _args else 5180
OPEN_BROWSER = "--open" in sys.argv

for ext, mime in {
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".webmanifest": "application/manifest+json",
}.items():
    mimetypes.add_type(mime, ext)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_head(self):
        target = self.translate_path(self.path)
        if not os.path.exists(target):
            self.path = "/index.html"
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


# Windows 上 SO_REUSEADDR 会让端口被占用时仍然「绑定成功」，必须关闭
socketserver.TCPServer.allow_reuse_address = os.name != "nt"


def main():
    if not os.path.isdir(ROOT):
        print("dist/ 不存在，请先运行 pnpm build", flush=True)
        sys.exit(1)

    for candidate in range(PORT, PORT + 10):
        try:
            httpd = socketserver.TCPServer(("127.0.0.1", candidate), Handler)
        except OSError:
            print("端口 %d 已被占用，尝试 %d …" % (candidate, candidate + 1), flush=True)
            continue

        url = "http://127.0.0.1:%d/" % candidate
        print("TableHub demo -> %s" % url, flush=True)
        if candidate != PORT:
            print("（%d 被其它程序占用，已自动顺延到 %d）" % (PORT, candidate), flush=True)
        if OPEN_BROWSER:
            try:
                import webbrowser

                webbrowser.open(url)
            except Exception:
                pass
        httpd.serve_forever()
        return

    print("端口 %d-%d 全部被占用，未能启动" % (PORT, PORT + 9), flush=True)
    sys.exit(1)


if __name__ == "__main__":
    main()
