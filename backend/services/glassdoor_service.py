import requests as http_requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus

GLASSDOOR_BASE = "https://www.glassdoor.com"

def build_search_url(company: str) -> str:
    return f"{GLASSDOOR_BASE}/Reviews/{quote_plus(company)}-reviews-SRCH_KE0,{len(company)}.htm"

def parse_rating(val) -> float | None:
    if val is None:
        return None
    try:
        return float(str(val).strip())
    except (ValueError, TypeError):
        return None

def scrape_company_reviews(company: str, timeout: int = 20):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
    }
    result = {
        "company": company,
        "overallRating": None,
        "ceoApproval": None,
        "recommendToFriend": None,
        "totalReviews": 0,
        "recentReviews": [],
        "prosThemes": [],
        "consThemes": [],
        "ceoName": None,
        "url": build_search_url(company),
        "error": None,
    }
    try:
        resp = http_requests.get(result["url"], headers=headers, timeout=timeout)
        if resp.status_code != 200:
            result["error"] = f"Glassdoor returned {resp.status_code}"
            return result
        soup = BeautifulSoup(resp.text, "html.parser")
        rating_el = soup.select_one('[data-test="rating-headline"]') or soup.select_one('.rating-headline')
        if rating_el:
            result["overallRating"] = parse_rating(rating_el.get_text(strip=True))
        review_els = soup.select('.review-details') or soup.select('[data-test="review"]')
        for rev in review_els[:10]:
            title_el = rev.select_one('.review-title, [data-test="review-title"]')
            pros_el = rev.select_one('[data-test="pros"], .pros')
            cons_el = rev.select_one('[data-test="cons"], .cons')
            date_el = rev.select_one('.review-date, [data-test="review-date"]')
            review = {
                "title": title_el.get_text(strip=True) if title_el else "",
                "pros": pros_el.get_text(strip=True) if pros_el else "",
                "cons": cons_el.get_text(strip=True) if cons_el else "",
                "date": date_el.get_text(strip=True) if date_el else "",
            }
            result["recentReviews"].append(review)
        result["totalReviews"] = len(result["recentReviews"])
    except http_requests.exceptions.Timeout:
        result["error"] = "Glassdoor request timed out"
    except Exception as e:
        result["error"] = str(e)
    return result
