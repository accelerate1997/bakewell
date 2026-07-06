import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f0f2e8] print:bg-white">
      <AdminSidebar className="hidden md:flex fixed left-0 top-0 print:hidden" />
      <div className="md:pl-[240px] print:pl-0">
        <AdminTopBar className="print:hidden" />
        <main className="pt-24 px-4 md:px-8 pb-8 min-h-screen print:pt-0 print:px-0 print:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
