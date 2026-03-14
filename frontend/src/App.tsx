import { Routes, Route, Link, useLocation } from 'react-router-dom';

import Timeline from './pages/Timeline';
import ProjectDetails from './pages/ProjectDetails';
import Contacts from './pages/Contacts';
import ContactProfile from './pages/ContactProfile';
import { ToastContainer } from './components/ToastContainer';

function App() {
  const location = useLocation();

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-brand text-gradient">Professional CRM</Link>
        <div className="nav-links">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Timeline
          </Link>
          <Link 
            to="/contacts" 
            className={`nav-link ${location.pathname === '/contacts' ? 'active' : ''}`}
          >
            Contacts
          </Link>
        </div>
      </nav>

      <main className="main-content container">
        <Routes>
          <Route path="/" element={<Timeline />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/:id" element={<ContactProfile />} />
        </Routes>
      </main>
      <ToastContainer />
    </>
  );
}

export default App;
