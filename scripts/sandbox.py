"""Local connection sandbox. No production integrations or persistent data."""
import argparse
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass  # Request paths and bodies may contain sensitive data.

    def reply(self, status, data):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            self.reply(200, {"status": "ok", "service": "kot-digital", "mode": "sandbox"})
        else:
            self.reply(404, {"error": "not_found"})

    def do_POST(self):
        if self.path != "/mock/webhook":
            self.reply(404, {"error": "not_found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 65536:
                self.reply(413, {"error": "body_size"})
                return
            json.loads(self.rfile.read(length))
        except (ValueError, UnicodeDecodeError):
            self.reply(400, {"error": "invalid_json"})
            return
        self.reply(200, {"received": True, "mode": "sandbox", "stored": False})


def make_server(host="127.0.0.1", port=8000):
    server = ThreadingHTTPServer((host, port), Handler)
    server.timeout = 10
    return server


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    with make_server(args.host, args.port) as server:
        print(f"KOT sandbox: http://{args.host}:{args.port}/health", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
