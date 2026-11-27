import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getErrorMessage } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, signIn, register } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [fields, setFields] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    setBusy(true);
    try {
      if (isRegister) await register(fields);
      else await signIn({ email: fields.email, password: fields.password });
      notify(isRegister ? 'Your account is ready. Welcome to Margin.' : 'Welcome back.');
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setFieldErrors(err.response?.data?.fields || {});
    }
    finally { setBusy(false); }
  }

  return (
    <section className="auth-layout"><div className="auth-aside"><span className="eyebrow">A PLACE FOR YOUR WORDS</span><h1>{isRegister ? <>Your next idea<br /><em>starts here.</em></> : <>Good to see<br /><em>you again.</em></>}</h1><p>{isRegister ? 'Make a little room for the things you want to say.' : 'Pick up right where your curiosity left off.'}</p><div className="aside-stamp">m.</div></div>
      <div className="auth-panel"><span className="eyebrow">{isRegister ? 'JOIN THE JOURNAL' : 'WELCOME BACK'}</span><h2>{isRegister ? 'Create your account' : 'Log in to Margin'}</h2><p className="form-intro">{isRegister ? 'Your writing desk is just a few details away.' : 'Your stories and reading list are waiting.'}</p>
        <form className="auth-form" onSubmit={submit}>
          {isRegister && <label>Your name<input autoComplete="username" minLength="2" maxLength="30" value={fields.username} onChange={(e) => setFields({ ...fields, username: e.target.value })} required aria-invalid={Boolean(fieldErrors.username)} />{fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}</label>}
          <label>Email address<input type="email" autoComplete="email" maxLength="254" value={fields.email} onChange={(e) => setFields({ ...fields, email: e.target.value })} required aria-invalid={Boolean(fieldErrors.email)} />{fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}</label>
          <label>Password<input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={isRegister ? 8 : undefined} maxLength={isRegister ? 72 : 128} value={fields.password} onChange={(e) => setFields({ ...fields, password: e.target.value })} required aria-invalid={Boolean(fieldErrors.password)} />{fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}</label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-dark auth-submit" disabled={busy}>{busy ? 'One moment…' : isRegister ? 'Create my account ↗' : 'Log in ↗'}</button>
        </form>
        <p className="auth-switch">{isRegister ? 'Already have a desk here?' : 'New to the journal?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link></p>
      </div>
    </section>
  );
}
