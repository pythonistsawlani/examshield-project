import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getExamsAPI, getMyResultsAPI } from '../utils/api';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import '../styles/neon.css';

/*
  STUDENT DASHBOARD — Neon Cyber UI
  Shows: Stats, Upcoming Exams, Recent Results
*/

export default function StudentDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [exams,   setExams]   = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const [errorStatus, setErrorStatus] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsData, resData] = await Promise.all([
          getExamsAPI(token),
          getMyResultsAPI(token),
        ]);
        setExams(examsData);
        setResults(resData);
      } catch (err) {
        console.error(err);
        setErrorStatus(true);
        toast.error('Failed to load exams. Connection to server lost.', { duration: 5000 });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Compute stats
  const avgScore   = results.length ? Math.round(results.reduce((a, r) => a + r.percentage, 0) / results.length) : 0;
  const bestRank   = results.length ? Math.min(...results.map(r => r.rank || 99)) : '-';
  
  // Create a map of examId -> number of attempts
  const attemptCounts = results.reduce((acc, r) => {
    acc[r.exam_id] = (acc[r.exam_id] || 0) + 1;
    return acc;
  }, {});

  const navItems = [
    { icon: '█', label: 'Dashboard',   path: '/dashboard',   active: true },
    { icon: '◈', label: 'Results',     path: '/results' },
    { icon: '▲', label: 'Leaderboard', path: '/leaderboard' },
    { icon: '⚙', label: 'Settings',    path: '/settings' },
  ];

  return (
    <div className="app-layout">
      <Sidebar navItems={navItems} role="student" user={user} onLogout={logout} />

      <main className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">STUDENT_DASHBOARD</h1>
            <p className="page-subtitle">
              SYS_TIME: {new Date().toLocaleString()} | USER: {user?.name?.toUpperCase()}
            </p>
          </div>
          <div className="badge badge-green pulse-green">SESSION ACTIVE</div>
        </div>

        {/* Warning Banner */}
        <div className="warning-banner" style={{marginBottom: '24px'}}>
          <span>⚠</span>
          ANTI-CHEAT PROTOCOL ACTIVE — ANY SUSPICIOUS ACTIVITY WILL BE LOGGED AND REPORTED
        </div>

        {/* Stats */}
        <div className="grid-4" style={{marginBottom:'32px'}}>
          {[
            { label: 'TOTAL_EXAMS',  value: exams.length,    color: 'var(--primary)' },
            { label: 'AVG_SCORE',    value: `${avgScore}%`,  color: 'var(--secondary)' },
            { label: 'BEST_RANK',    value: `#${bestRank}`,  color: '#FFD700' },
            { label: 'COMPLETED',    value: results.length,  color: 'var(--primary)' },
          ].map(s => (
            <div key={s.label} className="card card--elevated">
              <p className="mono text-muted" style={{fontSize:'10px', letterSpacing:'0.12em', marginBottom:'8px'}}>{s.label}</p>
              <p style={{fontFamily:'var(--font-heading)', fontSize:'36px', fontWeight:'700', color: s.color, lineHeight:1}}>
                {loading ? '—' : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Two column: Upcoming Exams + Recent Results */}
        <div className="grid-2">
          {/* Upcoming Exams */}
          <div className="card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
              <h3 style={{fontFamily:'var(--font-heading)', fontSize:'14px', letterSpacing:'0.08em', color:'var(--primary)'}}>
                ▶ UPCOMING_EXAMS
              </h3>
              <span className="badge badge-green">{exams.length} ACTIVE</span>
            </div>

            {loading ? (
              <div style={{padding:'20px', textAlign:'center'}}>
                <span className="blink text-green" style={{fontSize:'24px'}}>⏳</span>
                <p className="text-muted mono blink mt-2" style={{fontSize:'12px'}}>FETCHING SECURE DATA...</p>
              </div>
            ) : errorStatus ? (
              <p className="text-red mono" style={{fontSize:'12px', color: 'var(--danger)'}}>// SYSTEM ERROR: UNABLE TO FETCH DATA</p>
            ) : exams.length === 0 ? (
              <p className="text-muted mono" style={{fontSize:'12px'}}>// NO ACTIVE EXAMS FOUND</p>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                {exams.map(exam => {
                  const attempts = attemptCounts[exam.id] || 0;
                  const isCompleted = attempts > 0;
                  return (
                    <div key={exam.id} className="exam-card-row card card--elevated">
                      <div>
                        <p style={{fontFamily:'var(--font-heading)', fontSize:'14px', fontWeight:'600'}}>{exam.title}</p>
                        <p className="mono text-muted" style={{fontSize:'11px', marginTop:'4px'}}>
                          DURATION: {exam.duration}min | MARKS: {exam.total_marks} | Q: {exam.question_count}
                        </p>
                        <div style={{marginTop:'8px', display:'flex', gap:'6px', flexWrap:'wrap'}}>
                          <span className="badge badge-green">{exam.subject || 'GENERAL'}</span>
                          {exam.is_active && !isCompleted && <span className="badge badge-pink">LIVE</span>}
                          {isCompleted && <span className="badge badge-secondary">ATTEMPTS: {attempts}</span>}
                          {!exam.question_count && <span className="badge badge-red">EMPTY</span>}
                        </div>
                      </div>
                      <button
                        className={`btn ${exam.question_count > 0 ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => navigate(`/exam/${exam.id}`)}
                        disabled={!exam.question_count}
                        style={{marginTop:'12px', padding:'8px 16px', fontSize:'11px'}}
                      >
                        {isCompleted ? 'RETAKE ▶' : (exam.question_count > 0 ? 'START ▶' : 'NO Q_BANK')}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Results */}
          <div className="card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
              <h3 style={{fontFamily:'var(--font-heading)', fontSize:'14px', letterSpacing:'0.08em', color:'var(--primary)'}}>
                ◈ RECENT_RESULTS
              </h3>
              <button className="btn btn-secondary" onClick={() => navigate('/results')} style={{padding:'4px 12px', fontSize:'10px'}}>
                VIEW ALL
              </button>
            </div>

            {results.length === 0 ? (
              <p className="text-muted mono" style={{fontSize:'12px'}}>// NO RESULTS YET. TAKE AN EXAM!</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>EXAM</th>
                    <th>SCORE</th>
                    <th>RANK</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 5).map(r => (
                    <tr key={r.id} style={{cursor:'pointer'}} onClick={() => navigate(`/result/${r.id}`)}>
                      <td style={{fontFamily:'var(--font-body)', fontSize:'13px'}}>{r.exam_title}</td>
                      <td>
                        <span style={{color: r.percentage >= 60 ? 'var(--primary)' : 'var(--danger)', fontWeight:'600'}}>
                          {r.percentage}%
                        </span>
                      </td>
                      <td className="text-muted">#{r.rank || '—'}</td>
                      <td>
                        <span className={`badge ${r.percentage >= 60 ? 'badge-green' : 'badge-red'}`}>
                          {r.percentage >= 60 ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
