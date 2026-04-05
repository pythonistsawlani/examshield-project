import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { adminCreateAdminAPI, adminChangePasswordAPI } from '../utils/api';
import toast from 'react-hot-toast';
import '../styles/neon.css';

const NEON_KEY = 'examshield_neonGlow';
const SOUNDS_KEY = 'examshield_terminalSounds';

export default function Settings() {
  const { user, token, logout } = useAuth();

  const [neonGlow, setNeonGlow] = useState(() => localStorage.getItem(NEON_KEY) !== 'false');
  const [terminalSounds, setTerminalSounds] = useState(() => localStorage.getItem(SOUNDS_KEY) === 'true');

  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [adminBusy, setAdminBusy] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('neon-glow-off', !neonGlow);
    localStorage.setItem(NEON_KEY, neonGlow ? 'true' : 'false');
  }, [neonGlow]);

  useEffect(() => {
    localStorage.setItem(SOUNDS_KEY, terminalSounds ? 'true' : 'false');
  }, [terminalSounds]);

  const submitCreateAdmin = async (e) => {
    e.preventDefault();
    if (!adminForm.name.trim() || !adminForm.email.trim() || !adminForm.password) {
      toast.error('Fill all fields.');
      return;
    }
    setAdminBusy(true);
    try {
      await adminCreateAdminAPI(token, adminForm);
      toast.success('Admin account created.');
      setAdminForm({ name: '', email: '', password: '' });
    } catch (err) {
      if (!toast.isActive('admin-create-err')) {
        toast.error(err.message || 'Failed.', { toastId: 'admin-create-err' });
      }
    } finally {
      setAdminBusy(false);
    }
  };

  const submitChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error('New passwords do not match.');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    setAdminBusy(true);
    try {
      await adminChangePasswordAPI(token, {
        oldPassword: pwForm.oldPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password updated. Please sign in again.');
      setPwForm({ oldPassword: '', newPassword: '', confirm: '' });
      logout();
    } catch (err) {
      if (!toast.isActive('admin-pw-err')) {
        toast.error(err.message || 'Failed.', { toastId: 'admin-pw-err' });
      }
    } finally {
      setAdminBusy(false);
    }
  };

  const navItemsStudent = [
    { icon: '█', label: 'Dashboard',   path: '/dashboard' },
    { icon: '◈', label: 'Results',     path: '/results' },
    { icon: '▲', label: 'Leaderboard', path: '/leaderboard' },
    { icon: '⚙', label: 'Settings',    path: '/settings', active: true },
  ];

  const navItemsAdmin = [
    { icon: '█', label: 'Dashboard',  path: '/admin' },
    { icon: '≡', label: 'Exams',      path: '/admin/exams' },
    { icon: '◉', label: 'Students',   path: '/admin/students' },
    { icon: '◈', label: 'Results',    path: '/admin/results' },
    { icon: '⚙', label: 'Settings',   path: '/admin/settings', active: true },
  ];

  const navItems = user?.role === 'admin' ? navItemsAdmin : navItemsStudent;

  return (
    <div className="app-layout">
      <Sidebar navItems={navItems} role={user?.role || 'student'} user={user} onLogout={logout} />

      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">SYSTEM_SETTINGS</h1>
            <p className="page-subtitle">
              SYS_TIME: {new Date().toLocaleString()} | USER: {user?.name?.toUpperCase()}
            </p>
          </div>
          <div className="badge badge-green pulse-green">ONLINE</div>
        </div>

        <div className="grid-2">
          {/* User Profile Card */}
          <div className="card">
            <h3 style={{fontFamily:'var(--font-heading)', fontSize:'14px', letterSpacing:'0.08em', color:'var(--primary)', marginBottom:'20px'}}>
              ≡ USER_PROFILE_DATA
            </h3>

            <div style={{display:'flex', gap:'20px', alignItems:'center', marginBottom:'24px'}}>
              <div style={{
                width:'80px', height:'80px', background:'var(--bg-elevated)', border:'2px solid var(--primary)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px', color:'var(--primary)'
              }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p style={{fontFamily:'var(--font-heading)', fontSize:'24px', letterSpacing:'1px', textTransform:'uppercase'}}>{user?.name}</p>
                <span className={`badge ${user?.role === 'admin' ? 'badge-pink' : 'badge-green'}`} style={{marginTop:'8px'}}>
                  {user?.role?.toUpperCase()} CLEARANCE
                </span>
              </div>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              <div className="input-wrapper">
                <label className="input-label" style={{color:'var(--text-muted)'}}>EMAIL_ADDRESS</label>
                <div style={{fontFamily:'var(--font-mono)', fontSize:'12px', padding:'12px', background:'var(--bg-elevated)', border:'1px solid var(--border)'}}>
                  {user?.email}
                </div>
              </div>
              <div className="input-wrapper">
                <label className="input-label" style={{color:'var(--text-muted)'}}>DEPARTMENT</label>
                <div style={{fontFamily:'var(--font-mono)', fontSize:'12px', padding:'12px', background:'var(--bg-elevated)', border:'1px solid var(--border)'}}>
                  {user?.department || '— (SYSTEM OVERRIDE)'}
                </div>
              </div>
            </div>

            <p className="mono text-muted" style={{marginTop:'24px', fontSize:'10px', textAlign:'center'}}>
              // PROFILE EDITS LOCKED BY SYSADMIN //
            </p>
          </div>

          {/* Preferences Card */}
          <div>
            <div className="card" style={{marginBottom:'24px'}}>
              <h3 style={{fontFamily:'var(--font-heading)', fontSize:'14px', letterSpacing:'0.08em', color:'var(--secondary)', marginBottom:'20px'}}>
                ⚙ DISPLAY_PREFERENCES
              </h3>

              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:'16px', borderBottom:'1px solid var(--border)', marginBottom:'16px'}}>
                <div>
                  <p style={{fontFamily:'var(--font-heading)', fontSize:'13px'}}>Neon Glow</p>
                  <p className="mono text-muted" style={{fontSize:'10px', marginTop:'4px'}}>Stored in localStorage ({NEON_KEY})</p>
                </div>
                <button
                  type="button"
                  className={`btn ${neonGlow ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 14px', fontSize: '10px' }}
                  onClick={() => setNeonGlow((v) => !v)}
                >
                  {neonGlow ? 'ON' : 'OFF'}
                </button>
              </div>

              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <p style={{fontFamily:'var(--font-heading)', fontSize:'13px'}}>Terminal Sounds</p>
                  <p className="mono text-muted" style={{fontSize:'10px', marginTop:'4px'}}>Preference only (no audio yet)</p>
                </div>
                <button
                  type="button"
                  className={`btn ${terminalSounds ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 14px', fontSize: '10px' }}
                  onClick={() => setTerminalSounds((v) => !v)}
                >
                  {terminalSounds ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {user?.role === 'admin' && (
              <>
                <div className="card card--glow" style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', letterSpacing: '0.08em', color: 'var(--primary)', marginBottom: '16px' }}>
                    ➕ CREATE_ADMIN
                  </h3>
                  <form onSubmit={submitCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="input-wrapper">
                      <label className="input-label">NAME</label>
                      <input
                        className="input-field"
                        value={adminForm.name}
                        onChange={(e) => setAdminForm((f) => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="input-wrapper">
                      <label className="input-label">EMAIL</label>
                      <input
                        className="input-field"
                        type="email"
                        value={adminForm.email}
                        onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="input-wrapper">
                      <label className="input-label">PASSWORD</label>
                      <input
                        className="input-field"
                        type="password"
                        value={adminForm.password}
                        onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={adminBusy} style={{ fontSize: '11px' }}>
                      {adminBusy ? '…' : 'CREATE ADMIN'}
                    </button>
                  </form>
                </div>

                <div className="card card--pink-glow" style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', letterSpacing: '0.08em', color: 'var(--secondary)', marginBottom: '16px' }}>
                    🔑 CHANGE_PASSWORD
                  </h3>
                  <form onSubmit={submitChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="input-wrapper">
                      <label className="input-label">CURRENT</label>
                      <input
                        className="input-field"
                        type="password"
                        value={pwForm.oldPassword}
                        onChange={(e) => setPwForm((f) => ({ ...f, oldPassword: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="input-wrapper">
                      <label className="input-label">NEW</label>
                      <input
                        className="input-field"
                        type="password"
                        value={pwForm.newPassword}
                        onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="input-wrapper">
                      <label className="input-label">CONFIRM NEW</label>
                      <input
                        className="input-field"
                        type="password"
                        value={pwForm.confirm}
                        onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={adminBusy} style={{ fontSize: '11px' }}>
                      {adminBusy ? '…' : 'UPDATE PASSWORD'}
                    </button>
                  </form>
                </div>
              </>
            )}

            <div className="warning-banner" style={{background:'rgba(255,0,110,0.1)', border:'1px solid rgba(255,0,110,0.3)', color:'var(--danger)'}}>
              <span>🚨</span>
              ACCOUNT_DELETION PROTOCOL REQUIRES HIGHER CLEARANCE. CONTACT SYS_ADMIN.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
