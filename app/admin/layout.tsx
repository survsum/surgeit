import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminSidebar from './AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') redirect('/admin-login');

  return (
    <div className="admin-page min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      <AdminSidebar />
      {/* On mobile, push content down past the fixed top bar (56px) */}
      <main className="flex-1 overflow-auto min-w-0 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
