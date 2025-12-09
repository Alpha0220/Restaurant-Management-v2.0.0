
'use client';

import { useActionState, useEffect, useState, useTransition, useRef } from 'react';
import { addMultipleStockItems, getStockItems, getStockNames } from '@/app/actions';
import { Plus, Clock, User as UserIcon, Trash2, Save, X, ShoppingCart, ChevronRight } from 'lucide-react';

export default function StockPage() {
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [stockNames, setStockNames] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState('');

  // Form State
  const [nameInput, setNameInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Refs for focus management
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Pending Items for Bulk Add
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadStockIds();
    getStockNames().then(setStockNames);

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user.name || user.username || 'Unknown');
      } catch (e) {
        console.error('Error parsing user', e);
      }
    }
  }, []);

  const loadStockIds = async () => {
    const allItems = await getStockItems();
    const today = new Date().toISOString().split('T')[0];
    const todaysItems = allItems.filter((item: any) => {
      if (!item.date) return false;
      return item.date.startsWith(today);
    });
    setStockItems(todaysItems);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNameInput(value);
    if (value.length > 0) {
      const filtered = stockNames.filter(name =>
        name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (name: string) => {
    setNameInput(name);
    setSuggestions([]);
  };

  const addToPendingList = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!nameInput || !quantityInput || !priceInput) {
      setMessage({ text: 'กรุณากรอกข้อมูลให้ครบถ้วน', type: 'error' });
      return;
    }

    const newItem = {
      name: nameInput,
      quantity: Number(quantityInput),
      price: Number(priceInput),
      user: currentUser,
      tempId: Date.now(),
    };

    setPendingItems([...pendingItems, newItem]);

    // Reset form and focus name
    setNameInput('');
    setQuantityInput('');
    setPriceInput('');
    setMessage(null);
    nameInputRef.current?.focus();
  };

  const removeFromPending = (tempId: number) => {
    setPendingItems(pendingItems.filter(item => item.tempId !== tempId));
  };

  const handleSaveAll = () => {
    if (pendingItems.length === 0) return;

    startTransition(async () => {
      const itemsPayload = JSON.stringify(pendingItems.map(({ tempId, ...rest }) => rest));

      const formData = new FormData();
      formData.append('items', itemsPayload);

      const result = await addMultipleStockItems(null, formData);

      if (result?.success) {
        setMessage({ text: result.message, type: 'success' });
        setPendingItems([]);
        loadStockIds();
        getStockNames().then(setStockNames);
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ text: result?.message || 'เกิดข้อผิดพลาด', type: 'error' });
      }
    });
  };

  // Handle Enter key in Price input to add item
  const handlePriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addToPendingList();
    }
  };

  const totalPendingPrice = pendingItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="max-w-5xl mx-auto mt-6 p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">คลังวัตถุดิบ</h1>
          <p className="text-gray-500 text-sm">จัดการรายการสินค้าเข้าสต็อกวันนี้</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Quick Add & Pending List */}
        <div className="lg:col-span-2 space-y-6">

          {/* Quick Add Bar */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
              <Plus className="w-5 h-5 mr-2 text-blue-600" /> เพิ่มรายการใหม่
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5 relative">
                <label className="block text-xs font-medium text-gray-500 mb-1">ชื่อวัตถุดิบ</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={nameInput}
                  onChange={handleNameChange}
                  autoComplete="off"
                  className="w-full rounded-lg border-gray-300 text-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
                  placeholder="พิมพ์ชื่อ..."
                />
                {suggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-xl max-h-48 overflow-auto">
                    {suggestions.map((name, index) => (
                      <li key={index} onClick={() => selectSuggestion(name)} className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0">
                        {name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">ปริมาณ</label>
                <input
                  type="number"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  min="0.1"
                  step="0.1"
                  className="w-full rounded-lg border-gray-300 text-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
                  placeholder="0.0"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">ราคา</label>
                <input
                  type="number"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  onKeyDown={handlePriceKeyDown}
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border-gray-300 text-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
                  placeholder="0.00"
                />
              </div>
              <div className="md:col-span-1">
                <button
                  onClick={() => addToPendingList()}
                  className="w-full h-[42px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center shadow-sm"
                  title="กด Enter เพื่อเพิ่ม"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            {message && (
              <div className={`mt-3 p-2 rounded text-sm text-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}
          </div>

          {/* Pending List (Basket) */}
          {pendingItems.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-blue-200 overflow-hidden animate-fade-in relative">
              <div className="bg-blue-50 px-6 py-3 border-b border-blue-100 flex justify-between items-center">
                <div className="flex items-center text-blue-800 font-semibold">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  รายการที่รอการบันทึก <span className="ml-2 bg-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded-full">{pendingItems.length}</span>
                </div>
                <div className="text-sm font-medium text-blue-800">
                  รวม: <span className="text-lg">฿{totalPendingPrice.toLocaleString()}</span>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">ชื่อ</th>
                      <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">ปริมาณ</th>
                      <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">ราคา</th>
                      <th className="px-6 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {pendingItems.map((item) => (
                      <tr key={item.tempId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{item.quantity}</td>
                        <td className="px-6 py-3 text-sm text-gray-900 font-medium">฿{item.price.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right">
                          <button onClick={() => removeFromPending(item.tempId)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <X className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={handleSaveAll}
                  disabled={isPending}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 transition-all transform active:scale-[0.99]"
                >
                  {isPending ? (
                    <span className="flex items-center"><Clock className="w-4 h-4 mr-2 animate-spin" /> กำลังบันทึก...</span>
                  ) : (
                    <span className="flex items-center"><Save className="w-4 h-4 mr-2" /> ยืนยันการบันทึกทั้งหมด</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full max-h-[calc(100vh-100px)] flex flex-col">
            <div className="px-5 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-gray-500" /> ประวัติวันนี้
              </h3>
              <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{stockItems.length}</span>
            </div>
            <div className="overflow-y-auto flex-1 p-0">
              {stockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400 bg-gray-50/50 m-4 rounded-lg border-2 border-dashed border-gray-200">
                  <Clock className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm">ยังไม่มีรายการ</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {stockItems.map((item, index) => (
                    <div key={index} className="px-5 py-3 hover:bg-gray-50 transition-colors group">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">{item.name}</h4>
                        <span className="text-sm font-bold text-green-600">฿{item.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="text-xs text-gray-500">
                          ปริมาณ: {item.quantity}
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center">
                          {new Date(item.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          <span className="mx-1">•</span>
                          {item.user}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
