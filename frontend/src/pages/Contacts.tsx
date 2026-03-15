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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortMode, setSortMode] = useState<'nameAsc' | 'nameDesc' | 'lastContacted' | 'relationship'>('nameAsc');
  const [duplicateGroups, setDuplicateGroups] = useState<Contact[][]>([]);
  const [showDedupeModal, setShowDedupeModal] = useState(false);

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

  const sortedContacts = [...contacts].sort((a, b) => {
    if (sortMode === 'nameAsc') {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    }
    if (sortMode === 'nameDesc') {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameB.localeCompare(nameA);
    }
    if (sortMode === 'relationship') {
      return (b.relationshipStrength || 0) - (a.relationshipStrength || 0);
    }
    if (sortMode === 'lastContacted') {
      const dateA = a.lastContacted ? new Date(a.lastContacted).getTime() : 0;
      const dateB = b.lastContacted ? new Date(b.lastContacted).getTime() : 0;
      return dateB - dateA;
    }
    return 0;
  });

  const fetchDuplicates = async () => {
    setShowDedupeModal(true);
    try {
      const res = await fetch('http://localhost:3001/api/contacts/duplicates');
      if (res.ok) {
        const data = await res.json();
        setDuplicateGroups(data);
      }
    } catch (error) {
      addToast('Error fetching duplicates.', 'error');
    }
  };

  const handleMergeGroup = async (group: Contact[]) => {
    if (group.length < 2) return;
    const primaryContactId = group[0].id;
    const duplicateContactIds = group.slice(1).map(c => c.id);

    try {
      const res = await fetch('http://localhost:3001/api/contacts/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryContactId, duplicateContactIds })
      });
      if (res.ok) {
        addToast('Contacts merged successfully!', 'success');
        setDuplicateGroups(prev => prev.filter(g => g !== group));
        fetchContacts();
      } else {
        addToast('Failed to merge contacts.', 'error');
      }
    } catch (error) {
      addToast('Network error while merging.', 'error');
    }
  };

  return (
    <div>
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <h1 className="text-gradient">Contact Book</h1>
          <p className="text-secondary">Manage your professional network contextually.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px', padding: '0.25rem', height: 'fit-content' }}>
            <button 
              className="btn" 
              style={{ padding: '0.5rem', background: viewMode === 'grid' ? 'var(--bg-surface)' : 'transparent', border: 'none', borderRadius: '6px', color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </button>
            <button 
              className="btn" 
              style={{ padding: '0.5rem', background: viewMode === 'list' ? 'var(--bg-surface)' : 'transparent', border: 'none', borderRadius: '6px', color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </button>
          </div>

          <select 
            className="input-control" 
            style={{ width: 'auto', padding: '0.5rem 1rem' }}
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as any)}
          >
            <option value="nameAsc">Name (A-Z)</option>
            <option value="nameDesc">Name (Z-A)</option>
            <option value="lastContacted">Recently Contacted</option>
            <option value="relationship">Relationship (High to Low)</option>
          </select>

          <button 
            className="btn btn-secondary" 
            onClick={fetchDuplicates}
            title="Find and merge duplicate contacts"
          >
            Find Duplicates
          </button>

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

      {showDedupeModal && (
        <div className="glass-panel" style={{ marginBottom: '2rem', border: '1px solid var(--accent-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Intelligent Deduplication</h2>
            <button className="btn btn-secondary" onClick={() => setShowDedupeModal(false)}>Close</button>
          </div>
          {duplicateGroups.length === 0 ? (
            <p className="text-secondary">No exact duplicate contacts found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p className="text-secondary">We found contacts with identical names. Merging them will combine their skills, notes, and project links.</p>
              {duplicateGroups.map((group, idx) => (
                <div key={idx} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{group[0].firstName} {group[0].lastName}</strong> ({group.length} entries found)
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      IDs: {group.map(c => c.id).join(', ')}
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={() => handleMergeGroup(group)}>Merge All</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                  spellCheck={true}
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
                  spellCheck={true}
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
                spellCheck={true}
                value={newContact.skills}
                onChange={(e) => setNewContact({...newContact, skills: e.target.value})}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                <label className="input-label">Last Contacted (Date)</label>
                <input 
                  type="date" 
                  className="input-control" 
                  value={newContact.lastContacted}
                  onChange={(e) => setNewContact({...newContact, lastContacted: e.target.value})}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Context / Notes</label>
              <textarea 
                className="input-control" 
                rows={3} 
                spellCheck={true}
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
        <div 
          style={{ 
            display: viewMode === 'grid' ? 'grid' : 'flex', 
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : 'none', 
            flexDirection: viewMode === 'list' ? 'column' : 'row',
            gap: '1.5rem' 
          }}
        >
          {sortedContacts.map((contact, idx) => (
            <Link 
              key={contact.id} 
              to={`/contacts/${contact.id}`} 
              className={`glass-panel animate-fade-in-up stagger-${(idx % 4) + 1} contact-card`} 
              style={{ 
                textDecoration: 'none', color: 'inherit', position: 'relative',
                display: viewMode === 'list' ? 'flex' : 'block',
                alignItems: viewMode === 'list' ? 'center' : 'stretch',
                padding: viewMode === 'list' ? '1rem' : '1.5rem',
                gap: viewMode === 'list' ? '1rem' : '0'
              }}
            >
              {isSelectMode && (
                <div style={{ 
                  position: viewMode === 'grid' ? 'absolute' : 'relative', 
                  top: viewMode === 'grid' ? '1.25rem' : 'auto', 
                  left: viewMode === 'grid' ? '1.25rem' : 'auto',
                  marginRight: viewMode === 'list' ? '1rem' : '0',
                  display: 'flex', alignItems: 'center'
                }}>
                  <input 
                    type="checkbox" 
                    checked={selectedContactIds.has(contact.id)}
                    onChange={() => {}} // Dummy to suppress React warning
                    onClick={(e: React.MouseEvent<HTMLInputElement>) => { e.preventDefault(); e.stopPropagation(); handleCheckboxChange(contact.id, e); }}
                    style={{ transform: 'scale(1.2)', cursor: 'pointer', zIndex: 10 }}
                  />
                </div>
              )}
              
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '1rem', 
                marginBottom: viewMode === 'grid' ? '1rem' : '0', 
                paddingLeft: (isSelectMode && viewMode === 'grid') ? '2.5rem' : '0',
                flex: viewMode === 'list' ? '1' : 'none',
                minWidth: viewMode === 'list' ? '250px' : 'auto'
              }}>
                <div style={{ 
                  width: viewMode === 'list' ? '40px' : '48px', height: viewMode === 'list' ? '40px' : '48px', 
                  borderRadius: '50%', 
                  background: 'var(--accent-gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: viewMode === 'list' ? '1rem' : '1.2rem', color: 'white',
                  flexShrink: 0
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

              {viewMode === 'list' && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '150px' }}>
                  <div className="text-secondary" style={{ fontSize: '0.85rem' }}>
                    {contact.lastContacted ? `Last Contacted: ${contact.lastContacted}` : 'No recent contact'}
                  </div>
                </div>
              )}
              
              <div style={{ 
                display: 'flex', flexWrap: 'wrap', gap: '0.4rem', 
                marginTop: viewMode === 'grid' ? '0.5rem' : '0', 
                alignItems: 'center',
                flex: viewMode === 'list' ? '2' : 'none',
                justifyContent: viewMode === 'list' ? 'flex-start' : 'flex-start'
              }}>
                {contact.skills && (
                  <>
                    {contact.skills.split(',').map(s => s.trim()).slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="badge" style={{ fontSize: '0.7rem' }}>{skill}</span>
                    ))}
                    {contact.skills.split(',').length > 3 && (
                      <span className="badge" style={{ fontSize: '0.7rem' }}>+</span>
                    )}
                  </>
                )}
                {viewMode === 'list' && <div style={{marginLeft: 'auto', fontWeight: 'bold'}}>{contact.relationshipStrength}/10</div>}
              </div>

              <button 
                className="edit-btn"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClick(contact); }} 
                style={{ 
                  position: viewMode === 'grid' ? 'absolute' : 'relative', 
                  top: viewMode === 'grid' ? '1rem' : 'auto', 
                  right: viewMode === 'grid' ? '1rem' : 'auto', 
                  marginLeft: viewMode === 'list' ? '1rem' : '0',
                  background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem', zIndex: 10 
                }}
                title="Edit Contact"
              >
                ✏️
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
