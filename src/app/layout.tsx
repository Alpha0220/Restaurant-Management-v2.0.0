'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="th">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-gray-100">
          {!isLoginPage && <Sidebar />}
          <main className={`flex-1 ${!isLoginPage ? 'md:ml-64 pb-16 md:pb-0' : ''}`}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
