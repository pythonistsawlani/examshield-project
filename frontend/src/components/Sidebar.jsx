import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/neon.css';

/*
  SIDEBAR COMPONENT — Neon Cyber UI
  Reusable sidebar for student & admin layouts
*/

export default function Sidebar({ navItems = [], role = 'student', user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="glow-green" style={{letterSpacing:'-0.04em'}}>
          EXAM<span style={{color:'var(--secondary)'}}>SHIELD</span>
        </div>
        <div className="mono text-muted" style={{fontSize:'9px', letterSpacing:'0.12em', marginTop:'2px', fontWeight:'400'}}>
          {role.toUpperCase()} PORTAL v2.0
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{flex:1}}>
        {navItems.map(item => (
          <Link
            key={item.label}
            to={item.path}
            className={`sidebar-nav-item ${item.active ? 'active' : ''}`}
          >
            <span style={{fontSize:'14px', width:'16px', color: item.active ? 'var(--primary)' : 'var(--text-dim)'}}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div style={{padding:'16px 20px', borderTop:'1px solid var(--border)'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px'}}>
          {/* Avatar */}
          <div style={{
            width:'32px', height:'32px',
            background:'var(--bg-elevated)',
            border:'1px solid var(--border)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--font-mono)', fontSize:'13px',
            color:'var(--primary)',
            flexShrink:0,
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{overflow:'hidden'}}>
            <p style={{fontFamily:'var(--font-heading)', fontSize:'12px', fontWeight:'600', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
              {user?.name || 'USER'}
            </p>
            <p className="mono text-muted" style={{fontSize:'9px', letterSpacing:'0.08em'}}>{role.toUpperCase()}</p>
          </div>
        </div>
        <button
          className="btn btn-secondary w-full"
          onClick={handleLogout}
          style={{padding:'8px', fontSize:'10px', letterSpacing:'0.08em'}}
        >
          ⏏ LOGOUT
        </button>
      </div>
    </aside>
  );
}
