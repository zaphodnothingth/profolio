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
  rating?: number;
}

const API_URL = 'http://localhost:3001/api/projects';

export default function Timeline() {
  const { addToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProject, setNewProject] = useState<{
    id?: number;
    name: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string;
    rating: number | '';
  }>({
    name: '',
    company: '',
    role: '',
    startDate: '',
    endDate: '',
    description: '',
    rating: 5
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
    if (!newProject.name.trim()) {
      addToast('Project Name is required.', 'error');
      return;
    }
    const r = Number(newProject.rating);
    if (newProject.rating !== '' && (isNaN(r) || r < 1 || r > 10)) {
      addToast('Rating must be between 1 and 10.', 'error');
      return;
    }

    const isEdit = !!newProject.id;
    const url = isEdit ? `${API_URL}/${newProject.id}` : API_URL;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject),
      });
      if (res.ok) {
        setShowAddForm(false);
        setNewProject({ name: '', company: '', role: '', startDate: '', endDate: '', description: '', rating: 5 });
        fetchProjects();
        addToast(`Project ${isEdit ? 'updated' : 'saved'} successfully!`, 'success');
      } else {
        addToast(`Failed to ${isEdit ? 'update' : 'save'} project.`, 'error');
      }
    } catch (error) {
      console.error('Failed to save project', error);
      addToast('Network error while saving.', 'error');
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newProject.id) return;
    
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      const res = await fetch(`${API_URL}/${newProject.id}`, { method: 'DELETE' });
      if (res.ok) {
        setShowAddForm(false);
        setNewProject({ name: '', company: '', role: '', startDate: '', endDate: '', description: '', rating: 5 });
        fetchProjects();
        addToast('Project deleted successfully.', 'success');
      } else {
        addToast('Failed to delete project.', 'error');
      }
    } catch (error) {
      console.error('Failed to delete project', error);
      addToast('Network error while deleting.', 'error');
    }
  };

  const handleEditClick = (project: Project) => {
    setNewProject({
      id: project.id,
      name: project.name,
      company: project.company || '',
      role: project.role || '',
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      description: project.description || '',
      rating: project.rating ?? 5
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-gradient">Career Timeline</h1>
          <p className="text-secondary">Track your job history, roles, and projects over time.</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          if (showAddForm) {
            setShowAddForm(false);
            setNewProject({ name: '', company: '', role: '', startDate: '', endDate: '', description: '', rating: 5 });
          } else {
            setShowAddForm(true);
          }
        }}>
          {showAddForm ? 'Cancel' : '+ Add Project'}
        </button>
      </div>

      {showAddForm && (
        <div className="glass-panel animate-fade-in-up" style={{ marginBottom: '2rem' }}>
          <h3>{newProject.id ? 'Edit Project' : 'Add New Project or Role'}</h3>
          <form onSubmit={handleCreateProject} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Project Name</label>
                <input 
                  type="text" 
                  className="input-control" 
                  required 
                  spellCheck={true}
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Company</label>
                <input 
                  type="text" 
                  className="input-control" 
                  spellCheck={true}
                  value={newProject.company}
                  onChange={(e) => setNewProject({...newProject, company: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Role / Title</label>
                <input 
                  type="text" 
                  className="input-control" 
                  spellCheck={true}
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
              <label className="input-label">Satisfaction / Rating (1-10)</label>
              <input 
                type="number" min="1" max="10"
                className="input-control" 
                value={newProject.rating}
                onChange={(e) => setNewProject({...newProject, rating: e.target.value === '' ? '' : parseInt(e.target.value)})}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description / Achievements</label>
              <textarea 
                className="input-control" 
                rows={4} 
                spellCheck={true}
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
              ></textarea>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">Save Project</button>
              {newProject.id && (
                <button type="button" className="btn btn-secondary" onClick={handleDeleteProject} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                  Delete Project
                </button>
              )}
            </div>
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
            <details key={project.id} className={`glass-panel animate-fade-in-up stagger-${(idx % 4) + 1} project-card`} style={{ cursor: 'pointer' }}>
              <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', listStyle: 'none' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Link to={`/projects/${project.id}`} style={{ color: 'inherit', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                      {project.name}
                    </Link>
                    <button 
                      className="edit-btn"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClick(project); }} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0 4px' }}
                      title="Edit Project"
                    >
                      ✏️
                    </button>
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {project.role && <span className="badge badge-primary">{project.role}</span>}
                    {project.company && <span className="text-secondary" style={{ fontSize: '0.9rem' }}>@ {project.company}</span>}
                    {project.rating && <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>Rating: {project.rating}/10</span>}
                  </div>
                </div>
                {project.startDate && (
                  <div className="text-secondary" style={{ fontSize: '0.9rem', textAlign: 'right' }}>
                    {project.startDate} {project.endDate ? `— ${project.endDate}` : '— Present'}
                  </div>
                )}
              </summary>
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', cursor: 'text' }} onClick={(e) => e.stopPropagation()}>
                <p style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  {project.description || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>No description provided.</span>}
                </p>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
