from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "version" in body


def test_rules_endpoint():
    response = client.get("/api/rules")
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == len(body["rules"])
    assert body["count"] > 0


def test_audit_endpoint_detects_issue():
    payload = {"content": "password = 'hunter2hunter2'", "filename": "config.env"}
    response = client.post("/api/audit", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["filename"] == "config.env"
    assert body["risk_score"] > 0
    assert any(f["category"] == "secret" for f in body["findings"])


def test_audit_endpoint_clean_content():
    response = client.post("/api/audit", json={"content": "hello world"})
    assert response.status_code == 200
    body = response.json()
    assert body["findings"] == []
    assert body["risk_level"] == "clean"
