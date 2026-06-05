import json
import os
from typing import Optional

STORE_PATH = os.path.join(os.path.dirname(__file__), "labels_data.json")

DEFAULT_LABELS = [
    {
        "id": "gia-dinh", "name": "Gia đình", "color": "#ff6b6b", "emoji": "👨‍👩‍👧‍👦",
        "keywords": ["mẹ", "ba", "bố", "mợ", "cô", "chú", "dì", "ông", "bà", "gia đình", "nhà nội", "nhà ngoại"],
    },
    {
        "id": "cong-viec", "name": "Công việc", "color": "#4dabf7", "emoji": "💼",
        "keywords": ["công ty", "nhóm da", "nhóm dự án", "sếp", "họp", "hr", "kế toán", "project", "team", "sprint"],
    },
    {
        "id": "ban-be", "name": "Bạn bè", "color": "#69db7c", "emoji": "👥",
        "keywords": ["bạn", "thân", "hội", "nhóm bạn", "gang", "lớp"],
    },
]


def _load() -> dict:
    if not os.path.exists(STORE_PATH):
        data = {"labels": DEFAULT_LABELS, "assignments": {}}
        _save(data)
        return data
    with open(STORE_PATH) as f:
        return json.load(f)


def _save(data: dict):
    with open(STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_labels() -> list:
    return _load()["labels"]


def get_assignments() -> dict:
    return _load()["assignments"]


def create_label(name: str, color: str, emoji: str = "🏷️", keywords: list = None) -> dict:
    data = _load()
    base_id = name.lower().replace(" ", "-")
    for ch, rep in {"đ": "d", "ă": "a", "â": "a", "ê": "e", "ô": "o", "ơ": "o", "ư": "u"}.items():
        base_id = base_id.replace(ch, rep)
    label_id = base_id
    existing = {l["id"] for l in data["labels"]}
    i = 2
    while label_id in existing:
        label_id = f"{base_id}-{i}"
        i += 1
    label = {"id": label_id, "name": name, "color": color, "emoji": emoji, "keywords": keywords or []}
    data["labels"].append(label)
    _save(data)
    return label


def update_label(label_id: str, updates: dict) -> Optional[dict]:
    data = _load()
    for label in data["labels"]:
        if label["id"] == label_id:
            label.update(updates)
            _save(data)
            return label
    return None


def delete_label(label_id: str) -> bool:
    data = _load()
    before = len(data["labels"])
    data["labels"] = [l for l in data["labels"] if l["id"] != label_id]
    for assignments in data["assignments"].values():
        if label_id in assignments:
            assignments.remove(label_id)
    _save(data)
    return len(data["labels"]) < before


def set_conv_labels(conv_id: str, label_ids: list):
    data = _load()
    data["assignments"][conv_id] = label_ids
    _save(data)


def auto_suggest(conversations: list) -> dict:
    """Return {conv_id: [label_ids]} based on name keyword matching."""
    data = _load()
    result = {}
    for conv in conversations:
        name = (conv.get("name") or "").lower()
        matched = []
        for label in data["labels"]:
            for kw in label.get("keywords", []):
                if kw.lower() in name and label["id"] not in matched:
                    matched.append(label["id"])
                    break
        if matched:
            result[conv["id"]] = matched
    return result
