import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { StudentWireHeader } from './StudentWireHeader';

export function Layout() {
  const { pathname } = useLocation();
  const isStudentArea = pathname.startsWith('/student') || pathname.startsWith('/diploma');

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {isStudentArea ? <StudentWireHeader /> : <Navbar />}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8">
        <div key={pathname} className="animate-page-transition flex flex-1 flex-col">
          <Outlet />
        </div>
      </main>
      {isStudentArea ? null : <Footer />}
    </div>
  );
}
