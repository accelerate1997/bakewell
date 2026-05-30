'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Boxes, 
  Users, 
  Tag, 
  Image as ImageIcon, 
  Settings,
  LogOut,
  FolderTree,
  Truck,
  UserCog,
  Star,
  BarChart3,
  Calendar,
  Inbox
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { playfair } from '@/lib/fonts';

const navLinks = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: Calendar },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/bulk-enquiries', label: 'Bulk Enquiries', icon: Inbox },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/users', label: 'Users', icon: UserCog },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { href: '/admin/pincodes', label: 'Pincodes', icon: Truck },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';

  // Filter links: only show Users and Settings to ADMINs
  const allowedLinks = navLinks.filter(link => {
    if (link.href === '/admin/users' || link.href === '/admin/settings') {
      return isAdmin;
    }
    return true;
  });

  return (
    <div className={cn("w-full md:w-[240px] h-screen bg-[#1a2c1a] text-white flex flex-col z-50", className)}>
      <div className="p-6">
        <h1 className={cn(playfair.className, "text-xl font-black text-white")}>
          THE DAILY BAKE™
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-[#4d7a3e] font-bold mt-1">
          Admin Panel
        </p>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {allowedLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-sm transition-all group",
                isActive 
                  ? "bg-[rgba(200,135,42,0.15)] border-l-[3px] border-[#c8872a] text-[#c8872a]" 
                  : "hover:bg-[rgba(255,255,255,0.05)] text-white/70 hover:text-white"
              )}
            >
              <Icon size={20} />
              <span className="text-sm font-bold uppercase tracking-wider">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#3d5a2e] flex items-center justify-center font-bold text-xs uppercase text-white">
            {user?.name ? user.name.slice(0, 2) : 'AD'}
          </div>
          <div className="flex flex-col max-w-[120px]">
            <span className="text-xs font-bold truncate text-white">{user?.name || 'Admin User'}</span>
            <span className="text-[10px] text-white/50 truncate">{user?.email || user?.phone || 'admin@dailybake.com'}</span>
          </div>
        </div>
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
