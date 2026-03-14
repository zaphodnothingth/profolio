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
  const [newContact, setNewContact] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    skills: '', notes: '', relationshipStrength: 5 as number | string, lastContacted: ''
  });

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
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
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
        addToast('Contact added successfully!', 'success');
      } else {
        addToast('Failed to add contact.', 'error');
      }
    } catch (error) {
      console.error('Failed to create contact', error);
      addToast('Network error while saving.', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-gradient">Contact Book</h1>
          <p className="text-secondary">Manage your professional network contextually.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ Add Contact'}
        </button>
      </div>

      {showAddForm && (
        <div className="glass-panel animate-fade-in-up" style={{ marginBottom: '2rem' }}>
          <h3>Add New Contact</h3>
          <form onSubmit={handleCreateContact}>
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
            
            <button type="submit" className="btn btn-primary" disabled={newContact.relationshipStrength === ''}>Save Contact</button>
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
              className={`glass-panel animate-fade-in-up stagger-${(idx % 4) + 1}`} 
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
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
