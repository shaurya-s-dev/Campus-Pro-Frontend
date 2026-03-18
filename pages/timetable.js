import Head from 'next/head';
import TimetableView from '@/components/TimetableView';

export default function TimetablePage() {
  return (
    <>
      <Head><title>Timetable — CampusPro</title></Head>
      <div style={{
        minHeight:'100vh',
        background:'#04040b',
        padding:'40px 24px',
        maxWidth:900,
        margin:'0 auto',
      }}>
        <TimetableView timetableData={null} />
      </div>
    </>
  );
}