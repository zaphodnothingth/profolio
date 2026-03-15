import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  skills: string;
  notes: string;
  relationshipStrength: number;
  lastContacted: string;
}

interface Project {
  id: number;
  name: string;
  company: string;
  role: string;
  projectRole?: string;
}

const API_URL = 'http://localhost:3001/api/contacts';

export default function ContactProfile() {
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [linkRole, setLinkRole] = useState('');

  useEffect(() => {
    const fetchContactData = async () => {
      try {
        const [contactRes, projectsRes, allProjectsRes] = await Promise.all([
          fetch(`${API_URL}/${id}`),
          fetch(`${API_URL}/${id}/projects`),
          fetch(`http://localhost:3001/api/projects`)
        ]);
        
        if (contactRes.ok) setContact(await contactRes.json());
        if (projectsRes.ok) setProjects(await projectsRes.json());
        if (allProjectsRes.ok) setAllProjects(await allProjectsRes.json());
      } catch (error) {
        console.error('Failed to fetch contact details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContactData();
  }, [id]);

  const handleLinkProject = async (projectId: number) => {
    try {
      const res = await fetch('http://localhost:3001/api/project-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, contactId: id, role: linkRole || 'Collaborator' })
      });
      if (res.ok) {
        setShowLinkMenu(false);
        setLinkRole('');
        const projectsRes = await fetch(`${API_URL}/${id}/projects`);
        if (projectsRes.ok) setProjects(await projectsRes.json());
        addToast('Project linked successfully!', 'success');
      } else {
        addToast('Failed to link project.', 'error');
      }
    } catch (error) {
      console.error('Failed to link project', error);
      addToast('Network error while linking project.', 'error');
    }
  };

  const handleUnlinkProject = async (e: React.MouseEvent, projectId: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:3001/api/project-contacts/${projectId}/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProjects(projects.filter(p => p.id !== projectId));
        addToast('Project unlinked.', 'success');
      } else {
        addToast('Failed to unlink project.', 'error');
      }
    } catch (error) {
      console.error('Failed to unlink project', error);
      addToast('Network error while unlinking.', 'error');
    }
  };

  // vCard export handled by native <a> tag download attribute now

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div className="loader"></div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center' }}>
        <h3>Contact Not Found</h3>
        <Link to="/contacts" className="btn btn-secondary" style={{ marginTop: '1rem' }}>Back to Contacts</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <Link to="/contacts" style={{ color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
            ← Back to Contacts Book
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem' }}>
            <div style={{ 
              width: '80px', height: '80px', 
              borderRadius: '50%', 
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '2rem', color: 'white',
              boxShadow: 'var(--shadow-glow)'
            }}>
              {contact.firstName[0]}{contact.lastName[0]}
            </div>
            <div>
              <h1 className="text-gradient" style={{ margin: 0, fontSize: '2.5rem' }}>
                {contact.firstName} {contact.lastName}
              </h1>
              <div className="text-secondary" style={{ fontSize: '1.1rem', marginTop: '0.25rem' }}>
                {contact.email && <span>{contact.email}</span>}
                {contact.email && contact.phone && <span style={{ margin: '0 0.5rem' }}>|</span>}
                {contact.phone && <span>{contact.phone}</span>}
              </div>
            </div>
          </div>
        </div>
        <a 
          href={`${API_URL}/${id}/export-vcard`} 
          download 
          className="btn btn-primary"
          style={{ textDecoration: 'none' }}
        >
          Export to Apple/Google Contacts
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 2fr)', gap: '2rem', marginTop: '3rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel animate-fade-in-up stagger-1">
            <h3>Relationship</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ flex: 1, height: '8px', background: 'var(--bg-surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${(contact.relationshipStrength / 10) * 100}%`,
                  background: 'var(--success)'
                }}></div>
              </div>
              <span style={{ fontWeight: 'bold' }}>{contact.relationshipStrength} / 10</span>
            </div>
          </div>

          <div className="glass-panel animate-fade-in-up stagger-2">
            <h3>Skills & Keywords</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
              {contact.skills ? (
                contact.skills.split(',').map(s => s.trim()).map((skill, idx) => (
                  <span key={idx} className="badge badge-primary">{skill}</span>
                ))
              ) : (
                <span className="text-secondary">No skills listed</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel animate-fade-in-up stagger-3" style={{ height: 'fit-content' }}>
            <h3>Context & Notes</h3>
            {contact.notes ? (
              <p style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                {contact.notes}
              </p>
            ) : (
              <p className="text-secondary" style={{ marginTop: '1rem', fontStyle: 'italic' }}>
                No notes added for this contact.
              </p>
            )}
          </div>

          <div className="glass-panel animate-fade-in-up stagger-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Shared Projects</h3>
              <button className="btn btn-secondary" onClick={() => setShowLinkMenu(!showLinkMenu)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>
                {showLinkMenu ? 'Cancel' : 'Link Project'}
              </button>
            </div>

            {showLinkMenu && (
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '1rem' }}>
                <input 
                  type="text" 
                  className="input-control" 
                  placeholder="Role on project (e.g. Manager...)" 
                  value={linkRole} 
                  onChange={e => setLinkRole(e.target.value)}
                  style={{ marginBottom: '1rem' }}
                />
                <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {allProjects.filter(ap => !projects.find(p => p.id === ap.id)).map(ap => (
                    <div key={ap.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                      <span>{ap.name}</span>
                      <button className="btn btn-primary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleLinkProject(ap.id)}>Add</button>
                    </div>
                  ))}
                  {allProjects.filter(ap => !projects.find(p => p.id === ap.id)).length === 0 && (
                     <p className="text-secondary" style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>No other projects available to link.</p>
                  )}
                </div>
              </div>
            )}

            {projects.length === 0 ? (
              <p className="text-secondary" style={{ fontStyle: 'italic' }}>No projects linked with this contact.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {projects.map(p => (
                  <Link to={`/projects/${p.id}`} key={p.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="contact-row">
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '0.2rem' }}>{p.name}</div>
                        <div className="text-secondary" style={{ fontSize: '0.85rem' }}>{p.company}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className="badge">{p.projectRole || 'Collaborator'}</span>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }} 
                          onClick={(e) => handleUnlinkProject(e, p.id)}
                          title="Unlink Project"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
