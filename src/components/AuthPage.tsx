import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { loginAdmin, registerAdmin, getApiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import gal from '../assets/reference/gal-vihara.jpg';
import sigiriya from '../assets/reference/sigiriya.jpg';
export default function AuthPage({ register = false }: { register?: boolean }) {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<'user' | 'academic'>('user');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (register && password !== confirm) { setError('Your passwords do not match.'); return; }
    const fields = new FormData(event.currentTarget);
    setLoading(true); setError('');
    try {
      const response = register ? await registerAdmin(String(fields.get('username')), String(fields.get('email')), password, role, String(fields.get('institution') || '')) : await loginAdmin(String(fields.get('email')), password);
      setAuth(response); navigate(response.user.role === 'admin' ? '/admin' : '/account', { replace: true });
    } catch (err) { setError(getApiErrorMessage(err, register ? 'Registration failed.' : 'Login failed.')); }
    finally { setLoading(false); }
  }
  return <main className={`auth-page ${register ? 'registration-page' : ''}`} style={{ backgroundImage: `linear-gradient(#0005, #0005), url(${register ? sigiriya : gal})` }}><Link to="/" className="auth-back"><ArrowLeft />Back to Home</Link><div className="auth-composition"><section className="auth-card"><h1>{register ? 'Sign Up' : 'Sign In'}</h1><p className="auth-welcome">{register ? 'Create your account' : 'Welcome back!'}</p><form onSubmit={submit}>
    {register && <label>Username<input name="username" autoComplete="username" required placeholder="Enter your username" /></label>}
    {register && <><label>Account Type<select name="role" value={role} onChange={event => setRole(event.target.value as 'user' | 'academic')}><option value="user">Normal User</option><option value="academic">Academic</option></select></label>{role === 'academic' && <><label>University / Institution<input name="institution" required maxLength={200} placeholder="Your university or research institution" /></label><p className="academic-registration-hint">Academic notes are reviewed by an administrator before they are published.</p></>}</>}
    <label>Email Address<input name="email" type="email" autoComplete="email" required placeholder="Enter your email address" /></label><label>Password<div className="password-input"><input name="password" type={visible ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 6 : undefined} placeholder="Enter your password" /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff /> : <Eye />}</button></div></label>
    {register && <label>Confirm Password<input type={visible ? 'text' : 'password'} value={confirm} onChange={event => setConfirm(event.target.value)} autoComplete="new-password" required minLength={6} placeholder="Confirm your password" /></label>}
    {error && <p className="auth-error" role="alert">{error}</p>}<button type="submit" className="primary-button" disabled={loading}>{loading && <Loader2 className="animate-spin" />}{loading ? 'Please wait…' : register ? 'Sign Up' : 'Sign In'}</button></form><p className="auth-switch">{register ? 'Already have an account?' : "Don't have an account?"} <Link to={register ? '/admin/login' : '/admin/register'}>{register ? 'Sign In' : 'Sign Up'}</Link></p></section><div className="auth-photo" style={{ backgroundImage: `url(${register ? sigiriya : gal})` }} /></div></main>;
}
