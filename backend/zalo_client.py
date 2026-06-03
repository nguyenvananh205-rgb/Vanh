"""
Zalo Web API client using session cookies from chat.zalo.me
"""
import httpx
import json
import time
from typing import Optional

ZALO_WEB_HOST = "https://tt-files.zalo.me"
ZALO_API_HOST = "https://tt-content.zalo.me"
ZALO_PROFILE_HOST = "https://profile.zalo.me"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://chat.zalo.me",
    "Referer": "https://chat.zalo.me/",
}


class ZaloClient:
    def __init__(self, cookies: dict):
        self.cookies = cookies
        self.client = httpx.AsyncClient(
            cookies=cookies,
            headers=HEADERS,
            timeout=30.0,
            follow_redirects=True,
        )
        self._zpw_info: Optional[dict] = None

    async def close(self):
        await self.client.aclose()

    def _zpw_user_id(self) -> str:
        """Extract user ID from cookies."""
        return self.cookies.get("zpw_usr_st", "").split("|")[0] if "zpw_usr_st" in self.cookies else ""

    async def get_user_info(self) -> dict:
        """Get current logged-in user profile."""
        url = f"{ZALO_PROFILE_HOST}/api/social/profile/me"
        params = {
            "zpw_ver": 2,
            "type": 0,
            "uid": self._zpw_user_id(),
        }
        resp = await self.client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
        if data.get("error_code") != 0:
            raise ValueError(f"Zalo API error: {data.get('error_message', 'Unknown error')}")
        return data.get("data", {})

    async def get_conversations(self, last_id: str = "0", count: int = 30) -> list:
        """Fetch list of conversations (threads)."""
        url = f"{ZALO_WEB_HOST}/api/message/list"
        params = {
            "zpw_ver": 636,
            "type": 0,
            "last_id": last_id,
            "count": count,
        }
        resp = await self.client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
        if data.get("error_code") != 0:
            raise ValueError(f"Zalo API error: {data.get('error_message', 'Unknown error')}")
        return data.get("data", {}).get("data", [])

    async def get_messages(
        self,
        thread_id: str,
        thread_type: int = 0,
        last_id: str = "0",
        count: int = 20,
    ) -> list:
        """Fetch messages from a conversation thread."""
        url = f"{ZALO_WEB_HOST}/api/message/getmsg"
        params = {
            "zpw_ver": 636,
            "thread_id": thread_id,
            "type": thread_type,
            "last_id": last_id,
            "count": count,
        }
        resp = await self.client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
        if data.get("error_code") != 0:
            raise ValueError(f"Zalo API error: {data.get('error_message', 'Unknown error')}")
        raw = data.get("data", {})
        msgs = raw.get("msgs", [])
        # Normalize and sort oldest first
        msgs.sort(key=lambda m: int(m.get("ts", 0)))
        return msgs

    async def send_message(
        self,
        thread_id: str,
        message: str,
        thread_type: int = 0,
    ) -> dict:
        """Send a text message to a thread."""
        url = f"{ZALO_WEB_HOST}/api/message/sendmsg"
        ts = int(time.time() * 1000)
        payload = {
            "zpw_ver": 636,
            "type": thread_type,
            "thread_id": thread_id,
            "msg": message,
            "ts": ts,
        }
        resp = await self.client.post(url, data=payload)
        resp.raise_for_status()
        data = resp.json()
        if data.get("error_code") != 0:
            raise ValueError(f"Zalo API error: {data.get('error_message', 'Unknown error')}")
        return data.get("data", {})

    async def search_conversations(self, keyword: str) -> list:
        """Search conversations by keyword (client-side filter on thread list)."""
        conversations = await self.get_conversations(count=100)
        kw = keyword.lower()
        return [
            c for c in conversations
            if kw in (c.get("name") or "").lower()
            or kw in (c.get("last_msg", {}).get("content") or "").lower()
        ]
