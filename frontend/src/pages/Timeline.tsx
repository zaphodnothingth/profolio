import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

interface Project {
  id: number;
  name: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

const API_URL = 'http://localhost:3001/api/projects';

export default function Timeline() {
  const { addToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    company: '',
    role: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  const fetchProjects = async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject),
      });
      if (res.ok) {
        setShowAddForm(false);
        setNewProject({ name: '', company: '', role: '', startDate: '', endDate: '', description: '' });
        fetchProjects();
        addToast('Project saved successfully!', 'success');
      } else {
        addToast('Failed to save project.', 'error');
      }
    } catch (error) {
      console.error('Failed to create project', error);
      addToast('Network error while saving.', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-gradient">Career Timeline</h1>
          <p className="text-secondary">Track your job history, roles, and projects over time.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ Add Project'}
        </button>
      </div>

      {showAddForm && (
        <div className="glass-panel animate-fade-in-up" style={{ marginBottom: '2rem' }}>
          <h3>Add New Project or Role</h3>
          <form onSubmit={handleCreateProject}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Project Name</label>
                <input 
                  type="text" 
                  className="input-control" 
                  required 
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Company</label>
                <input 
                  type="text" 
                  className="input-control" 
                  value={newProject.company}
                  onChange={(e) => setNewProject({...newProject, company: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Role / Title</label>
                <input 
                  type="text" 
                  className="input-control" 
                  value={newProject.role}
                  onChange={(e) => setNewProject({...newProject, role: e.target.value})}
                />
              </div>
              <div className="input-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Start Date</label>
                  <input 
                    type="month" 
                    className="input-control" 
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({...newProject, startDate: e.target.value})}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">End Date</label>
                  <input 
                    type="month" 
                    className="input-control" 
                    value={newProject.endDate}
                    onChange={(e) => setNewProject({...newProject, endDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Description / Achievements</label>
              <textarea 
                className="input-control" 
                rows={4} 
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary">Save Project</button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="loader"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h3 className="text-secondary">No projects yet</h3>
          <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>Add your first project or role to start building your timeline.</p>
          <button className="btn btn-secondary" onClick={() => setShowAddForm(true)}>Add Project</button>
        </div>
      ) : (
        <div className="timeline-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {projects.map((project, idx) => (
            <div key={project.id} className={`glass-panel animate-fade-in-up stagger-${(idx % 4) + 1}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>
                    <Link to={`/projects/${project.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {project.name}
                    </Link>
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {project.role && <span className="badge badge-primary">{project.role}</span>}
                    {project.company && <span className="text-secondary" style={{ fontSize: '0.9rem' }}>@ {project.company}</span>}
                  </div>
                </div>
                {project.startDate && (
                  <div className="text-secondary" style={{ fontSize: '0.9rem', textAlign: 'right' }}>
                    {project.startDate} {project.endDate ? `— ${project.endDate}` : '— Present'}
                  </div>
                )}
              </div>
              <p style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                {project.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
