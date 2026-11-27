import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Layout() {
  const { user, signOut } = useAuth();
  const notify = useToast();
  async function handleSignOut() {
    try {
      await signOut();
      notify('You have been signed out.');
    } catch {
      notify('Signed out here, but the server could not confirm logout.', 'error');
    }
  }
  return (
    <>
      <header className="topbar">
        <div className="nav-wrap">
          <Link to="/" className="brand"><span className="brand-mark">m.</span> margin</Link>
          <nav aria-label="Main navigation">
            <NavLink to="/" end>Discover</NavLink>
            {user ? (
              <>
                <NavLink to="/dashboard">My writing</NavLink>
                <NavLink to="/dashboard" className="nav-user" aria-label={`Account for ${user.username}`}>Account</NavLink>
                <button className="text-button" onClick={handleSignOut}>Log out</button>
              </>
            ) : (
              <>
                <NavLink to="/login">Log in</NavLink>
                <Link to="/register" className="nav-cta">Start writing <span aria-hidden="true">↗</span></Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="page-shell"><Outlet /></main>
      <footer className="footer"><div><Link to="/" className="brand"><span className="brand-mark">m.</span> margin</Link><span>Make room for good ideas.</span></div><span>© {new Date().getFullYear()} Margin Journal</span></footer>
    </>
  );
}
