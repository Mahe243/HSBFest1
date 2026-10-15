from contextlib import asynccontextmanager
from datetime import datetime, date
from pathlib import Path
import sys
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Ensure backend folder is on python path
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from database import get_db_connection, init_db
from models import (
    EventOut,
    EventDetail,
    RegistrationIn,
    RegistrationOut,
    RegistrationItem,
    StatsOut,
    EventCreate,
)
from seed_data import seed_events


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist and are seeded on startup
    init_db()
    try:
        seed_events()
    except Exception as e:
        print(f"Warning during seed: {e}")
    yield


app = FastAPI(
    title="Zenith '26 College Fest Management System API",
    description="API for student registration portal and admin festival coordination",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for local development and API testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# API Endpoints
# ==========================================

@app.get("/api/events", response_model=List[EventOut], tags=["Events"])
def list_events(
    category: Optional[str] = Query(None, description="Filter by event category"),
    search: Optional[str] = Query(None, description="Search in event title"),
):
    """
    Returns all events with live computed available_seats.
    Supports optional category filtering and case-insensitive search by title.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT 
            e.id, e.title, e.category, e.description, 
            e.event_date, e.event_time, e.venue, e.capacity, 
            e.fee, e.icon,
            (e.capacity - COUNT(r.id)) AS available_seats
        FROM events e
        LEFT JOIN registrations r ON e.id = r.event_id
        WHERE 1=1
    """
    params: List[Any] = []

    if category and category.strip() and category.strip().lower() != "all":
        query += " AND LOWER(e.category) = LOWER(?)"
        params.append(category.strip())

    if search and search.strip():
        query += " AND LOWER(e.title) LIKE ?"
        params.append(f"%{search.strip().lower()}%")

    query += " GROUP BY e.id ORDER BY e.event_date ASC, e.event_time ASC;"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [
        EventOut(
            id=row["id"],
            title=row["title"],
            category=row["category"],
            description=row["description"],
            event_date=row["event_date"],
            event_time=row["event_time"],
            venue=row["venue"],
            capacity=row["capacity"],
            fee=row["fee"],
            icon=row["icon"],
            available_seats=max(0, row["available_seats"]),
        )
        for row in rows
    ]


@app.get("/api/events/{event_id}", response_model=EventDetail, tags=["Events"])
def get_event(event_id: int):
    """
    Returns single event details by event_id with live available seats, or 404 if not found.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            e.id, e.title, e.category, e.description, 
            e.event_date, e.event_time, e.venue, e.capacity, 
            e.fee, e.icon,
            (e.capacity - COUNT(r.id)) AS available_seats
        FROM events e
        LEFT JOIN registrations r ON e.id = r.event_id
        WHERE e.id = ?
        GROUP BY e.id;
    """, (event_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} not found",
        )

    return EventDetail(
        id=row["id"],
        title=row["title"],
        category=row["category"],
        description=row["description"],
        event_date=row["event_date"],
        event_time=row["event_time"],
        venue=row["venue"],
        capacity=row["capacity"],
        fee=row["fee"],
        icon=row["icon"],
        available_seats=max(0, row["available_seats"]),
    )


@app.post(
    "/api/events/{event_id}/register",
    response_model=RegistrationOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Registrations"],
)
def register_for_event(event_id: int, payload: RegistrationIn):
    """
    Registers a student for an event. Performs strict independent server-side validation:
    - Event must exist (404)
    - student_name, roll_number, email must not be empty (400)
    - email must contain '@' (400)
    - event must not be at capacity (409 "Event is full")
    - email must not already be registered for this event (409 "Already registered")
    """
    name = payload.student_name.strip() if payload.student_name else ""
    roll = payload.roll_number.strip() if payload.roll_number else ""
    email = payload.email.strip().lower() if payload.email else ""
    phone = payload.phone.strip() if payload.phone else None

    # Server-side validation: required fields
    if not name or not roll or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student name, roll number, and email are required",
        )

    # Server-side validation: email format
    if "@" not in email or email.startswith("@") or email.endswith("@"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email address format (must contain '@')",
        )

    conn = get_db_connection()
    cursor = conn.cursor()

    # Verify event existence and calculate current availability
    cursor.execute("""
        SELECT e.id, e.title, e.capacity, COUNT(r.id) as reg_count
        FROM events e
        LEFT JOIN registrations r ON e.id = r.event_id
        WHERE e.id = ?
        GROUP BY e.id;
    """, (event_id,))
    event_row = cursor.fetchone()

    if not event_row:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} does not exist",
        )

    # Check capacity limit
    if event_row["reg_count"] >= event_row["capacity"]:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Event is full",
        )

    # Check duplicate email registration for this event
    cursor.execute(
        "SELECT id FROM registrations WHERE event_id = ? AND LOWER(email) = LOWER(?);",
        (event_id, email),
    )
    existing_reg = cursor.fetchone()
    if existing_reg:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already registered",
        )

    registered_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        INSERT INTO registrations (event_id, student_name, roll_number, email, phone, registered_at)
        VALUES (?, ?, ?, ?, ?, ?);
    """, (event_id, name, roll, email, phone, registered_at))

    reg_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return RegistrationOut(
        id=reg_id,
        event_id=event_id,
        student_name=name,
        registered_at=registered_at,
    )


@app.get("/api/registrations", response_model=List[RegistrationItem], tags=["Registrations"])
def list_registrations(event_id: Optional[int] = Query(None, description="Filter by event id")):
    """
    Returns list of registrations, optionally filtered by event_id.
    Includes the event title on each record.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT 
            r.id, r.event_id, e.title AS event_title, 
            r.student_name, r.roll_number, r.email, r.phone, r.registered_at
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE 1=1
    """
    params: List[Any] = []
    if event_id is not None:
        query += " AND r.event_id = ?"
        params.append(event_id)

    query += " ORDER BY r.id DESC;"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [
        RegistrationItem(
            id=row["id"],
            event_id=row["event_id"],
            event_title=row["event_title"],
            student_name=row["student_name"],
            roll_number=row["roll_number"],
            email=row["email"],
            phone=row["phone"],
            registered_at=row["registered_at"],
        )
        for row in rows
    ]


@app.get("/api/stats", response_model=StatsOut, tags=["Admin"])
def get_stats():
    """
    Returns fresh live computed statistics:
    - total_events
    - total_registrations
    - total_capacity
    - overall_utilization_pct (rounded to 1 decimal)
    - upcoming_events_count (events with event_date today or later)
    - events_by_category (dict of category -> count)
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Total events & total capacity
    cursor.execute("SELECT COUNT(*) AS total_events, COALESCE(SUM(capacity), 0) AS total_capacity FROM events;")
    ev_stats = cursor.fetchone()
    total_events = ev_stats["total_events"]
    total_capacity = ev_stats["total_capacity"]

    # Total registrations
    cursor.execute("SELECT COUNT(*) AS total_regs FROM registrations;")
    total_registrations = cursor.fetchone()["total_regs"]

    # Overall utilization
    if total_capacity > 0:
        overall_utilization_pct = round((total_registrations / total_capacity) * 100, 1)
    else:
        overall_utilization_pct = 0.0

    # Upcoming events count (event_date today or later)
    today_str = date.today().isoformat()
    cursor.execute("SELECT COUNT(*) AS upcoming FROM events WHERE event_date >= ?;", (today_str,))
    upcoming_events_count = cursor.fetchone()["upcoming"]

    # Category counts
    cursor.execute("SELECT category, COUNT(*) as cnt FROM events GROUP BY category;")
    category_rows = cursor.fetchall()
    events_by_category = {row["category"]: row["cnt"] for row in category_rows}

    conn.close()

    return StatsOut(
        total_events=total_events,
        total_registrations=total_registrations,
        total_capacity=total_capacity,
        overall_utilization_pct=overall_utilization_pct,
        upcoming_events_count=upcoming_events_count,
        events_by_category=events_by_category,
    )


# ==========================================
# Stretch Goals Endpoints
# ==========================================

@app.post(
    "/api/events",
    response_model=EventOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Stretch Goals"],
)
def create_event(payload: EventCreate):
    """
    Admin endpoint to create a new event with full server-side validation.
    """
    title = payload.title.strip()
    category = payload.category.strip()
    venue = payload.venue.strip()
    event_date = payload.event_date.strip()
    event_time = payload.event_time.strip()

    if not title or not category or not venue or not event_date or not event_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title, category, venue, event_date, and event_time are required.",
        )

    if payload.capacity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Capacity must be greater than 0.",
        )

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO events (title, category, description, event_date, event_time, venue, capacity, fee, icon)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        title,
        category,
        payload.description or "",
        event_date,
        event_time,
        venue,
        payload.capacity,
        payload.fee,
        payload.icon or "🎉",
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return EventOut(
        id=new_id,
        title=title,
        category=category,
        description=payload.description or "",
        event_date=event_date,
        event_time=event_time,
        venue=venue,
        capacity=payload.capacity,
        fee=payload.fee,
        icon=payload.icon or "🎉",
        available_seats=payload.capacity,
    )


@app.delete("/api/registrations/{registration_id}", tags=["Stretch Goals"])
def cancel_registration(registration_id: int):
    """
    Admin endpoint to cancel a registration.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, event_id FROM registrations WHERE id = ?;", (registration_id,))
    reg = cursor.fetchone()
    if not reg:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Registration with id {registration_id} not found",
        )

    cursor.execute("DELETE FROM registrations WHERE id = ?;", (registration_id,))
    conn.commit()
    conn.close()

    return {"message": "Registration cancelled successfully", "id": registration_id}


# ==========================================
# Frontend Static Files Serving (Step 4)
# ==========================================

@app.get("/", include_in_schema=False)
def serve_index():
    index_file = FRONTEND_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="index.html not found")


@app.get("/admin.html", include_in_schema=False)
def serve_admin():
    admin_file = FRONTEND_DIR / "admin.html"
    if admin_file.exists():
        return FileResponse(admin_file)
    raise HTTPException(status_code=404, detail="admin.html not found")


# Mount the js/ static folder to /js
js_dir = FRONTEND_DIR / "js"
if js_dir.exists():
    app.mount("/js", StaticFiles(directory=str(js_dir)), name="js")

# Mount any other frontend assets
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")
