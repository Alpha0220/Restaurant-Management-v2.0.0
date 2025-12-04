import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Restaurant Management",
  description: "Manage your restaurant stock, menu, and orders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-gray-100 pb-16 md:pb-0">
          <Sidebar />
          <main className="flex-1 overflow-auto w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
