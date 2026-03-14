import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize SQLite database connection
let db: any;
async function initializeDB() {
  db = await open({
    filename: path.join(__dirname, '../../data/database.sqlite'),
    driver: sqlite3.Database
  });

  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      role TEXT,
      startDate TEXT,
      endDate TEXT,
      description TEXT
    );
    
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      skills TEXT,
      notes TEXT,
      relationshipStrength INTEGER,
      lastContacted TEXT
    );

    CREATE TABLE IF NOT EXISTS project_contacts (
      projectId INTEGER,
      contactId INTEGER,
      role TEXT,
      PRIMARY KEY (projectId, contactId),
      FOREIGN KEY (projectId) REFERENCES projects(id),
      FOREIGN KEY (contactId) REFERENCES contacts(id)
    );
  `);
  console.log('Database initialized');
}

initializeDB().catch(console.error);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Professional CRM API is running' });
});

// Projects API
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await db.all('SELECT * FROM projects ORDER BY startDate DESC');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, company, role, startDate, endDate, description } = req.body;
    const result = await db.run(
      'INSERT INTO projects (name, company, role, startDate, endDate, description) VALUES (?, ?, ?, ?, ?, ?)',
      [name, company, role, startDate, endDate, description]
    );
    res.status(201).json({ id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

app.get('/api/projects/:id/export', async (req, res) => {
  try {
    const project = await db.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    const md = `## ${project.name}
**Role**: ${project.role}
**Company**: ${project.company}
**Timeline**: ${project.startDate} to ${project.endDate || 'Present'}

### Key Achievements
${project.description}
`;
    res.json({ markdown: md });
  } catch (error) {
    res.status(500).json({ error: 'Failed to export project' });
  }
});

app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await db.all('SELECT * FROM contacts ORDER BY lastName, firstName');
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

app.post('/api/contacts', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, skills, notes, relationshipStrength, lastContacted } = req.body;
    const result = await db.run(
      'INSERT INTO contacts (firstName, lastName, email, phone, skills, notes, relationshipStrength, lastContacted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [firstName, lastName, email, phone, skills, notes, relationshipStrength, lastContacted]
    );
    res.status(201).json({ id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

app.get('/api/contacts/:id', async (req, res) => {
  try {
    const contact = await db.get('SELECT * FROM contacts WHERE id = ?', [req.params.id]);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

app.get('/api/contacts/:id/export-vcard', async (req, res) => {
  try {
    const contact = await db.get('SELECT * FROM contacts WHERE id = ?', [req.params.id]);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:${contact.lastName};${contact.firstName};;;\nFN:${contact.firstName} ${contact.lastName}\nEMAIL;TYPE=INTERNET:${contact.email || ''}\nTEL;TYPE=CELL:${contact.phone || ''}\nNOTE:${contact.notes ? contact.notes.replace(/\\n/g, '\\\\n') : ''}\nEND:VCARD`;

    res.setHeader('Content-Type', 'text/vcard');
    res.setHeader('Content-Disposition', `attachment; filename="${contact.firstName}_${contact.lastName}.vcf"`);
    res.send(vcard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export contact vcard' });
  }
});

app.get('/api/projects/:id/contacts', async (req, res) => {
  try {
    const contacts = await db.all(`
      SELECT c.*, pc.role AS projectRole 
      FROM contacts c 
      JOIN project_contacts pc ON c.id = pc.contactId 
      WHERE pc.projectId = ?
    `, [req.params.id]);
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project contacts' });
  }
});

app.get('/api/contacts/:id/projects', async (req, res) => {
  try {
    const projects = await db.all(`
      SELECT p.*, pc.role AS projectRole 
      FROM projects p 
      JOIN project_contacts pc ON p.id = pc.projectId 
      WHERE pc.contactId = ?
    `, [req.params.id]);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contact projects' });
  }
});

app.post('/api/project-contacts', async (req, res) => {
  try {
    const { projectId, contactId, role } = req.body;
    await db.run(
      'INSERT INTO project_contacts (projectId, contactId, role) VALUES (?, ?, ?)',
      [projectId, contactId, role]
    );
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to link project and contact' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
