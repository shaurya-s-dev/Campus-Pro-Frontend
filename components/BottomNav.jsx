import { useRouter } from 'next/router';

const TABS = [
  { id:'overview',   icon:'⊞', label:'Home' },
  { id:'attendance', icon:'◎', label:'Attend' },
  { id:'marks',      icon:'◈', label:'Marks' },
  { id:'timetable',  icon:'▤', label:'Schedule' },
  { id:'courses',    icon:'▣', label:'Courses' },
];

export default function BottomNav({ activeTab, onTabChange, below75 }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(t => (
        <button
          key={t.id}
          className={`bn-item ${activeTab === t.id ? 'bn-active' : ''}`}
          onClick={() => onTabChange(t.id)}
        >
          <span className="bn-icon">{t.icon}</span>
          {t.id === 'attendance' && below75 > 0 && (
            <span className="bn-badge">{below75}</span>
          )}
          <span className="bn-label">{t.label}</span>
        </button>
      ))}
      <style jsx>{`
        .bottom-nav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 64px;
          background: rgba(10,10,20,0.96);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255,255,255,0.08);
          z-index: 1000;
          padding: 0 4px;
          padding-bottom: env(safe-area-inset-bottom);
        }
        @media (max-width: 768px) {
          .bottom-nav { display: flex; align-items: center; justify-content: space-around; }
        }
        .bn-item {
          flex: 1; background: none; border: none;
          display: flex; flex-direction: column; align-items: center;
          gap: 3px; padding: 8px 4px; cursor: pointer;
          color: rgba(255,255,255,0.35); position: relative;
          transition: color 0.15s; min-width: 0;
        }
        .bn-active { color: #818cf8; }
        .bn-active .bn-icon {
          background: rgba(99,102,241,0.15);
          border-radius: 10px;
          box-shadow: 0 0 12px rgba(99,102,241,0.3);
        }
        .bn-icon {
          font-size: 18px; width: 36px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .bn-label { font-size: 10px; font-weight: 500; letter-spacing: 0.2px; }
        .bn-badge {
          position: absolute; top: 4px; right: calc(50% - 22px);
          background: #ef4444; color: #fff;
          font-size: 9px; font-weight: 700;
          width: 16px; height: 16px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
      `}</style>
    </nav>
  );
}
