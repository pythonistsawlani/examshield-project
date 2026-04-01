import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLeaderboardAPI } from '../utils/api';
import Sidebar from '../components/Sidebar';
import '../styles/neon.css';

/*
  LEADERBOARD PAGE — Neon Cyber UI
  Shows: Top 3 podium + Rankings table
*/

export default function Leaderboard() {
  const { token, user, logout } = useAuth();
  const [data,  setData]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all'); // all | week | month

  useEffect(() => {
    getLeaderboardAPI(token)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const navItems = [
    { icon: '█', label: 'Dashboard',   path: '/dashboard' },
    { icon: '◈', label: 'Results',     path: '/results' },
    { icon: '▲', label: 'Leaderboard', path: '/leaderboard', active: true },
    { icon: '⚙', label: 'Settings',    path: '/settings' },
  ];

  const top3 = data.slice(0, 3);

  const rankColor = (rank) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return 'var(--text-muted)';
  };

  return (
    <div className="app-layout">
      <Sidebar navItems={navItems} role="student" user={user} onLogout={logout} />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">LEADERBOARD</h1>
            <p className="page-subtitle">GLOBAL RANKING SYSTEM — REAL TIME DATA</p>
          </div>
          {/* Filter tabs */}
          <div style={{display:'flex', gap:'0'}}>
            {['all','week','month'].map(f => (
              <button
                key={f}
                className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(f)}
                style={{padding:'8px 16px', fontSize:'10px'}}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="card" style={{textAlign:'center', padding:'60px'}}>
            <p className="glow-green mono blink">LOADING RANKINGS...</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {top3.length >= 1 && (
              <div className="card" style={{marginBottom:'24px', overflow:'hidden'}}>
                <p className="mono text-muted" style={{fontSize:'10px', letterSpacing:'0.15em', marginBottom:'32px', textAlign:'center'}}>
                  ▲ TOP_PERFORMERS
                </p>
                <div style={{display:'flex', alignItems:'flex-end', justifyContent:'center', gap:'16px', paddingBottom:'24px'}}>
                  {/* 2nd Place */}
                  {top3[1] && (
                    <div style={{textAlign:'center', flex:1}}>
                      <div style={{
                        background:'var(--bg-card)', border:'1px solid rgba(192,192,192,0.3)',
                        padding:'20px 16px', marginBottom:'0',
                        boxShadow:'0 0 20px rgba(192,192,192,0.1)',
                      }}>
                        <div style={{fontSize:'32px', marginBottom:'8px'}}>👤</div>
                        <p style={{fontFamily:'var(--font-heading)', color:'#C0C0C0', fontSize:'14px'}}>{top3[1].name}</p>
                        <p className="mono" style={{fontSize:'20px', fontWeight:'700', color:'#C0C0C0', marginTop:'4px'}}>
                          {top3[1].score}
                        </p>
                        <span style={{fontFamily:'var(--font-heading)', fontSize:'28px', color:'#C0C0C0'}}>🥈</span>
                      </div>
                      <div style={{height:'60px', background:'rgba(192,192,192,0.1)', border:'1px solid rgba(192,192,192,0.2)', borderTop:'none'}}/>
                    </div>
                  )}
                  {/* 1st Place */}
                  {top3[0] && (
                    <div style={{textAlign:'center', flex:1}}>
                      <div style={{
                        background:'rgba(255,215,0,0.05)', border:'1px solid rgba(255,215,0,0.4)',
                        padding:'24px 16px',
                        boxShadow:'0 0 30px rgba(255,215,0,0.15)',
                      }}>
                        <div style={{fontSize:'40px', marginBottom:'8px'}}>👑</div>
                        <p style={{fontFamily:'var(--font-heading)', color:'#FFD700', fontSize:'16px', fontWeight:'700'}}>{top3[0].name}</p>
                        <p className="mono" style={{fontSize:'28px', fontWeight:'900', color:'#FFD700', marginTop:'4px',
                          textShadow:'0 0 20px rgba(255,215,0,0.5)'}}>
                          {top3[0].score}
                        </p>
                        <span style={{fontFamily:'var(--font-heading)', fontSize:'36px', color:'#FFD700'}}>🏆</span>
                      </div>
                      <div style={{height:'80px', background:'rgba(255,215,0,0.05)', border:'1px solid rgba(255,215,0,0.2)', borderTop:'none'}}/>
                    </div>
                  )}
                  {/* 3rd Place */}
                  {top3[2] && (
                    <div style={{textAlign:'center', flex:1}}>
                      <div style={{
                        background:'var(--bg-card)', border:'1px solid rgba(205,127,50,0.3)',
                        padding:'20px 16px',
                        boxShadow:'0 0 20px rgba(205,127,50,0.1)',
                      }}>
                        <div style={{fontSize:'32px', marginBottom:'8px'}}>👤</div>
                        <p style={{fontFamily:'var(--font-heading)', color:'#CD7F32', fontSize:'14px'}}>{top3[2].name}</p>
                        <p className="mono" style={{fontSize:'20px', fontWeight:'700', color:'#CD7F32', marginTop:'4px'}}>
                          {top3[2].score}
                        </p>
                        <span style={{fontFamily:'var(--font-heading)', fontSize:'28px', color:'#CD7F32'}}>🥉</span>
                      </div>
                      <div style={{height:'40px', background:'rgba(205,127,50,0.05)', border:'1px solid rgba(205,127,50,0.2)', borderTop:'none'}}/>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Full rankings table */}
            <div className="card">
              <h3 style={{fontFamily:'var(--font-heading)', fontSize:'14px', letterSpacing:'0.08em', color:'var(--primary)', marginBottom:'16px'}}>
                ◈ FULL_RANKINGS
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>RANK</th>
                    <th>STUDENT</th>
                    <th>SCORE</th>
                    <th>ACCURACY</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((entry, i) => {
                    const isMe = Number(entry.user_id) === Number(user?.id);
                    return (
                      <tr key={entry.user_id} style={{background: isMe ? 'rgba(0,255,65,0.04)' : ''}}>
                        <td style={{fontFamily:'var(--font-mono)', fontWeight:'700', color: rankColor(i+1), fontSize:'14px'}}>
                          #{i + 1}
                        </td>
                        <td>
                          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            <div style={{
                              width:'32px', height:'32px',
                              background:'var(--bg-elevated)',
                              border:'1px solid var(--border)',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontFamily:'var(--font-mono)', fontSize:'12px', color:'var(--primary)'
                            }}>
                              {entry.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p style={{fontFamily:'var(--font-body)', fontSize:'13px'}}>
                                {entry.name} {isMe && <span className="badge badge-green">YOU</span>}
                              </p>
                              <p className="mono text-muted" style={{fontSize:'10px'}}>{entry.department || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{fontFamily:'var(--font-heading)', fontWeight:'700', color:'var(--primary)'}}>
                          {entry.score}
                        </td>
                        <td>
                          <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                            <div className="progress-track" style={{width:'60px', height:'2px'}}>
                              <div className="progress-fill" style={{width:`${entry.accuracy || 0}%`}}/>
                            </div>
                            <span className="mono" style={{fontSize:'11px', color:'var(--primary)'}}>{entry.accuracy || 0}%</span>
                          </div>
                        </td>
                        <td>
                          {i < 3
                            ? <span style={{color: rankColor(i+1)}}>{'★'.repeat(3 - i)}</span>
                            : <span className="text-muted mono" style={{fontSize:'11px'}}>—</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
