import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // สำหรับ Next.js 16.0.7 ใช้ experimental.serverActions
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // เพิ่มขนาด limit เป็น 10 MB สำหรับการอัปโหลดไฟล์
    },
  },
};

export default nextConfig;
