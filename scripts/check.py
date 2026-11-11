"""Exercise HTTP behavior on an ephemeral local port, without external services."""
import json
import threading
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from sandbox import make_server


server = make_server(port=0)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
origin = f"http://127.0.0.1:{server.server_port}"


def request(path, expected, body=None):
    req = Request(origin + path, data=body, headers={"Content-Type": "application/json"})
    try:
        response = urlopen(req, timeout=5)
    except HTTPError as error:
        response = error
    with response:
        assert response.status == expected, (path, response.status)
        return json.load(response)


try:
    assert request("/health", 200)["mode"] == "sandbox"
    assert request("/mock/webhook", 200, b'{"test":true}')["stored"] is False
    request("/mock/webhook", 400, b"invalid")
    request("/mock/webhook", 413, b"x" * 65537)
    request("/missing", 404)
    print("PASS: health, mock webhook, invalid JSON, body limit, missing route")
finally:
    server.shutdown()
    server.server_close()
    thread.join(timeout=5)
