import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyResultsAPI } from '../utils/api';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import '../styles/neon.css';

/*
  RESULT PAGE — Neon Cyber UI
  Shows: Score, breakdown, correct/wrong analysis
*/

export default function ResultPage() {
  const { resultId } = useParams();
  const location = useLocation();
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const isListView = location.pathname === '/results' || !resultId;

  useEffect(() => {
    if (!token) return;
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    if (isListView) {
      getMyResultsAPI(token)
        .then((rows) => {
          setList(Array.isArray(rows) ? rows : []);
          setResult(null);
        })
        .catch((err) => {
          console.error(err);
          toast.error(err.message || 'Failed to load results.');
          setList([]);
        })
        .finally(() => setLoading(false));
      return;
    }
    fetch(`${baseUrl}/results/${resultId}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message || 'Failed to load result.');
        setResult(data);
      })
      .catch((err) => {
        console.error(err);
        toast.error(err.message || 'Result not found.');
        setResult(null);
      })
      .finally(() => setLoading(false));
  }, [resultId, token, isListView]);

  const navItems = [
    { icon: '█', label: 'Dashboard',   path: '/dashboard' },
    { icon: '◈', label: 'Results',     path: '/results',   active: true },
    { icon: '▲', label: 'Leaderboard', path: '/leaderboard' },
    { icon: '⚙', label: 'Settings',    path: '/settings' },
  ];

  const getGrade = (pct) => {
    if (pct >= 90) return { label: 'S_RANK',  color: '#FFD700' };
    if (pct >= 75) return { label: 'A_RANK',  color: 'var(--primary)' };
    if (pct >= 60) return { label: 'B_RANK',  color: 'var(--primary)' };
    if (pct >= 45) return { label: 'C_RANK',  color: '#ff9900' };
    return              { label: 'FAIL',      color: 'var(--danger)' };
  };

  return (
    <div className="app-layout">
      <Sidebar navItems={navItems} role="student" user={user} onLogout={logout} />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">RESULT_ANALYSIS</h1>
            <p className="page-subtitle">EXAM PERFORMANCE REPORT</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')} style={{fontSize:'11px'}}>
            ← BACK_TO_DASHBOARD
          </button>
        </div>

        {loading ? (
          <div className="card" style={{textAlign:'center', padding:'60px'}}>
            <p className="glow-green mono blink">LOADING RESULT DATA...</p>
          </div>
        ) : isListView ? (
          <div className="card">
            <h3 style={{fontFamily:'var(--font-heading)', fontSize:'14px', letterSpacing:'0.08em', color:'var(--primary)', marginBottom:'16px'}}>
              ◈ ALL_RESULTS
            </h3>
            {list.length === 0 ? (
              <p className="text-muted mono" style={{fontSize:'12px'}}>// NO RESULTS YET. TAKE AN EXAM FROM THE DASHBOARD.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>EXAM</th>
                    <th>SCORE</th>
                    <th>RANK</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.id}>
                      <td style={{fontFamily:'var(--font-body)', fontSize:'13px'}}>{r.exam_title}</td>
                      <td>
                        <span style={{ color: r.percentage >= 60 ? 'var(--primary)' : 'var(--danger)', fontWeight:'600' }}>
                          {r.percentage}%
                        </span>
                      </td>
                      <td className="text-muted">#{r.rank ?? '—'}</td>
                      <td>
                        <button type="button" className="btn btn-secondary" style={{fontSize:'10px', padding:'4px 12px'}} onClick={() => navigate(`/result/${r.id}`)}>
                          VIEW DETAIL
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : !result ? (
          <div className="card">
            <p className="text-muted mono">// RESULT NOT FOUND</p>
          </div>
        ) : (
          <>
            {/* Score Hero */}
            <div className="card card--glow" style={{textAlign:'center', padding:'48px', marginBottom:'24px'}}>
              <p className="mono text-muted" style={{fontSize:'10px', letterSpacing:'0.2em', marginBottom:'8px'}}>
                FINAL_SCORE
              </p>
              <div style={{
                fontFamily:'var(--font-heading)',
                fontSize:'96px',
                fontWeight:'900',
                color: result.percentage >= 60 ? 'var(--primary)' : 'var(--danger)',
                textShadow: result.percentage >= 60 ? 'var(--glow-green)' : 'var(--glow-red)',
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}>
                {result.score}/{result.total_marks}
              </div>
              <p style={{fontFamily:'var(--font-heading)', fontSize:'24px', marginTop:'8px', color:'var(--text-muted)'}}>
                {result.percentage}%
              </p>

              {/* Grade badge */}
              {(() => {
                const g = getGrade(result.percentage);
                return (
                  <div className="mono" style={{
                    marginTop:'20px',
                    fontSize:'28px',
                    fontWeight:'900',
                    color: g.color,
                    letterSpacing:'0.2em',
                    textShadow:`0 0 20px ${g.color}`,
                  }}>
                    {g.label}
                  </div>
                );
              })()}

              {/* Stats row */}
              <div className="grid-4" style={{marginTop:'32px', textAlign:'left'}}>
                {[
                  { label: 'CORRECT',   value: result.correct,   color:'var(--primary)' },
                  { label: 'WRONG',     value: result.wrong,     color:'var(--danger)' },
                  { label: 'SKIPPED',   value: result.skipped,   color:'var(--text-muted)' },
                  { label: 'RANK',      value: `#${result.rank || '—'}`, color:'#FFD700' },
                ].map(s => (
                  <div key={s.label} className="card card--elevated" style={{textAlign:'center', padding:'16px'}}>
                    <p className="mono text-muted" style={{fontSize:'9px', letterSpacing:'0.12em'}}>{s.label}</p>
                    <p style={{fontFamily:'var(--font-heading)', fontSize:'28px', fontWeight:'700', color: s.color, marginTop:'4px'}}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Answer Review */}
            <div className="card" style={{marginBottom:'24px'}}>
              <h3 style={{fontFamily:'var(--font-heading)', fontSize:'14px', letterSpacing:'0.08em', color:'var(--primary)', marginBottom:'20px'}}>
                ◈ ANSWER_REVIEW
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>QUESTION</th>
                    <th>YOUR_ANSWER</th>
                    <th>CORRECT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {(result.answers || []).map((a, i) => (
                    <tr key={i}>
                      <td className="mono text-muted" style={{fontSize:'12px'}}>Q_{String(i+1).padStart(2,'0')}</td>
                      <td style={{maxWidth:'300px', fontSize:'13px'}}>{a.question_text}</td>
                      <td className={`mono ${a.is_correct ? 'text-green' : 'text-red'}`} style={{fontSize:'12px'}}>
                        {a.your_answer || 'SKIPPED'}
                      </td>
                      <td className="mono text-green" style={{fontSize:'12px'}}>{a.correct_answer}</td>
                      <td>
                        <span className={`badge ${a.is_correct ? 'badge-green' : a.your_answer ? 'badge-red' : 'badge-gray'}`}>
                          {a.is_correct ? 'CORRECT' : a.your_answer ? 'WRONG' : 'SKIPPED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4">
              <button className="btn btn-primary" onClick={() => navigate('/leaderboard')}>
                VIEW LEADERBOARD ▲
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                BACK TO DASHBOARD
              </button>
              <button className="btn btn-secondary" onClick={() => window.print()}>
                PRINT REPORT ⎙
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
