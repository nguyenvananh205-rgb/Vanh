from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json

from zalo_client import ZaloClient
import labels_store

app = FastAPI(title="Zalo Message Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_session: dict[str, ZaloClient] = {}
SESSION_KEY = "default"


def get_client() -> ZaloClient:
    client = _session.get(SESSION_KEY)
    if not client:
        raise HTTPException(status_code=401, detail="Chưa đăng nhập. Vui lòng cung cấp cookies Zalo.")
    return client


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    cookies: dict


@app.post("/api/auth/login")
async def login(req: LoginRequest):
    if not req.cookies:
        raise HTTPException(status_code=400, detail="Cookies không được để trống.")
    client = ZaloClient(cookies=req.cookies)
    try:
        user = await client.get_user_info()
    except Exception as e:
        await client.close()
        raise HTTPException(status_code=401, detail=f"Xác thực thất bại: {str(e)}")
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
async def search_conversations(q: str, client: ZaloClient = Depends(get_client)):
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
            thread_id=thread_id, thread_type=thread_type, last_id=last_id, count=count,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SendMessageRequest(BaseModel):
    message: str
    thread_type: int = 0


@app.post("/api/conversations/{thread_id}/messages")
async def send_message(thread_id: str, req: SendMessageRequest, client: ZaloClient = Depends(get_client)):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Tin nhắn không được để trống.")
    try:
        return await client.send_message(thread_id=thread_id, message=req.message, thread_type=req.thread_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Labels ────────────────────────────────────────────────────────────────────

class CreateLabelRequest(BaseModel):
    name: str
    color: str
    emoji: str = "🏷️"
    keywords: List[str] = []


class UpdateLabelRequest(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    emoji: Optional[str] = None
    keywords: Optional[List[str]] = None


class SetConvLabelsRequest(BaseModel):
    label_ids: List[str]


class AutoSuggestRequest(BaseModel):
    conversations: list  # [{id, name, ...}]


@app.get("/api/labels")
async def get_labels():
    return {
        "labels": labels_store.get_labels(),
        "assignments": labels_store.get_assignments(),
    }


@app.post("/api/labels")
async def create_label(req: CreateLabelRequest):
    return labels_store.create_label(req.name, req.color, req.emoji, req.keywords)


@app.put("/api/labels/{label_id}")
async def update_label(label_id: str, req: UpdateLabelRequest):
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    result = labels_store.update_label(label_id, updates)
    if not result:
        raise HTTPException(status_code=404, detail="Nhãn không tồn tại.")
    return result


@app.delete("/api/labels/{label_id}")
async def delete_label(label_id: str):
    if not labels_store.delete_label(label_id):
        raise HTTPException(status_code=404, detail="Nhãn không tồn tại.")
    return {"success": True}


@app.put("/api/conversations/{conv_id}/labels")
async def set_conv_labels(conv_id: str, req: SetConvLabelsRequest):
    labels_store.set_conv_labels(conv_id, req.label_ids)
    return {"success": True}


@app.post("/api/labels/auto-suggest")
async def auto_suggest(req: AutoSuggestRequest):
    return labels_store.auto_suggest(req.conversations)


@app.get("/api/labels/from-zalo")
async def fetch_zalo_labels(client: ZaloClient = Depends(get_client)):
    """Try to fetch Zalo's native conversation labels."""
    try:
        resp = await client.client.get(
            "https://tt-files.zalo.me/api/label/list",
            params={"zpw_ver": 636},
        )
        data = resp.json()
        if data.get("error_code") == 0:
            return data.get("data", {}).get("labels", [])
    except Exception:
        pass
    return []
