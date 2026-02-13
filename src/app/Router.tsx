import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { AppContent } from '@/app/App';
import { SpecialistLandingPage } from '@/app/components/SpecialistLandingPage';

function SpecialistPageWrapper() {
  const { slug } = useParams<{ slug: string }>();
  return slug ? <SpecialistLandingPage slug={slug} /> : <div>Loading...</div>;
}

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/specialist/:slug" element={<SpecialistPageWrapper />} />
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  );
}
