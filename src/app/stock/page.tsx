'use client';

import { useActionState } from 'react';
import { addStockItem } from '@/app/actions';

const initialState = {
  message: '',
  errors: {},
};

export default function StockPage() {
  // @ts-ignore
  const [state, dispatch] = useActionState(addStockItem, initialState);

  return (
    <div className="max-w-md mx-auto mt-6 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">เพิ่มสต็อกสินค้า</h1>
        <form action={dispatch} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">ชื่อสินค้า</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              placeholder="เช่น เนื้อไก่, ผักคะน้า"
            />
            {state?.errors?.name && <p className="text-red-500 text-xs mt-1">{state.errors.name}</p>}
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">จำนวน (กรัม)</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              required
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              placeholder="0"
            />
            {state?.errors?.quantity && <p className="text-red-500 text-xs mt-1">{state.errors.quantity}</p>}
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">ราคาต่อหน่วย</label>
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

          <div>
            <label htmlFor="user" className="block text-sm font-medium text-gray-700">ผู้บันทึก</label>
            <select
              id="user"
              name="user"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
              <option value="">เลือกผู้บันทึก</option>
              <option value="Admin">Admin</option>
              <option value="Staff1">พนักงาน 1</option>
              <option value="Staff2">พนักงาน 2</option>
            </select>
            {state?.errors?.user && <p className="text-red-500 text-xs mt-1">{state.errors.user}</p>}
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-6"
          >
            บันทึกสต็อก
          </button>

          {state?.message && (
            <p className={`text-center text-sm mt-4 ${state.message.includes('ผิดพลาด') || state.message.includes('ไม่ครบ') ? 'text-red-600' : 'text-green-600'}`}>
              {state.message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
