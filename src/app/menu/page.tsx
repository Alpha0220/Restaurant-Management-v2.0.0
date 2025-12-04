'use client';

import { useActionState } from 'react';
import { addMenuItem, getStockItems, getMenuItems, deleteMenuItem } from '@/app/actions';
import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

const initialState = {
  message: '',
  errors: {},
};

export default function MenuPage() {
  // @ts-ignore
  const [state, dispatch] = useActionState(addMenuItem, initialState);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<{ name: string, qty: number }[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    getStockItems().then(setStockItems);
    loadMenu();
  }, [state]); // Reload menu when state changes (after add)

  const loadMenu = () => {
    getMenuItems().then(setMenuItems);
  };

  const handleDelete = async (name: string) => {
    if (confirm(`คุณต้องการลบเมนู "${name}" ใช่หรือไม่?`)) {
      await deleteMenuItem(name);
      loadMenu();
    }
  };

  const addIngredient = () => {
    setSelectedIngredients([...selectedIngredients, { name: '', qty: 0 }]);
  };

  const updateIngredient = (index: number, field: 'name' | 'qty', value: string | number) => {
    const newIngredients = [...selectedIngredients];
    // @ts-ignore
    newIngredients[index][field] = value;
    setSelectedIngredients(newIngredients);
  };

  const removeIngredient = (index: number) => {
    const newIngredients = selectedIngredients.filter((_, i) => i !== index);
    setSelectedIngredients(newIngredients);
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">จัดการเมนู</h1>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-1" />
          {isFormOpen ? 'ปิดฟอร์ม' : 'เพิ่มเมนู'}
        </button>
      </div>

      {/* Add Menu Form */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 animate-fade-in">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">เพิ่มเมนูใหม่</h2>
          <form action={dispatch} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">ชื่อเมนู</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                placeholder="เช่น ข้าวกะเพราไก่"
              />
              {state?.errors?.name && <p className="text-red-500 text-xs mt-1">{state.errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">วัตถุดิบที่ใช้</label>
              {selectedIngredients.map((ing, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={ing.name}
                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    required
                  >
                    <option value="">เลือกวัตถุดิบ</option>
                    {stockItems.map((item) => (
                      <option key={item.name} value={item.name}>{item.name} (คงเหลือ: {item.quantity})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="ปริมาณ (กรัม)"
                    value={ing.qty}
                    onChange={(e) => updateIngredient(index, 'qty', Number(e.target.value))}
                    className="w-28 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    required
                    min="1"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addIngredient}
                className="text-sm text-blue-600 hover:text-blue-800 mt-1"
              >
                + เพิ่มวัตถุดิบ
              </button>
              <input type="hidden" name="ingredients" value={JSON.stringify(selectedIngredients)} />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">ราคาขาย</label>
              <input
                type="number"
                id="price"
                name="price"
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                placeholder="0.00"
              />
              {state?.errors?.price && <p className="text-red-500 text-xs mt-1">{state.errors.price}</p>}
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              บันทึกเมนู
            </button>

            {state?.message && (
              <p className={`text-center text-sm mt-4 ${state.message.includes('ผิดพลาด') || state.message.includes('ไม่ครบ') ? 'text-red-600' : 'text-green-600'}`}>
                {state.message}
              </p>
            )}
          </form>
        </div>
      )}

      {/* Menu List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">รายการเมนูทั้งหมด</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {menuItems.length === 0 ? (
            <p className="p-6 text-center text-gray-500">ยังไม่มีเมนู</p>
          ) : (
            menuItems.map((item, index) => (
              <div key={`${item.name}-${index}`} className="p-4 flex justify-between items-center hover:bg-gray-50">
                <div>
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-500">฿{item.price}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    วัตถุดิบ: {item.ingredients.map((ing: any) => `${ing.name} (${ing.qty}g)`).join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(item.name)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="ลบเมนู"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
