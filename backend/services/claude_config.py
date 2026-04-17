"""
Manages AI provider API key persistence for PSG Executive Intelligence.
Keys are stored in psg_config.json in the Electron user-data directory
(passed via PSG_USER_DATA env var from main.js) so they survive app restarts.

Supports Anthropic, OpenAI, and Google Gemini providers.
"""
import os
import json

_CONFIG_FILE = None
_cache: dict = {}

# Map provider name → JSON config key
PROVIDER_KEYS = {
    'anthropic': 'anthropic_api_key',
    'openai':    'openai_api_key',
    'gemini':    'gemini_api_key',
}


def _get_config_path() -> str:
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


def _load_config() -> dict:
    try:
        with open(_get_config_path(), "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _save_config(data: dict):
    path = _get_config_path()
    try:
        existing: dict = {}
        try:
            with open(path, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            pass
        existing.update(data)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2)
    except Exception as e:
        print(f"[PSG] Warning: could not save config: {e}")


def get_api_key(provider: str = 'anthropic') -> str:
    """Return the configured API key for the given provider, or '' if not set."""
    if provider in _cache:
        return _cache[provider]
    config_key = PROVIDER_KEYS.get(provider, f'{provider}_api_key')
    val = _load_config().get(config_key, '')
    _cache[provider] = val
    return val


def save_api_key(key: str, provider: str = 'anthropic'):
    """Persist an API key for the given provider and update the in-memory cache."""
    _cache[provider] = key
    config_key = PROVIDER_KEYS.get(provider, f'{provider}_api_key')
    _save_config({config_key: key})


def get_provider_status() -> dict:
    """Return {provider: bool} indicating which providers have API keys configured."""
    return {p: bool(get_api_key(p)) for p in PROVIDER_KEYS}
