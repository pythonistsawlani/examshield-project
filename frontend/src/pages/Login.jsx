import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginAPI, registerAPI, forgotPasswordAPI, resetPasswordAPI } from '../utils/api';
import toast from 'react-hot-toast';
import '../styles/neon.css';
import './Login.css';

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();

  const [role, setRole]       = useState('student');
  const [mode, setMode]       = useState('login'); // login | signup | reset
  
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '', token: '' });
  const [loading, setLoading] = useState(false);
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotForm, setForgotForm] = useState({ email: '', password: '', confirm: '' });

  // Check if URL has reset token (e.g. /reset-password/12345)
  useEffect(() => {
    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'reset-password' && pathParts[2]) {
      setMode('reset');
      setForm(prev => ({ ...prev, token: pathParts[2] }));
    }
  }, [location]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (form.password !== form.confirm) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }
        if (form.password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await registerAPI(form.name, form.email, form.password);
        toast.success('Registration successful! Please login.');
        setMode('login');
      } 
      else if (mode === 'reset') {
        if (form.password !== form.confirm) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }
        const res = await resetPasswordAPI({ token: form.token, newPassword: form.password });
        toast.success(res.message);
        navigate('/');
        setMode('login');
      }
      else {
        // Login Mode
        const res = await loginAPI(form.email, form.password, role);
        toast.success(`Welcome back!`);
        login(res.user, res.token);
        navigate(res.user.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      if (!toast.isActive('login-error')) {
        toast.error(err.message || 'Operation failed.', { toastId: 'login-error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const submitForgotMock = async (e) => {
    e.preventDefault();
    if (forgotForm.password !== forgotForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (forgotForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await resetPasswordAPI({ email: forgotForm.email.trim(), newPassword: forgotForm.password });
      toast.success('Password updated. You can sign in with your new password.');
      setForgotModal(false);
      setForgotForm({ email: '', password: '', confirm: '' });
    } catch (err) {
      if (!toast.isActive('forgot-error')) {
        toast.error(err.message || 'Reset failed.', { toastId: 'forgot-error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const requestTokenLink = async () => {
    if (!forgotForm.email.trim()) {
      toast.error('Enter your email first.');
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPasswordAPI(forgotForm.email.trim());
      toast.success(res.message);
      if (res.mockTokenForPresentation) {
        toast(`Token (dev): ${res.mockTokenForPresentation.slice(0, 12)}… — check server logs for full link.`, { icon: '📧' });
      }
    } catch (err) {
      toast.error(err.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="terminal-art">
          <div className="terminal-header">
            <span className="t-dot" style={{background:'#ff5f56'}}/>
            <span className="t-dot" style={{background:'#ffbd2e'}}/>
            <span className="t-dot" style={{background:'#27c93f'}}/>
            <span style={{marginLeft:'auto', fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-muted)'}}>root@examshield</span>
          </div>
          <div className="terminal-body">
            <p><span className="text-green">$</span> <span className="text-muted">initializing ExamShield...</span></p>
            <p><span className="text-green">$</span> <span className="text-muted">secure_mode=</span><span className="text-pink">ACTIVE</span></p>
            <p><span className="text-green">$</span> <span className="text-muted">anti_cheat=</span><span className="text-green">ON</span></p>
            <p><span className="text-green">$</span> <span className="text-muted">jwt_auth=</span><span className="text-green">ENABLED</span></p>
            <p className="mt-2"><span className="text-green">$</span> <span className="text-muted">awaiting logic</span><span className="blink text-green">_</span></p>
          </div>
        </div>
        <div className="login-tagline">
          <h1 className="glow-green">EXAM<span className="text-pink">SHIELD</span></h1>
          <p className="text-muted mono" style={{fontSize:'12px', letterSpacing:'0.15em', marginTop:'8px'}}>
            ONLINE EXAMINATION SYSTEM v2.0
          </p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <p className="mono text-muted" style={{fontSize:'10px', letterSpacing:'0.15em'}}>
              SYSTEM ACCESS
            </p>
            <h2 style={{fontFamily:'var(--font-heading)', fontSize:'24px', marginTop:'4px'}}>
              {mode === 'login' ? 'AUTHENTICATE' :
               mode === 'signup' ? 'STUDENT REGISTRATION' :
               'RESET PASSWORD'}
            </h2>
          </div>

          {/* Role Toggle only visible in login mode for security */}
          {mode === 'login' && (
            <div className="role-toggle">
              <button
                className={`role-btn ${role === 'student' ? 'active' : ''}`}
                onClick={() => setRole('student')}
                type="button"
              >
                <span>👨‍🎓</span> STUDENT
              </button>
              <button
                className={`role-btn ${role === 'admin' ? 'active' : ''}`}
                onClick={() => setRole('admin')}
                type="button"
              >
                <span>🛡️</span> ADMIN
              </button>
            </div>
          )}

          {/* Mode tabs (only for login & signup) */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="mode-tabs">
              <button
                className={`mode-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => setMode('login')}
                type="button"
              >LOGIN</button>
              <button
                className={`mode-tab ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => setMode('signup')}
                type="button"
              >REGISTER</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {mode === 'reset' && (
              <div className="input-wrapper">
                <label className="input-label">RESET TOKEN</label>
                <input
                  name="token"
                  type="text"
                  className="input-field"
                  placeholder="Enter crypto token"
                  value={form.token}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {mode === 'signup' && (
              <div className="input-wrapper">
                <label className="input-label">FULL NAME</label>
                <input
                  name="name"
                  type="text"
                  className="input-field"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {mode !== 'reset' && (
              <div className="input-wrapper">
                <label className="input-label">EMAIL</label>
                <input
                  name="email"
                  type="email"
                  className="input-field"
                  placeholder="user@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
              <div className="input-wrapper">
                <label className="input-label">{mode === 'reset' ? 'NEW PASSWORD' : 'PASSWORD'}</label>
                <input
                  name="password"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {(mode === 'signup' || mode === 'reset') && (
              <div className="input-wrapper">
                <label className="input-label">CONFIRM PASSWORD</label>
                <input
                  name="confirm"
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{marginTop: '1rem'}}>
              {loading ? (
                <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'4px'}}>
                  <span className="blink">PROCESSING...</span>
                  <span className="mono" style={{fontSize:'9px', opacity:0.7}}>BACKEND MAY BE WAKING UP (COLD START)</span>
                </div>
              ) : (
                mode === 'login' ? `ACCESS AS ${role.toUpperCase()}` :
                mode === 'signup' ? 'CREATE ACCOUNT' :
                'UPDATE PASSWORD'
              )}
            </button>

            {mode === 'reset' && (
               <p className="forgot-link text-center mt-3">
                 <span className="text-green" style={{cursor:'pointer'}} onClick={() => setMode('login')}>
                   ← Back to Login
                 </span>
               </p>
            )}

            {mode === 'login' && (
              <p className="forgot-link">
                <span className="text-muted">Forgot password? </span>
                <button
                  type="button"
                  className="text-green"
                  style={{cursor:'pointer', background:'none', border:'none', padding:0, font:'inherit'}}
                  onClick={() => setForgotModal(true)}
                >
                  Open reset →
                </button>
              </p>
            )}
          </form>

          {mode === 'login' && (
            <div className="role-indicator text-center" style={{marginTop:'1rem'}}>
              <span className="mono text-muted" style={{fontSize:'10px'}}>ROLE: </span>
              <span className={`badge ${role === 'admin' ? 'badge-pink' : 'badge-green'}`}>
                {role.toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {forgotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => !loading && setForgotModal(false)}
          role="presentation"
        >
          <div
            className="login-card"
            style={{ maxWidth: '420px', width: '100%', margin: '16px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="forgot-modal-title"
          >
            <p className="mono text-muted" style={{ fontSize: '10px', letterSpacing: '0.15em' }}>
              PASSWORD RECOVERY (MOCK)
            </p>
            <h2 id="forgot-modal-title" style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', marginTop: '8px' }}>
              Reset by email
            </h2>
            <p className="text-muted mono" style={{ fontSize: '11px', marginTop: '8px', lineHeight: 1.5 }}>
              Sets a new password immediately (no email server). For token-based reset, use &quot;Request token link&quot; and open the URL from server logs.
            </p>
            <form onSubmit={submitForgotMock} className="login-form" style={{ marginTop: '20px' }}>
              <div className="input-wrapper">
                <label className="input-label">EMAIL</label>
                <input
                  className="input-field"
                  type="email"
                  required
                  value={forgotForm.email}
                  onChange={(e) => setForgotForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="user@example.com"
                />
              </div>
              <div className="input-wrapper">
                <label className="input-label">NEW PASSWORD</label>
                <input
                  className="input-field"
                  type="password"
                  required
                  value={forgotForm.password}
                  onChange={(e) => setForgotForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
              <div className="input-wrapper">
                <label className="input-label">CONFIRM</label>
                <input
                  className="input-field"
                  type="password"
                  required
                  value={forgotForm.confirm}
                  onChange={(e) => setForgotForm((f) => ({ ...f, confirm: e.target.value }))}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: '12px' }}>
                {loading ? '…' : 'UPDATE PASSWORD'}
              </button>
              <button
                type="button"
                className="btn btn-secondary w-full"
                style={{ marginTop: '8px', fontSize: '11px' }}
                onClick={requestTokenLink}
                disabled={loading}
              >
                Request token link (forgot-password flow)
              </button>
              <button
                type="button"
                className="btn btn-secondary w-full"
                style={{ marginTop: '8px' }}
                onClick={() => !loading && setForgotModal(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
