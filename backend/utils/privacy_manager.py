"""
Tattva.AI — Privacy Manager
Utilities for enforcing temporary file deletion and ensuring user metadata/data
is not stored permanently within the system framework.
"""
from __future__ import annotations

import os
import logging

# Privacy flag configuration
PRIVACY_MODE = os.environ.get("PRIVACY_MODE", "True").lower() in ("true", "1", "yes")

def get_privacy_status() -> dict:
    """Return privacy status block for API payloads."""
    if PRIVACY_MODE:
        return {
            "privacy_mode": True,
            "message": "All uploaded files are automatically deleted after analysis."
        }
    return {
        "privacy_mode": False,
        "message": "Privacy mode is disabled. Temporary files may be retained."
    }

def delete_file(file_path: str) -> None:
    """
    Deletes a file safely if it exists and logs the event (if configured).
    """
    if not file_path:
        return
        
    try:
        if os.path.isfile(file_path):
            os.remove(file_path)
            if PRIVACY_MODE:
                print(f"[Privacy Manager] Securely deleted transient file: `{os.path.basename(file_path)}`")
    except OSError as e:
        print(f"[Privacy Manager] Error: Could not delete `{os.path.basename(file_path)}` - {e}")


def secure_cleanup(file_paths: list[str]) -> None:
    """
    Deletes multiple temporary files securely.
    """
    if not file_paths:
        return
        
    for path in file_paths:
        delete_file(path)
