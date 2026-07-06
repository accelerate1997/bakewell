'use client';

import { usePathname } from 'next/navigation';
import { Search, Bell, User, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { AdminSidebar } from './AdminSidebar';

export function AdminTopBar() {
  const pathname = usePathname();
  
  // Convert /admin/products to "Products"
  const getPageTitle = () => {
    if (pathname === '/admin') return 'Overview';
    const parts = pathname.split('/');
    const lastPart = parts[parts.length - 1];
    if (!lastPart) return 'Overview';
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  };

  return (
    <div className="h-16 bg-white border-b border-[#d4d9b8] fixed top-0 left-0 md:left-[240px] right-0 flex items-center justify-between px-4 md:px-8 z-40 print:hidden">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger render={
            <Button variant="ghost" size="icon" className="md:hidden text-[#1a2c1a]">
              <Menu size={20} />
            </Button>
          } />
          <SheetContent side="left" className="p-0 w-[240px] border-none">
            <AdminSidebar className="relative w-full" />
          </SheetContent>
        </Sheet>
        
        <h2 className="text-sm md:text-xl font-black uppercase tracking-tight text-[#1a2c1a]">
          {getPageTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <div className="relative w-40 md:w-64 hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a7a]" size={16} />
          <Input 
            placeholder="Search..." 
            className="pl-10 h-9 border-[#d4d9b8] rounded-[4px] focus-visible:ring-[#3d5a2e]"
          />
        </div>

        <div className="relative">
          <Button variant="ghost" size="icon" className="text-[#1a2c1a] h-8 w-8 md:h-10 md:w-10">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-2 h-2 bg-[#c8872a] rounded-full border-2 border-white"></span>
          </Button>
        </div>

        <div className="flex items-center gap-3 pl-2">
          <div className="w-8 h-8 rounded-full bg-[#f0f2e8] flex items-center justify-center text-[#3d5a2e]">
            <User size={18} />
          </div>
          <span className="hidden lg:block text-xs font-black text-[#1a2c1a] uppercase tracking-tight">Admin</span>
        </div>
      </div>
    </div>
  );
}
