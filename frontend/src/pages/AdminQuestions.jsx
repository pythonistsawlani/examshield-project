import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getAdminQuestionsAPI, addQuestionAPI, editQuestionAPI, deleteQuestionAPI
} from '../utils/api';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import '../styles/neon.css';

export default function AdminQuestions() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState({ open: false, mode: 'create', question: null });
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A'
  });

  const navItems = [
    { icon: '█', label: 'Dashboard',  path: '/admin' },
    { icon: '≡', label: 'Exams',      path: '/admin/exams' },
    { icon: '?', label: 'Questions',  path: `/admin/exam/${examId}/questions`, active: true },
    { icon: '◉', label: 'Students',   path: '/admin/students' },
    { icon: '◈', label: 'Results',    path: '/admin/results' },
    { icon: '⚙', label: 'Settings',   path: '/admin/settings' },
  ];

  const fetchQuestions = async () => {
    try {
      const data = await getAdminQuestionsAPI(token, examId);
      setQuestions(data);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuestions(); }, [token, examId]);

  const openCreate = () => {
    setForm({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A' });
    setModal({ open: true, mode: 'create', question: null });
  };

  const openEdit = (q) => {
    setForm({
      question_text: q.question_text,
      option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d,
      correct_answer: q.correct_answer
    });
    setModal({ open: true, mode: 'edit', question: q });
  };

  const handleSave = async () => {
    if (!form.question_text || !form.option_a || !form.correct_answer) {
      return toast.error("Please fill all required inputs!");
    }
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await addQuestionAPI(token, { ...form, exam_id: examId });
        toast.success("Question Created!");
      } else {
        await editQuestionAPI(token, modal.question.id, form);
        toast.success("Question Updated!");
      }
      setModal({ open: false, mode: 'create', question: null });
      fetchQuestions();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this question forever?")) return;
    try {
      await deleteQuestionAPI(token, id);
      toast.success("Question deleted.");
      fetchQuestions();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar navItems={navItems} role="admin" user={user} onLogout={logout} />

      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">QUESTION_BANK_MANAGER</h1>
            <p className="page-subtitle">
              SYS_TIME: {new Date().toLocaleString()} | EXAM: #{examId}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
              ◀ BACK TO EXAMS
            </button>
            <button className="btn btn-primary" onClick={openCreate} style={{fontSize:'11px'}}>
              + ADD_QUESTION
            </button>
          </div>
        </div>

        <div className="card">
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px'}}>
            <h3 style={{fontFamily:'var(--font-heading)', fontSize:'14px', letterSpacing:'0.08em', color:'var(--primary)'}}>
              ≡ QUESTIONS ({questions.length})
            </h3>
          </div>

          {loading ? (
            <p className="mono text-muted blink" style={{fontSize:'12px'}}>FETCHING SECURE DATA...</p>
          ) : questions.length === 0 ? (
            <p className="mono text-muted" style={{fontSize:'12px', padding:'24px 0'}}>
              // NO QUESTIONS IN THIS EXAM YET. ADD ONE TO CONTINUE.
            </p>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
              {questions.map((q, idx) => (
                <div key={q.id} className="card card--elevated" style={{display:'flex', gap:'20px'}}>
                  <div style={{flex:1}}>
                    <strong style={{fontSize:'14px', color:'var(--primary)'}}>Q{idx + 1}: {q.question_text}</strong>
                    <div style={{display:'flex', flexWrap:'wrap', gap:'10px', marginTop:'10px', fontSize:'12px', fontFamily:'var(--font-mono)', color:'var(--text-muted)'}}>
                      <span className={q.correct_answer === 'A' ? 'text-green font-bold' : ''}>[A] {q.option_a}</span>
                      <span className={q.correct_answer === 'B' ? 'text-green font-bold' : ''}>[B] {q.option_b}</span>
                      <span className={q.correct_answer === 'C' ? 'text-green font-bold' : ''}>[C] {q.option_c}</span>
                      <span className={q.correct_answer === 'D' ? 'text-green font-bold' : ''}>[D] {q.option_d}</span>
                    </div>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:'8px', minWidth:'80px'}}>
                    <button className="btn btn-secondary" style={{padding:'4px 8px', fontSize:'10px'}} onClick={() => openEdit(q)}>
                      EDIT ✎
                    </button>
                    <button className="btn btn-danger" style={{padding:'4px 8px', fontSize:'10px'}} onClick={() => handleDelete(q.id)}>
                      DEL ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Add/Edit Modal ── */}
      {modal.open && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.8)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000,
          backdropFilter:'blur(4px)',
        }}>
          <div className="card card--glow" style={{width:'100%', maxWidth:'600px', padding:'32px', maxHeight:'90vh', overflowY:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
              <h3 style={{fontFamily:'var(--font-heading)', fontSize:'16px', color:'var(--primary)', letterSpacing:'0.05em'}}>
                {modal.mode === 'create' ? '+ NEW_QUESTION' : '✎ EDIT_QUESTION'}
              </h3>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
              <div className="input-wrapper">
                <label className="input-label">QUESTION_TEXT</label>
                <textarea
                  className="input-field" rows="3"
                  value={form.question_text} onChange={e => setForm({...form, question_text: e.target.value})}
                />
              </div>

              <div className="grid-2">
                {['A', 'B', 'C', 'D'].map(opt => (
                  <div key={opt} className="input-wrapper">
                    <label className="input-label">OPTION_{opt}</label>
                    <input
                      type="text" className="input-field"
                      value={form[`option_${opt.toLowerCase()}`]}
                      onChange={e => setForm({...form, [`option_${opt.toLowerCase()}`]: e.target.value})}
                    />
                  </div>
                ))}
              </div>

              <div className="input-wrapper" style={{marginTop:'8px'}}>
                <label className="input-label">CORRECT_ANSWER</label>
                <div style={{display:'flex', gap:'12px'}}>
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <label key={opt} style={{fontFamily:'var(--font-mono)', fontSize:'12px', display:'flex', alignItems:'center', gap:'4px', cursor:'pointer'}}>
                      <input 
                        type="radio" name="answer" value={opt} 
                        checked={form.correct_answer === opt}
                        onChange={e => setForm({...form, correct_answer: e.target.value})}
                        style={{accentColor:'var(--primary)'}}
                      />
                      [{opt}]
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3" style={{marginTop:'32px'}}>
              <button className="btn btn-primary flex-1" onClick={handleSave} disabled={saving}>
                {saving ? <span className="blink">SAVING...</span> : 'CONFIRM ▶'}
              </button>
              <button className="btn btn-secondary" onClick={() => setModal({open:false})}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
