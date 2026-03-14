import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

const API_URL = 'http://localhost:3001/api/contacts';

export default function Contacts() {
  const { addToast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState<{
    id?: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    skills: string;
    notes: string;
    relationshipStrength: number | string;
    lastContacted: string;
  }>({
    firstName: '', lastName: '', email: '', phone: '',
    skills: '', notes: '', relationshipStrength: 5, lastContacted: ''
  });
  
  const [selectedContactIds, setSelectedContactIds] = useState<Set<number>>(new Set());
  const [lastCheckedId, setLastCheckedId] = useState<number | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const fetchContacts = async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        setContacts(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch contacts', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Manual validation to provide clear Toast feedback instead of silent HTML5 tooltips
    if (!newContact.firstName.trim() || !newContact.lastName.trim()) {
      addToast('First Name and Last Name are required.', 'error');
      return;
    }
    const strength = Number(newContact.relationshipStrength);
    if (isNaN(strength) || strength < 1 || strength > 10) {
      addToast('Relationship Strength must be a number between 1 and 10.', 'error');
      return;
    }

    const isEdit = !!newContact.id;
    const url = isEdit ? `${API_URL}/${newContact.id}` : API_URL;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      });
      if (res.ok) {
        setShowAddForm(false);
        fetchContacts();
        setNewContact({
          firstName: '', lastName: '', email: '', phone: '',
          skills: '', notes: '', relationshipStrength: 5, lastContacted: ''
        });
        addToast(`Contact ${isEdit ? 'updated' : 'added'} successfully!`, 'success');
      } else {
        addToast(`Failed to ${isEdit ? 'update' : 'add'} contact.`, 'error');
      }
    } catch (error) {
      console.error('Failed to save contact', error);
      addToast('Network error while saving.', 'error');
    }
  };

  const handleDeleteContact = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newContact.id) return;
    
    if (!window.confirm('Are you sure you want to delete this contact?')) return;

    try {
      const res = await fetch(`${API_URL}/${newContact.id}`, { method: 'DELETE' });
      if (res.ok) {
        setShowAddForm(false);
        setNewContact({
          firstName: '', lastName: '', email: '', phone: '',
          skills: '', notes: '', relationshipStrength: 5, lastContacted: ''
        });
        fetchContacts();
        selectedContactIds.delete(newContact.id);
        setSelectedContactIds(new Set(selectedContactIds));
        addToast('Contact deleted successfully.', 'success');
      } else {
        addToast('Failed to delete contact.', 'error');
      }
    } catch (error) {
      console.error('Failed to delete contact', error);
      addToast('Network error while deleting.', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContactIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedContactIds.size} contacts?`)) return;

    try {
      const res = await fetch(`${API_URL}/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedContactIds) }),
      });
      
      if (res.ok) {
        setSelectedContactIds(new Set());
        setLastCheckedId(null);
        fetchContacts();
        addToast(`Successfully deleted ${selectedContactIds.size} contacts.`, 'success');
      } else {
        addToast('Failed to delete contacts.', 'error');
      }
    } catch (error) {
      console.error('Failed to bulk delete contacts', error);
      addToast('Network error while deleting.', 'error');
    }
  };

  const handleEditClick = (contact: Contact) => {
    setNewContact({
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email || '',
      phone: contact.phone || '',
      skills: contact.skills || '',
      notes: contact.notes || '',
      relationshipStrength: contact.relationshipStrength || 5,
      lastContacted: contact.lastContacted || ''
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckboxChange = (contactId: number, e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const isChecked = e.currentTarget.checked;
    const newSelected = new Set(selectedContactIds);

    if (e.shiftKey && lastCheckedId !== null) {
      // Find indexes in currently rendered array to do a range selection
      const currentIndex = contacts.findIndex(c => c.id === contactId);
      const lastIndex = contacts.findIndex(c => c.id === lastCheckedId);
      
      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        
        for (let i = start; i <= end; i++) {
          if (isChecked) {
            newSelected.add(contacts[i].id);
          } else {
            newSelected.delete(contacts[i].id);
          }
        }
      }
    } else {
      if (isChecked) {
        newSelected.add(contactId);
      } else {
        newSelected.delete(contactId);
      }
    }

    setSelectedContactIds(newSelected);
    setLastCheckedId(contactId);
  };

  const toggleSelectMode = () => {
    if (isSelectMode) {
      setIsSelectMode(false);
      setSelectedContactIds(new Set());
      setLastCheckedId(null);
    } else {
      setIsSelectMode(true);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-gradient">Contact Book</h1>
          <p className="text-secondary">Manage your professional network contextually.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {selectedContactIds.size > 0 && isSelectMode && (
            <button className="btn btn-secondary" onClick={handleBulkDelete} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
              Delete Selected ({selectedContactIds.size})
            </button>
          )}
          <button className="btn btn-secondary" onClick={toggleSelectMode}>
            {isSelectMode ? 'Cancel Selection' : 'Select'}
          </button>
          <button className="btn btn-primary" onClick={() => {
            if (showAddForm) {
              setShowAddForm(false);
              setNewContact({
                firstName: '', lastName: '', email: '', phone: '',
                skills: '', notes: '', relationshipStrength: 5, lastContacted: ''
              });
            } else {
              setShowAddForm(true);
            }
          }}>
            {showAddForm ? 'Cancel' : '+ Add Contact'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="glass-panel animate-fade-in-up" style={{ marginBottom: '2rem' }}>
          <h3>{newContact.id ? 'Edit Contact' : 'Add New Contact'}</h3>
          <form onSubmit={handleCreateContact} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">First Name</label>
                <input 
                  type="text" 
                  className="input-control" 
                  required 
                  value={newContact.firstName}
                  onChange={(e) => setNewContact({...newContact, firstName: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Last Name</label>
                <input 
                  type="text" 
                  className="input-control" 
                  required 
                  value={newContact.lastName}
                  onChange={(e) => setNewContact({...newContact, lastName: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input 
                  type="email" 
                  className="input-control" 
                  value={newContact.email}
                  onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Phone</label>
                <input 
                  type="tel" 
                  className="input-control" 
                  value={newContact.phone}
                  onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                />
              </div>
            </div>
            
            <div className="input-group">
              <label className="input-label">Skills (comma separated)</label>
              <input 
                type="text" 
                className="input-control" 
                placeholder="e.g. React, UX Design, Product Management"
                value={newContact.skills}
                onChange={(e) => setNewContact({...newContact, skills: e.target.value})}
              />
            </div>
            
            <div className="input-group">
              <label className="input-label">Relationship Strength (1-10)</label>
              <input 
                type="number" 
                min="1" max="10"
                className="input-control" 
                value={newContact.relationshipStrength}
                onChange={(e) => setNewContact({...newContact, relationshipStrength: e.target.value === '' ? '' : parseInt(e.target.value)})}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Context / Notes</label>
              <textarea 
                className="input-control" 
                rows={3} 
                value={newContact.notes}
                onChange={(e) => setNewContact({...newContact, notes: e.target.value})}
              ></textarea>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={newContact.relationshipStrength === ''}>Save Contact</button>
              {newContact.id && (
                <button type="button" className="btn btn-secondary" onClick={handleDeleteContact} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                  Delete Contact
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
      ) : contacts.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h3 className="text-secondary">No contacts yet</h3>
          <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>Add your first professional contact to your network.</p>
          <button className="btn btn-secondary" onClick={() => setShowAddForm(true)}>Add Contact</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {contacts.map((contact, idx) => (
            <Link 
              key={contact.id} 
              to={`/contacts/${contact.id}`} 
              className={`glass-panel animate-fade-in-up stagger-${(idx % 4) + 1} contact-card`} 
              style={{ textDecoration: 'none', color: 'inherit', display: 'block', position: 'relative' }}
            >
              {isSelectMode && (
                <input 
                  type="checkbox" 
                  checked={selectedContactIds.has(contact.id)}
                  onChange={() => {}} // Dummy to suppress React warning
                  onClick={(e: React.MouseEvent<HTMLInputElement>) => { e.preventDefault(); e.stopPropagation(); handleCheckboxChange(contact.id, e); }}
                  style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', transform: 'scale(1.2)', cursor: 'pointer', zIndex: 10 }}
                />
              )}
              <button 
                className="edit-btn"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClick(contact); }} 
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem', zIndex: 10 }}
                title="Edit Contact"
              >
                ✏️
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', paddingLeft: isSelectMode ? '2.5rem' : '0' }}>
                <div style={{ 
                  width: '48px', height: '48px', 
                  borderRadius: '50%', 
                  background: 'var(--accent-gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: '1.2rem', color: 'white'
                }}>
                  {contact.firstName[0]}{contact.lastName[0]}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{contact.firstName} {contact.lastName}</h3>
                  <div className="text-secondary" style={{ fontSize: '0.85rem' }}>
                    {contact.email || contact.phone || 'No contact info'}
                  </div>
                </div>
              </div>
              
              {contact.skills && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {contact.skills.split(',').map(s => s.trim()).slice(0, 3).map((skill, idx) => (
                    <span key={idx} className="badge" style={{ fontSize: '0.7rem' }}>{skill}</span>
                  ))}
                  {contact.skills.split(',').length > 3 && (
                    <span className="badge" style={{ fontSize: '0.7rem' }}>+</span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
