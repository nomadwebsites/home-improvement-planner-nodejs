// Initialize Socket.io
const socket = io();

// State
let projects = [];
let currentEditingProject = null;
let currentEditingCost = null;
let currentProjectForCost = null;

// DOM Elements
const projectsContainer = document.getElementById('projects-container');
const addProjectBtn = document.getElementById('add-project-btn');
const projectModal = document.getElementById('project-modal');
const costModal = document.getElementById('cost-modal');
const projectForm = document.getElementById('project-form');
const costForm = document.getElementById('cost-form');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    initializeEventListeners();
    initializeSocketListeners();
});

// Load all projects
async function loadProjects() {
    try {
        const response = await fetch('/api/projects');
        projects = await response.json();
        renderProjects();
        updateSummary();
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// Render projects
function renderProjects() {
    if (projects.length === 0) {
        projectsContainer.innerHTML = `
            <div class="empty-state">
                <h3>📋 No projects yet</h3>
                <p>Click "Add New Project" to get started!</p>
            </div>
        `;
        return;
    }

    projectsContainer.innerHTML = projects.map((project, index) => `
        <div class="project-card" data-project-id="${project.id}" draggable="true">
            <div class="project-header">
                <div class="project-info">
                    <div class="project-name">${escapeHtml(project.name)}</div>
                    <div class="project-priority-container">
                        <label for="priority-${project.id}">Priority:</label>
                        <input 
                            type="number" 
                            id="priority-${project.id}" 
                            class="priority-input" 
                            value="${index + 1}" 
                            min="1" 
                            max="${projects.length}"
                            data-project-id="${project.id}"
                            title="Enter a number to move this project to that position"
                        />
                    </div>
                </div>
                <div class="project-actions">
                    <button class="icon-btn" onclick="editProject(${project.id})" title="Edit Project">✏️</button>
                    <button class="icon-btn" onclick="deleteProject(${project.id})" title="Delete Project">🗑️</button>
                </div>
            </div>
            <div class="project-body">
                ${project.value_add ? `
                    <div class="value-add-section">
                        <h3>💰 Estimated Value Add</h3>
                        <div class="value-add-amount">$${formatNumber(project.value_add)}</div>
                        ${project.value_add_description ? `
                            <div class="value-add-description">${escapeHtml(project.value_add_description)}</div>
                        ` : ''}
                    </div>
                ` : ''}
                
                <div class="costs-section">
                    <div class="costs-header">
                        <h3>📝 Cost Breakdown</h3>
                        <button class="btn btn-success btn-small" onclick="addCost(${project.id})">+ Add Cost</button>
                    </div>
                    ${project.costs.length > 0 ? `
                        ${project.costs.map(cost => `
                            <div class="cost-item">
                                <span class="cost-description">${escapeHtml(cost.description)}</span>
                                <span class="cost-amount">$${formatNumber(cost.amount)}</span>
                                <div class="cost-actions">
                                    <button class="btn btn-secondary btn-small" onclick="editCost(${cost.id}, ${project.id})">Edit</button>
                                    <button class="btn btn-danger btn-small" onclick="deleteCost(${cost.id})">Delete</button>
                                </div>
                            </div>
                        `).join('')}
                    ` : '<p style="color: #6c757d; font-style: italic;">No costs added yet</p>'}
                </div>
            </div>
            <div class="project-total">
                <span>Total Project Cost</span>
                <span>$${formatNumber(project.total_cost)}</span>
            </div>
        </div>
    `).join('');

    initializeDragAndDrop();
    initializePriorityInputs();
}

// Update summary statistics
function updateSummary() {
    const totalProjects = projects.length;
    const totalCost = projects.reduce((sum, p) => sum + p.total_cost, 0);
    const totalValueAdd = projects.reduce((sum, p) => sum + (p.value_add || 0), 0);
    const netValue = totalValueAdd - totalCost;

    document.getElementById('total-projects').textContent = totalProjects;
    document.getElementById('total-cost').textContent = `$${formatNumber(totalCost)}`;
    document.getElementById('total-value-add').textContent = `$${formatNumber(totalValueAdd)}`;
    document.getElementById('net-value').textContent = `$${formatNumber(netValue)}`;
    
    const netValueElement = document.getElementById('net-value');
    netValueElement.style.color = netValue >= 0 ? '#28a745' : '#dc3545';
}

// Initialize event listeners
function initializeEventListeners() {
    // Add project button
    addProjectBtn.addEventListener('click', () => {
        currentEditingProject = null;
        document.getElementById('modal-title').textContent = 'Add New Project';
        projectForm.reset();
        showModal(projectModal);
    });

    // Project form submit
    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            name: document.getElementById('project-name').value,
            value_add: parseFloat(document.getElementById('value-add').value) || null,
            value_add_description: document.getElementById('value-add-description').value || null
        };

        try {
            if (currentEditingProject) {
                await fetch(`/api/projects/${currentEditingProject}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                await fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }
            hideModal(projectModal);
        } catch (error) {
            console.error('Error saving project:', error);
            alert('Failed to save project');
        }
    });

    // Cost form submit
    costForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            description: document.getElementById('cost-description').value,
            amount: parseFloat(document.getElementById('cost-amount').value)
        };

        try {
            if (currentEditingCost) {
                await fetch(`/api/costs/${currentEditingCost}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                await fetch(`/api/projects/${currentProjectForCost}/costs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }
            hideModal(costModal);
        } catch (error) {
            console.error('Error saving cost:', error);
            alert('Failed to save cost');
        }
    });

    // Modal close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => {
            hideModal(projectModal);
            hideModal(costModal);
        });
    });

    document.getElementById('cancel-project-btn').addEventListener('click', () => {
        hideModal(projectModal);
    });

    document.getElementById('cancel-cost-btn').addEventListener('click', () => {
        hideModal(costModal);
    });

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === projectModal) {
            hideModal(projectModal);
        }
        if (e.target === costModal) {
            hideModal(costModal);
        }
    });
}

// Initialize Socket.io listeners
function initializeSocketListeners() {
    socket.on('project_created', (project) => {
        project.costs = [];
        project.total_cost = 0;
        projects.push(project);
        renderProjects();
        updateSummary();
    });

    socket.on('project_updated', (updatedProject) => {
        const index = projects.findIndex(p => p.id === updatedProject.id);
        if (index !== -1) {
            projects[index] = updatedProject;
            renderProjects();
            updateSummary();
        }
    });

    socket.on('project_deleted', ({ id }) => {
        projects = projects.filter(p => p.id !== id);
        renderProjects();
        updateSummary();
    });

    socket.on('projects_reordered', () => {
        loadProjects();
    });

    socket.on('cost_added', ({ project_id, cost }) => {
        const project = projects.find(p => p.id === project_id);
        if (project) {
            project.costs.push(cost);
            project.total_cost = project.costs.reduce((sum, c) => sum + c.amount, 0);
            renderProjects();
            updateSummary();
        }
    });

    socket.on('cost_updated', (updatedCost) => {
        projects.forEach(project => {
            const costIndex = project.costs.findIndex(c => c.id === updatedCost.id);
            if (costIndex !== -1) {
                project.costs[costIndex] = updatedCost;
                project.total_cost = project.costs.reduce((sum, c) => sum + c.amount, 0);
                renderProjects();
                updateSummary();
            }
        });
    });

    socket.on('cost_deleted', ({ id, project_id }) => {
        const project = projects.find(p => p.id === project_id);
        if (project) {
            project.costs = project.costs.filter(c => c.id !== id);
            project.total_cost = project.costs.reduce((sum, c) => sum + c.amount, 0);
            renderProjects();
            updateSummary();
        }
    });
}

// Drag and drop functionality
function initializeDragAndDrop() {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragend', handleDragEnd);
    });
}

let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    const afterElement = getDragAfterElement(projectsContainer, e.clientY);
    if (afterElement == null) {
        projectsContainer.appendChild(draggedElement);
    } else {
        projectsContainer.insertBefore(draggedElement, afterElement);
    }
    
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    
    // Get new order
    const projectCards = document.querySelectorAll('.project-card');
    const newOrder = Array.from(projectCards).map(card => parseInt(card.dataset.projectId));
    
    // Update server
    fetch('/api/projects/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_ids: newOrder })
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.project-card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Priority input functionality
function initializePriorityInputs() {
    const priorityInputs = document.querySelectorAll('.priority-input');
    
    priorityInputs.forEach(input => {
        // Store the original value
        input.addEventListener('focus', (e) => {
            e.target.dataset.originalValue = e.target.value;
        });
        
        // Handle Enter key
        input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                await updateProjectPriority(e.target);
                e.target.blur();
            }
        });
        
        // Handle blur (when user clicks away)
        input.addEventListener('blur', async (e) => {
            await updateProjectPriority(e.target);
        });
        
        // Prevent drag when interacting with input
        input.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
    });
}

async function updateProjectPriority(input) {
    const projectId = input.dataset.projectId;
    const newPriority = parseInt(input.value);
    const originalValue = parseInt(input.dataset.originalValue);
    
    // Validate input
    if (isNaN(newPriority) || newPriority < 1) {
        input.value = originalValue;
        return;
    }
    
    // If value hasn't changed, do nothing
    if (newPriority === originalValue) {
        return;
    }
    
    try {
        const response = await fetch(`/api/projects/${projectId}/priority`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priority: newPriority - 1 }) // Convert to 0-indexed
        });
        
        if (!response.ok) {
            throw new Error('Failed to update priority');
        }
        
        // The socket event will trigger a reload
    } catch (error) {
        console.error('Error updating priority:', error);
        alert('Failed to update priority');
        input.value = originalValue; // Restore original value on error
    }
}

// Project operations
function editProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    currentEditingProject = id;
    document.getElementById('modal-title').textContent = 'Edit Project';
    document.getElementById('project-name').value = project.name;
    document.getElementById('value-add').value = project.value_add || '';
    document.getElementById('value-add-description').value = project.value_add_description || '';
    showModal(projectModal);
}

async function deleteProject(id) {
    if (!confirm('Are you sure you want to delete this project? All associated costs will be deleted.')) {
        return;
    }

    try {
        await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
    }
}

// Cost operations
function addCost(projectId) {
    currentEditingCost = null;
    currentProjectForCost = projectId;
    document.getElementById('cost-modal-title').textContent = 'Add Cost Item';
    costForm.reset();
    showModal(costModal);
}

function editCost(costId, projectId) {
    const project = projects.find(p => p.id === projectId);
    const cost = project.costs.find(c => c.id === costId);
    if (!cost) return;

    currentEditingCost = costId;
    currentProjectForCost = projectId;
    document.getElementById('cost-modal-title').textContent = 'Edit Cost Item';
    document.getElementById('cost-description').value = cost.description;
    document.getElementById('cost-amount').value = cost.amount;
    showModal(costModal);
}

async function deleteCost(id) {
    if (!confirm('Are you sure you want to delete this cost item?')) {
        return;
    }

    try {
        await fetch(`/api/costs/${id}`, { method: 'DELETE' });
    } catch (error) {
        console.error('Error deleting cost:', error);
        alert('Failed to delete cost');
    }
}

// Modal helpers
function showModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// Utility functions
function formatNumber(num) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
