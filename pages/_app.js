import '@/styles/globals.css';
import Head from 'next/head';
import { ThemeProvider } from '@/context/ThemeContext';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { useState, useEffect } from 'react';

export default function App({ Component, pageProps }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.log('SW error:', err));
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Only show if not dismissed before
      const dismissed = localStorage.getItem('install_dismissed');
      if (!dismissed) setShowInstallBanner(true);
    });
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowInstallBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem('install_dismissed', 'true');
  };

  return (
    <ThemeProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#6366f1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      
      <Component {...pageProps} />
      
      {showInstallBanner && (
        <div className="install-banner animate-up">
          <div className="ib-left">
            <div className="ib-icon">
              <img src="/icons/icon-72.png" alt="CampusPro" />
            </div>
            <div className="ib-text">
              <div className="ib-title">Install CampusPro</div>
              <div className="ib-sub">Add to home screen for the best experience</div>
            </div>
          </div>
          <div className="ib-actions">
            <button className="ib-install-btn" onClick={handleInstall}>
              Install
            </button>
            <button className="ib-dismiss" onClick={handleDismiss}>✕</button>
          </div>
        </div>
      )}

      <SpeedInsights />
      <Analytics />
    </ThemeProvider>
  );
}