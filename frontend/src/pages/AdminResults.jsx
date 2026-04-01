import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAdminAllResultsAPI } from '../utils/api';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import '../styles/neon.css';

export default function AdminResults() {
  const { token, user, logout } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const navItems = [
    { icon: '█', label: 'Dashboard',  path: '/admin' },
    { icon: '≡', label: 'Exams',      path: '/admin/exams' },
    { icon: '◉', label: 'Students',   path: '/admin/students' },
    { icon: '◈', label: 'Results',    path: '/admin/results', active: true },
    { icon: '⚙', label: 'Settings',   path: '/admin/settings' },
  ];

  useEffect(() => {
    getAdminAllResultsAPI(token)
      .then(setRows)
      .catch((err) => {
        console.error(err);
        toast.error(err.message || 'Failed to load results.');
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="app-layout">
      <Sidebar navItems={navItems} role="admin" user={user} onLogout={logout} />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">ALL_EXAM_RESULTS</h1>
            <p className="page-subtitle">RECENT SUBMISSIONS (LAST 200)</p>
          </div>
          <div className="badge badge-pink">ADMIN</div>
        </div>

        <div className="card">
          {loading ? (
            <p className="mono text-muted blink" style={{ fontSize: '12px' }}>LOADING...</p>
          ) : rows.length === 0 ? (
            <p className="mono text-muted" style={{ fontSize: '12px' }}>{'// NO RESULTS IN DATABASE YET'}</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>STUDENT</th>
                  <th>EXAM</th>
                  <th>SCORE</th>
                  <th>RANK</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="mono text-muted" style={{ fontSize: '11px' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                    </td>
                    <td>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px' }}>{r.student_name}</div>
                      <div className="mono text-muted" style={{ fontSize: '10px' }}>{r.student_email}</div>
                    </td>
                    <td style={{ fontSize: '13px' }}>{r.exam_title}</td>
                    <td>
                      <span style={{ color: r.percentage >= 60 ? 'var(--primary)' : 'var(--danger)', fontWeight: 600 }}>
                        {r.percentage}%
                      </span>
                    </td>
                    <td className="mono">#{r.rank ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
