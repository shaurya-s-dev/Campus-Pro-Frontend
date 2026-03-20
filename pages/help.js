import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AuroraBackground from '@/components/AuroraBackground';
import Sidebar from '@/components/Sidebar';
import { DataStore, requireAuth, sanitizeObject } from '@/lib/security';

const FAQ = [
  {
    category: 'Getting Started',
    items: [
      { q: 'How do I login to CampusPro?', a: 'Use your SRM Academia email and password. Your credentials are used only to authenticate with SRM servers via a secure proxy.' },
      { q: 'Why does login fail sometimes?', a: 'SRM allows only 2 active sessions. If you are logged in on the official portal or another app, logout there first. Also, ensure you are using the correct credentials.' },
      { q: 'Is my password stored?', a: 'Never. Your credentials go directly to SRM Academia servers. We only store a session token locally in your browser to keep you logged in.' }
    ]
  },
  {
    category: 'Features',
    items: [
      { q: 'How is attendance calculated?', a: 'Data is directly fetched from SRM Academia. It is the exact same data shown on the official portal, just presented in a more readable format.' },
      { q: 'What does "Margin" mean on attendance cards?', a: 'Margin is the number of classes you can miss while still maintaining at least a 75% attendance record. A negative margin means you have a deficit.' },
      { q: 'How accurate is Attendance Planner?', a: 'It is an estimate based on your current attendance and the remaining days in the academic calendar. Please use it as a rough guide only.' },
      { q: 'How does the GPA calculator work?', a: 'It uses SRM\'s official grading scale (O=10, A+=9, A=8, B+=7, B=6, C=5, P=4, F=0) to calculate your weighted average.' }
    ]
  },
  {
    category: 'Technical Issues',
    items: [
      { q: 'Data seems outdated', a: 'Data is fetched fresh every time you login. If you suspect data is stale, try logging out and logging back in to trigger a refresh.' },
      { q: 'App shows wrong day order', a: 'Day orders follow the official SRM academic calendar for the Even Semester 2025-26. If the administration changes the calendar, the app will be updated accordingly.' }
    ]
  }
];

export default function HelpCenter() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [openIndex, setOpenIndex] = useState('0-0');

  useEffect(() => {
    if (!requireAuth(router)) return;
    const raw = DataStore.get();
    if (raw) setData(sanitizeObject(raw));
  }, [router]);

  const toggleFAQ = (id) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  if (!data) return <div className="loading" />;

  return (
    <>
      <Head><title>Help Center — CampusPro</title></Head>

      <AuroraBackground />

      <div className="page-root" style={{ position: 'relative', zIndex: 1 }}>
        <Sidebar activeTab="help" user={data.user} />
        
        <main className="main-content">
          <header className="header animate-up">
            <h1 className="title">Help Center</h1>
            <p className="subtitle">Find answers to common questions or get support</p>
          </header>

          <div className="categories-grid">
            {[
              { l: 'Getting Started', i: '🚀', c: 'var(--accent-light)' },
              { l: 'Features', i: '✨', c: 'var(--emerald)' },
              { l: 'Attendance', i: '📊', c: 'var(--amber)' },
              { l: 'Technical', i: '⚙️', c: 'var(--rose)' },
            ].map((cat, i) => (
              <div key={i} className="cat-card glass animate-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="cat-icon" style={{ background: `${cat.c}14`, color: cat.c }}>{cat.i}</div>
                <div className="cat-name">{cat.l}</div>
              </div>
            ))}
          </div>

          <section className="faq-section glass animate-up" style={{ animationDelay: '250ms' }}>
            <h2 className="faq-title">Frequently Asked Questions</h2>
            <div className="faq-list">
              {FAQ.map((group, gi) => (
                <div key={gi} className="faq-group">
                  <h3 className="group-title">{group.category}</h3>
                  {group.items.map((item, ii) => {
                    const id = `${gi}-${ii}`;
                    const isOpen = openIndex === id;
                    return (
                      <div key={id} className={`faq-item ${isOpen ? 'open' : ''}`}>
                        <button className="faq-q" onClick={() => toggleFAQ(id)}>
                          <span>{item.q}</span>
                          <svg className="faq-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </button>
                        <div className="faq-a">
                          <div className="faq-a-inner">{item.a}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>

          <footer className="help-footer animate-up" style={{ animationDelay: '400ms' }}>
            <p>Still need help?</p>
            <button className="btn-contact" onClick={() => router.push('/report-issue')}>Contact Support</button>
          </footer>
        </main>
      </div>

      <style jsx>{`
        .page-root { display: flex; min-height: 100vh; background: var(--bg); }
        .main-content { flex: 1; padding: 40px 60px; max-width: 1000px; margin: 0 auto; }
        
        .header { margin-bottom: 40px; }
        .title { font-family: var(--font-display); font-size: 36px; font-weight: 800; color: var(--text-1); letter-spacing: -1px; }
        .subtitle { font-size: 15px; color: var(--text-3); margin-top: 6px; }

        .categories-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 40px; }
        .cat-card { border-radius: 20px; padding: 24px; text-align: center; cursor: pointer; transition: transform 0.2s; }
        .cat-card:hover { transform: translateY(-5px); border-color: var(--accent-border); }
        .cat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 20px; }
        .cat-name { font-size: 13px; font-weight: 700; color: var(--text-2); }

        .faq-section { border-radius: 24px; padding: 32px; }
        .faq-title { font-family: var(--font-display); font-size: 20px; font-weight: 700; color: var(--text-1); margin-bottom: 24px; }
        
        .faq-group { margin-bottom: 32px; }
        .group-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--accent-light); letter-spacing: 1px; margin-bottom: 12px; padding-left: 4px; }
        
        .faq-item { border-bottom: 1px solid var(--border); }
        .faq-item:last-child { border-bottom: none; }
        .faq-q { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 18px 4px; background: none; border: none; color: var(--text-2); font-size: 14.5px; font-weight: 600; cursor: pointer; text-align: left; }
        .faq-q:hover { color: var(--text-1); }
        .faq-chevron { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); opacity: 0.3; }
        .faq-item.open .faq-chevron { transform: rotate(180deg); opacity: 1; color: var(--accent-light); }
        
        .faq-a { max-height: 0; overflow: hidden; transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .faq-item.open .faq-a { max-height: 200px; }
        .faq-a-inner { padding: 4px 4px 24px; color: var(--text-3); font-size: 14px; line-height: 1.6; }

        .help-footer { margin-top: 48px; text-align: center; padding: 32px 0; border-top: 1px solid var(--border); }
        .help-footer p { color: var(--text-3); font-size: 14px; margin-bottom: 16px; }
        .btn-contact { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-1); padding: 12px 32px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-contact:hover { border-color: var(--accent-border); background: var(--glass-bg); transform: translateY(-2px); }

        @media (max-width: 860px) {
          .main-content { padding: 80px 20px 40px; }
          .categories-grid { grid-template-columns: repeat(2, 1fr); }
          .title { font-size: 28px; }
        }
      `}</style>
    </>
  );
}
