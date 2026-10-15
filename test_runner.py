import urllib.request
import urllib.error
import json
import sys

base = "http://127.0.0.1:8010"

def test(name, url, method="GET", data=None, expected_code=200):
    req = urllib.request.Request(url, method=method)
    body_bytes = None
    if data:
        req.add_header("Content-Type", "application/json")
        body_bytes = json.dumps(data).encode("utf-8")
    try:
        with urllib.request.urlopen(req, data=body_bytes) as resp:
            code = resp.status
            content = resp.read().decode("utf-8")
            assert code == expected_code, f"Expected {expected_code}, got {code}"
            print(f"[PASS] {name} -> HTTP {code}")
            return json.loads(content) if "application/json" in resp.headers.get("Content-Type", "") else content
    except urllib.error.HTTPError as e:
        assert e.code == expected_code, f"Expected {expected_code}, got {e.code}"
        err_content = e.read().decode("utf-8")
        print(f"[PASS] {name} -> HTTP {e.code} (Expected Status): {err_content.strip()}")
        return json.loads(err_content) if "application/json" in e.headers.get("Content-Type", "") else err_content

print("==================================================================")
print("     ZENITH '26 - FULL AUTOMATED API VERIFICATION SUITE           ")
print("==================================================================")

# 1. Static frontend routes
test("Serve index.html (GET /)", f"{base}/")
test("Serve admin.html (GET /admin.html)", f"{base}/admin.html")
test("Serve js/app.js (GET /js/app.js)", f"{base}/js/app.js")
test("Serve js/admin.js (GET /js/admin.js)", f"{base}/js/admin.js")
test("FastAPI Swagger Docs (GET /docs)", f"{base}/docs")

# 2. Events endpoints
evs = test("List all events (GET /api/events)", f"{base}/api/events")
print(f"       Total events returned: {len(evs)}")

tech = test("Filter category (GET /api/events?category=Technical)", f"{base}/api/events?category=Technical")
print(f"       Technical events returned: {len(tech)}")

search = test("Search query (GET /api/events?search=Sprint)", f"{base}/api/events?search=Sprint")
print(f"       Search result title: {search[0]['title']}")

ev1 = test("Single event detail (GET /api/events/1)", f"{base}/api/events/1")
print(f"       Event 1: {ev1['title']} | Available Seats: {ev1['available_seats']}/{ev1['capacity']}")

test("Non-existent event (GET /api/events/999)", f"{base}/api/events/999", expected_code=404)

# 3. Registration & Server-Side Validation
reg_data = {
    "student_name": "Aarav Sharma",
    "roll_number": "26CS014",
    "email": "aarav.sharma@college.edu",
    "phone": "9876543210"
}
reg_resp = test("Register student (POST /api/events/1/register)", f"{base}/api/events/1/register", method="POST", data=reg_data, expected_code=201)
print(f"       Registered ID: {reg_resp['id']}, Time: {reg_resp['registered_at']}")

test("Duplicate registration 409 (POST /api/events/1/register)", f"{base}/api/events/1/register", method="POST", data=reg_data, expected_code=409)

missing_name = {"student_name": "", "roll_number": "26CS014", "email": "test@college.edu"}
test("Missing name validation 400 (POST /api/events/1/register)", f"{base}/api/events/1/register", method="POST", data=missing_name, expected_code=400)

invalid_email = {"student_name": "Rohan", "roll_number": "26CS015", "email": "invalidemail"}
test("Invalid email validation 400 (POST /api/events/1/register)", f"{base}/api/events/1/register", method="POST", data=invalid_email, expected_code=400)

# 4. Registrations List & Stats
regs = test("List registrations (GET /api/registrations)", f"{base}/api/registrations")
print(f"       Total recorded registrations: {len(regs)}, Event: {regs[0]['event_title']}")

stats = test("Live Fest Stats (GET /api/stats)", f"{base}/api/stats")
print(f"       Stats: Events={stats['total_events']} | Regs={stats['total_registrations']} | Util={stats['overall_utilization_pct']}% | Categories={stats['events_by_category']}")

# 5. Stretch Goals
new_event = {
    "title": "Quantum Hackathon",
    "category": "Technical",
    "description": "Quantum algorithms sprint",
    "event_date": "2026-11-15",
    "event_time": "09:00 AM",
    "venue": "Innovation Hub",
    "capacity": 50,
    "fee": 0,
    "icon": "⚛️"
}
created_ev = test("Admin create event (POST /api/events)", f"{base}/api/events", method="POST", data=new_event, expected_code=201)
print(f"       Created Event: #{created_ev['id']} {created_ev['title']}")

cancel_resp = test(f"Admin cancel registration (DELETE /api/registrations/{reg_resp['id']})", f"{base}/api/registrations/{reg_resp['id']}", method="DELETE", expected_code=200)
print(f"       Cancelled: {cancel_resp['message']}")

print("==================================================================")
print("     ALL VERIFICATION CHECKS PASSED PERFECTLY!                    ")
print("==================================================================")
