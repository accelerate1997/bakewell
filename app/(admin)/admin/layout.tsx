import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f0f2e8]">
      <AdminSidebar className="hidden md:flex fixed left-0 top-0" />
      <div className="md:pl-[240px]">
        <AdminTopBar />
        <main className="pt-24 px-4 md:px-8 pb-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
