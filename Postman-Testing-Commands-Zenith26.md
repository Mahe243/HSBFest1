# Postman & cURL API Testing Guide: Zenith '26 Fest System

**Project:** Zenith '26 College Fest Management System  
**Base URL:** `http://localhost:8010`  
**Interactive Docs:** `http://localhost:8010/docs`

This document details all 18 API verification tests across core endpoints and stretch goals, including exact request bodies, headers, expected HTTP status codes, and expected response payloads.

---

## Postman Setup Instructions

1. **Open Postman** (Desktop App or Web Client).
2. Click **Import** in the top left corner.
3. Select the file `zenith26-api.postman_collection.json` located at the root of `zenith26-fest-system/`.
4. The collection will import with the pre-configured variable `baseUrl` set to `http://localhost:8010`.
5. Ensure your FastAPI server is running:
   ```bash
   uvicorn backend.main:app --reload
   ```

---

## Test Suite Overview (18 Requests)

| # | Endpoint | Method | Test Scenario | Expected Status |
|---|----------|--------|---------------|-----------------|
| 1 | `/api/events` | GET | List all 14 seed events | `200 OK` |
| 2 | `/api/events?category=Technical` | GET | Filter by category | `200 OK` |
| 3 | `/api/events?category=Cultural` | GET | Filter by Cultural | `200 OK` |
| 4 | `/api/events?search=Sprint` | GET | Search event title | `200 OK` |
| 5 | `/api/events?search=xyznonexistent` | GET | Search with no results | `200 OK` (empty array `[]`) |
| 6 | `/api/events/1` | GET | Get existing event detail | `200 OK` |
| 7 | `/api/events/999` | GET | Get non-existent event | `404 Not Found` |
| 8 | `/api/events/1/register` | POST | Valid registration | `201 Created` |
| 9 | `/api/events/1/register` | POST | Duplicate registration (same email & event) | `409 Conflict` ("Already registered") |
| 10 | `/api/events/1/register` | POST | Missing required field (`student_name` empty) | `400 Bad Request` |
| 11 | `/api/events/1/register` | POST | Missing `roll_number` | `400 Bad Request` |
| 12 | `/api/events/1/register` | POST | Invalid email format (missing `@`) | `400 Bad Request` |
| 13 | `/api/events/999/register` | POST | Register for non-existent event | `404 Not Found` |
| 14 | `/api/registrations` | GET | List all registrations (with event titles) | `200 OK` |
| 15 | `/api/registrations?event_id=1` | GET | Filter registrations by event | `200 OK` |
| 16 | `/api/stats` | GET | Fetch live festival analytics | `200 OK` |
| 17 | `/api/events` (Stretch) | POST | Admin creates new event | `201 Created` |
| 18 | `/api/registrations/1` (Stretch) | DELETE | Admin cancels registration | `200 OK` |

---

## Detailed Requests & Payloads

### 1. Events Endpoints

#### Request 1: GET All Events
- **Method:** `GET`
- **URL:** `http://localhost:8010/api/events`
- **Expected Status:** `200 OK`
- **Expected Body Structure:** Array of 14 `EventOut` objects with `available_seats` computed live.

#### Request 2: GET Filter by Category
- **Method:** `GET`
- **URL:** `http://localhost:8010/api/events?category=Technical`
- **Expected Status:** `200 OK`
- **Expected Count:** 4 events (`Code Sprint 2.0`, `Robo Race`, `AI Pitch Fest`, `Web Design Rumble`).

#### Request 3: GET Search by Title
- **Method:** `GET`
- **URL:** `http://localhost:8010/api/events?search=Sprint`
- **Expected Status:** `200 OK`
- **Expected Response:** Returns `Code Sprint 2.0`.

#### Request 4: GET Non-existent Event ID
- **Method:** `GET`
- **URL:** `http://localhost:8010/api/events/999`
- **Expected Status:** `404 Not Found`
- **Expected Body:**
  ```json
  { "detail": "Event with id 999 not found" }
  ```

---

### 2. Registration Endpoints & "Never Trust the Client"

#### Request 8: Successful Registration
- **Method:** `POST`
- **URL:** `http://localhost:8010/api/events/1/register`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "student_name": "Aarav Sharma",
    "roll_number": "26CS014",
    "email": "aarav.sharma@college.edu",
    "phone": "9876543210"
  }
  ```
- **Expected Status:** `201 Created`
- **Expected Body:**
  ```json
  {
    "id": 1,
    "event_id": 1,
    "student_name": "Aarav Sharma",
    "registered_at": "YYYY-MM-DD HH:MM:SS"
  }
  ```

#### Request 9: Duplicate Email Registration (409 Conflict)
- **Method:** `POST`
- **URL:** `http://localhost:8010/api/events/1/register`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "student_name": "Aarav Sharma",
    "roll_number": "26CS014",
    "email": "aarav.sharma@college.edu",
    "phone": "9876543210"
  }
  ```
- **Expected Status:** `409 Conflict`
- **Expected Body:**
  ```json
  { "detail": "Already registered" }
  ```

#### Request 10: Missing Student Name (400 Bad Request)
- **Method:** `POST`
- **URL:** `http://localhost:8010/api/events/1/register`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "student_name": "",
    "roll_number": "26CS014",
    "email": "test@college.edu"
  }
  ```
- **Expected Status:** `400 Bad Request`
- **Expected Body:**
  ```json
  { "detail": "Student name, roll number, and email are required" }
  ```

#### Request 12: Invalid Email Format (400 Bad Request)
- **Method:** `POST`
- **URL:** `http://localhost:8010/api/events/1/register`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "student_name": "Rohan Verma",
    "roll_number": "26EC032",
    "email": "rohanvermagmail.com"
  }
  ```
- **Expected Status:** `400 Bad Request`
- **Expected Body:**
  ```json
  { "detail": "Invalid email address format (must contain '@')" }
  ```

---

### 3. Analytics & Stats

#### Request 16: Live Fest Statistics
- **Method:** `GET`
- **URL:** `http://localhost:8010/api/stats`
- **Expected Status:** `200 OK`
- **Sample Body:**
  ```json
  {
    "total_events": 14,
    "total_registrations": 1,
    "total_capacity": 1467,
    "overall_utilization_pct": 0.1,
    "upcoming_events_count": 14,
    "events_by_category": {
      "Technical": 4,
      "Cultural": 5,
      "Sports": 2,
      "Gaming": 1,
      "Workshop": 2
    }
  }
  ```

---

### 4. Stretch Goals (Admin Operations)

#### Request 17: Admin Adds Event
- **Method:** `POST`
- **URL:** `http://localhost:8010/api/events`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "title": "Quantum Computing Hackathon",
    "category": "Technical",
    "description": "48-hour quantum algorithm challenge.",
    "event_date": "2026-11-15",
    "event_time": "09:00 AM",
    "venue": "Innovation Hub",
    "capacity": 50,
    "fee": 0,
    "icon": "⚛️"
  }
  ```
- **Expected Status:** `201 Created`

#### Request 18: Admin Cancels Registration
- **Method:** `DELETE`
- **URL:** `http://localhost:8010/api/registrations/1`
- **Expected Status:** `200 OK`
- **Expected Body:**
  ```json
  { "message": "Registration cancelled successfully", "id": 1 }
  ```
