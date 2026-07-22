import json
import shutil
from datetime import datetime
from pathlib import Path

# Project root = cpa_analyze/
PROJECT_ROOT = Path(__file__).resolve().parents[3]

RAW_DATA_DIR = PROJECT_ROOT / "data" / "raw_data"
PREPROCESS_DIR = PROJECT_ROOT / "data" / "preprocess_data"

RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
PREPROCESS_DIR.mkdir(parents=True, exist_ok=True)


def generate_filename() -> str:
    """Tạo tên file theo format HHMMSS_DDMMYYYY"""
    now = datetime.now()
    return now.strftime("%H%M%S_%d%m%Y")


def save_raw(data: list, base_name: str) -> Path:
    """Lưu raw data, trả về path đã lưu."""
    path = RAW_DATA_DIR / f"{base_name}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return path


def save_preprocessed(data: list, base_name: str) -> Path:
    """Lưu preprocessed data, trả về path."""
    path = PREPROCESS_DIR / f"preprocess_{base_name}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return path


def load_raw(base_name: str) -> list:
    """Load raw data theo base_name."""
    path = RAW_DATA_DIR / f"{base_name}.json"
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def backup_original(base_name: str):
    """
    Backup raw file lần đầu tiên trước khi edit.
    File backup: <base_name>_original.json
    Nếu đã có backup rồi thì không làm gì.
    """
    src = RAW_DATA_DIR / f"{base_name}.json"
    dst = RAW_DATA_DIR / f"{base_name}_original.json"
    if not dst.exists() and src.exists():
        shutil.copy2(src, dst)


def restore_original(base_name: str) -> bool:
    """
    Khôi phục file gốc từ backup.
    Trả về True nếu thành công.
    """
    backup = RAW_DATA_DIR / f"{base_name}_original.json"
    target = RAW_DATA_DIR / f"{base_name}.json"
    if backup.exists():
        shutil.copy2(backup, target)
        return True
    return False


def load_original(base_name: str) -> list | None:
    """Load bản gốc (backup) theo base_name. Trả về None nếu không có backup."""
    path = RAW_DATA_DIR / f"{base_name}_original.json"
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def has_backup(base_name: str) -> bool:
    return (RAW_DATA_DIR / f"{base_name}_original.json").exists()
