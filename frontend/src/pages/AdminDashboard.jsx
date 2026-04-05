import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getExamsAPI, createExamAPI, updateExamAPI, deleteExamAPI, getAdminStatsAPI
} from '../utils/api';
import Sidebar from '../components/Sidebar';
import '../styles/neon.css';

/*
  ADMIN DASHBOARD + PANEL — Neon Cyber UI
  Features:
  - Stats overview
  - Exam CRUD (Create, Edit, Delete)
  - Exam management table
  - Modal for create/edit exam
*/

export default function AdminDashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [exams,   setExams]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState({ open: false, mode: 'create', exam: null });
  const [form,    setForm]    = useState({
    title:'', subject:'', duration:'', total_marks:'', description:'', max_attempts: '3',
  });
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState('');

  const navItems = [
    { icon: '█', label: 'Dashboard',  path: '/admin',          active: true },
    { icon: '≡', label: 'Exams',      path: '/admin/exams' },
    { icon: '◉', label: 'Students',   path: '/admin/students' },
    { icon: '◈', label: 'Results',    path: '/admin/results' },
    { icon: '⚙', label: 'Settings',   path: '/admin/settings' },
  ];

  const fetchData = async () => {
    try {
      const [examsData, statsData] = await Promise.all([
        getExamsAPI(token),
        getAdminStatsAPI(token),
      ]);
      setExams(examsData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  // Open create modal
  const openCreate = () => {
    setForm({
      title:'', subject:'', duration:'', total_marks:'', description:'', max_attempts: '3',
    });
    setModal({ open: true, mode: 'create', exam: null });
  };

  // Open edit modal
  const openEdit = (exam) => {
    setForm({
      title: exam.title,
      subject: exam.subject || '',
      duration: exam.duration,
      total_marks: exam.total_marks,
      description: exam.description || '',
      max_attempts: String(exam.max_attempts != null ? exam.max_attempts : 3),
    });
    setModal({ open: true, mode: 'edit', exam });
  };

  // Save exam (create or update)
  const saveExam = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration: Number(form.duration),
        total_marks: Number(form.total_marks),
        max_attempts: Math.max(1, Number(form.max_attempts) || 1),
      };
      if (modal.mode === 'create') {
        await createExamAPI(token, payload);
      } else {
        await updateExamAPI(token, modal.exam.id, payload);
      }
      setModal({ open: false, mode: 'create', exam: null });
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete exam
  const deleteExam = async (id) => {
    if (!window.confirm('DELETE this exam? // This cannot be undone.')) return;
    try {
      await deleteExamAPI(token, id);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = exams.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-layout">
      <Sidebar navItems={navItems} role="admin" user={user} onLogout={logout} />

      <main className="main-content">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">ADMIN_CONTROL_CENTER</h1>
            <p className="page-subtitle">
              SYS_TIME: {new Date().toLocaleString()} | ADMIN: {user?.name?.toUpperCase()}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="badge badge-pink">ADMIN ACCESS</div>
            <button className="btn btn-primary" onClick={openCreate} style={{fontSize:'11px'}}>
              + CREATE_EXAM
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{marginBottom:'32px'}}>
          {[
            { label: 'TOTAL_STUDENTS', value: stats?.totalStudents ?? '—',  color: 'var(--primary)' },
            { label: 'ACTIVE_EXAMS',   value: stats?.activeExams ?? '—',    color: 'var(--secondary)' },
            { label: 'QUESTIONS_BANK', value: stats?.totalQuestions ?? '—', color: '#FFD700' },
            { label: 'AVG_PASS_RATE',  value: stats ? `${stats.avgPassRate}%` : '—', color: 'var(--primary)' },
          ].map(s => (
            <div key={s.label} className="card card--elevated">
              <p className="mono text-muted" style={{fontSize:'10px', letterSpacing:'0.12em', marginBottom:'8px'}}>{s.label}</p>
              <p style={{fontFamily:'var(--font-heading)', fontSize:'36px', fontWeight:'700', color: s.color, lineHeight: 1}}>
                {loading ? '—' : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Exam Management Table */}
        <div className="card">
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px'}}>
            <h3 style={{fontFamily:'var(--font-heading)', fontSize:'14px', letterSpacing:'0.08em', color:'var(--primary)'}}>
              ≡ EXAM_MANAGEMENT
            </h3>
            {/* Search */}
            <input
              type="text"
              className="input-field"
              placeholder="SEARCH_EXAM..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{width:'220px', fontFamily:'var(--font-mono)', fontSize:'12px'}}
            />
          </div>

          {loading ? (
            <p className="mono text-muted blink" style={{fontSize:'12px'}}>LOADING EXAM DATA...</p>
          ) : filtered.length === 0 ? (
            <p className="mono text-muted" style={{fontSize:'12px', padding:'24px 0'}}>
              // NO EXAMS FOUND. CREATE ONE WITH [ + CREATE_EXAM ]
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>EXAM_TITLE</th>
                  <th>SUBJECT</th>
                  <th>DURATION</th>
                  <th>Q_COUNT</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(exam => (
                  <tr key={exam.id}>
                    <td style={{fontFamily:'var(--font-body)', fontWeight:'500'}}>{exam.title}</td>
                    <td className="mono text-muted" style={{fontSize:'12px'}}>{exam.subject || 'GENERAL'}</td>
                    <td className="mono" style={{fontSize:'12px'}}>{exam.duration} MIN</td>
                    <td className="mono text-green" style={{fontSize:'12px'}}>
                      {exam.question_count || 0}
                      <span className="text-muted" style={{ display: 'block', fontSize: '10px' }}>
                        max {exam.max_attempts != null ? exam.max_attempts : 3} tries
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${exam.is_active ? 'badge-green' : 'badge-gray'}`}>
                        {exam.is_active ? 'ACTIVE' : 'DRAFT'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-secondary"
                          onClick={() => openEdit(exam)}
                          style={{padding:'4px 12px', fontSize:'10px'}}
                        >EDIT</button>
                        <button
                          className="btn"
                          onClick={() => navigate(`/admin/exam/${exam.id}/questions`)}
                          style={{padding:'4px 12px', fontSize:'10px', background:'rgba(255,215,0,0.1)', color:'#FFD700', border:'1px solid rgba(255,215,0,0.3)'}}
                        >Q_BANK</button>
                        <button
                          className="btn btn-danger"
                          onClick={() => deleteExam(exam.id)}
                          style={{padding:'4px 12px', fontSize:'10px'}}
                        >DEL</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* ── Create/Edit Exam Modal ── */}
      {modal.open && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.8)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000,
          backdropFilter:'blur(4px)',
        }}>
          <div className="card card--glow" style={{width:'100%', maxWidth:'480px', padding:'32px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
              <h3 style={{fontFamily:'var(--font-heading)', fontSize:'16px', color:'var(--primary)', letterSpacing:'0.05em'}}>
                {modal.mode === 'create' ? '+ CREATE_EXAM' : '✎ EDIT_EXAM'}
              </h3>
              <button
                onClick={() => setModal({open:false})}
                style={{background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'18px'}}
              >✕</button>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
              {[
                {key:'title',       label:'EXAM_TITLE',    type:'text',   ph:'e.g. Data Structures Final'},
                {key:'subject',     label:'SUBJECT',       type:'text',   ph:'e.g. Computer Science'},
                {key:'duration',    label:'DURATION (MIN)',type:'number', ph:'e.g. 60'},
                {key:'total_marks', label:'TOTAL_MARKS',   type:'number', ph:'e.g. 100'},
                {key:'max_attempts',label:'MAX_ATTEMPTS',  type:'number', ph:'e.g. 3'},
                {key:'description', label:'DESCRIPTION',   type:'text',   ph:'Brief description...'},
              ].map(f => (
                <div key={f.key} className="input-wrapper">
                  <label className="input-label">{f.label}</label>
                  <input
                    type={f.type}
                    className="input-field"
                    placeholder={f.ph}
                    value={form[f.key]}
                    onChange={e => setForm({...form, [f.key]: e.target.value})}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3" style={{marginTop:'24px'}}>
              <button className="btn btn-primary flex-1" onClick={saveExam} disabled={saving}>
                {saving ? <span className="blink">SAVING...</span> : (modal.mode === 'create' ? 'CREATE ▶' : 'SAVE_CHANGES ▶')}
              </button>
              <button className="btn btn-secondary" onClick={() => setModal({open:false})}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
