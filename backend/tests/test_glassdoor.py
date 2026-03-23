from services.glassdoor_service import build_search_url, parse_rating

def test_build_search_url():
    url = build_search_url("Pfizer")
    assert "glassdoor.com" in url
    assert "Pfizer" in url

def test_parse_rating():
    assert parse_rating("4.2") == 4.2
    assert parse_rating("N/A") is None
    assert parse_rating(None) is None
