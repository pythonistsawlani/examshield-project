import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminStudentsAPI } from '../utils/api';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import '../styles/neon.css';

export default function AdminStudents() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await getAdminStudentsAPI(token);
        setStudents(data);
      } catch (err) {
        toast.error(err.message || 'Failed to load students.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [token]);

  const navItems = [
    { icon: '█', label: 'Dashboard',  path: '/admin' },
    { icon: '≡', label: 'Exams',      path: '/admin/exams' },
    { icon: '◉', label: 'Students',   path: '/admin/students', active: true },
    { icon: '◈', label: 'Results',    path: '/admin/results' },
    { icon: '⚙', label: 'Settings',   path: '/admin/settings' },
  ];

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.department && s.department.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="app-layout">
      <Sidebar navItems={navItems} role="admin" user={user} onLogout={logout} />

      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">STUDENT_MANAGEMENT</h1>
            <p className="page-subtitle">
              SYS_TIME: {new Date().toLocaleString()} | TOTAL_RECORDS: {students.length}
            </p>
          </div>
          <div className="badge badge-pink pulse-pink">ADMIN ACCESS</div>
        </div>

        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
            <h3 style={{fontFamily:'var(--font-heading)', fontSize:'14px', letterSpacing:'0.08em', color:'var(--primary)'}}>
              ≡ STUDENT_DATABASE
            </h3>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="SEARCH_STUDENT..." 
                className="input-field"
                style={{padding:'8px 16px', fontSize:'12px', width:'250px'}}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div style={{padding:'40px', textAlign:'center'}}>
              <p className="mono text-green blink">FETCHING_STUDENT_DATA...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <p className="mono text-muted" style={{padding:'20px'}}>// NO STUDENT RECORDS FOUND</p>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>NAME</th>
                    <th>EMAIL</th>
                    <th>DEPARTMENT</th>
                    <th>JOINED_DATE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => (
                    <tr key={s.id}>
                      <td className="mono" style={{fontSize:'12px', color:'var(--text-muted)'}}>#{s.id}</td>
                      <td style={{fontWeight:'600'}}>{s.name}</td>
                      <td className="mono" style={{fontSize:'12px'}}>{s.email}</td>
                      <td>
                        <span className="badge badge-secondary">{s.department || 'N/A'}</span>
                      </td>
                      <td className="mono" style={{fontSize:'12px'}}>
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <span className={`badge ${s.is_active ? 'badge-green' : 'badge-red'}`}>
                          {s.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
