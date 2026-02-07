# Bug Tracker

A lightweight bug tracking system for internal apps. Built with FastAPI (Python) and React, deployed on Render.

## Features

- **Bug Submission Form**: Product selection, severity, description, screenshots
- **Bug List**: Sortable, filterable by status/product/severity
- **Bug Detail**: Full view with screenshots, admin controls
- **Admin Panel**: Manage products and statuses
- **Mobile Responsive**: Works on desktop and mobile

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: React, TailwindCSS, React Query
- **Deployment**: Render (Web Services + PostgreSQL + Disk)

## Quick Start

### 1. Clone & Setup

```bash
git clone https://github.com/larspnw/bug-tracker.git
cd bug-tracker
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
export ADMIN_PASSWORD=your-admin-password
export DATABASE_URL=sqlite:///./bugtracker.db  # For local dev

# Seed database with initial products and statuses
python seed.py

# Run server
uvicorn app.main:app --reload
```

Backend runs at http://localhost:8000

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000

## Deploy to Render

### Option A: One-Click Deploy (Blueprints)

1. Push this repo to GitHub
2. In Render Dashboard: **Blueprints** → **New Blueprint Instance**
3. Connect your GitHub repo
4. Render creates everything automatically

### Option B: Manual Deploy

**Backend:**
1. Create **Web Service**
2. Root directory: `backend`
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add env vars:
   - `ADMIN_PASSWORD`: your-password
   - `DATABASE_URL`: (from PostgreSQL addon)
   - `CORS_ORIGINS`: https://your-frontend.onrender.com

**Database:**
1. Create **PostgreSQL** (or use free tier for testing)

**Disk:**
1. Add **Disk** to backend service:
   - Mount path: `/uploads`
   - Size: 1GB (or more)

**Frontend:**
1. Create **Static Site**
2. Root directory: `frontend`
3. Build: `npm install && npm run build`
4. Publish: `dist`
5. Add env var:
   - `VITE_API_URL`: https://your-backend.onrender.com

**After deploy:**
```bash
# SSH into backend service or use Render shell
python seed.py
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bugs` | GET | List bugs (with filters) |
| `/api/bugs` | POST | Create bug with files |
| `/api/bugs/{id}` | GET | Get bug details |
| `/api/bugs/{id}` | PATCH | Update bug (admin) |
| `/api/bugs/{id}` | DELETE | Delete bug (admin) |
| `/api/products` | GET | List active products |
| `/api/statuses` | GET | List all statuses |
| `/api/admin/*` | - | Admin endpoints (require password) |

## Environment Variables

### Backend
- `DATABASE_URL`: PostgreSQL connection string
- `ADMIN_PASSWORD`: Password for admin operations
- `CORS_ORIGINS`: Allowed frontend domains (comma-separated)

### Frontend
- `VITE_API_URL`: Backend API URL

## Pre-Seeded Data

**Products:**
- Calorie Tracker
- Wheel app
- Bug tracker

**Statuses:**
- New (blue)
- In Progress (yellow)
- Resolved (green)
- Closed (gray)
- Won't Fix (red)

## Project Structure

```
bug-tracker/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI routes
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   └── database.py      # DB connection
│   ├── seed.py              # Seed initial data
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BugSubmission.jsx
│   │   │   ├── BugList.jsx
│   │   │   ├── BugDetail.jsx
│   │   │   └── AdminPanel.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── render.yaml              # Render blueprint
```

## License

MIT
