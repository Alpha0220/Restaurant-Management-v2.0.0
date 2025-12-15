'use client';

import { useActionState, useEffect, useState } from 'react';
import { saveMenuItem, getStockItems, getMenuItems, deleteMenuItem } from '@/app/actions';
import { Trash2, Plus, Pencil, X, Utensils, Search, ChefHat } from 'lucide-react';

interface Ingredient {
  name: string;
  qty: number;
}

interface MenuItem {
  name: string;
  price: number;
  ingredients?: Ingredient[];
}

interface StockItem {
  name: string;
  quantity: number;
  price: number;
  date: string;
  user: string;
}

const initialState = {
  message: '',
  errors: {},
};

export default function MenuPage() {
  const [state, dispatch] = useActionState(saveMenuItem, initialState);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<{ name: string, qty: number }[]>([]);

  // Ingredient Selector State
  const [ingName, setIngName] = useState('');
  const [ingQty, setIngQty] = useState('');

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  const loadStockIds = async () => {
    const items = await getStockItems();
    // Aggregate items by name to avoid duplicates and sum quantities
    const aggregated = items.reduce((acc: Record<string, StockItem>, item: StockItem) => {
      if (!acc[item.name]) {
        acc[item.name] = { ...item, quantity: 0 };
      }
      acc[item.name].quantity += item.quantity;
      return acc;
    }, {});
    setStockItems(Object.values(aggregated));
  };

  const loadMenu = () => {
    getMenuItems().then(setMenuItems);
  };

  useEffect(() => {
    const initData = async () => {
      await loadStockIds();
      loadMenu();
    };
    initData();
  }, [state]);

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setPrice(String(item.price));
    setSelectedIngredients(item.ingredients || []);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setName('');
    setPrice('');
    setSelectedIngredients([]);
  };

  const handleDelete = async (name: string) => {
    if (confirm(`คุณต้องการลบเมนู "${name}" ใช่หรือไม่?`)) {
      await deleteMenuItem(name);
      loadMenu();
    }
  };

  const handleAddIngredient = () => {
    if (!ingName || !ingQty) return;

    // Check if exists
    const exists = selectedIngredients.find(i => i.name === ingName);
    if (exists) {
      alert('วัตถุดิบนี้มีอยู่แล้ว');
      return;
    }

    setSelectedIngredients([...selectedIngredients, { name: ingName, qty: Number(ingQty) }]);
    setIngName('');
    setIngQty('');
  };

  const removeIngredient = (index: number) => {
    const newIngredients = selectedIngredients.filter((_, i) => i !== index);
    setSelectedIngredients(newIngredients);
  };

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto mt-6 p-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <ChefHat className="w-8 h-8 mr-3 text-orange-500" />
            จัดการเมนูอาหาร
          </h1>
          <p className="text-gray-500 text-sm mt-1">สร้างสรรค์เมนูและจัดการสูตรอาหารของคุณ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Editor (Sticky) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden sticky top-6">
            <div className={`px-6 py-4 border-b flex justify-between items-center ${editingItem ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
              <h2 className={`font-bold flex items-center ${editingItem ? 'text-blue-700' : 'text-orange-700'}`}>
                {editingItem ? <Pencil className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                {editingItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}
              </h2>
              {editingItem && (
                <button onClick={handleCancelEdit} className="text-xs text-gray-500 hover:text-red-500 underline">
                  ยกเลิก
                </button>
              )}
            </div>

            <div className="p-6">
              <form action={(formData) => {
                dispatch(formData);
                if (!editingItem) {
                  // Clear form only on success add (simple optimistic assume here or use state check)
                  setName('');
                  setPrice('');
                  setSelectedIngredients([]);
                }
              }} className="space-y-5">
                {editingItem && <input type="hidden" name="originalName" value={editingItem.name} />}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเมนู</label>
                  <input
                    type="text"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-lg border-gray-300 text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5 border text-sm"
                    placeholder="เช่น ข้าวกะเพราไก่ไข่ดาว"
                  />
                  {state?.errors?.name && <p className="text-red-500 text-xs mt-1">{state.errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคาขาย (บาท)</label>
                  <input
                    type="number"
                    name="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border-gray-300 text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5 border text-sm"
                    placeholder="0.00"
                  />
                  {state?.errors?.price && <p className="text-red-500 text-xs mt-1">{state.errors.price}</p>}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">สูตรอาหาร (วัตถุดิบ)</label>

                  {/* Ingredient Selector */}
                  <div className="flex gap-2 mb-3">
                    <select
                      value={ingName}
                      onChange={(e) => setIngName(e.target.value)}
                      className="flex-1 rounded-lg border-gray-300 text-gray-600 text-sm p-2 border focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">เลือกวัตถุดิบ...</option>
                      {stockItems.map((item) => (
                        <option key={item.name} value={item.name}>{item.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={ingQty}
                      onChange={(e) => setIngQty(e.target.value)}
                      placeholder="g"
                      className="w-16 rounded-lg border-gray-300 text-gray-600 text-sm p-2 border focus:ring-orange-500 focus:border-orange-500"
                    />
                    <button type="button" onClick={handleAddIngredient} className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Added Ingredients List */}
                  <div className="bg-gray-50 rounded-lg p-3 min-h-[100px] border border-gray-200">
                    {selectedIngredients.length === 0 ? (
                      <p className="text-gray-400 text-xs text-center py-4">ยังไม่มีวัตถุดิบในสูตร</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedIngredients.map((ing, idx) => (
                          <div key={`${ing.name}-${idx}`} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 shadow-sm">
                            <span className="text-sm text-gray-700 font-medium">{ing.name}</span>
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 mr-2 bg-gray-100 px-2 py-0.5 rounded-full">{ing.qty}g</span>
                              <button type="button" onClick={() => removeIngredient(idx)} className="text-gray-400 hover:text-red-500">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input type="hidden" name="ingredients" value={JSON.stringify(selectedIngredients)} />
                </div>

                <button
                  type="submit"
                  className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${editingItem ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'}`}
                >
                  {editingItem ? 'บันทึกการแก้ไข' : 'สร้างเมนูใหม่'}
                </button>

                {state?.message && (
                  <div className={`p-3 rounded-lg text-sm text-center ${state.message.includes('สำเร็จ') || state.message.includes('เรียบร้อย') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {state.message}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Menu List */}
        <div className="lg:col-span-8">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาเมนู..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <Utensils className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>ไม่พบรายการเมนู</p>
              </div>
            ) : (
              filteredItems.map((item, index) => (
                <div key={`${item.name}-${index}`} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                    <span className="font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg text-sm">฿{item.price.toLocaleString()}</span>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2 uppercase font-semibold tracking-wider">วัตถุดิบ:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.ingredients && item.ingredients.length > 0 ? (
                        item.ingredients.map((ing: Ingredient, i: number) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md border border-gray-200">
                            {ing.name} <span className="text-gray-400 mx-0.5">|</span> {ing.qty}g
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">ไม่ได้ระบุ</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-gray-50 gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4 mr-1.5" />
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(item.name)}
                      className="flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      ลบ
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
