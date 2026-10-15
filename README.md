# Zenith '26 College Fest Management System ⚡

A full-stack College Fest Management System built for **PM2-01 (How Software Works)** and **PM2-02 (Front-End, Back-End & Mobile)**. The platform features an energetic student portal for browsing and registering for events, alongside a real-time admin coordination dashboard with capacity monitoring and analytics.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, Tailwind CSS (via Play CDN), Vanilla JavaScript (ES6 Modules & Fetch API)
- **Backend:** Python 3.10+, FastAPI, Pydantic v2, Uvicorn (ASGI server)
- **Database:** SQLite 3 (`fest.db` with relational schema and live computed seat availability)
- **Data Ingestion:** `openpyxl` (reading `data/events_seed.xlsx` on initial startup)
- **API Testing:** Postman Desktop / cURL (`zenith26-api.postman_collection.json`)

---

## 📂 Project Structure

```text
zenith26-fest-system/
├── backend/
│   ├── database.py       # SQLite connection helper & schema creation
│   ├── main.py           # FastAPI application, REST endpoints, static mounting
│   ├── models.py         # Pydantic schema validation & response models
│   └── seed_data.py      # Spreadsheet loader populating events from events_seed.xlsx
├── frontend/
│   ├── index.html        # Student event discovery & registration portal
│   ├── admin.html        # Fest coordinator live admin dashboard
│   └── js/
│       ├── app.js        # Student portal client logic, modals, search & filters
│       └── admin.js      # Dashboard metrics, utilization tables, cancellation actions
├── data/
│   └── events_seed.xlsx  # 14 seed events spreadsheet (10 attributes per event)
├── zenith26-api.postman_collection.json  # Postman test collection with 18 requests
├── Postman-Testing-Commands-Zenith26.md   # Postman test run manual & reference guide
├── requirements.txt      # Python dependencies
└── README.md             # Project documentation
```

---

## 🚀 How to Run the Application

### 1. Set Up the Python Virtual Environment
Open your terminal in the `zenith26-fest-system` folder:

```bash
# Windows
python -m venv .venv
.\.venv\Scripts\activate

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Seed the Database (Optional — runs automatically on server start)
```bash
python backend/seed_data.py
```

### 4. Start the Application Server
```bash
uvicorn backend.main:app --port 8010 --reload
```

The server will initialize SQLite database tables (`events`, `registrations`), import seed events from `data/events_seed.xlsx`, and serve both frontend pages and the REST API.

---

## 🌐 URLs & Access Points

| Page / Resource | URL | Description |
|-----------------|-----|-------------|
| **Student Portal** | [http://localhost:8010/](http://localhost:8010/) | Discover events, filter by category, search, register |
| **Admin Dashboard** | [http://localhost:8010/admin.html](http://localhost:8010/admin.html) | Live metrics, capacity utilization table, registrations |
| **Swagger Interactive Docs** | [http://localhost:8010/docs](http://localhost:8010/docs) | OpenAPI interactive API documentation & testing UI |
| **Redoc API Spec** | [http://localhost:8010/redoc](http://localhost:8010/redoc) | Clean API schema reference |

---

## 📡 API Endpoints Contract

### Core Endpoints

- `GET /api/events`  
  List all events with live calculated `available_seats`.  
  *Query Parameters:* `?category=<category>`, `?search=<term>`
- `GET /api/events/{event_id}`  
  Retrieve detailed information for a single event (`200 OK` or `404 Not Found`).
- `POST /api/events/{event_id}/register`  
  Register a student for an event.  
  *Server-side Validations:* Event exists (`404`), non-empty required fields (`400`), email format check (`400`), event capacity check (`409 "Event is full"`), duplicate email check (`409 "Already registered"`).  
  *Success:* `201 Created` with registration details.
- `GET /api/registrations`  
  List student registrations including event title.  
  *Query Parameters:* `?event_id=<id>`
- `GET /api/stats`  
  Live computed festival metrics: total events, total registrations, overall utilization %, upcoming events count, and category breakdown.

### Stretch Goal Endpoints

- `POST /api/events`  
  Admin creates a new event with full server-side validation (`201 Created`).
- `DELETE /api/registrations/{registration_id}`  
  Admin cancels an existing registration, freeing up 1 seat (`200 OK`).

---

## 🧪 Postman & API Contract Testing

Import `zenith26-api.postman_collection.json` into Postman to test all 18 requests. Review the accompanying manual in `Postman-Testing-Commands-Zenith26.md`.
