import { useState } from 'react';

const FAQ_DATA = [
  {
    category: 'Getting Started',
    items: [
      { q: 'How do I login to CampusPro?', a: 'Use your SRM Academia email and password. Your credentials are used only to authenticate with SRM servers via a secure proxy.' },
      { q: 'Why does login fail sometimes?', a: 'SRM allows only 2 active sessions. If you are logged in on the official portal or another app, logout there first. Also, ensure you are using the correct credentials.' },
      { q: 'Is my password stored?', a: 'Never. Your credentials go directly to SRM Academia servers. We only store a session token locally in your browser to keep you logged in.' }
    ]
  },
  {
    category: 'attendance',
    items: [
      { q: 'Why is my attendance different from what SRM shows?', a: 'CampusPro fetches data directly from SRM Academia — it should match exactly. If there is a small difference, try logging out and back in to refresh your data. Data is cached for performance.' },
      { q: 'What does the Margin number mean?', a: 'Margin shows how many more classes you can skip while staying above 75%. A positive margin means you are safe. A negative number (deficit) means you need to attend that many classes to reach 75%.' },
      { q: 'How is attendance calculated?', a: 'Data is directly fetched from SRM Academia. It is the exact same data shown on the official portal, just presented in a more readable format.' },
      { q: 'What does "Margin" mean on attendance cards?', a: 'Margin is the number of classes you can miss while still maintaining at least a 75% attendance record. A negative margin means you have a deficit.' },
      { q: 'How accurate is Attendance Planner?', a: 'It is an estimate based on your current attendance and the remaining days in the academic calendar. Please use it as a rough guide only.' }
    ]
  },
  {
    category: 'marks',
    items: [
      { q: 'Why do some subjects show "No marks yet"?', a: 'Your faculty has not uploaded marks for that subject yet on SRM Academia. This will update automatically once they do.' },
      { q: 'Why are some subjects excluded from my average?', a: 'Zero-credit courses and subjects with no marks data are excluded from your average percentage to give a more accurate picture of your academic performance.' },
      { q: 'How does the GPA calculator work?', a: 'It uses SRM\'s official grading scale (O=10, A+=9, A=8, B+=7, B=6, C=5, P=4, F=0) to calculate your weighted average.' }
    ]
  },
  {
    category: 'technical',
    items: [
      { q: 'Why does login sometimes ask for a CAPTCHA?', a: 'SRM Academia triggers a CAPTCHA challenge after multiple login attempts in a short period. This is Zoho\'s bot protection. Simply solve the CAPTCHA shown and you will be logged in normally.' },
      { q: 'My data looks outdated — how do I refresh it?', a: 'Sign out and sign back in. This forces a fresh fetch from SRM Academia. Data is cached per session for speed.' },
      { q: 'Data seems outdated', a: 'Data is fetched fresh every time you login. If you suspect data is stale, try logging out and logging back in to trigger a refresh.' },
      { q: 'App shows wrong day order', a: 'Day orders follow the official SRM academic calendar for the Even Semester 2025-26. If the administration changes the calendar, the app will be updated accordingly.' }
    ]
  },
  {
    category: 'gpa',
    items: [
      { q: 'How does the GPA calculator work?', a: 'Click "Import My Courses" to load your subjects automatically. Then select your expected or actual grade for each subject. The SGPA is calculated using SRM\'s official formula: Sum(Grade Points × Credits) / Total Credits.' },
      { q: 'Why are some courses not imported into GPA calculator?', a: 'Zero-credit courses are excluded because they do not count toward your GPA. This matches SRM\'s official calculation method.' }
    ]
  }
];

export default function HelpCenterContent() {
  const [openIndex, setOpenIndex] = useState('0-0');

  const toggleFAQ = (id) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <div className="help-center-wrap">
      <header className="header animate-up">
        <h1 className="title">Help Center</h1>
        <p className="subtitle">Find answers to common questions or get support</p>
        <p className="section-helper">
          Everything you need to know about using CampusPro. From attendance calculation logic 
          to technical troubleshooting, find your answers here.
        </p>
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
          {FAQ_DATA.map((group, gi) => (
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

      <style jsx>{`
        .help-center-wrap { padding: 0px 20px 40px; max-width: 1000px; margin: 0 auto; width: 100%; }
        .header { margin-bottom: 30px; }
        .title { font-family: var(--font-display); font-size: 32px; font-weight: 800; color: var(--text-1); letter-spacing: -1px; }
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
        .faq-item.open .faq-a { max-height: 250px; }
        .faq-a-inner { padding: 4px 4px 24px; color: var(--text-3); font-size: 14px; line-height: 1.6; }

        .section-helper { font-size: 12.5px; color: var(--text-3); margin-top: 4px; margin-bottom: 16px; line-height: 1.6; max-width: 600px; }

        @media (max-width: 860px) {
          .categories-grid { grid-template-columns: repeat(2, 1fr); }
          .title { font-size: 28px; }
        }
      `}</style>
    </div>
  );
}
