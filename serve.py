"""Tiny static server for the prebuilt Triply app (no Node.js required).

Serves week4/dist on http://localhost:8080 with the MIME types the PWA needs,
so the service worker and the install prompt work on localhost.
"""

import http.server
import os
import socketserver
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "week4", "dist")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".webmanifest": "application/manifest+json",
        ".js": "text/javascript",
        ".json": "application/json",
        ".css": "text/css",
        ".png": "image/png",
        ".svg": "image/svg+xml",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass


os.chdir(ROOT)
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print(f"Triply is running at http://localhost:{PORT}/")
    print("Press Ctrl+C (or close the window) to stop.")
    httpd.serve_forever()
