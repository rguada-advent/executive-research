"""
Manages Anthropic API key persistence for PSG Executive Intelligence.
Key is stored in psg_config.json in the Electron user-data directory
(passed via PSG_USER_DATA env var from main.js) so it survives app restarts.
"""
import os
import json

_CONFIG_FILE = None
_cached_key = None


def _get_config_path():
    global _CONFIG_FILE
    if _CONFIG_FILE is None:
        user_data = os.environ.get("PSG_USER_DATA", "")
        if user_data:
            os.makedirs(user_data, exist_ok=True)
            _CONFIG_FILE = os.path.join(user_data, "psg_config.json")
        else:
            # Dev fallback: store next to server.py
            _CONFIG_FILE = os.path.join(os.path.dirname(__file__), "..", "psg_config.json")
    return _CONFIG_FILE


def get_api_key() -> str:
    """Return the configured Anthropic API key, or '' if not set."""
    global _cached_key
    if _cached_key is not None:
        return _cached_key
    try:
        with open(_get_config_path(), "r", encoding="utf-8") as f:
            _cached_key = json.load(f).get("anthropic_api_key", "")
    except (FileNotFoundError, json.JSONDecodeError):
        _cached_key = ""
    return _cached_key


def save_api_key(key: str):
    """Persist the API key to the config file and update the in-memory cache."""
    global _cached_key
    _cached_key = key
    path = _get_config_path()
    try:
        existing = {}
        try:
            with open(path, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            pass
        existing["anthropic_api_key"] = key
        with open(path, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2)
    except Exception as e:
        print(f"[PSG] Warning: could not save config: {e}")
