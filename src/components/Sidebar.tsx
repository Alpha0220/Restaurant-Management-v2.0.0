'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, UtensilsCrossed, Package, Store, LogOut } from 'lucide-react';
import { logout } from '@/app/actions';

const navItems = [
  { href: '/dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
  { href: '/menu', label: 'จัดการเมนู', icon: UtensilsCrossed },
  { href: '/stock', label: 'คลังวัตถุดิบ', icon: Package },
  { href: '/pos', label: 'ขายหน้าร้าน', icon: Store },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-gray-900 text-white h-screen fixed left-0 top-0">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">Restaurant App</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-gray-800 w-full transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">ออกจากระบบ</span>
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <nav className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}
              >
                <Icon size={24} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
          <form action={logout} className="w-full h-full">
            <button
              type="submit"
              className="flex flex-col items-center justify-center w-full h-full space-y-1 text-red-500"
            >
              <LogOut size={24} />
              <span className="text-xs font-medium">ออก</span>
            </button>
          </form>
        </nav>
      </div>
    </>
  );
}
