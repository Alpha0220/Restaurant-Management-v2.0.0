'use server';

import { getSheet } from '@/lib/googleSheets';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const stockSchema = z.object({
  name: z.string().min(1, 'ชื่อสินค้าจำเป็นต้องระบุ'),
  quantity: z.coerce.number().min(1, 'จำนวนต้องอย่างน้อย 1'),
  price: z.coerce.number().min(0, 'ราคาต้องไม่ติดลบ'),
  user: z.string().min(1, 'ชื่อผู้บันทึกจำเป็นต้องระบุ'),
});

export async function addStockItem(prevState: any, formData: FormData) {
  const validatedFields = stockSchema.safeParse({
    name: formData.get('name'),
    quantity: formData.get('quantity'),
    price: formData.get('price'),
    user: formData.get('user'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'ข้อมูลไม่ครบถ้วน ไม่สามารถเพิ่มสต็อกได้',
    };
  }

  const { name, quantity, price, user } = validatedFields.data;

  try {
    const sheet = await getSheet('Stock', ['name', 'quantity', 'price', 'user', 'date']);
    await sheet.addRow({
      name,
      quantity,
      price,
      user,
      date: new Date().toISOString(),
    });

    revalidatePath('/stock');
    return { message: 'เพิ่มสต็อกเรียบร้อยแล้ว!' };
  } catch (error) {
    console.error('Database Error:', error);
    return { message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' };
  }
}

export async function getStockItems() {
  try {
    const sheet = await getSheet('Stock', ['name', 'quantity', 'price', 'user', 'date']);
    const rows = await sheet.getRows();
    return rows.map(row => ({
      name: row.get('name'),
      quantity: row.get('quantity'),
      price: row.get('price'),
    }));
  } catch (error) {
    console.error('Failed to fetch stock items:', error);
    return [];
  }
}

const menuSchema = z.object({
  name: z.string().min(1, 'ชื่อเมนูจำเป็นต้องระบุ'),
  price: z.coerce.number().min(0, 'ราคาต้องไม่ติดลบ'),
  ingredients: z.string().min(1, 'วัตถุดิบจำเป็นต้องระบุ'),
});

export async function addMenuItem(prevState: any, formData: FormData) {
  const validatedFields = menuSchema.safeParse({
    name: formData.get('name'),
    price: formData.get('price'),
    ingredients: formData.get('ingredients'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'ข้อมูลไม่ครบถ้วน ไม่สามารถเพิ่มเมนูได้',
    };
  }

  const { name, price, ingredients } = validatedFields.data;

  try {
    const sheet = await getSheet('Menu', ['name', 'price', 'ingredients', 'date']);
    await sheet.addRow({
      name,
      price,
      ingredients,
      date: new Date().toISOString(),
    });

    revalidatePath('/menu');
    return { message: 'เพิ่มเมนูเรียบร้อยแล้ว!' };
  } catch (error) {
    console.error('Database Error:', error);
    return { message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' };
  }
}

export async function deleteMenuItem(name: string) {
  try {
    const sheet = await getSheet('Menu', ['name', 'price', 'ingredients', 'date']);
    const rows = await sheet.getRows();
    const rowToDelete = rows.find(row => row.get('name') === name);

    if (rowToDelete) {
      await rowToDelete.delete();
      revalidatePath('/menu');
      return { success: true, message: 'ลบเมนูเรียบร้อยแล้ว' };
    }
    return { success: false, message: 'ไม่พบเมนูที่ต้องการลบ' };
  } catch (error) {
    console.error('Delete Error:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในการลบ' };
  }
}

export async function getMenuItems() {
  try {
    const sheet = await getSheet('Menu', ['name', 'price', 'ingredients', 'date']);
    const rows = await sheet.getRows();
    return rows.map(row => {
      const ingredientsRaw = row.get('ingredients');
      let ingredients = [];
      try {
        ingredients = ingredientsRaw ? JSON.parse(ingredientsRaw) : [];
      } catch (e) {
        console.warn(`Failed to parse ingredients for menu item ${row.get('name')}:`, ingredientsRaw);
      }
      return {
        name: row.get('name'),
        price: Number(row.get('price')),
        ingredients,
      };
    });
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    return [];
  }
}

export async function submitOrder(orderItems: { name: string, price: number, quantity: number }[]) {
  try {
    const stockItems = await getStockItems();
    const menuItems = await getMenuItems();

    let totalCost = 0;
    let totalPrice = 0;

    // Calculate cost and price
    for (const orderItem of orderItems) {
      const menuItem = menuItems.find(m => m.name === orderItem.name);
      if (!menuItem) continue;

      totalPrice += orderItem.price * orderItem.quantity;

      // Calculate cost based on ingredients
      let itemCost = 0;
      for (const ing of menuItem.ingredients) {
        const stockItem = stockItems.find((s: any) => s.name === ing.name);
        if (stockItem) {
          // Price per gram * quantity needed
          // Assuming stock price is per unit (e.g. per pack), we need to know price per gram.
          // The user requirement said: "Quantity (grams), Price per unit".
          // This is ambiguous. I will assume "Price" entered in Stock is for the "Quantity" entered.
          // So Price Per Gram = Stock Price / Stock Quantity.
          const pricePerGram = Number(stockItem.price) / Number(stockItem.quantity);
          itemCost += pricePerGram * ing.qty;
        }
      }
      totalCost += itemCost * orderItem.quantity;
    }

    const sheet = await getSheet('Orders', ['items', 'totalPrice', 'totalCost', 'date']);
    await sheet.addRow({
      items: JSON.stringify(orderItems),
      totalPrice,
      totalCost,
      date: new Date().toISOString(),
    });

    revalidatePath('/dashboard');
    return { success: true, message: 'บันทึกออเดอร์เรียบร้อยแล้ว!' };
  } catch (error) {
    console.error('Order Error:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกออเดอร์' };
  }
}

export async function getDashboardStats(
  filterType: 'all' | 'day' | 'month' | 'year' | 'custom' = 'month',
  dateValue?: string,
  startDate?: string,
  endDate?: string
) {
  try {
    const sheet = await getSheet('Orders', ['items', 'totalPrice', 'totalCost', 'date']);
    const rows = await sheet.getRows();

    let totalSales = 0;
    let totalCost = 0;
    const itemSales: Record<string, { quantity: number, sales: number }> = {};
    const orders: any[] = [];

    rows.forEach(row => {
      const rowDate = new Date(row.get('date'));
      let include = true;

      if (filterType === 'day' && dateValue) {
        const rowDateStr = rowDate.toISOString().split('T')[0];
        if (rowDateStr !== dateValue) include = false;
      } else if (filterType === 'month' && dateValue) {
        const rowMonthStr = rowDate.toISOString().slice(0, 7);
        if (rowMonthStr !== dateValue) include = false;
      } else if (filterType === 'year' && dateValue) {
        const rowYearStr = rowDate.getFullYear().toString();
        if (rowYearStr !== dateValue) include = false;
      } else if (filterType === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);
        if (rowDate < start || rowDate > end) include = false;
      }

      if (include) {
        totalSales += Number(row.get('totalPrice'));
        totalCost += Number(row.get('totalCost'));

        const itemsRaw = row.get('items');
        let items = [];
        try {
          items = itemsRaw ? JSON.parse(itemsRaw) : [];
        } catch (e) {
          console.warn('Failed to parse order items:', itemsRaw);
        }

        // Add to orders list
        orders.push({
          date: rowDate.toISOString(),
          items,
          totalPrice: Number(row.get('totalPrice')),
        });

        items.forEach((item: any) => {
          if (!itemSales[item.name]) {
            itemSales[item.name] = { quantity: 0, sales: 0 };
          }
          itemSales[item.name].quantity += item.quantity;
          itemSales[item.name].sales += item.price * item.quantity;
        });
      }
    });

    // Sort orders by date desc
    orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      totalSales,
      totalCost,
      profit: totalSales - totalCost,
      itemSales,
      orders,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return { totalSales: 0, totalCost: 0, profit: 0, itemSales: {}, orders: [] };
  }
}
