import Head from 'next/head';
import TimetableView from '@/components/TimetableView';
import dynamic from 'next/dynamic';
const AuroraBackground = dynamic(() => import('@/components/AuroraBackground'), { ssr: false });

export default function TimetablePage() {
  return (
    <>
      <Head><title>Timetable — CampusPro</title></Head>
      <AuroraBackground />
      <div style={{
        minHeight:'100vh',
        position: 'relative',
        zIndex: 1,
        padding:'40px 24px',
        maxWidth:900,
        margin:'0 auto',
      }}>
        <TimetableView timetableData={null} />
      </div>
    </>
  );
}