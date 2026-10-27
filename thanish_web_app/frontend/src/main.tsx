import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { ChamberProvider } from './store';
import ChatWidget from './components/ChatWidget';
import Landing from './landing';
import { Chamber, Errors, Faq, Schedule, Species, Status, Support } from './pages';
import './styles.css';

const links = [
  ['/', 'Home'], ['/chamber/', 'Chamber'], ['/schedule/', 'Schedule'], ['/species/', 'Species'],
  ['/faq/', 'FAQ'], ['/errors/', 'Error codes'], ['/status/', 'Status'], ['/support/', 'Support'],
];

const Page = () => <div className="page"><Outlet /></div>;

function Shell() {
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setMenu(false); window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, []);
  return (
    <>
      <header className={`top ${pathname === '/' ? 'on-hero' : ''}`}>
        <button className="menu-btn" onClick={() => setMenu(!menu)} aria-expanded={menu}><i />{menu ? 'CLOSE' : 'MENU'}</button>
        <Link to="/" className="wordmark">vivaria</Link>
        <Link to="/support/" className="contact">CONTACT</Link>
      </header>
      {menu && (
        <nav className="overlay" aria-label="Main">
          {links.map(([to, label], i) => <Link key={to} to={to} aria-current={pathname === to ? 'page' : undefined}><small>{String(i).padStart(2, '0')}</small>{label}</Link>)}
        </nav>
      )}
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<Page />}>
            <Route path="/chamber/" element={<Chamber />} />
            <Route path="/schedule/" element={<Schedule />} />
            <Route path="/species/" element={<Species />} />
            <Route path="/faq/" element={<Faq />} />
            <Route path="/errors/" element={<Errors />} />
            <Route path="/status/" element={<Status />} />
            <Route path="/support/" element={<Support />} />
          </Route>
        </Routes>
      </main>
      <footer>
        <div className="foot-mark">vivaria</div>
        <div className="foot-links">{links.slice(1).map(([to, l]) => <Link key={to} to={to}>{l}</Link>)}<a href="/health/">Health</a></div>
        <p>VivariaOS is a simulation and planning tool. It does not control real hardware.</p>
      </footer>
      <ChatWidget />
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter><ChamberProvider><Shell /></ChamberProvider></BrowserRouter>
  </React.StrictMode>,
);
