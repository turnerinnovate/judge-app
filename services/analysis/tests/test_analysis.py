import pytest

fastapi = pytest.importorskip('fastapi')
from fastapi.testclient import TestClient
from services.analysis.app.main import app
from app.main import app

client = TestClient(app)


def test_health():
    r = client.get('/health')
    assert r.status_code == 200
    assert r.json()['status'] == 'ok'


def test_analyze():
    payload = {
        'event_type': 'TRADITIONAL_WEAPON',
        'has_weapon': True,
        'frames': [
            {'points': {'nose': [0.1, 0.1], 'left_shoulder': [0.2, 0.3]}},
            {'points': {'nose': [0.1, 0.2], 'left_shoulder': [0.2, 0.4], 'right_shoulder': [0.5, 0.4]}},
            {'points': {'nose': [0.1, 0.2], 'left_shoulder': [0.2, 0.4], 'right_shoulder': [0.5, 0.4], 'left_wrist': [0.4, 0.5]}},
            {'points': {'nose': [0.1, 0.2], 'left_shoulder': [0.2, 0.4], 'right_shoulder': [0.5, 0.4], 'left_wrist': [0.4, 0.5], 'right_wrist': [0.6, 0.6]}}
        ]
    }
    r = client.post('/analyze', json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body['eventType'] == 'TRADITIONAL_WEAPON'
    assert len(body['phaseAnnotations']) >= 1
    assert body['confidence']['overall'] <= 1.0
