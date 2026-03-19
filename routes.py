"""Flask routes for GAHub."""

import json
from flask import (Blueprint, render_template, request, redirect,
                   url_for, flash, jsonify)
from flask_login import login_user, logout_user, login_required, current_user
from models import db, User, Project, Collaborator, Spreadsheet

main = Blueprint('main', __name__)


# ---------- Page Routes ----------

@main.route('/')
def landing():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    return render_template('landing.html')


@main.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))

    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')

        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            login_user(user)
            flash('Welcome back!', 'success')
            return redirect(url_for('main.dashboard'))
        else:
            flash('Invalid email or password.', 'error')

    return render_template('login.html')


@main.route('/signup', methods=['GET', 'POST'])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        confirm = request.form.get('confirm_password', '')

        # Validation
        if not username or not email or not password:
            flash('All fields are required.', 'error')
            return render_template('signup.html')

        if password != confirm:
            flash('Passwords do not match.', 'error')
            return render_template('signup.html')

        if len(password) < 6:
            flash('Password must be at least 6 characters.', 'error')
            return render_template('signup.html')

        if User.query.filter_by(email=email).first():
            flash('Email already registered.', 'error')
            return render_template('signup.html')

        if User.query.filter_by(username=username).first():
            flash('Username already taken.', 'error')
            return render_template('signup.html')

        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        flash('Account created! Please login.', 'success')
        return redirect(url_for('main.login'))

    return render_template('signup.html')


@main.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Logged out successfully.', 'success')
    return redirect(url_for('main.landing'))


@main.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')


# ---------- API Routes — Projects ----------

@main.route('/api/projects', methods=['GET'])
@login_required
def get_projects():
    # Projects the user owns
    owned = Project.query.filter_by(owner_id=current_user.id).all()
    # Projects the user collaborates on
    collab_ids = [c.project_id for c in
                  Collaborator.query.filter_by(user_id=current_user.id).all()]
    collaborated = Project.query.filter(Project.id.in_(collab_ids)).all() if collab_ids else []

    all_projects = {p.id: p for p in owned + collaborated}
    return jsonify([p.to_dict() for p in all_projects.values()])


@main.route('/api/projects', methods=['POST'])
@login_required
def create_project():
    data = request.get_json()
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()

    if not name:
        return jsonify({'error': 'Project name is required'}), 400

    project = Project(name=name, description=description, owner_id=current_user.id)
    db.session.add(project)
    db.session.commit()
    return jsonify(project.to_dict()), 201


@main.route('/api/projects/<int:project_id>', methods=['DELETE'])
@login_required
def delete_project(project_id):
    project = Project.query.get_or_404(project_id)
    if project.owner_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    db.session.delete(project)
    db.session.commit()
    return jsonify({'message': 'Project deleted'})


@main.route('/api/projects/<int:project_id>', methods=['PUT'])
@login_required
def update_project(project_id):
    project = Project.query.get_or_404(project_id)
    if project.owner_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    if 'name' in data:
        project.name = data['name'].strip()
    if 'description' in data:
        project.description = data['description'].strip()

    db.session.commit()
    return jsonify(project.to_dict())


# ---------- API Routes — Collaborators ----------

@main.route('/api/projects/<int:project_id>/collaborators', methods=['GET'])
@login_required
def get_collaborators(project_id):
    project = Project.query.get_or_404(project_id)
    return jsonify([c.to_dict() for c in project.collaborators])


@main.route('/api/projects/<int:project_id>/collaborators', methods=['POST'])
@login_required
def add_collaborator(project_id):
    project = Project.query.get_or_404(project_id)
    if project.owner_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    username = data.get('username', '').strip()
    role = data.get('role', 'viewer')

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.id == current_user.id:
        return jsonify({'error': 'Cannot add yourself as collaborator'}), 400

    existing = Collaborator.query.filter_by(
        user_id=user.id, project_id=project_id).first()
    if existing:
        return jsonify({'error': 'User is already a collaborator'}), 400

    collab = Collaborator(user_id=user.id, project_id=project_id, role=role)
    db.session.add(collab)
    db.session.commit()
    return jsonify(collab.to_dict()), 201


@main.route('/api/collaborators/<int:collab_id>', methods=['DELETE'])
@login_required
def remove_collaborator(collab_id):
    collab = Collaborator.query.get_or_404(collab_id)
    project = Project.query.get(collab.project_id)
    if project.owner_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    db.session.delete(collab)
    db.session.commit()
    return jsonify({'message': 'Collaborator removed'})


# ---------- API Routes — Spreadsheets ----------

@main.route('/api/projects/<int:project_id>/spreadsheets', methods=['GET'])
@login_required
def get_spreadsheets(project_id):
    Project.query.get_or_404(project_id)
    sheets = Spreadsheet.query.filter_by(project_id=project_id).all()
    return jsonify([s.to_dict() for s in sheets])


@main.route('/api/projects/<int:project_id>/spreadsheets', methods=['POST'])
@login_required
def create_spreadsheet(project_id):
    Project.query.get_or_404(project_id)
    data = request.get_json()
    name = data.get('name', 'Untitled Spreadsheet').strip()
    rows = data.get('rows', 10)
    cols = data.get('cols', 6)

    # Initialize empty grid
    grid = [[''] * cols for _ in range(rows)]

    sheet = Spreadsheet(name=name, project_id=project_id,
                        data=grid, rows=rows, cols=cols)
    db.session.add(sheet)
    db.session.commit()
    return jsonify(sheet.to_dict()), 201


@main.route('/api/spreadsheets/<int:sheet_id>', methods=['GET'])
@login_required
def get_spreadsheet(sheet_id):
    sheet = Spreadsheet.query.get_or_404(sheet_id)
    return jsonify(sheet.to_dict())


@main.route('/api/spreadsheets/<int:sheet_id>', methods=['PUT'])
@login_required
def update_spreadsheet(sheet_id):
    sheet = Spreadsheet.query.get_or_404(sheet_id)
    data = request.get_json()

    if 'name' in data:
        sheet.name = data['name'].strip()
    if 'data' in data:
        sheet.data = data['data']
    if 'rows' in data:
        sheet.rows = data['rows']
    if 'cols' in data:
        sheet.cols = data['cols']

    db.session.commit()
    return jsonify(sheet.to_dict())


@main.route('/api/spreadsheets/<int:sheet_id>', methods=['DELETE'])
@login_required
def delete_spreadsheet(sheet_id):
    sheet = Spreadsheet.query.get_or_404(sheet_id)
    db.session.delete(sheet)
    db.session.commit()
    return jsonify({'message': 'Spreadsheet deleted'})


# ---------- API Routes — File Upload ----------

@main.route('/api/upload-excel', methods=['POST'])
@login_required
def upload_excel():
    """Upload an Excel file and convert it to a spreadsheet."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    project_id = request.form.get('project_id')

    if not project_id:
        return jsonify({'error': 'Project ID required'}), 400

    Project.query.get_or_404(int(project_id))

    try:
        import openpyxl
        wb = openpyxl.load_workbook(file, data_only=True)
        ws = wb.active

        grid = []
        for row in ws.iter_rows(values_only=True):
            grid.append([str(cell) if cell is not None else '' for cell in row])

        if not grid:
            grid = [[''] * 6 for _ in range(10)]

        rows = len(grid)
        cols = max(len(r) for r in grid) if grid else 6

        # Pad rows to equal length
        for r in grid:
            while len(r) < cols:
                r.append('')

        name = file.filename or 'Uploaded Spreadsheet'
        sheet = Spreadsheet(name=name, project_id=int(project_id),
                            data=grid, rows=rows, cols=cols)
        db.session.add(sheet)
        db.session.commit()
        return jsonify(sheet.to_dict()), 201

    except Exception as e:
        return jsonify({'error': f'Failed to parse file: {str(e)}'}), 400


# ---------- API — Search Users ----------

@main.route('/api/users/search', methods=['GET'])
@login_required
def search_users():
    q = request.args.get('q', '').strip()
    if len(q) < 2:
        return jsonify([])
    users = User.query.filter(
        User.username.ilike(f'%{q}%'),
        User.id != current_user.id
    ).limit(10).all()
    return jsonify([u.to_dict() for u in users])
