import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen


class QBankHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/proxy":
            self.proxy_request(parsed)
            return
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/ai-proxy":
            self.ai_proxy_request()
            return
        self.send_error(404, "Not found")

    def proxy_request(self, parsed):
        target = parse_qs(parsed.query).get("url", [""])[0]
        allowed = (
            "https://diuqbank.com/",
            "https://diuqbank-com.sgp1.cdn.digitaloceanspaces.com/",
            "https://firebasestorage.googleapis.com/",
            "https://storage.googleapis.com/",
        )
        if not target.startswith(allowed):
            self.send_error(400, "Unsupported proxy target")
            return

        try:
            req = Request(
                target,
                headers={
                    "User-Agent": "Mozilla/5.0 DIU-QBank-local-viewer",
                    "Referer": "https://diuqbank.com/",
                },
            )
            with urlopen(req, timeout=25) as upstream:
                data = upstream.read()
                content_type = upstream.headers.get("Content-Type", "application/octet-stream")
                if target.lower().split("?", 1)[0].endswith(".pdf"):
                    content_type = "application/pdf"
                self.send_response(200)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(data)))
                self.send_header("Content-Disposition", "inline")
                self.end_headers()
                self.wfile.write(data)
        except Exception as exc:
            self.send_error(502, f"Proxy fetch failed: {exc}")

    def ai_proxy_request(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
            provider = payload.get("provider")
            key = payload.get("key")
            prompt = payload.get("prompt")
            model = payload.get("model")
            if provider not in {"groq", "openai", "anthropic"} or not key or not prompt:
                self.send_error(400, "Missing provider, key, or prompt")
                return

            if provider == "groq":
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {"Authorization": f"Bearer {key}"}
                body = {"model": model, "max_tokens": 1500, "messages": [{"role": "user", "content": prompt}]}
            elif provider == "openai":
                url = "https://api.openai.com/v1/chat/completions"
                headers = {"Authorization": f"Bearer {key}"}
                body = {"model": model, "max_tokens": 1500, "messages": [{"role": "user", "content": prompt}]}
            else:
                url = "https://api.anthropic.com/v1/messages"
                headers = {"x-api-key": key, "anthropic-version": "2023-06-01"}
                body = {"model": model, "max_tokens": 1500, "messages": [{"role": "user", "content": prompt}]}

            req = Request(
                url,
                data=json.dumps(body).encode("utf-8"),
                headers={"Content-Type": "application/json", **headers},
                method="POST",
            )
            with urlopen(req, timeout=45) as upstream:
                data = json.loads(upstream.read().decode("utf-8"))
                if provider == "anthropic":
                    text = (data.get("content") or [{}])[0].get("text", "No response.")
                else:
                    text = ((data.get("choices") or [{}])[0].get("message") or {}).get("content", "No response.")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"text": text}).encode("utf-8"))
        except Exception as exc:
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(exc)}).encode("utf-8"))


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8787), QBankHandler)
    print("DIU QBank running at http://127.0.0.1:8787/index.html")
    server.serve_forever()
