"""
FastAPI-based Project Management System
Modern async Python solution with real-time collaboration
"""

import os
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request, Depends, HTTPException, Form, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Integer, Text, DateTime, Date, select, update, delete
from passlib.context import CryptContext
from jose import JWTError, jwt
import socketio
from pydantic import BaseModel, Field, EmailStr

# Load environment variables
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+asyncpg://localhost/project_manager')
SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
JWT_SECRET = os.getenv('JWT_SECRET', 'jwt-secret-key')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Database setup
class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = 'users'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default='customer')
    first_name: Mapped[Optional[str]] = mapped_column(String(50))
    last_name: Mapped[Optional[str]] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Project(Base):
    __tablename__ = 'projects'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default='new lead')
    assigned_to: Mapped[Optional[str]] = mapped_column(String(100))
    project_address: Mapped[Optional[str]] = mapped_column(String(255))
    client_phone: Mapped[Optional[str]] = mapped_column(String(20))
    start_date: Mapped[Optional[datetime]] = mapped_column(Date)
    end_date: Mapped[Optional[datetime]] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Pydantic models
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    email: str
    password: str = Field(..., min_length=6)
    first_name: str
    last_name: str
    role: str = 'customer'

class UserLogin(BaseModel):
    username: str
    password: str

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = 'new lead'
    assigned_to: Optional[str] = None
    project_address: Optional[str] = None
    client_phone: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    project_address: Optional[str] = None
    client_phone: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

# Database engine and session
engine = create_async_engine(DATABASE_URL, echo=True)
async_session = async_sessionmaker(engine, expire_on_commit=False)

async def get_db():
    async with async_session() as session:
        yield session

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create admin user
    async with async_session() as session:
        result = await session.execute(select(User).where(User.username == 'ADMIN'))
        admin = result.scalar_one_or_none()
        
        if not admin:
            admin = User(
                username='ADMIN',
                email='admin@windowsanddoors.com',
                password_hash=get_password_hash('TEST'),
                role='admin',
                first_name='Admin',
                last_name='User'
            )
            session.add(admin)
            await session.commit()
    
    yield

# FastAPI app
app = FastAPI(
    title="Project Management System",
    description="Modern async project management with real-time collaboration",
    version="2.0.0",
    lifespan=lifespan
)

# Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)

# Templates and static files
templates = Jinja2Templates(directory="templates")

# Mount static files if directory exists
try:
    app.mount("/static", StaticFiles(directory="static"), name="static")
except RuntimeError:
    pass  # Static directory doesn't exist yet

# Current user dependency
async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)) -> Optional[User]:
    token = request.cookies.get("access_token") or request.headers.get("Authorization", "").replace("Bearer ", "")
    
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        user_id = int(user_id)
        if user_id is None:
            return None
    except JWTError:
        return None
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    return user

async def require_auth(current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return current_user

# Routes
@app.get("/", response_class=HTMLResponse)
async def index(request: Request, current_user: User = Depends(get_current_user)):
    if current_user:
        return RedirectResponse(url="/dashboard", status_code=302)
    return RedirectResponse(url="/login", status_code=302)

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request, current_user: User = Depends(get_current_user)):
    if current_user:
        return RedirectResponse(url="/dashboard", status_code=302)
    return templates.TemplateResponse("auth/login.html", {"request": request})

@app.post("/login")
async def login(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    # Authenticate user
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(password, user.password_hash):
        return templates.TemplateResponse("auth/login.html", {
            "request": request,
            "error": "Invalid username or password"
        })
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    # Set cookie and redirect
    response = RedirectResponse(url="/dashboard", status_code=302)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        expires=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    return response

@app.get("/register", response_class=HTMLResponse)
async def register_page(request: Request, current_user: User = Depends(get_current_user)):
    if current_user:
        return RedirectResponse(url="/dashboard", status_code=302)
    return templates.TemplateResponse("auth/register.html", {"request": request})

@app.post("/register")
async def register(
    request: Request,
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    role: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    # Check if user exists
    result = await db.execute(
        select(User).where((User.username == username) | (User.email == email))
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        return templates.TemplateResponse("auth/register.html", {
            "request": request,
            "error": "Username or email already exists"
        })
    
    # Create new user
    user = User(
        username=username,
        email=email,
        password_hash=get_password_hash(password),
        role=role,
        first_name=first_name,
        last_name=last_name
    )
    
    db.add(user)
    await db.commit()
    
    return templates.TemplateResponse("auth/login.html", {
        "request": request,
        "success": "Registration successful! Please log in."
    })

@app.get("/logout")
async def logout():
    response = RedirectResponse(url="/login", status_code=302)
    response.delete_cookie("access_token")
    return response

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(
    request: Request, 
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    # Get recent projects
    result = await db.execute(
        select(Project).order_by(Project.updated_at.desc()).limit(10)
    )
    projects = result.scalars().all()
    
    # Get statistics
    from sqlalchemy import func
    total_projects = await db.scalar(select(func.count(Project.id)))
    active_projects = await db.scalar(
        select(func.count(Project.id)).where(Project.status.in_(['in progress', 'scheduled']))
    )
    completed_projects = await db.scalar(
        select(func.count(Project.id)).where(Project.status == 'complete')
    )
    new_leads = await db.scalar(
        select(func.count(Project.id)).where(Project.status == 'new lead')
    )
    
    stats = {
        'total_projects': total_projects or 0,
        'active_projects': active_projects or 0,
        'completed_projects': completed_projects or 0,
        'new_leads': new_leads or 0
    }
    
    return templates.TemplateResponse("dashboard/index.html", {
        "request": request,
        "current_user": current_user,
        "projects": projects,
        "stats": stats
    })

@app.get("/projects", response_class=HTMLResponse)
async def projects_page(
    request: Request,
    current_user: User = Depends(require_auth),
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Project)
    
    if search:
        query = query.where(
            Project.name.contains(search) |
            Project.description.contains(search) |
            Project.project_address.contains(search)
        )
    
    if status:
        query = query.where(Project.status == status)
    
    query = query.order_by(Project.updated_at.desc())
    result = await db.execute(query)
    projects = result.scalars().all()
    
    return templates.TemplateResponse("projects/index.html", {
        "request": request,
        "current_user": current_user,
        "projects": projects,
        "search": search or "",
        "status_filter": status or ""
    })

@app.get("/projects/new", response_class=HTMLResponse)
async def new_project_page(
    request: Request,
    current_user: User = Depends(require_auth)
):
    if current_user.role not in ['admin', 'contractor_trial', 'contractor_paid']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return templates.TemplateResponse("projects/form.html", {
        "request": request,
        "current_user": current_user,
        "action": "Create"
    })

@app.post("/projects/new")
async def create_project(
    request: Request,
    current_user: User = Depends(require_auth),
    name: str = Form(...),
    description: str = Form(""),
    status: str = Form("new lead"),
    assigned_to: str = Form(""),
    project_address: str = Form(""),
    client_phone: str = Form(""),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ['admin', 'contractor_trial', 'contractor_paid']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    project = Project(
        name=name,
        description=description or None,
        status=status,
        assigned_to=assigned_to or None,
        project_address=project_address or None,
        client_phone=client_phone or None
    )
    
    db.add(project)
    await db.commit()
    
    return RedirectResponse(url="/projects", status_code=302)

@app.get("/projects/{project_id}", response_class=HTMLResponse)
async def project_detail(
    request: Request,
    project_id: int,
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return templates.TemplateResponse("projects/detail.html", {
        "request": request,
        "current_user": current_user,
        "project": project
    })

# API Routes
@app.get("/api/projects")
async def api_get_projects(
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Project).order_by(Project.updated_at.desc()))
    projects = result.scalars().all()
    
    return [{
        "id": p.id,
        "name": p.name,
        "status": p.status,
        "assigned_to": p.assigned_to,
        "project_address": p.project_address,
        "client_phone": p.client_phone,
        "start_date": p.start_date.isoformat() if p.start_date else None,
        "end_date": p.end_date.isoformat() if p.end_date else None,
        "updated_at": p.updated_at.isoformat()
    } for p in projects]

@app.put("/api/projects/{project_id}")
async def api_update_project(
    project_id: int,
    update_data: Dict[str, Any],
    current_user: User = Depends(require_auth),
    db: AsyncSession = Depends(get_db)
):
    # Get project
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update allowed fields
    allowed_fields = ['name', 'status', 'assigned_to', 'project_address', 'client_phone']
    
    for field, value in update_data.items():
        if field in allowed_fields:
            setattr(project, field, value)
    
    project.updated_at = datetime.utcnow()
    await db.commit()
    
    # Emit real-time update
    await sio.emit('cell_updated', {
        'project_id': project.id,
        'field': list(update_data.keys())[0] if update_data else None,
        'value': list(update_data.values())[0] if update_data else None,
        'updated_by': current_user.username
    }, room='projects')
    
    return {
        "id": project.id,
        "name": project.name,
        "status": project.status,
        "assigned_to": project.assigned_to,
        "project_address": project.project_address,
        "client_phone": project.client_phone,
        "updated_at": project.updated_at.isoformat()
    }

# Socket.IO Events
@sio.event
async def connect(sid, environ):
    print(f"Client {sid} connected")
    await sio.enter_room(sid, 'projects')
    await sio.emit('user_connected', {
        'user_id': sid,
        'username': 'User',
        'message': 'User joined the collaboration'
    }, room='projects', skip_sid=sid)

@sio.event
async def disconnect(sid):
    print(f"Client {sid} disconnected")
    await sio.leave_room(sid, 'projects')
    await sio.emit('user_disconnected', {
        'user_id': sid,
        'username': 'User',
        'message': 'User left the collaboration'
    }, room='projects')

@sio.event
async def start_editing(sid, data):
    await sio.emit('cell_editing_started', {
        'project_id': data['project_id'],
        'field': data['field'],
        'user_id': sid,
        'username': data.get('username', 'User')
    }, room='projects', skip_sid=sid)

@sio.event
async def stop_editing(sid, data):
    await sio.emit('cell_editing_stopped', {
        'project_id': data['project_id'],
        'field': data['field'],
        'user_id': sid,
        'username': data.get('username', 'User')
    }, room='projects', skip_sid=sid)

if __name__ == "__main__":
    uvicorn.run("main:socket_app", host="0.0.0.0", port=5000, reload=True)