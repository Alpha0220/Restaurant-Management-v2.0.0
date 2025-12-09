'use client';

import { getDashboardStats } from '@/app/actions';
import { useEffect, useState } from 'react';
import Loading from '@/components/Loading';
import {
  LayoutDashboard,
  Calendar,
  DollarSign,
  TrendingUp,
  Wallet,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  ChefHat
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>({
    totalSales: 0,
    totalCost: 0,
    grossProfit: 0,
    totalStockExpenditure: 0,
    netProfit: 0,
    itemSales: {},
    orders: []
  });
  const [filterType, setFilterType] = useState<'all' | 'day' | 'month' | 'year' | 'custom'>('month');
  const [dateValue, setDateValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set default date value
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
    setIsLoading(true);
    getDashboardStats(filterType, dateValue, startDate, endDate).then((data) => {
      setStats(data);
      setIsLoading(false);
    });
  }, [filterType, dateValue, startDate, endDate]);

  const FilterButton = ({ type, label }: { type: any, label: string }) => (
    <button
      onClick={() => setFilterType(type)}
      className={`flex-1 min-w-[80px] py-2 text-sm font-medium rounded-lg transition-colors ${filterType === type
        ? 'bg-blue-600 text-white shadow-sm'
        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8 relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center backdrop-blur-sm min-h-screen">
          <Loading />
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 space-y-6">

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500 text-sm">สรุปผลการดำเนินงานของร้าน</p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-3 text-sm font-medium text-gray-700">
            <Calendar className="w-4 h-4 mr-2 text-blue-500" />
            ตัวกรองวันที่
          </div>

          <div className="space-y-4">
            {/* Filter Buttons Scrollable on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {/* <FilterButton type="all" label="ทั้งหมด" /> */}
              <FilterButton type="day" label="รายวัน" />
              <FilterButton type="month" label="รายเดือน" />
              {/* <FilterButton type="year" label="รายปี" /> */}
              <FilterButton type="custom" label="กำหนดเอง" />
            </div>

            {/* Date Inputs */}
            {(filterType !== 'all') && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 animate-fade-in">
                {filterType !== 'custom' ? (
                  <input
                    type={filterType === 'day' ? 'date' : filterType === 'month' ? 'month' : 'number'}
                    value={dateValue}
                    onChange={(e) => setDateValue(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={filterType === 'year' ? 'Ex: 2024' : ''}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">วันที่เริ่มต้น</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">วันที่สิ้นสุด</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Sales */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign className="w-16 h-16 text-blue-600" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-blue-600 mb-1 flex items-center">
                ยอดขายรวม <ArrowUpRight className="w-3 h-3 ml-1" />
              </p>
              <h3 className="text-2xl font-bold text-gray-800">฿{stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
          </div>

          {/* Gross Profit */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-100 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-16 h-16 text-green-600" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-green-600 mb-1 flex items-center">
                กำไรขั้นต้น
              </p>
              <h3 className="text-2xl font-bold text-gray-800">฿{stats.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="text-xs text-green-500 mt-1">ยอดขาย - ต้นทุนสินค้า (COGS)</p>
            </div>
          </div>

          {/* COGS */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShoppingBag className="w-16 h-16 text-red-600" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-red-600 mb-1 flex items-center">
                ต้นทุนสินค้า (COGS)
              </p>
              <h3 className="text-2xl font-bold text-gray-800">฿{stats.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="text-xs text-red-400 mt-1">Cost of Goods Sold</p>
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl shadow-lg text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-20">
              <Wallet className="w-16 h-16 text-white" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-emerald-100 mb-1 flex items-center">
                กำไรสุทธิ (Cash Flow)
              </p>
              <h3 className="text-3xl font-bold">฿{stats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="text-xs text-emerald-100 mt-2 opacity-80">
                ยอดขาย - รายจ่ายซื้อของเข้าร้าน (฿{stats.totalStockExpenditure.toLocaleString()})
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <ChefHat className="w-5 h-5 mr-2 text-orange-500" />
                เมนูขายดี
              </h3>
            </div>
            <div className="p-0">
              {Object.keys(stats.itemSales).length === 0 ? (
                <div className="p-8 text-center text-gray-400">ไม่มีข้อมูลการขาย</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {Object.entries(stats.itemSales)
                    .sort(([, a]: [string, any], [, b]: [string, any]) => b.sales - a.sales) // Sort by sales value
                    .map(([name, data]: [string, any], index) => (
                      <div key={name} className="px-5 py-3 hover:bg-gray-50 flex items-center justify-between group transition-colors">
                        <div className="flex items-center space-x-3">
                          <span className={`
                          flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                          ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                              index === 1 ? 'bg-gray-100 text-gray-700' :
                                index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-transparent text-gray-400'}
                        `}>
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{name}</p>
                            <p className="text-xs text-gray-500">ขายแล้ว {data.quantity}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          ฿{data.sales.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <Package className="w-5 h-5 mr-2 text-blue-500" />
                ประวัติการขายล่าสุด
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-5 py-3 w-32">เวลา</th>
                    <th className="px-5 py-3">รายการ</th>
                    <th className="px-5 py-3 text-right">ยอดรวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.orders && stats.orders.length > 0 ? (
                    stats.orders.slice(0, 10).map((order: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                          <div className="font-medium text-gray-700">
                            {new Date(order.date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' })}
                          </div>
                          <div className="text-xs">
                            {new Date(order.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="text-gray-700 max-w-[150px] md:max-w-xs truncate">
                            {order.items.map((i: any) => `${i.name} (${i.quantity})`).join(', ')}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-gray-900">
                          ฿{order.totalPrice.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-400">ไม่มีคำสั่งซื้อล่าสุด</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {stats.orders && stats.orders.length > 10 && (
              <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                <span className="text-xs text-gray-500">แสดง 10 รายการล่าสุด</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
