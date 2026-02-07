const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Initialize SQLite database
const db = new Database('data/projects.db');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    value_add REAL,
    value_add_description TEXT,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS costs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
  );
`);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API Routes

// Get all projects with their costs
app.get('/api/projects', (req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM projects ORDER BY priority ASC, id ASC').all();
    
    projects.forEach(project => {
      const costs = db.prepare('SELECT * FROM costs WHERE project_id = ? ORDER BY id ASC').all(project.id);
      project.costs = costs;
      project.total_cost = costs.reduce((sum, cost) => sum + cost.amount, 0);
    });
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create a new project
app.post('/api/projects', (req, res) => {
  try {
    const { name, value_add, value_add_description } = req.body;
    
    const result = db.prepare(
      'INSERT INTO projects (name, value_add, value_add_description, priority) VALUES (?, ?, ?, ?)'
    ).run(name, value_add || null, value_add_description || null, 0);
    
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    project.costs = [];
    project.total_cost = 0;
    
    io.emit('project_created', project);
    res.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update a project
app.put('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, value_add, value_add_description } = req.body;
    
    db.prepare(
      'UPDATE projects SET name = ?, value_add = ?, value_add_description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(name, value_add || null, value_add_description || null, id);
    
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    const costs = db.prepare('SELECT * FROM costs WHERE project_id = ?').all(id);
    project.costs = costs;
    project.total_cost = costs.reduce((sum, cost) => sum + cost.amount, 0);
    
    io.emit('project_updated', project);
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete a project
app.delete('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete associated costs first
    db.prepare('DELETE FROM costs WHERE project_id = ?').run(id);
    
    // Delete the project
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    
    io.emit('project_deleted', { id: parseInt(id) });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Update project priorities (reorder)
app.put('/api/projects/reorder', (req, res) => {
  try {
    const { project_ids } = req.body;
    
    const updatePriority = db.prepare('UPDATE projects SET priority = ? WHERE id = ?');
    const updateMany = db.transaction((ids) => {
      ids.forEach((id, index) => {
        updatePriority.run(index, id);
      });
    });
    
    updateMany(project_ids);
    
    io.emit('projects_reordered', { project_ids });
    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering projects:', error);
    res.status(500).json({ error: 'Failed to reorder projects' });
  }
});

// Add a cost to a project
app.post('/api/projects/:project_id/costs', (req, res) => {
  try {
    const { project_id } = req.params;
    const { description, amount } = req.body;
    
    const result = db.prepare(
      'INSERT INTO costs (project_id, description, amount) VALUES (?, ?, ?)'
    ).run(project_id, description, amount);
    
    const cost = db.prepare('SELECT * FROM costs WHERE id = ?').get(result.lastInsertRowid);
    
    io.emit('cost_added', { project_id: parseInt(project_id), cost });
    res.json(cost);
  } catch (error) {
    console.error('Error adding cost:', error);
    res.status(500).json({ error: 'Failed to add cost' });
  }
});

// Update a cost
app.put('/api/costs/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount } = req.body;
    
    db.prepare(
      'UPDATE costs SET description = ?, amount = ? WHERE id = ?'
    ).run(description, amount, id);
    
    const cost = db.prepare('SELECT * FROM costs WHERE id = ?').get(id);
    
    io.emit('cost_updated', cost);
    res.json(cost);
  } catch (error) {
    console.error('Error updating cost:', error);
    res.status(500).json({ error: 'Failed to update cost' });
  }
});

// Delete a cost
app.delete('/api/costs/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const cost = db.prepare('SELECT project_id FROM costs WHERE id = ?').get(id);
    db.prepare('DELETE FROM costs WHERE id = ?').run(id);
    
    io.emit('cost_deleted', { id: parseInt(id), project_id: cost.project_id });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting cost:', error);
    res.status(500).json({ error: 'Failed to delete cost' });
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the app at http://localhost:${PORT}`);
});
