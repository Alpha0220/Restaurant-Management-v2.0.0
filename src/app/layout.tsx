'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { usePathname } from 'next/navigation';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';

const inter = Inter({ subsets: ["latin"] });

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen bg-gray-100">
      {!isLoginPage && <Sidebar />}
      <main className={`flex-1 transition-all duration-300 ${!isLoginPage ? (isCollapsed ? 'md:ml-20' : 'md:ml-64') + ' pb-16 md:pb-0' : ''}`}>
        {children}
      </main>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <SidebarProvider>
          <LayoutContent>{children}</LayoutContent>
        </SidebarProvider>
      </body>
    </html>
  );
}
