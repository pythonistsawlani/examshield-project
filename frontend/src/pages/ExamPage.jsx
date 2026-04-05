import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getQuestionsAPI, startExamAttemptAPI, submitExamAPI } from '../utils/api';
import toast from 'react-hot-toast';
import '../styles/neon.css';
import './ExamPage.css';

/*
  EXAM PAGE — Neon Cyber UI
  Features:
  - Timer with auto-submit
  - Question navigator grid
  - MCQ options with pink glow on select
  - Anti-cheat: tab switch detection, fullscreen, right-click disable
  - Question randomization
  - Flag questions
*/

export default function ExamPage() {
  const { examId }        = useParams();
  const navigate           = useNavigate();
  const { token, user }    = useAuth();

  const [exam,         setExam]         = useState(null);
  const [questions,    setQuestions]    = useState([]);
  const [answers,      setAnswers]      = useState({});   // { questionId: 'A' }
  const [flagged,      setFlagged]      = useState({});   // { questionId: true }
  const [currentIdx,   setCurrentIdx]   = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(0);    // seconds
  const [attemptId,    setAttemptId]    = useState(null);
  const [cheating,     setCheating]     = useState({ count: 0, show: false });
  const [submitting,   setSubmitting]   = useState(false);
  const [loading,      setLoading]      = useState(true);

  const timerRef  = useRef(null);
  const fullRef   = useRef(false);
  const submitRef = useRef(async () => {});

  // ── Load exam & start attempt ──
  useEffect(() => {
    const init = async () => {
      try {
        const attempt = await startExamAttemptAPI(token, examId);
        setAttemptId(attempt.attemptId);
        setExam(attempt.exam);
        setTimeLeft(attempt.exam.duration * 60); // convert mins to secs

        const qData = await getQuestionsAPI(token, examId);
        if (!qData || qData.length === 0) {
          if (!toast.isActive('exam-no-questions')) {
            toast.error("SYSTEM ERROR: Developer hasn't added questions to this exam yet.", {
              toastId: 'exam-no-questions',
            });
          }
          return navigate('/dashboard');
        }
        // Randomize question order
        const shuffled = qData.sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
      } catch (err) {
        console.error(err);
        const msg = err.message || 'Failed to initialize exam.';
        if (!toast.isActive('exam-flow-error')) {
          toast.error(msg, { toastId: 'exam-flow-error', duration: 5000 });
        }
        navigate('/dashboard'); // Prevent loading exam without attemptId
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [examId, token, navigate]);

  // ── Anti-Cheat: Tab/Window Switch Detection ──
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setCheating(prev => ({
          count: prev.count + 1,
          show: true,
        }));
        // Auto-hide warning after 3s
        setTimeout(() => setCheating(prev => ({ ...prev, show: false })), 3000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // ── Anti-Cheat: Disable right-click ──
  useEffect(() => {
    const noContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', noContextMenu);
    return () => document.removeEventListener('contextmenu', noContextMenu);
  }, []);

  // ── Anti-Cheat: Request Fullscreen ──
  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen && !fullRef.current) {
      el.requestFullscreen().then(() => { fullRef.current = true; }).catch(() => {});
    }
  }, []);

  // ── Countdown Timer: depend on questions.length (not timeLeft) so one interval runs after load ──
  // eslint-disable-next-line react-hooks/exhaustive-deps -- timeLeft omitted on purpose; interval uses functional setState
  useEffect(() => {
    if (loading || !attemptId || !exam || questions.length === 0 || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          submitRef.current(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    timerRef.current = id;
    return () => clearInterval(id);
  }, [loading, attemptId, exam?.id, questions.length]);

  // ── Format time MM:SS ──
  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const isTimeCritical = timeLeft > 0 && timeLeft <= 300; // under 5 minutes

  // ── Select answer ──
  const selectAnswer = (qId, option) => {
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  // ── Flag question ──
  const toggleFlag = (qId) => {
    setFlagged(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  // ── Submit exam ──
  const handleSubmit = useCallback(async (auto = false) => {
    if (!auto && !window.confirm('CONFIRM EXAM SUBMISSION? // This action cannot be undone.')) return;
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const result = await submitExamAPI(token, attemptId, answers);
      navigate(`/result/${result.resultId}`);
    } catch (err) {
      console.error(err);
      if (!toast.isActive('exam-submit-error')) {
        toast.error(err.message || 'Failed to submit exam.', { toastId: 'exam-submit-error' });
      }
      setSubmitting(false); // Fix: stop the spinner on error
    }
  }, [token, attemptId, answers, navigate]);

  submitRef.current = handleSubmit;

  // ── Current question ──
  const currentQ   = questions[currentIdx];
  const answered   = Object.keys(answers).length;
  const progress   = questions.length ? (answered / questions.length) * 100 : 0;

  // ── Question state helper ──
  const getQState = (q, idx) => {
    if (idx === currentIdx)      return 'current';
    if (flagged[q.id])           return 'flagged';
    if (answers[q.id])           return 'answered';
    return 'unanswered';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card" style={{textAlign:'center', padding:'40px 60px'}}>
          <p className="glow-green mono blink" style={{fontSize:'18px', letterSpacing:'0.15em'}}>
            INITIALIZING_EXAM_SESSION...
          </p>
          <p className="text-muted mono mt-2" style={{fontSize:'12px'}}>
            Loading questions & configuring anti-cheat
          </p>
          <p className="text-muted mono mt-3" style={{fontSize:'10px', opacity:0.7, borderTop:'1px solid var(--border)', paddingTop:'12px'}}>
            PLEASE WAIT — BACKEND MAY BE WAKING UP (RENDER COLD START)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-page">

      {/* ── Cheat Warning Popup ── */}
      {cheating.show && (
        <div className="cheat-popup">
          <span>🚨</span>
          <div>
            <strong>VIOLATION DETECTED</strong>
            <p>Tab switch detected! Count: {cheating.count} — This is being logged.</p>
          </div>
        </div>
      )}

      {/* ── Top Bar ── */}
      <div className="exam-topbar">
        <div className="exam-title">
          <span className="text-pink blink mono" style={{fontSize:'10px', letterSpacing:'0.15em'}}>
            ● EXAM_SESSION_ACTIVE
          </span>
          <h2 style={{fontFamily:'var(--font-heading)', fontSize:'16px', marginTop:'2px'}}>
            {exam?.title || 'LOADING...'}
          </h2>
        </div>

        {/* Timer */}
        <div className={`exam-timer ${isTimeCritical ? 'timer-critical' : ''}`}>
          <span className="mono" style={{fontSize:'10px', letterSpacing:'0.1em', display:'block'}}>
            TIME_REMAINING
          </span>
          <span className="timer-display">{formatTime(timeLeft)}</span>
        </div>

        <div className="exam-info">
          <div className="mono text-muted" style={{fontSize:'11px', textAlign:'right'}}>
            <p>USER: <span className="text-green">{user?.name?.toUpperCase()}</span></p>
            <p>Q: <span className="text-green">{currentIdx + 1}/{questions.length}</span></p>
            <p>CHEATING FLAGS: <span className={cheating.count > 0 ? 'text-red' : 'text-green'}>{cheating.count}</span></p>
          </div>
        </div>
      </div>

      {/* ── Anti-cheat warning banner ── */}
      <div className="warning-banner">
        <span>⚠</span>
        FULLSCREEN REQUIRED — TAB SWITCHING, COPY-PASTE & RIGHT-CLICK ARE DISABLED — VIOLATIONS ARE RECORDED
      </div>

      {/* ── Exam Body ── */}
      <div className="exam-body">

        {/* ── Left Panel: Question Navigator ── */}
        <div className="q-navigator">
          <p className="mono text-muted" style={{fontSize:'10px', letterSpacing:'0.1em', marginBottom:'12px', paddingBottom:'8px', borderBottom:'1px solid var(--border)'}}>
            QUESTION_MAP
          </p>
          <div className="q-grid">
            {questions.map((q, idx) => {
              const state = getQState(q, idx);
              return (
                <button
                  key={q.id}
                  className={`q-pill q-pill--${state}`}
                  onClick={() => setCurrentIdx(idx)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="q-legend">
            {[
              { cls: 'q-pill--answered',   label: 'Answered' },
              { cls: 'q-pill--current',    label: 'Current' },
              { cls: 'q-pill--flagged',    label: 'Flagged' },
              { cls: 'q-pill--unanswered', label: 'Unanswered' },
            ].map(l => (
              <div key={l.label} style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <div className={`q-pill ${l.cls}`} style={{width:'24px', height:'24px', fontSize:'0', pointerEvents:'none'}}/>
                <span className="mono text-muted" style={{fontSize:'10px'}}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* Submit button in sidebar */}
          <button
            className="btn btn-danger w-full"
            style={{marginTop:'auto', fontSize:'11px'}}
            onClick={() => handleSubmit(false)}
            disabled={submitting}
          >
            {submitting ? <span className="blink">SUBMITTING...</span> : 'SUBMIT_EXAM ▶'}
          </button>
        </div>

        {/* ── Center: Question Card ── */}
        <div className="q-main">
          {currentQ && (
            <>
              {/* Question header */}
              <div className="q-header">
                <div className="flex items-center gap-3">
                  <span className="badge badge-green mono">Q_{String(currentIdx + 1).padStart(2, '0')}</span>
                  {flagged[currentQ.id] && <span className="badge badge-red">FLAGGED</span>}
                </div>
                <button
                  className={`btn ${flagged[currentQ.id] ? 'btn-danger' : 'btn-secondary'}`}
                  style={{padding:'6px 14px', fontSize:'10px'}}
                  onClick={() => toggleFlag(currentQ.id)}
                >
                  {flagged[currentQ.id] ? 'UNFLAG' : 'FLAG_Q ⚑'}
                </button>
              </div>

              {/* Question text */}
              <div className="q-text-card">
                <p style={{fontFamily:'var(--font-body)', fontSize:'16px', lineHeight: 1.7, color: 'var(--text)'}}>
                  {currentQ.question_text}
                </p>
              </div>

              {/* MCQ Options */}
              <div className="q-options">
                {['A', 'B', 'C', 'D'].map((opt, i) => {
                  const optKey  = `option_${opt.toLowerCase()}`;
                  const optText = currentQ[optKey];
                  const isSelected = answers[currentQ.id] === opt;
                  if (!optText) return null;
                  return (
                    <button
                      key={opt}
                      className={`q-option ${isSelected ? 'q-option--selected' : ''}`}
                      onClick={() => selectAnswer(currentQ.id, opt)}
                    >
                      <span className="q-option-label">{opt}</span>
                      <span className="q-option-text">{optText}</span>
                      {isSelected && <span className="q-option-check">✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Navigation buttons */}
              <div className="q-nav-buttons">
                <button
                  className="btn btn-secondary"
                  onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                >
                  ◀ PREV_Q
                </button>
                <div className="mono text-muted" style={{fontSize:'11px', letterSpacing:'0.08em'}}>
                  {answered} of {questions.length} answered
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                  disabled={currentIdx === questions.length - 1}
                >
                  NEXT_Q ▶
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom Progress Bar ── */}
      <div className="progress-track" style={{height:'4px'}}>
        <div className="progress-fill" style={{width:`${progress}%`}}/>
      </div>
    </div>
  );
}
