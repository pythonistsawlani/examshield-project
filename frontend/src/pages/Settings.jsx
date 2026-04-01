import React from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import '../styles/neon.css';

export default function Settings() {
  const { user, logout } = useAuth();
  
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
                  <p style={{fontFamily:'var(--font-heading)', fontSize:'13px'}}>Neon Glow Intensity</p>
                  <p className="mono text-muted" style={{fontSize:'10px', marginTop:'4px'}}>MAXIMUM_OVERDRIVE recommended</p>
                </div>
                <div className="badge badge-green">ENABLED</div>
              </div>

              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <p style={{fontFamily:'var(--font-heading)', fontSize:'13px'}}>Terminal Sounds</p>
                  <p className="mono text-muted" style={{fontSize:'10px', marginTop:'4px'}}>Audio alert prompts</p>
                </div>
                <div className="badge badge-gray">DISABLED</div>
              </div>
            </div>

            <div className="warning-banner" style={{background:'rgba(255,0,110,0.1)', border:'1px solid rgba(255,0,110,0.3)', color:'var(--danger)'}}>
              <span>🚨</span>
              ACCOUNT_DELETION_PROTOCOL REQUIRES HIGHER CLEARANCE. CONTACT SYS_ADMIN.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
