import pytest
from server import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health(client):
    rv = client.get('/health')
    assert rv.status_code == 200
    assert rv.json['status'] == 'ok'

def test_proxy_rejects_disallowed_domain(client):
    rv = client.post('/proxy', json={
        'url': 'https://evil.com/data',
        'method': 'GET',
        'headers': {}
    })
    assert rv.status_code == 403

def test_proxy_requires_url(client):
    rv = client.post('/proxy', json={'method': 'GET'})
    assert rv.status_code == 400
