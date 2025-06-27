"""
Simple FastAPI Project Management System
Simplified version for immediate deployment
"""

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import uvicorn

# Initialize FastAPI app
app = FastAPI(title="Project Management System")

# Templates
templates = Jinja2Templates(directory="templates")

# Simple data store for demo
projects_data = [
    {"id": 1, "name": "Kitchen Window Replacement", "status": "in progress", "assigned_to": "John Doe", "address": "123 Main St"},
    {"id": 2, "name": "Living Room Patio Door", "status": "scheduled", "assigned_to": "Jane Smith", "address": "456 Oak Ave"},
    {"id": 3, "name": "Bathroom Window Upgrade", "status": "new lead", "assigned_to": "", "address": "789 Pine Rd"},
]

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("simple/index.html", {
        "request": request,
        "projects": projects_data,
        "stats": {
            "total_projects": len(projects_data),
            "active_projects": len([p for p in projects_data if p["status"] in ["in progress", "scheduled"]]),
            "completed_projects": 0,
            "new_leads": len([p for p in projects_data if p["status"] == "new lead"])
        }
    })

@app.get("/projects", response_class=HTMLResponse)
async def projects(request: Request):
    return templates.TemplateResponse("simple/projects.html", {
        "request": request,
        "projects": projects_data
    })

if __name__ == "__main__":
    uvicorn.run("simple_app:app", host="0.0.0.0", port=5000, reload=False)