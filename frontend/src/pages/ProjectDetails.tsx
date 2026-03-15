import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  projectRole?: string;
}

const API_URL = 'http://localhost:3001/api/projects';

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportData, setExportData] = useState<string | null>(null);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [linkRole, setLinkRole] = useState('');

  useEffect(() => {
    const fetchProjectAndContacts = async () => {
      try {
        const [projRes, contactsRes, allContactsRes] = await Promise.all([
          fetch(`${API_URL}/${id}`),
          fetch(`${API_URL}/${id}/contacts`),
          fetch(`http://localhost:3001/api/contacts`)
        ]);
        
        if (projRes.ok) setProject(await projRes.json());
        if (contactsRes.ok) setContacts(await contactsRes.json());
        if (allContactsRes.ok) setAllContacts(await allContactsRes.json());
      } catch (error) {
        console.error('Failed to fetch project details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjectAndContacts();
  }, [id]);

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_URL}/${id}/export`);
      if (res.ok) {
        const data = await res.json();
        setExportData(data.markdown);
        addToast('Markdown generated successfully!', 'success');
      } else {
        addToast('Failed to generate markdown.', 'error');
      }
    } catch (error) {
      console.error('Failed to export project', error);
      addToast('Network error while generating markdown.', 'error');
    }
  };

  const handleCopy = () => {
    if (exportData) {
      navigator.clipboard.writeText(exportData);
      addToast('Copied to clipboard!', 'success');
    }
  };

  const handleLinkContact = async (contactId: number) => {
    try {
      const res = await fetch('http://localhost:3001/api/project-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, contactId, role: linkRole || 'Collaborator' })
      });
      if (res.ok) {
        setShowLinkMenu(false);
        setLinkRole('');
        const contactsRes = await fetch(`${API_URL}/${id}/contacts`);
        if (contactsRes.ok) setContacts(await contactsRes.json());
        addToast('Contact linked successfully!', 'success');
      } else {
        addToast('Failed to link contact.', 'error');
      }
    } catch (error) {
      console.error('Failed to link contact', error);
      addToast('Network error while linking contact.', 'error');
    }
  };

  const handleUnlinkContact = async (e: React.MouseEvent, contactId: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:3001/api/project-contacts/${id}/${contactId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setContacts(contacts.filter(c => c.id !== contactId));
        addToast('Contact unlinked.', 'success');
      } else {
        addToast('Failed to unlink contact.', 'error');
      }
    } catch (error) {
      console.error('Failed to unlink contact', error);
      addToast('Network error while unlinking.', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div className="loader"></div>
      </div>
    );
  }

  if (!project) return (
    <div className="glass-panel" style={{ textAlign: 'center' }}>
      <h3>Project Not Found</h3>
      <Link to="/" className="btn btn-secondary" style={{ marginTop: '1rem' }}>Back to Timeline</Link>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
            ← Back to Timeline
          </Link>
          <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>{project.name}</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span className="badge badge-primary">{project.role}</span>
            <span className="text-secondary">{project.company}</span>
            <span className="text-secondary">|</span>
            <span className="text-secondary">{project.startDate} to {project.endDate || 'Present'}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel animate-fade-in-up stagger-1">
            <h3>Achievements & Impact</h3>
            <p style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)', marginTop: '1rem' }}>
              {project.description}
            </p>
          </div>

          <div className="glass-panel animate-fade-in-up stagger-2">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Associated Contacts</h3>
              <button className="btn btn-secondary" onClick={() => setShowLinkMenu(!showLinkMenu)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}>
                {showLinkMenu ? 'Cancel' : 'Link Contact'}
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
                  {allContacts.filter(ac => !contacts.find(c => c.id === ac.id)).map(ac => (
                    <div key={ac.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                      <span>{ac.firstName} {ac.lastName}</span>
                      <button className="btn btn-primary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleLinkContact(ac.id)}>Add</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {contacts.length === 0 ? (
              <p className="text-secondary" style={{ fontStyle: 'italic' }}>No contacts linked yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {contacts.map(c => (
                  <Link to={`/contacts/${c.id}`} key={c.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="contact-row">
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', color: 'white' }}>
                        {c.firstName[0]}{c.lastName[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500' }}>{c.firstName} {c.lastName}</div>
                      </div>
                      <span className="badge">{c.projectRole}</span>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }} 
                        onClick={(e) => handleUnlinkContact(e, c.id)}
                        title="Unlink Contact"
                      >
                        ✕
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="glass-panel animate-fade-in-up stagger-3">
            <h3>Export to LinkedIn</h3>
            <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              Generate a clean, professional markdown summary of this project tailored for your LinkedIn profile or resume.
            </p>
            <button className="btn btn-primary" onClick={handleExport} style={{ width: '100%', marginBottom: '1rem' }}>
              Generate Markdown
            </button>

            {exportData && (
              <div style={{ marginTop: '1rem' }}>
                <textarea 
                  className="input-control" 
                  rows={8} 
                  value={exportData} 
                  readOnly 
                  style={{ fontSize: '0.85rem', fontFamily: 'monospace', marginBottom: '1rem' }}
                />
                <button className="btn btn-secondary" onClick={handleCopy} style={{ width: '100%' }}>
                  Copy to Clipboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
