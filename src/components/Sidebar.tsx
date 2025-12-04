'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Utensils, Package } from 'lucide-react';

const navItems = [
  { name: 'ภาพรวม', href: '/dashboard', icon: LayoutDashboard },
  { name: 'ขายหน้าร้าน', href: '/pos', icon: ShoppingCart },
  { name: 'จัดการเมนู', href: '/menu', icon: Utensils },
  { name: 'คลังวัตถุดิบ', href: '/stock', icon: Package },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-gray-900 text-white min-h-screen">
        <div className="flex items-center justify-center h-20 border-b border-gray-800">
          <h1 className="text-2xl font-bold">ร้านอาหาร</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 text-center">&copy; 2024 ระบบจัดการร้าน</p>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50 shadow-lg pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
