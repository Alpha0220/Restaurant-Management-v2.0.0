'use client';

import { getDashboardStats } from '@/app/actions';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [filterType, setFilterType] = useState<'all' | 'day' | 'month' | 'year' | 'custom'>('month');
  const [dateValue, setDateValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Set default date value based on filter type
    const now = new Date();
    if (filterType === 'day') {
      setDateValue(now.toISOString().split('T')[0]);
    } else if (filterType === 'month') {
      setDateValue(now.toISOString().slice(0, 7));
    } else if (filterType === 'year') {
      setDateValue(now.getFullYear().toString());
    } else {
      setDateValue('');
    }
  }, [filterType]);

  useEffect(() => {
    getDashboardStats(filterType, dateValue, startDate, endDate).then(setStats);
  }, [filterType, dateValue, startDate, endDate]);

  if (!stats) return <div className="p-6 text-center">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="p-4 bg-gray-100 min-h-screen pb-20 md:pb-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">ภาพรวมร้านค้า</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setFilterType('day')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filterType === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            รายวัน
          </button>
          <button
            onClick={() => setFilterType('month')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filterType === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            รายเดือน
          </button>
          <button
            onClick={() => setFilterType('year')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filterType === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            รายปี
          </button>
          <button
            onClick={() => setFilterType('custom')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${filterType === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            กำหนดเอง
          </button>
        </div>

        {filterType !== 'all' && filterType !== 'custom' && (
          <input
            type={filterType === 'day' ? 'date' : filterType === 'month' ? 'month' : 'number'}
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className="border rounded-md px-3 py-2 w-full md:w-auto"
            placeholder={filterType === 'year' ? 'YYYY' : ''}
          />
        )}

        {filterType === 'custom' && (
          <div className="flex gap-2 items-center w-full md:w-auto">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded-md px-3 py-2 w-full md:w-auto"
            />
            <span>ถึง</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded-md px-3 py-2 w-full md:w-auto"
            />
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm font-medium uppercase">ยอดขายรวม</h3>
          <p className="text-3xl font-bold text-gray-800">฿{stats.totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <h3 className="text-gray-500 text-sm font-medium uppercase">ต้นทุนรวม</h3>
          <p className="text-3xl font-bold text-gray-800">฿{stats.totalCost.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-medium uppercase">กำไรสุทธิ</h3>
          <p className="text-3xl font-bold text-gray-800">฿{stats.profit.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Item Report */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800">ยอดขายแยกตามเมนู</h3>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อเมนู</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยอดขาย</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(stats.itemSales).map(([name, data]: [string, any]) => (
                  <tr key={name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">฿{data.sales.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales History */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800">ประวัติการขาย</h3>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รายการ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยอดรวม</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.orders && stats.orders.map((order: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.date).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {order.items.map((item: any) => `${item.name} x${item.quantity}`).join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ฿{order.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
