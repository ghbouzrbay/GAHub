/**
 * GAHub — Client-Side Application Logic
 */

// ============================================
// State
// ============================================
let currentProjectId = null;
let currentSheetId = null;
let projects = [];
let selectedFile = null;

// SVG Icon Library
const icons = {
    folder: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
    trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    users: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    grid: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
    calendar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    info: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    spreadsheet: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
    usersEmpty: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    gridEmpty: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
};

// Activity action labels
const actionLabels = {
    created_project: 'Created project',
    deleted_project: 'Deleted project',
    updated_project: 'Updated project',
    added_collaborator: 'Added collaborator',
    removed_collaborator: 'Removed collaborator',
    created_spreadsheet: 'Created spreadsheet',
    deleted_spreadsheet: 'Deleted spreadsheet',
    uploaded_spreadsheet: 'Uploaded spreadsheet',
};

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    loadStats();
    setupUploadArea();
    setupKeyboardShortcuts();
});

// ============================================
// Toast Notifications
// ============================================
function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = 'flash-msg ' + type;
    el.innerHTML = (type === 'success' ? icons.check + ' ' : type === 'error' ? icons.x + ' ' : icons.info + ' ') + msg;
    el.onclick = () => el.remove();
    container.appendChild(el);
    setTimeout(() => {
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        el.style.opacity = '0';
        el.style.transform = 'translateX(40px)';
        setTimeout(() => el.remove(), 400);
    }, 3500);
}

/**
 * Custom-styled confirmation dialog (replaces confirm()).
 * @param {string} message - The confirmation message.
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false otherwise.
 */
function customConfirm(message) {
    return new Promise((resolve) => {
        const modalId = 'custom-confirm-modal';
        
        // Remove existing modal to prevent duplicate IDs stacking in the DOM
        const existingModal = document.getElementById(modalId);
        if (existingModal) existingModal.remove();

        const modalHTML = `
            <div class="modal-overlay" id="${modalId}">
                <div class="modal">
                    <h2>Confirm</h2>
                    <p>${message}</p>
                    <div class="modal-actions">
                        <button class="btn btn-ghost" id="${modalId}-cancel">Cancel</button>
                        <button class="btn btn-primary" id="${modalId}-confirm">Confirm</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Grab the buttons and attach event listeners inside the Promise scope
        const cancelBtn = document.getElementById(`${modalId}-cancel`);
        const confirmBtn = document.getElementById(`${modalId}-confirm`);

        cancelBtn.addEventListener('click', () => {
            closeModal(modalId);
            resolve(false);
        });

        confirmBtn.addEventListener('click', () => {
            closeModal(modalId);
            resolve(true);
        });

        openModal(modalId);
    });
}

/**
 * Custom-styled prompt dialog (replaces prompt()).
 * @param {string} message - The prompt message.
 * @param {string} [defaultValue=""] - The default value for the input.
 * @returns {Promise<string|null>} - Resolves to the input value or null if canceled.
 */
function customPrompt(message, defaultValue = '') {
    return new Promise((resolve) => {
        const modalId = 'custom-prompt-modal';
        
        const existingModal = document.getElementById(modalId);
        if (existingModal) existingModal.remove();

        const modalHTML = `
            <div class="modal-overlay" id="${modalId}">
                <div class="modal">
                    <h2>Input Required</h2>
                    <p>${message}</p>
                    <div class="form-group">
                        <input type="text" id="${modalId}-input" class="form-control" value="${defaultValue}">
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-ghost" id="${modalId}-cancel">Cancel</button>
                        <button class="btn btn-primary" id="${modalId}-submit">Submit</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const cancelBtn = document.getElementById(`${modalId}-cancel`);
        const submitBtn = document.getElementById(`${modalId}-submit`);
        const inputField = document.getElementById(`${modalId}-input`);

        cancelBtn.addEventListener('click', () => {
            closeModal(modalId);
            resolve(null);
        });

        submitBtn.addEventListener('click', () => {
            closeModal(modalId);
            resolve(inputField.value.trim());
        });

        openModal(modalId);
    });
}

// ============================================
// API Helper
// ============================================
async function api(url, method = 'GET', body = null) {
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
    }
    return data;
}

// ============================================
// Modal Management
// ============================================
function openModal(id) {
    document.getElementById(id).classList.add('active');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// ============================================
// View Switching
// ============================================
function switchView(view, btn) {
    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // Hide all views
    document.getElementById('projects-view').style.display = 'none';
    document.getElementById('activity-view').style.display = 'none';
    document.getElementById('project-detail-view').classList.remove('active');
    currentProjectId = null;

    if (view === 'projects') {
        document.getElementById('projects-view').style.display = 'block';
    } else if (view === 'activity') {
        document.getElementById('activity-view').style.display = 'block';
        loadActivity();
    }
}

// ============================================
// Dashboard Stats
// ============================================
async function loadStats() {
    try {
        const stats = await api('/api/stats');
        animateCounter('stat-projects', stats.projects);
        animateCounter('stat-collaborators', stats.collaborators);
        animateCounter('stat-spreadsheets', stats.spreadsheets);
    } catch (err) {
        // Stats are non-critical
    }
}

function animateCounter(elementId, targetValue) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const duration = 800;
    const startTime = performance.now();
    const startValue = 0;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startValue + (targetValue - startValue) * eased);
        el.textContent = current;
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    requestAnimationFrame(update);
}

// ============================================
// Projects
// ============================================
async function loadProjects() {
    try {
        projects = await api('/api/projects');
        renderProjects();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderProjects(filter = '') {
    const grid = document.getElementById('projects-grid');
    let html = '';

    // Create card
    html += `
        <div class="create-project-card glass-card" onclick="openCreateProjectModal()" style="border-radius:var(--radius-lg);">
            <div class="plus-icon">+</div>
            <span>New Project</span>
        </div>
    `;

    const filtered = filter
        ? projects.filter(p =>
            p.name.toLowerCase().includes(filter.toLowerCase()) ||
            (p.description || '').toLowerCase().includes(filter.toLowerCase())
        )
        : projects;

    filtered.forEach((p, index) => {
        const date = new Date(p.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
        html += `
            <div class="project-card glass-card" onclick="openProjectDetail(${p.id})" style="animation-delay:${index * 0.06}s;">
                <div class="project-card-header">
                    <div class="project-card-icon">${icons.folder}</div>
                    <button class="btn btn-icon btn-ghost" onclick="event.stopPropagation();confirmDeleteProject(${p.id})" title="Delete">${icons.trash}</button>
                </div>
                <h3>${escapeHtml(p.name)}</h3>
                <p>${escapeHtml(p.description || 'No description')}</p>
                <div class="project-card-meta">
                    <span>${icons.users} ${(p.collaborators || []).length}</span>
                    <span>${icons.grid} ${p.spreadsheet_count || 0}</span>
                    <span>${icons.calendar} ${date}</span>
                </div>
            </div>
        `;
    });

    grid.innerHTML = html;
}

function searchProjects() {
    const q = document.getElementById('search-input').value.trim();
    renderProjects(q);
}

function openCreateProjectModal() {
    document.getElementById('new-project-name').value = '';
    document.getElementById('new-project-desc').value = '';
    openModal('create-project-modal');
}

async function createProject() {
    const name = document.getElementById('new-project-name').value.trim();
    const description = document.getElementById('new-project-desc').value.trim();
    if (!name) return showToast('Project name is required', 'error');

    try {
        await api('/api/projects', 'POST', { name, description });
        closeModal('create-project-modal');
        showToast('Project created!', 'success');
        loadProjects();
        loadStats();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function confirmDeleteProject(id) {
    customConfirm('Are you sure you want to delete this project?').then((confirmed) => {
        if (confirmed) {
            deleteProject(id);
        }
    });
}

async function deleteProject(id) {
    try {
        await api(`/api/projects/${id}`, 'DELETE');
        showToast('Project deleted', 'success');
        if (currentProjectId === id) closeProjectDetail();
        loadProjects();
        loadStats();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function deleteCurrentProject() {
    if (currentProjectId) confirmDeleteProject(currentProjectId);
}

// ============================================
// Project Detail
// ============================================
async function openProjectDetail(id) {
    currentProjectId = id;
    const project = projects.find(p => p.id === id);
    if (!project) return;

    document.getElementById('projects-view').style.display = 'none';
    document.getElementById('activity-view').style.display = 'none';
    document.getElementById('project-detail-view').classList.add('active');

    document.getElementById('detail-project-name').textContent = project.name;
    document.getElementById('detail-project-desc').textContent = project.description || 'No description provided.';

    // Reset to overview tab
    switchTab('overview', document.querySelector('.detail-tab'));

    // Load collaborators and spreadsheets
    loadCollaborators();
    loadSpreadsheets();
}

function closeProjectDetail() {
    document.getElementById('project-detail-view').classList.remove('active');
    document.getElementById('projects-view').style.display = 'block';
    currentProjectId = null;
    loadProjects();
    loadStats();
}

function switchTab(tabName, btn) {
    document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById('tab-' + tabName).classList.add('active');
}

// Edit project
function openEditProjectModal() {
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return;
    document.getElementById('edit-project-name').value = project.name;
    document.getElementById('edit-project-desc').value = project.description || '';
    openModal('edit-project-modal');
}

async function updateProject() {
    const name = document.getElementById('edit-project-name').value.trim();
    const description = document.getElementById('edit-project-desc').value.trim();
    if (!name) return showToast('Project name is required', 'error');

    try {
        const updated = await api(`/api/projects/${currentProjectId}`, 'PUT', { name, description });
        closeModal('edit-project-modal');
        showToast('Project updated!', 'success');

        // Update local state
        const idx = projects.findIndex(p => p.id === currentProjectId);
        if (idx !== -1) projects[idx] = updated;

        document.getElementById('detail-project-name').textContent = updated.name;
        document.getElementById('detail-project-desc').textContent = updated.description || 'No description provided.';
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ============================================
// Collaborators
// ============================================
async function loadCollaborators() {
    if (!currentProjectId) return;
    try {
        const collabs = await api(`/api/projects/${currentProjectId}/collaborators`);
        renderCollaborators(collabs);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderCollaborators(collabs) {
    const list = document.getElementById('collab-list');
    if (collabs.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${icons.usersEmpty}</div>
                <h3>No collaborators yet</h3>
                <p>Add team members to start collaborating.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = collabs.map(c => `
        <li class="collab-item">
            <div class="collab-info">
                <div class="collab-avatar">${(c.username || '?')[0].toUpperCase()}</div>
                <div>
                    <div class="collab-name">${escapeHtml(c.username || 'Unknown')}</div>
                    <div class="collab-role">${c.role}</div>
                </div>
            </div>
            <button class="btn btn-danger btn-sm" onclick="removeCollaborator(${c.id})">Remove</button>
        </li>
    `).join('');
}

function openAddCollabModal() {
    document.getElementById('collab-username').value = '';
    document.getElementById('collab-role').value = 'viewer';
    openModal('add-collab-modal');
}

async function addCollaborator() {
    const username = document.getElementById('collab-username').value.trim();
    const role = document.getElementById('collab-role').value;
    if (!username) return showToast('Username is required', 'error');

    try {
        await api(`/api/projects/${currentProjectId}/collaborators`, 'POST', { username, role });
        closeModal('add-collab-modal');
        showToast('Collaborator added!', 'success');
        loadCollaborators();
        loadProjects(); // Refresh card counts
        loadStats();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function confirmDeleteProject(id) {
    customConfirm('Are you sure you want to delete this project?').then((confirmed) => {
        if (confirmed) {
            deleteProject(id);
        }
    });
}

async function removeCollaborator(id) {
    const confirmed = await customConfirm('Remove this collaborator?');
    if (!confirmed) return;
    
    try {
        await api(`/api/collaborators/${id}`, 'DELETE');
        showToast('Collaborator removed', 'success');
        loadCollaborators();
        loadProjects();
        loadStats();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ============================================
// Spreadsheets
// ============================================
async function loadSpreadsheets() {
    if (!currentProjectId) return;
    try {
        const sheets = await api(`/api/projects/${currentProjectId}/spreadsheets`);
        renderSheetsList(sheets);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderSheetsList(sheets) {
    const container = document.getElementById('sheets-list');
    document.getElementById('sheet-editor-container').style.display = 'none';

    if (sheets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${icons.gridEmpty}</div>
                <h3>No spreadsheets yet</h3>
                <p>Create a new spreadsheet or upload an Excel file.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = sheets.map(s => {
        const date = new Date(s.updated_at || s.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
        return `
            <div class="glass-card" style="padding:var(--spacing-lg);margin-bottom:var(--spacing-sm);display:flex;align-items:center;justify-content:space-between;cursor:pointer;"
                 onclick="openSheetEditor(${s.id})">
                <div style="display:flex;align-items:center;gap:var(--spacing-md);">
                    <span style="font-size:1.3rem;color:var(--accent-primary);">${icons.spreadsheet}</span>
                    <div>
                        <div style="font-weight:600;font-size:0.95rem;">${escapeHtml(s.name)}</div>
                        <div style="font-size:0.8rem;color:var(--text-muted);">${s.rows}&times;${s.cols} · ${date}</div>
                    </div>
                </div>
                <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteSpreadsheet(${s.id})">${icons.trash}</button>
            </div>
        `;
    }).join('');
}

function openCreateSheetModal() {
    document.getElementById('sheet-name').value = '';
    document.getElementById('sheet-rows').value = '10';
    document.getElementById('sheet-cols').value = '6';
    openModal('create-sheet-modal');
}

async function createSpreadsheet() {
    const name = document.getElementById('sheet-name').value.trim() || 'Untitled';
    const rows = parseInt(document.getElementById('sheet-rows').value) || 10;
    const cols = parseInt(document.getElementById('sheet-cols').value) || 6;

    try {
        await api(`/api/projects/${currentProjectId}/spreadsheets`, 'POST', { name, rows, cols });
        closeModal('create-sheet-modal');
        showToast('Spreadsheet created!', 'success');
        loadSpreadsheets();
        loadStats();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteSpreadsheet(id) {
    const confirmed = await customConfirm('Delete this spreadsheet?');
    if (!confirmed) return;
    
    try {
        await api(`/api/spreadsheets/${id}`, 'DELETE');
        showToast('Spreadsheet deleted', 'success');
        loadSpreadsheets();
        loadStats();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ============================================
// Spreadsheet Editor
// ============================================
async function openSheetEditor(id) {
    try {
        const sheet = await api(`/api/spreadsheets/${id}`);
        currentSheetId = id;
        renderSpreadsheet(sheet);
        document.getElementById('sheets-list').style.display = 'none';
        document.getElementById('sheet-editor-container').style.display = 'block';
        document.getElementById('sheet-editor-name').textContent = sheet.name;
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function closeSheetEditor() {
    document.getElementById('sheet-editor-container').style.display = 'none';
    document.getElementById('sheets-list').style.display = 'block';
    currentSheetId = null;
    loadSpreadsheets();
}

function renderSpreadsheet(sheet) {
    const container = document.getElementById('spreadsheet-container');
    const data = sheet.data || [];
    const rows = sheet.rows || data.length || 10;
    const cols = sheet.cols || (data[0] ? data[0].length : 6);

    // Column headers: A, B, C, ...
    const colLetters = Array.from({ length: cols }, (_, i) => String.fromCharCode(65 + i));

    let html = '<table class="spreadsheet-table"><thead><tr><th class="row-header"></th>';
    colLetters.forEach(l => { html += `<th>${l}</th>`; });
    html += '</tr></thead><tbody>';

    for (let r = 0; r < rows; r++) {
        html += `<tr><th class="row-header">${r + 1}</th>`;
        for (let c = 0; c < cols; c++) {
            const val = (data[r] && data[r][c] !== undefined) ? data[r][c] : '';
            html += `<td><input type="text" value="${escapeAttr(val)}" data-row="${r}" data-col="${c}"></td>`;
        }
        html += '</tr>';
    }

    html += '</tbody></table>';
    container.innerHTML = html;
}

async function saveSpreadsheet() {
    if (!currentSheetId) return;

    const inputs = document.querySelectorAll('#spreadsheet-container input');
    const data = {};
    let maxRow = 0, maxCol = 0;

    inputs.forEach(input => {
        const r = parseInt(input.dataset.row);
        const c = parseInt(input.dataset.col);
        if (!data[r]) data[r] = {};
        data[r][c] = input.value;
        maxRow = Math.max(maxRow, r);
        maxCol = Math.max(maxCol, c);
    });

    // Convert to 2D array
    const grid = [];
    for (let r = 0; r <= maxRow; r++) {
        const row = [];
        for (let c = 0; c <= maxCol; c++) {
            row.push(data[r] && data[r][c] !== undefined ? data[r][c] : '');
        }
        grid.push(row);
    }

    try {
        await api(`/api/spreadsheets/${currentSheetId}`, 'PUT', { data: grid });
        showToast('Spreadsheet saved!', 'success');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ============================================
// CSV Export
// ============================================
function exportCSV() {
    if (!currentSheetId) return;
    // Trigger download via the export endpoint
    window.location.href = `/api/spreadsheets/${currentSheetId}/export`;
}

// ============================================
// Activity Feed
// ============================================
async function loadActivity() {
    try {
        const activities = await api('/api/activity');
        renderActivity(activities);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderActivity(activities) {
    const list = document.getElementById('activity-list');
    if (activities.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></div>
                <h3>No activity yet</h3>
                <p>Your recent actions will appear here.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = activities.map((a, i) => {
        const label = actionLabels[a.action] || a.action;
        const timeAgo = getTimeAgo(a.created_at);
        return `
            <li class="activity-item" style="animation-delay:${i * 0.05}s;">
                <div class="activity-dot"></div>
                <div>
                    <div class="activity-text"><strong>${label}</strong> ${escapeHtml(a.target)}</div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
            </li>
        `;
    }).join('');
}

function getTimeAgo(isoString) {
    const now = new Date();
    const date = new Date(isoString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================
// Keyboard Shortcuts
// ============================================
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+S or Cmd+S — save spreadsheet
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            if (currentSheetId) {
                e.preventDefault();
                saveSpreadsheet();
            }
        }
        // Escape — close modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(m => {
                m.classList.remove('active');
            });
        }
    });
}

// ============================================
// File Upload
// ============================================
function setupUploadArea() {
    const area = document.getElementById('upload-area');
    if (!area) return;

    area.addEventListener('dragover', e => {
        e.preventDefault();
        area.classList.add('dragover');
    });
    area.addEventListener('dragleave', () => {
        area.classList.remove('dragover');
    });
    area.addEventListener('drop', e => {
        e.preventDefault();
        area.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            selectedFile = e.dataTransfer.files[0];
            document.getElementById('upload-file-name').textContent = selectedFile.name;
            document.getElementById('upload-btn').disabled = false;
        }
    });
}

function openUploadModal() {
    selectedFile = null;
    document.getElementById('upload-file-name').textContent = '';
    document.getElementById('upload-btn').disabled = true;
    document.getElementById('excel-file-input').value = '';
    openModal('upload-modal');
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        selectedFile = file;
        document.getElementById('upload-file-name').textContent = file.name;
        document.getElementById('upload-btn').disabled = false;
    }
}

async function uploadExcel() {
    if (!selectedFile || !currentProjectId) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('project_id', currentProjectId);

    try {
        const res = await fetch('/api/upload-excel', {
            method: 'POST',
            body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');

        closeModal('upload-modal');
        showToast('File uploaded successfully!', 'success');
        loadSpreadsheets();
        loadStats();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ============================================
// Helpers
// ============================================
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
