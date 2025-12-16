'use client';

import { getDashboardStats } from '@/app/actions';
import { useEffect, useState, useCallback } from 'react';
import Loading from '@/components/Loading';
import {
  LayoutDashboard,
  Calendar,
  // DollarSign,
  // TrendingUp,
  // Wallet,
  Package,
  ArrowUpRight,
  // ShoppingBag,
  ChefHat
} from 'lucide-react';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  date: string;
  items: OrderItem[];
  totalPrice: number;
  totalCost: number;
}

interface ItemSaleData {
  quantity: number;
  sales: number;
}

interface DashboardStats {
  totalSales: number;
  totalCost: number;
  grossProfit: number;
  totalStockExpenditure: number;
  netProfit: number;
  itemSales: Record<string, ItemSaleData>;
  orders: Order[];
}

type FilterType = 'all' | 'day' | 'month' | 'year' | 'custom';

interface FilterButtonProps {
  type: FilterType;
  label: string;
  activeType: FilterType;
  onClick: (type: FilterType) => void;
}

const FilterButton = ({ type, label, activeType, onClick }: FilterButtonProps) => (
  <button
    onClick={() => onClick(type)}
    className={`flex-1 min-w-[70px] py-1.5 px-3 text-xs md:text-sm font-medium rounded-md transition-colors ${activeType === type
      ? 'bg-blue-600 text-white shadow-sm'
      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
      }`}
  >
    {label}
  </button>
);

type ViewType = 'sales' | 'topItems';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalCost: 0,
    grossProfit: 0,
    totalStockExpenditure: 0,
    netProfit: 0,
    itemSales: {},
    orders: []
  });
  const [filterType, setFilterType] = useState<FilterType>('month');
  const [dateValue, setDateValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState<ViewType>('sales');

  const handleFilterChange = useCallback((newType: FilterType) => {
    setFilterType(newType);
    const now = new Date();
    if (newType === 'day') {
      setDateValue(now.toISOString().split('T')[0]);
    } else if (newType === 'month') {
      setDateValue(now.toISOString().slice(0, 7));
    } else if (newType === 'year') {
      setDateValue(now.getFullYear().toString());
    } else {
      setDateValue('');
    }
  }, []);

  // Initialize date on mount
  useEffect(() => {
    const now = new Date();
    // Default is 'month'
    // eslint-disable-next-line
    setDateValue(now.toISOString().slice(0, 7));
  }, []);

  useEffect(() => {
    let mounted = true;
    // eslint-disable-next-line
    setIsLoading(true);
    getDashboardStats(filterType, dateValue, startDate, endDate).then((data) => {
      if (mounted) {
        // Explicitly cast to unknown then to DashboardStats because getDashboardStats returns 'any' or an inferred object structure
        // that matches, but to be safe and clear:
        setStats(data as unknown as DashboardStats);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [filterType, dateValue, startDate, endDate]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8 relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center backdrop-blur-sm min-h-screen">
          <Loading />
        </div>
      )}

      <div className="max-w-7xl mx-auto p-3 md:p-4 space-y-4 md:space-y-6">

        {/* Header */}
        <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
          <div className="p-2 md:p-3 bg-blue-600 rounded-lg md:rounded-xl shadow-lg shadow-blue-200">
            <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500 text-xs md:text-sm">สรุปผลการดำเนินงานของร้าน</p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white p-2.5 md:p-3 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center mb-2 text-xs font-medium text-gray-600">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
            ตัวกรองวันที่
          </div>

          <div className="space-y-2.5">
            {/* Filter Buttons Scrollable on mobile */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
              {/* <FilterButton type="all" label="ทั้งหมด" activeType={filterType} onClick={handleFilterChange} /> */}
              <FilterButton type="day" label="รายวัน" activeType={filterType} onClick={handleFilterChange} />
              <FilterButton type="month" label="รายเดือน" activeType={filterType} onClick={handleFilterChange} />
              {/* <FilterButton type="year" label="รายปี" activeType={filterType} onClick={handleFilterChange} /> */}
              <FilterButton type="custom" label="กำหนดเอง" activeType={filterType} onClick={handleFilterChange} />
            </div>

            {/* Date Inputs */}
            {(filterType !== 'all') && (
              <div className="bg-gray-50 p-2 rounded-md border border-gray-200 animate-fade-in">
                {filterType !== 'custom' ? (
                  <input
                    type={filterType === 'day' ? 'date' : filterType === 'month' ? 'month' : 'number'}
                    value={dateValue}
                    onChange={(e) => setDateValue(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-800 text-xs md:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={filterType === 'year' ? 'Ex: 2024' : ''}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] md:text-xs text-gray-500 mb-0.5 block">วันที่เริ่มต้น</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-800 text-xs md:text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] md:text-xs text-gray-500 mb-0.5 block">วันที่สิ้นสุด</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-800 text-xs md:text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Total Sales */}
          <div className="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-2 md:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              {/* <DollarSign className="w-12 h-12 md:w-16 md:h-16 text-blue-600" /> */}
            </div>
            <div className="relative z-10">
              <p className="text-xs md:text-sm font-medium text-blue-600 mb-1 flex items-center">
               ยอดขายรวม <ArrowUpRight className="w-2 h-2 md:w-3 md:h-3 ml-1" /> 
              </p>
              <h3 className="text-lg md:text-2xl font-bold text-gray-800">฿{stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
          </div>

          {/* Gross Profit */}
          <div className="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl shadow-sm border border-green-100 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-2 md:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              {/* <TrendingUp className="w-12 h-12 md:w-16 md:h-16 text-green-600" /> */}
            </div>
            <div className="relative z-10">
              <p className="text-xs md:text-sm font-medium text-green-600 mb-1 flex items-center">
                กำไรขั้นต้น
              </p>
              <h3 className="text-lg md:text-2xl font-bold text-gray-800">฿{stats.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="text-[10px] md:text-xs text-green-500 mt-1 hidden sm:block">ยอดขาย - ต้นทุนสินค้า (COGS)</p>
            </div>
          </div>

          {/* COGS */}
          <div className="bg-white p-3 md:p-5 rounded-xl md:rounded-2xl shadow-sm border border-red-100 relative overflow-hidden group">
            {/* <div className="absolute right-0 top-0 p-2 md:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShoppingBag className="w-12 h-12 md:w-16 md:h-16 text-red-600" />
            </div> */}
            <div className="relative z-10">
              <p className="text-xs md:text-sm font-medium text-red-600 mb-1 flex items-center">
                ต้นทุนสินค้า
              </p>
              <h3 className="text-lg md:text-2xl font-bold text-gray-800">฿{stats.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="text-[10px] md:text-xs text-red-400 mt-1 hidden sm:block">Cost of Goods Sold</p>
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-linear-to-br from-emerald-500 to-teal-600 p-3 md:p-5 rounded-xl md:rounded-2xl shadow-lg text-white relative overflow-hidden col-span-2 lg:col-span-1">
            {/* <div className="absolute right-0 top-0 p-2 md:p-4 opacity-20">
              <Wallet className="w-12 h-12 md:w-16 md:h-16 text-white" />
            </div> */}
            <div className="relative z-10">
              <p className="text-xs md:text-sm font-medium text-emerald-100 mb-1 flex items-center">
                กำไรสุทธิ
              </p>
              <h3 className="text-xl md:text-3xl font-bold">฿{stats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="text-[10px] md:text-xs text-emerald-100 mt-2 opacity-80">
                ยอดขาย - รายจ่ายซื้อของเข้าร้าน (฿{stats.totalStockExpenditure.toLocaleString()})
              </p>
            </div>
          </div>
        </div>

        {/* View Type Filter Buttons */}
        <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex gap-2 md:gap-3">
            <button
              onClick={() => setViewType('sales')}
              className={`flex-1 py-2.5 md:py-3 px-2 md:px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base ${
                viewType === 'sales'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Package className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">ประวัติการขายล่าสุด</span>
              <span className="sm:hidden">ประวัติการขาย</span>
            </button>
            <button
              onClick={() => setViewType('topItems')}
              className={`flex-1 py-2.5 md:py-3 px-2 md:px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base ${
                viewType === 'topItems'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ChefHat className="w-4 h-4 md:w-5 md:h-5" />
              เมนูทั้งหมด
            </button>
          </div>
        </div>

        {/* Report Table/Cards */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {viewType === 'sales' ? (
            <>
              {/* Desktop: Sales History Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700 font-semibold">
                    <tr>
                      <th className="px-4 py-3 text-left whitespace-nowrap">วันที่</th>
                      <th className="px-4 py-3 text-left">รายการอาหาร</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">ยอดขาย</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">ต้นทุน</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">กำไร</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.orders && stats.orders.length > 0 ? (
                      stats.orders.map((order, idx) => {
                        const profit = order.totalPrice - order.totalCost;
                        return (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                              <div className="font-medium text-gray-800">
                                {new Date(order.date).toLocaleDateString('th-TH', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  year: 'numeric' 
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(order.date).toLocaleTimeString('th-TH', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                {order.items.map((item, i) => (
                                  <div key={i} className="text-gray-700">
                                    {item.name} <span className="text-gray-500">x{item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              ฿{order.totalPrice.toLocaleString(undefined, { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </td>
                            <td className="px-4 py-3 text-right text-red-600 font-medium">
                              ฿{order.totalCost.toLocaleString(undefined, { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-green-600">
                              ฿{profit.toLocaleString(undefined, { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400">
                          ไม่มีข้อมูลการขาย
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile: Sales History Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {stats.orders && stats.orders.length > 0 ? (
                  stats.orders.map((order, idx) => {
                    const profit = order.totalPrice - order.totalCost;
                    return (
                      <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                        {/* Date & Time */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <Calendar className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800 text-sm">
                                {new Date(order.date).toLocaleDateString('th-TH', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  year: 'numeric' 
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(order.date).toLocaleTimeString('th-TH', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">รายการอาหาร</div>
                          <div className="space-y-1">
                            {order.items.map((item, i) => (
                              <div key={i} className="text-sm text-gray-700 font-medium">
                                {item.name} <span className="text-gray-500">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <div className="text-xs text-gray-600 mb-1">ยอดขาย</div>
                            <div className="text-sm font-bold text-gray-900">
                              ฿{order.totalPrice.toLocaleString(undefined, { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </div>
                          </div>
                          <div className="text-center p-2 bg-red-50 rounded-lg">
                            <div className="text-xs text-gray-600 mb-1">ต้นทุน</div>
                            <div className="text-sm font-bold text-red-600">
                              ฿{order.totalCost.toLocaleString(undefined, { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded-lg">
                            <div className="text-xs text-gray-600 mb-1">กำไร</div>
                            <div className="text-sm font-bold text-green-600">
                              ฿{profit.toLocaleString(undefined, { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    ไม่มีข้อมูลการขาย
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Desktop: All Menu Items Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700 font-semibold">
                    <tr>
                      <th className="px-4 py-3 text-left">อันดับ</th>
                      <th className="px-4 py-3 text-left">เมนู</th>
                      <th className="px-4 py-3 text-right">จำนวนที่ขาย</th>
                      <th className="px-4 py-3 text-right">ยอดขาย</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.keys(stats.itemSales).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-400">
                          ไม่มีข้อมูลการขาย
                        </td>
                      </tr>
                    ) : (
                      Object.entries(stats.itemSales)
                        .sort(([, a], [, b]) => b.sales - a.sales)
                        .map(([name, data], index) => (
                          <tr key={name} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <span className={`
                                inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                                ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                  index === 1 ? 'bg-gray-200 text-gray-700' :
                                  index === 2 ? 'bg-orange-100 text-orange-700' : 
                                  'bg-gray-100 text-gray-500'}
                              `}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-800">{name}</td>
                            <td className="px-4 py-3 text-right text-gray-700">
                              {data.quantity} <span className="text-gray-500 text-xs">ชิ้น</span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                              ฿{data.sales.toLocaleString(undefined, { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile: All Menu Items Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {Object.keys(stats.itemSales).length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    ไม่มีข้อมูลการขาย
                  </div>
                ) : (
                  Object.entries(stats.itemSales)
                    .sort(([, a], [, b]) => b.sales - a.sales)
                    .map(([name, data], index) => (
                      <div key={name} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {/* Rank Badge */}
                            <span className={`
                              shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-base font-bold
                              ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                index === 1 ? 'bg-gray-200 text-gray-700' :
                                index === 2 ? 'bg-orange-100 text-orange-700' : 
                                'bg-gray-100 text-gray-500'}
                            `}>
                              {index + 1}
                            </span>
                            
                            {/* Menu Info */}
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800 mb-1">{name}</div>
                              <div className="text-sm text-gray-600">
                                ขายไปแล้ว <span className="font-medium text-gray-800">{data.quantity}</span> ชิ้น
                              </div>
                            </div>
                          </div>

                          {/* Sales Amount */}
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              ฿{data.sales.toLocaleString(undefined, { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
