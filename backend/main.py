from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json

from zalo_client import ZaloClient

app = FastAPI(title="Zalo Message Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session (replace with Redis for production)
_session: dict[str, ZaloClient] = {}
SESSION_KEY = "default"


def get_client() -> ZaloClient:
    client = _session.get(SESSION_KEY)
    if not client:
        raise HTTPException(status_code=401, detail="Chưa đăng nhập. Vui lòng cung cấp cookies Zalo.")
    return client


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    cookies: dict  # key-value pairs from browser DevTools


@app.post("/api/auth/login")
async def login(req: LoginRequest):
    """Authenticate using Zalo Web session cookies."""
    if not req.cookies:
        raise HTTPException(status_code=400, detail="Cookies không được để trống.")
    client = ZaloClient(cookies=req.cookies)
    try:
        user = await client.get_user_info()
    except Exception as e:
        await client.close()
        raise HTTPException(status_code=401, detail=f"Xác thực thất bại: {str(e)}")

    # Replace old session
    old = _session.get(SESSION_KEY)
    if old:
        await old.close()
    _session[SESSION_KEY] = client
    return {"success": True, "user": user}


@app.post("/api/auth/logout")
async def logout():
    client = _session.pop(SESSION_KEY, None)
    if client:
        await client.close()
    return {"success": True}


@app.get("/api/auth/status")
async def auth_status():
    return {"authenticated": SESSION_KEY in _session}


# ── Conversations ─────────────────────────────────────────────────────────────

@app.get("/api/conversations")
async def get_conversations(
    last_id: str = "0",
    count: int = 30,
    client: ZaloClient = Depends(get_client),
):
    try:
        return await client.get_conversations(last_id=last_id, count=count)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/conversations/search")
async def search_conversations(
    q: str,
    client: ZaloClient = Depends(get_client),
):
    try:
        return await client.search_conversations(keyword=q)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Messages ──────────────────────────────────────────────────────────────────

@app.get("/api/conversations/{thread_id}/messages")
async def get_messages(
    thread_id: str,
    thread_type: int = 0,
    last_id: str = "0",
    count: int = 20,
    client: ZaloClient = Depends(get_client),
):
    try:
        return await client.get_messages(
            thread_id=thread_id,
            thread_type=thread_type,
            last_id=last_id,
            count=count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SendMessageRequest(BaseModel):
    message: str
    thread_type: int = 0


@app.post("/api/conversations/{thread_id}/messages")
async def send_message(
    thread_id: str,
    req: SendMessageRequest,
    client: ZaloClient = Depends(get_client),
):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Tin nhắn không được để trống.")
    try:
        return await client.send_message(
            thread_id=thread_id,
            message=req.message,
            thread_type=req.thread_type,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
