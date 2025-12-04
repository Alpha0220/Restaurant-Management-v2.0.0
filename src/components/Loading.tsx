export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <div className="relative">
        <div className="w-12 h-12 rounded-full absolute border-4 border-gray-200"></div>
        <div className="w-12 h-12 rounded-full animate-spin absolute border-4 border-blue-600 border-t-transparent"></div>
      </div>
      <p className="mt-16 text-gray-500 font-medium animate-pulse">กำลังโหลดข้อมูล...</p>
    </div>
  );
}
