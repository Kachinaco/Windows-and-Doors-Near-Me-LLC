"""
Flask-based Project Management System
Complete Python solution with real-time collaboration
"""

import os
import json
import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from typing import Optional, Dict, Any

from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room, leave_room, rooms
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SelectField, TextAreaField, DateField
from wtforms.validators import DataRequired, Email, Length
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://localhost/project_manager')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# JWT Secret
JWT_SECRET = os.getenv('JWT_SECRET', 'jwt-secret-key')

# Models
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(50), default='customer')
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def generate_token(self):
        payload = {
            'user_id': self.id,
            'exp': datetime.utcnow() + timedelta(days=1)
        }
        return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default='new lead')
    assigned_to = db.Column(db.String(100))
    project_address = db.Column(db.String(255))
    client_phone = db.Column(db.String(20))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Forms
class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])

class RegisterForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=3, max=20)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    first_name = StringField('First Name', validators=[DataRequired()])
    last_name = StringField('Last Name', validators=[DataRequired()])
    role = SelectField('Role', choices=[
        ('customer', 'Customer (Free)'),
        ('contractor_trial', 'Contractor (Trial)'),
        ('contractor_paid', 'Contractor (Paid)')
    ], default='customer')

class ProjectForm(FlaskForm):
    name = StringField('Project Name', validators=[DataRequired()])
    description = TextAreaField('Description')
    status = SelectField('Status', choices=[
        ('new lead', 'New Lead'),
        ('in progress', 'In Progress'),
        ('on order', 'On Order'),
        ('scheduled', 'Scheduled'),
        ('complete', 'Complete')
    ])
    assigned_to = StringField('Assigned To')
    project_address = StringField('Project Address')
    client_phone = StringField('Client Phone')
    start_date = DateField('Start Date')
    end_date = DateField('End Date')

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = session.get('token') or request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return redirect(url_for('login'))
        
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            current_user = User.query.get(payload['user_id'])
            if not current_user:
                return redirect(url_for('login'))
            
            # Store user in request context
            request.current_user = current_user
            return f(*args, **kwargs)
        except jwt.InvalidTokenError:
            return redirect(url_for('login'))
    
    return decorated_function

def role_required(roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(request, 'current_user'):
                return redirect(url_for('login'))
            
            if request.current_user.role not in roles:
                flash('Access denied. Insufficient permissions.', 'error')
                return redirect(url_for('dashboard'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Routes
@app.route('/')
def index():
    if 'token' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        
        if user and user.check_password(form.password.data):
            token = user.generate_token()
            session['token'] = token
            session['user_id'] = user.id
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('auth/login.html', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm()
    if form.validate_on_submit():
        # Check if user already exists
        existing_user = User.query.filter(
            (User.username == form.username.data) | 
            (User.email == form.email.data)
        ).first()
        
        if existing_user:
            flash('Username or email already exists', 'error')
            return render_template('auth/register.html', form=form)
        
        # Create new user
        user = User(
            username=form.username.data,
            email=form.email.data,
            role=form.role.data,
            first_name=form.first_name.data,
            last_name=form.last_name.data
        )
        user.set_password(form.password.data)
        
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('auth/register.html', form=form)

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    user = request.current_user
    projects = Project.query.order_by(Project.updated_at.desc()).limit(10).all()
    
    # Get project statistics
    stats = {
        'total_projects': Project.query.count(),
        'active_projects': Project.query.filter(Project.status.in_(['in progress', 'scheduled'])).count(),
        'completed_projects': Project.query.filter_by(status='complete').count(),
        'new_leads': Project.query.filter_by(status='new lead').count()
    }
    
    return render_template('dashboard/index.html', 
                         user=user, 
                         projects=projects, 
                         stats=stats)

@app.route('/projects')
@login_required
def projects():
    user = request.current_user
    search = request.args.get('search', '')
    status_filter = request.args.get('status', '')
    
    query = Project.query
    
    if search:
        query = query.filter(
            Project.name.contains(search) | 
            Project.description.contains(search) | 
            Project.project_address.contains(search)
        )
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    projects_list = query.order_by(Project.updated_at.desc()).all()
    
    return render_template('projects/index.html', 
                         user=user, 
                         projects=projects_list,
                         search=search,
                         status_filter=status_filter)

@app.route('/projects/new', methods=['GET', 'POST'])
@login_required
@role_required(['admin', 'contractor_trial', 'contractor_paid'])
def new_project():
    form = ProjectForm()
    
    if form.validate_on_submit():
        project = Project(
            name=form.name.data,
            description=form.description.data,
            status=form.status.data,
            assigned_to=form.assigned_to.data,
            project_address=form.project_address.data,
            client_phone=form.client_phone.data,
            start_date=form.start_date.data,
            end_date=form.end_date.data
        )
        
        db.session.add(project)
        db.session.commit()
        
        flash('Project created successfully!', 'success')
        return redirect(url_for('projects'))
    
    return render_template('projects/form.html', form=form, action='Create')

@app.route('/projects/<int:project_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_project(project_id):
    project = Project.query.get_or_404(project_id)
    form = ProjectForm(obj=project)
    
    if form.validate_on_submit():
        form.populate_obj(project)
        project.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Emit real-time update
        socketio.emit('project_updated', {
            'project_id': project.id,
            'project': {
                'id': project.id,
                'name': project.name,
                'status': project.status,
                'assigned_to': project.assigned_to,
                'updated_at': project.updated_at.isoformat()
            }
        }, room='projects')
        
        flash('Project updated successfully!', 'success')
        return redirect(url_for('projects'))
    
    return render_template('projects/form.html', form=form, action='Edit', project=project)

@app.route('/projects/<int:project_id>')
@login_required
def project_detail(project_id):
    project = Project.query.get_or_404(project_id)
    return render_template('projects/detail.html', project=project)

# API Routes for AJAX updates
@app.route('/api/projects/<int:project_id>/update', methods=['POST'])
@login_required
def api_update_project(project_id):
    project = Project.query.get_or_404(project_id)
    data = request.get_json()
    
    # Update allowed fields
    allowed_fields = ['name', 'status', 'assigned_to', 'project_address', 'client_phone']
    
    for field in allowed_fields:
        if field in data:
            setattr(project, field, data[field])
    
    project.updated_at = datetime.utcnow()
    db.session.commit()
    
    # Emit real-time update
    socketio.emit('cell_updated', {
        'project_id': project.id,
        'field': list(data.keys())[0] if data else None,
        'value': list(data.values())[0] if data else None,
        'updated_by': request.current_user.username
    }, room='projects')
    
    return jsonify({'success': True, 'project': {
        'id': project.id,
        'name': project.name,
        'status': project.status,
        'assigned_to': project.assigned_to,
        'project_address': project.project_address,
        'client_phone': project.client_phone,
        'updated_at': project.updated_at.isoformat()
    }})

@app.route('/api/projects')
@login_required
def api_projects():
    projects_list = Project.query.order_by(Project.updated_at.desc()).all()
    
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'status': p.status,
        'assigned_to': p.assigned_to,
        'project_address': p.project_address,
        'client_phone': p.client_phone,
        'start_date': p.start_date.isoformat() if p.start_date else None,
        'end_date': p.end_date.isoformat() if p.end_date else None,
        'updated_at': p.updated_at.isoformat()
    } for p in projects_list])

# WebSocket Events for Real-time Collaboration
@socketio.on('connect')
def on_connect():
    token = session.get('token')
    if not token:
        return False
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user = User.query.get(payload['user_id'])
        if user:
            join_room('projects')
            emit('user_connected', {
                'user_id': user.id,
                'username': user.username,
                'message': f'{user.username} joined the collaboration'
            }, room='projects')
            return True
    except jwt.InvalidTokenError:
        return False

@socketio.on('disconnect')
def on_disconnect():
    token = session.get('token')
    if token:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user = User.query.get(payload['user_id'])
            if user:
                leave_room('projects')
                emit('user_disconnected', {
                    'user_id': user.id,
                    'username': user.username,
                    'message': f'{user.username} left the collaboration'
                }, room='projects')
        except jwt.InvalidTokenError:
            pass

@socketio.on('start_editing')
def on_start_editing(data):
    token = session.get('token')
    if token:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user = User.query.get(payload['user_id'])
            if user:
                emit('cell_editing_started', {
                    'project_id': data['project_id'],
                    'field': data['field'],
                    'user_id': user.id,
                    'username': user.username
                }, room='projects', include_self=False)
        except jwt.InvalidTokenError:
            pass

@socketio.on('stop_editing')
def on_stop_editing(data):
    token = session.get('token')
    if token:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user = User.query.get(payload['user_id'])
            if user:
                emit('cell_editing_stopped', {
                    'project_id': data['project_id'],
                    'field': data['field'],
                    'user_id': user.id,
                    'username': user.username
                }, room='projects', include_self=False)
        except jwt.InvalidTokenError:
            pass

# Initialize database
@app.before_first_request
def create_tables():
    db.create_all()
    
    # Create admin user if it doesn't exist
    admin = User.query.filter_by(username='ADMIN').first()
    if not admin:
        admin = User(
            username='ADMIN',
            email='admin@windowsanddoors.com',
            role='admin',
            first_name='Admin',
            last_name='User'
        )
        admin.set_password('TEST')
        db.session.add(admin)
        db.session.commit()

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)