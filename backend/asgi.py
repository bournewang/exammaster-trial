"""ASGI wrapper for Flask app to run with uvicorn."""

from asgiref.wsgi import WsgiToAsgi
from app import app

# Wrap Flask WSGI app as ASGI
asgi_app = WsgiToAsgi(app)
