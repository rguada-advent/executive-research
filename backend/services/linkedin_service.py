import requests as http_requests

VOYAGER_BASE = "https://www.linkedin.com/voyager/api"

def validate_cookies(li_at: str, jsessionid: str) -> bool:
    return bool(li_at and li_at.strip() and jsessionid and jsessionid.strip())

def build_voyager_headers(li_at: str, jsessionid: str) -> dict:
    jsid = jsessionid.strip().strip('"')
    return {
        "Cookie": f'li_at={li_at.strip()}; JSESSIONID="{jsid}"',
        "csrf-token": jsid,
        "x-restli-protocol-version": "2.0.0",
        "x-li-lang": "en_US",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

def voyager_request(path: str, li_at: str, jsessionid: str, timeout: int = 20):
    if not validate_cookies(li_at, jsessionid):
        return None, "Missing LinkedIn cookies"
    headers = build_voyager_headers(li_at, jsessionid)
    url = VOYAGER_BASE + path if path.startswith("/") else f"{VOYAGER_BASE}/{path}"
    try:
        resp = http_requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        if resp.status_code == 200:
            try:
                return resp.json(), None
            except ValueError:
                return resp.text, None
        elif resp.status_code in (401, 403):
            return None, "LinkedIn cookies expired or invalid"
        else:
            return None, f"LinkedIn API error: {resp.status_code}"
    except http_requests.exceptions.Timeout:
        return None, "LinkedIn request timed out"
    except Exception as e:
        return None, str(e)

def test_connection(li_at: str, jsessionid: str):
    data, error = voyager_request("/me", li_at, jsessionid)
    if error:
        return {"connected": False, "error": error}
    if data and isinstance(data, dict):
        name = data.get("firstName") or data.get("miniProfile", {}).get("firstName", "")
        return {"connected": True, "name": name, "data": data}
    return {"connected": False, "error": "Unexpected response from LinkedIn"}

def search_people(query: str, li_at: str, jsessionid: str, count: int = 5):
    from urllib.parse import quote
    path = (
        f"/search/dash/clusters?decorationId=com.linkedin.voyager.dash.deco.search."
        f"SearchClusterCollection-175&origin=GLOBAL_SEARCH_HEADER&q=all"
        f"&query=(keywords:{quote(query)},resultType:(PEOPLE))&start=0&count={count}"
    )
    data, error = voyager_request(path, li_at, jsessionid)
    if error:
        return [], error
    elements = []
    if isinstance(data, dict):
        elements = data.get("included", data.get("elements", []))
    profiles = []
    for e in elements:
        if not isinstance(e, dict):
            continue
        pub_id = e.get("publicIdentifier")
        if not pub_id:
            continue
        name = ""
        if e.get("title", {}).get("text"):
            name = e["title"]["text"]
        elif e.get("firstName"):
            name = f"{e.get('firstName', '')} {e.get('lastName', '')}".strip()
        profiles.append({
            "name": name or pub_id,
            "headline": e.get("headline", {}).get("text", "") or e.get("occupation", ""),
            "publicId": pub_id,
            "profileUrl": f"https://www.linkedin.com/in/{pub_id}",
            "connectionDegree": (
                e.get("memberDistance", {}).get("value") or
                e.get("distance", {}).get("value") or
                "UNKNOWN"
            ),
        })
    return profiles[:count], None

def search_shared_connections(public_id: str, li_at: str, jsessionid: str, count: int = 10):
    path = (
        f"/search/dash/clusters?decorationId=com.linkedin.voyager.dash.deco.search."
        f"SearchClusterCollection-175&origin=SHARED_CONNECTIONS_CANNED_SEARCH&q=all"
        f"&query=(flagshipSearchIntent:SEARCH_SRP,queryParameters:"
        f"(network:List(F,S),connectionOf:List({public_id}),resultType:List(PEOPLE)),"
        f"includeFiltersInResponse:false)&start=0&count={count}"
    )
    data, error = voyager_request(path, li_at, jsessionid)
    if error:
        return [], error
    elements = []
    if isinstance(data, dict):
        elements = data.get("included", data.get("elements", []))
    shared = []
    for e in elements:
        if not isinstance(e, dict):
            continue
        pub_id = e.get("publicIdentifier")
        if not pub_id:
            continue
        name = ""
        if e.get("title", {}).get("text"):
            name = e["title"]["text"]
        elif e.get("firstName"):
            name = f"{e.get('firstName', '')} {e.get('lastName', '')}".strip()
        shared.append({
            "name": name or pub_id,
            "headline": e.get("headline", {}).get("text", "") or e.get("occupation", ""),
            "profileUrl": f"https://www.linkedin.com/in/{pub_id}",
        })
    return shared[:count], None
