import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Sidebar from '@/components/Sidebar';
import { DataStore, requireAuth, sanitizeObject } from '@/lib/security';

export default function ReportIssue() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'Bug Report',
    subject: '',
    description: ''
  });

  useEffect(() => {
    if (!requireAuth(router)) return;
    const raw = DataStore.get();
    if (raw) {
      const parsed = sanitizeObject(raw);
      setData(parsed);
      setFormData(prev => ({
        ...prev,
        name: parsed.user?.name || '',
        email: parsed.user?.email || ''
      }));
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.description.length < 20) {
      alert("Please provide a more detailed description (at least 20 characters).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('https://formspree.io/f/xvzwykzj', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          issueType: formData.type,
          subject: formData.subject,
          description: formData.description,
          timestamp: new Date().toLocaleString('en-IN'),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError("Failed to send report. Please try again or use the fallback below.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!data) return <div className="loading" />;

  return (
    <>
      <Head><title>Report Issue — CampusPro</title></Head>

      <div className="dash-bg" aria-hidden="true">
        <div className="dash-bg-grid" />
        <div className="dash-blob-1" />
        <div className="dash-blob-2" />
        <div className="dash-blob-3" />
        <div className="dash-blob-4" />
        <div className="dash-bg-vignette" />
      </div>

      <div className="page-root">
        <Sidebar activeTab="report" user={data.user} />
        
        <main className="main-content">
          <header className="header animate-up">
            <h1 className="title">Report an Issue</h1>
            <p className="subtitle">Found a bug or have a suggestion? Let us know!</p>
          </header>

          <div className="form-container animate-up" style={{ animationDelay: '100ms' }}>
            {!submitted ? (
              <form className="issue-form glass" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="label">Your Name</label>
                    <input name="name" className="input" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="label">Contact Email</label>
                    <input type="email" name="email" className="input" value={formData.email} onChange={handleChange} required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Issue Type</label>
                  <select name="type" className="input select" value={formData.type} onChange={handleChange}>
                    <option>Bug Report</option>
                    <option>Wrong Data</option>
                    <option>Feature Request</option>
                    <option>Login Problem</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Subject</label>
                  <input name="subject" className="input" placeholder="Brief summary of the issue" value={formData.subject} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label className="label">Description</label>
                  <textarea name="description" className="input textarea" placeholder="Tell us exactly what happened. What steps did you take?" value={formData.description} onChange={handleChange} required />
                  <span className="char-count" style={{ color: formData.description.length < 20 ? 'var(--rose)' : 'var(--emerald)' }}>
                    {formData.description.length} / 20 chars min
                  </span>
                </div>

                {error && (
                  <div className="error-msg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {error}
                    <a href={`mailto:support@campuspro.io?subject=[FALLBACK] ${formData.subject}&body=${encodeURIComponent(formData.description)}`} className="mail-fallback">
                      Use Mailto instead
                    </a>
                  </div>
                )}

                <button type="submit" className={`btn-submit ${loading ? 'loading' : ''}`} disabled={loading}>
                  {loading ? 'Submitting...' : 'Send Report'}
                </button>
              </form>
            ) : (
              <div className="success-state glass animate-in">
                <div className="success-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="success-title">Report Submitted!</h2>
                <p className="success-desc">Thank you for helping us improve CampusPro. Our team will review your report and get back to you within 24-48 hours.</p>
                <button className="btn-back" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
              </div>
            )}
          </div>
        </main>
      </div>

      <style jsx>{`
        .page-root { display: flex; min-height: 100vh; background: var(--bg); }
        .main-content { flex: 1; padding: 40px 60px; max-width: 800px; margin: 0 auto; }
        
        .header { margin-bottom: 40px; }
        .title { font-family: var(--font-display); font-size: 32px; font-weight: 800; color: var(--text-1); letter-spacing: -1px; }
        .subtitle { font-size: 15px; color: var(--text-3); margin-top: 6px; }

        .issue-form { padding: 32px; border-radius: 24px; display: flex; flex-direction: column; gap: 20px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        
        .label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-3); letter-spacing: 0.5px; padding-left: 4px; }
        .input { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px; color: var(--text-1); font-family: inherit; font-size: 14px; outline: none; transition: all 0.2s; }
        .input:focus { border-color: var(--accent-light); box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
        .select { appearance: none; cursor: pointer; }
        .textarea { min-height: 150px; resize: none; line-height: 1.6; }
        
        .char-count { font-size: 11px; align-self: flex-end; margin-top: -4px; opacity: 0.8; font-family: var(--font-mono); }

        .btn-submit { background: var(--accent); color: white; border: none; padding: 16px; border-radius: 12px; font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.2s; margin-top: 12px; }
        .btn-submit:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3); }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .error-msg { 
          background: var(--rose-dim); 
          color: var(--rose); 
          border: 1px solid var(--rose-border); 
          padding: 12px 14px; 
          border-radius: 12px; 
          font-size: 13px; 
          display: flex; 
          align-items: center; 
          gap: 10px;
          animation: fadeUp 0.3s ease;
        }
        .mail-fallback { margin-left: auto; text-decoration: underline; font-weight: 700; font-size: 12px; }

        .success-state { padding: 60px 40px; border-radius: 24px; text-align: center; display: flex; flex-direction: column; align-items: center; }
        .success-icon { width: 80px; height: 80px; border-radius: 50%; background: var(--emerald-dim); border: 2px solid var(--emerald-border); display: flex; align-items: center; justify-content: center; margin-bottom: 24px; box-shadow: 0 0 20px rgba(16,185,129,0.2); }
        .success-title { font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--text-1); margin-bottom: 12px; }
        .success-desc { font-size: 15px; color: var(--text-3); line-height: 1.6; margin-bottom: 32px; max-width: 400px; }
        .btn-back { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-1); padding: 12px 32px; border-radius: 12px; font-weight: 700; cursor: pointer; }

        @media (max-width: 600px) {
          .main-content { padding: 80px 20px 40px; }
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
