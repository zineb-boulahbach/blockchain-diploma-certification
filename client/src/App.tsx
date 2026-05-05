import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminShell } from './admin/AdminShell';
import { AdminEmitPage } from './admin/AdminEmitPage';
import { AdminGestionPage } from './admin/AdminGestionPage';
import { AdminIndexPage } from './admin/AdminIndexPage';
import { Layout } from './components/Layout';
import { Web3Provider } from './context/Web3Context';
import { HomePage } from './pages/HomePage';
import { StudentPage } from './pages/StudentPage';
import { VerifyPage } from './pages/VerifyPage';
import { DiplomaDetailPage } from './pages/DiplomaDetailPage';
import { GuidePage } from './pages/GuidePage';

export default function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<AdminShell />}>
            <Route index element={<AdminIndexPage />} />
            <Route path="emit" element={<AdminEmitPage />} />
            <Route path="gestion" element={<AdminGestionPage />} />
          </Route>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/student" element={<StudentPage />} />
            <Route path="/diploma/:hash" element={<DiplomaDetailPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Web3Provider>
  );
}
