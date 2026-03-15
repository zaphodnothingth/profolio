"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize SQLite database connection
let db;
async function initializeDB() {
    db = await (0, sqlite_1.open)({
        filename: path_1.default.join(__dirname, '../../data/database.sqlite'),
        driver: sqlite3_1.default.Database
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
      description TEXT,
      rating INTEGER
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
    // Migration: Add rating column if it doesn't exist (ignores error if it does)
    try {
        await db.exec(`ALTER TABLE projects ADD COLUMN rating INTEGER`);
        console.log('Migration: Added rating column to projects');
    }
    catch (e) {
        // Column already exists
    }
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});
// Simple dictionary for offline skill deduplication
const skillAliases = {
    'reactjs': 'React',
    'react.js': 'React',
    'node js': 'Node.js',
    'nodejs': 'Node.js',
    'typescript': 'TypeScript',
    'javascript': 'JavaScript',
    'ts': 'TypeScript',
    'js': 'JavaScript',
    'ui/ux': 'UI/UX Design',
    'ux': 'UI/UX Design',
    'aws': 'AWS',
    'gcp': 'Google Cloud'
};
const normalizeSkills = (skillsString) => {
    if (!skillsString)
        return '';
    const skills = skillsString.split(',').map(s => s.trim()).filter(Boolean);
    const normalized = skills.map(skill => {
        const lower = skill.toLowerCase();
        // Return mapped alias or just capitalize the first letter to standardize
        return skillAliases[lower] || (skill.charAt(0).toUpperCase() + skill.slice(1));
    });
    // Deduplicate array
    return [...new Set(normalized)].join(', ');
};
app.post('/api/projects', async (req, res) => {
    try {
        const { name, company, role, startDate, endDate, description, rating } = req.body;
        const result = await db.run('INSERT INTO projects (name, company, role, startDate, endDate, description, rating) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, company, role, startDate, endDate, description, rating]);
        res.status(201).json({ id: result.lastID });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});
app.put('/api/projects/:id', async (req, res) => {
    try {
        const { name, company, role, startDate, endDate, description, rating } = req.body;
        await db.run('UPDATE projects SET name = ?, company = ?, role = ?, startDate = ?, endDate = ?, description = ?, rating = ? WHERE id = ?', [name, company, role, startDate, endDate, description, rating, req.params.id]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update project' });
    }
});
app.get('/api/projects/:id', async (req, res) => {
    try {
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        if (!project)
            return res.status(404).json({ error: 'Project not found' });
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});
app.delete('/api/projects/:id', async (req, res) => {
    try {
        await db.run('DELETE FROM project_contacts WHERE projectId = ?', [req.params.id]);
        await db.run('DELETE FROM projects WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});
app.get('/api/projects/:id/export', async (req, res) => {
    try {
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        if (!project)
            return res.status(404).json({ error: 'Project not found' });
        const md = `## ${project.name}
**Role**: ${project.role}
**Company**: ${project.company}
**Timeline**: ${project.startDate} to ${project.endDate || 'Present'}

### Key Achievements
${project.description}
`;
        res.json({ markdown: md });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to export project' });
    }
});
app.get('/api/contacts', async (req, res) => {
    try {
        const contacts = await db.all('SELECT * FROM contacts ORDER BY lastName, firstName');
        res.json(contacts);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});
app.post('/api/contacts', async (req, res) => {
    const { firstName, lastName, email, phone, skills, notes, relationshipStrength, lastContacted } = req.body;
    const cleanSkills = normalizeSkills(skills);
    try {
        const result = await db.run('INSERT INTO contacts (firstName, lastName, email, phone, skills, notes, relationshipStrength, lastContacted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [firstName, lastName, email, phone, cleanSkills, notes, relationshipStrength, lastContacted]);
        res.status(201).json({ id: result.lastID });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create contact' });
    }
});
app.get('/api/contacts/duplicates', async (req, res) => {
    try {
        // Find contacts with the exact same firstName and lastName
        // We group them and return arrays of full contact objects if count > 1
        const duplicateGroups = await db.all(`
      SELECT LOWER(firstName) as fn, LOWER(lastName) as ln, COUNT(*) as c
      FROM contacts
      GROUP BY fn, ln
      HAVING c > 1
    `);
        if (duplicateGroups.length === 0) {
            return res.json([]);
        }
        const allDuplicates = [];
        for (const group of duplicateGroups) {
            const contacts = await db.all('SELECT * FROM contacts WHERE LOWER(firstName) = ? AND LOWER(lastName) = ? ORDER BY id ASC', [group.fn, group.ln]);
            allDuplicates.push(contacts);
        }
        res.json(allDuplicates);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch duplicates' });
    }
});
app.post('/api/contacts/merge', async (req, res) => {
    try {
        const { primaryContactId, duplicateContactIds } = req.body;
        if (!primaryContactId || !Array.isArray(duplicateContactIds) || duplicateContactIds.length === 0) {
            return res.status(400).json({ error: 'Invalid payload' });
        }
        const primary = await db.get('SELECT * FROM contacts WHERE id = ?', [primaryContactId]);
        if (!primary)
            return res.status(404).json({ error: 'Primary contact not found' });
        let allSkills = primary.skills ? [primary.skills] : [];
        let allNotes = primary.notes ? [primary.notes] : [];
        const placeholders = duplicateContactIds.map(() => '?').join(',');
        const duplicates = await db.all(`SELECT * FROM contacts WHERE id IN (${placeholders})`, duplicateContactIds);
        for (const dup of duplicates) {
            if (dup.skills)
                allSkills.push(dup.skills);
            if (dup.notes)
                allNotes.push(`[Merged Notes]: ${dup.notes}`);
        }
        const mergedSkills = normalizeSkills(allSkills.join(', '));
        const mergedNotes = allNotes.join('\\n\\n');
        // Update primary contact
        await db.run('UPDATE contacts SET skills = ?, notes = ? WHERE id = ?', [mergedSkills, mergedNotes, primaryContactId]);
        // Re-assign projects from duplicates to primary, ignoring constraint errors if relationship already exists
        for (const dupId of duplicateContactIds) {
            const projects = await db.all('SELECT * FROM project_contacts WHERE contactId = ?', [dupId]);
            for (const proj of projects) {
                try {
                    await db.run('INSERT INTO project_contacts (projectId, contactId, role) VALUES (?, ?, ?)', [proj.projectId, primaryContactId, proj.role]);
                }
                catch (e) {
                    // Ignore PRIMARY KEY constraint if the primary contact was already linked to this project
                }
            }
        }
        // Delete duplicates and their old links
        await db.run(`DELETE FROM project_contacts WHERE contactId IN (${placeholders})`, duplicateContactIds);
        await db.run(`DELETE FROM contacts WHERE id IN (${placeholders})`, duplicateContactIds);
        res.json({ success: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to merge contacts' });
    }
});
app.put('/api/contacts/:id', async (req, res) => {
    const { firstName, lastName, email, phone, skills, notes, relationshipStrength, lastContacted } = req.body;
    const cleanSkills = normalizeSkills(skills);
    try {
        await db.run('UPDATE contacts SET firstName = ?, lastName = ?, email = ?, phone = ?, skills = ?, notes = ?, relationshipStrength = ?, lastContacted = ? WHERE id = ?', [firstName, lastName, email, phone, cleanSkills, notes, relationshipStrength, lastContacted, req.params.id]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update contact' });
    }
});
app.get('/api/contacts/:id', async (req, res) => {
    try {
        const contact = await db.get('SELECT * FROM contacts WHERE id = ?', [req.params.id]);
        if (!contact)
            return res.status(404).json({ error: 'Contact not found' });
        res.json(contact);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch contact' });
    }
});
app.delete('/api/contacts/:id', async (req, res) => {
    try {
        await db.run('DELETE FROM project_contacts WHERE contactId = ?', [req.params.id]);
        await db.run('DELETE FROM contacts WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete contact' });
    }
});
app.post('/api/contacts/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Invalid or empty IDs array' });
        }
        // SQLite doesn't natively support binding arrays into IN (?), so we generate placeholders
        const placeholders = ids.map(() => '?').join(',');
        await db.run(`DELETE FROM project_contacts WHERE contactId IN (${placeholders})`, ids);
        await db.run(`DELETE FROM contacts WHERE id IN (${placeholders})`, ids);
        res.json({ success: true, deletedCount: ids.length });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to bulk delete contacts' });
    }
});
app.get('/api/contacts/:id/export-vcard', async (req, res) => {
    try {
        const contact = await db.get('SELECT * FROM contacts WHERE id = ?', [req.params.id]);
        if (!contact)
            return res.status(404).json({ error: 'Contact not found' });
        const vcard = `BEGIN:VCARD
VERSION:3.0
N:${contact.lastName || ''};${contact.firstName || ''};;;
FN:${contact.firstName || ''} ${contact.lastName || ''}
EMAIL;TYPE=INTERNET:${contact.email || ''}
TEL;TYPE=CELL:${contact.phone || ''}
NOTE:${contact.skills ? 'Skills: ' + contact.skills + '\\n' : ''}${contact.notes || ''}
END:VCARD`.trim();
        const filename = `${contact.firstName || 'contact'}_${contact.lastName || ''}`.replace(/\s+/g, '_').toLowerCase();
        res.setHeader('Content-Type', 'text/vcard');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.vcf"`);
        res.send(vcard);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to export vcard' });
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
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch contact projects' });
    }
});
app.post('/api/project-contacts', async (req, res) => {
    try {
        const { projectId, contactId, role } = req.body;
        await db.run('INSERT INTO project_contacts (projectId, contactId, role) VALUES (?, ?, ?)', [projectId, contactId, role]);
        res.status(201).json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to link project and contact' });
    }
});
app.delete('/api/project-contacts/:projectId/:contactId', async (req, res) => {
    try {
        const { projectId, contactId } = req.params;
        await db.run('DELETE FROM project_contacts WHERE projectId = ? AND contactId = ?', [projectId, contactId]);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete project-contact link' });
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map