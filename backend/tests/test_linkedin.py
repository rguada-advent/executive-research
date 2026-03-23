import pytest
from services.linkedin_service import build_voyager_headers, validate_cookies

def test_build_voyager_headers():
    headers = build_voyager_headers("li_at_value", "ajax:12345")
    assert headers["Cookie"] == 'li_at=li_at_value; JSESSIONID="ajax:12345"'
    assert headers["csrf-token"] == "ajax:12345"
    assert headers["x-restli-protocol-version"] == "2.0.0"

def test_validate_cookies_missing():
    assert validate_cookies("", "") == False
    assert validate_cookies("li_at_val", "") == False
    assert validate_cookies("", "ajax:123") == False

def test_validate_cookies_present():
    assert validate_cookies("li_at_val", "ajax:123") == True
