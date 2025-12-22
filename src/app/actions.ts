'use server';

import { getSheet, getCachedRows, invalidateCache } from '@/lib/googleSheets';
import { GoogleSpreadsheetRow } from 'google-spreadsheet';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// ... (existing imports)

export async function login(prevState: unknown, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    (await cookies()).set('auth_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    redirect('/dashboard');
  } else {
    return { message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
  }
}

export async function logout() {
  (await cookies()).delete('auth_session');
  redirect('/login');
}

// ... (rest of the file)

import { uploadToCloudinary } from '@/lib/cloudinary';

// ... (existing imports)

const stockSchema = z.object({
  name: z.string().min(1, 'ชื่อสินค้าจำเป็นต้องระบุ'),
  quantity: z.coerce.number().min(1, 'จำนวนต้องอย่างน้อย 1'),
  price: z.coerce.number().min(0, 'ราคาต้องไม่ติดลบ'),
  user: z.string().min(1, 'ชื่อผู้บันทึกจำเป็นต้องระบุ'),
  receipt: z.string().optional(),
});

export async function addStockItem(prevState: unknown, formData: FormData) {
  // Check for file
  const file = formData.get('file') as File | null;
  let receiptLink = '';

  if (file && file.size > 0) {
    try {
      const url = await uploadToCloudinary(file);
      receiptLink = url;
    } catch (error) {
       console.error("Upload failed", error);
       // Continue without receipt or return error? Let's continue but warn.
    }
  }

  const validatedFields = stockSchema.safeParse({
    name: formData.get('name'),
    quantity: formData.get('quantity'),
    price: formData.get('price'),
    user: formData.get('user'),
    receipt: receiptLink,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'ข้อมูลไม่ครบถ้วน ไม่สามารถเพิ่มสต็อกได้',
    };
  }

  const { name, quantity, price, user, receipt } = validatedFields.data;

  try {
    const sheet = await getSheet('Stock', ['name', 'quantity', 'price', 'user', 'date', 'receipt']);
    await sheet.addRow({
      name,
      quantity,
      price,
      user,
      date: new Date().toISOString(),
      receipt: receipt || '',
    });

    invalidateCache('Stock'); // Invalidate cache
    revalidatePath('/stock');
    return { message: 'เพิ่มสต็อกเรียบร้อยแล้ว!' };
  } catch (error) {
    console.error('Database Error:', error);
    return { message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' };
  }
}


const bulkStockSchema = z.object({
  items: z.string().transform((str, ctx) => {
    try {
      const parsed = JSON.parse(str);
      if (!Array.isArray(parsed)) throw new Error('Must be an array');
      return parsed;
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid JSON' });
      return z.NEVER;
    }
  }).pipe(z.array(stockSchema.extend({ tempId: z.any().optional() }))), // Allow tempId in input
});

export async function addMultipleStockItems(prevState: unknown, formData: FormData) {
  const validatedFields = bulkStockSchema.safeParse({
    items: formData.get('items'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'ข้อมูลไม่ถูกต้อง',
    };
  }

  const { items } = validatedFields.data;

  try {
    const sheet = await getSheet('Stock', ['name', 'quantity', 'price', 'user', 'date', 'receipt']);
    const date = new Date().toISOString();
    
    // 0. Handle Batch File (if exists)
    const batchFile = formData.get('batch_file') as File | null;
    let batchReceiptUrl = '';
    
    if (batchFile && batchFile.size > 0) {
      try {
        batchReceiptUrl = await uploadToCloudinary(batchFile);
      } catch (e) {
        console.error('Failed to upload batch file', e);
      }
    }
    
    // Process uploads for each item
    const rowsToAdd = await Promise.all(items.map(async (item, index) => {
       let receiptLink = batchReceiptUrl; // Default to batch URL
       
       // Check if there is a specific file for this item (overrides batch?)
       // Or should it be specific file takes precedence? Yes.
       const file = formData.get(`file_${index}`) as File | null;
       
       if (file && file.size > 0) {
          try {
             const url = await uploadToCloudinary(file);
             receiptLink = url;
          } catch(e) {
             console.error(`Failed to upload file for item ${index}`, e);
          }
       }

       return {
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          user: item.user,
          date,
          receipt: receiptLink
       };
    }));

    // Add all rows
    await sheet.addRows(rowsToAdd);

    invalidateCache('Stock');
    revalidatePath('/stock');
    return { success: true, message: 'บันทึกรายการสต็อกทั้งหมดเรียบร้อยแล้ว!' };
  } catch (error) {
    console.error('Database Error:', error);
    return { message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' };
  }
}

export async function getStockItems() {
  try {
    const rows = await getCachedRows('Stock', ['name', 'quantity', 'price', 'user', 'date', 'receipt']);
    // Sort by date desc and include row index
    return rows.map((row: GoogleSpreadsheetRow, index: number) => ({
      rowIndex: index,
      name: row.get('name') as string,
      quantity: Number(row.get('quantity')),
      price: Number(row.get('price')),
      date: row.get('date') as string,
      user: row.get('user') as string,
      receipt: row.get('receipt') as string | undefined,
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Failed to fetch stock items:', error);
    return [];
  }
}

export async function updateStockItem(prevState: unknown, formData: FormData) {
  const originalDate = formData.get('originalDate') as string;
  const originalName = formData.get('originalName') as string;
  const originalUser = formData.get('originalUser') as string;
  
  const file = formData.get('file') as File | null;
  let receiptLink = formData.get('existingReceipt') as string || '';

  if (file && file.size > 0) {
    try {
      const url = await uploadToCloudinary(file);
      receiptLink = url;
    } catch (error) {
       console.error("Upload failed", error);
    }
  }

  const validatedFields = stockSchema.safeParse({
    name: formData.get('name'),
    quantity: formData.get('quantity'),
    price: formData.get('price'),
    user: formData.get('user'),
    receipt: receiptLink,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล',
    };
  }

  const { name, quantity, price, user, receipt } = validatedFields.data;

  try {
    const sheet = await getSheet('Stock', ['name', 'quantity', 'price', 'user', 'date', 'receipt']);
    const rows = await sheet.getRows();
    
    // Find the row to update by matching original data
    const rowToUpdate = rows.find((row: GoogleSpreadsheetRow) => 
      row.get('date') === originalDate && 
      row.get('name') === originalName && 
      row.get('user') === originalUser
    );

    if (!rowToUpdate) {
      return { message: 'ไม่พบรายการที่ต้องการแก้ไข' };
    }

    // Update the row
    rowToUpdate.set('name', name);
    rowToUpdate.set('quantity', quantity);
    rowToUpdate.set('price', price);
    rowToUpdate.set('user', user);
    rowToUpdate.set('receipt', receipt);
    
    await rowToUpdate.save();

    invalidateCache('Stock');
    revalidatePath('/stock');
    return { success: true, message: 'อัพเดทรายการเรียบร้อยแล้ว!' };
  } catch (error) {
    console.error('Database Error:', error);
    return { message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล' };
  }
}

export async function getStockNames() {
  try {
    const rows = await getCachedRows('Stock', ['name']);
    const names = new Set(rows.map((row: GoogleSpreadsheetRow) => row.get('name')));
    return Array.from(names).filter(Boolean).sort();
  } catch (error) {
    console.error('Failed to fetch stock names:', error);
    return [];
  }
}

const menuSchema = z.object({
  name: z.string().min(1, 'ชื่อเมนูจำเป็นต้องระบุ'),
  price: z.coerce.number().min(0, 'ราคาต้องไม่ติดลบ'),
  ingredients: z.string().min(1, 'วัตถุดิบจำเป็นต้องระบุ'),
});

export async function addMenuItem(prevState: unknown, formData: FormData) {
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

    invalidateCache('Menu'); // Invalidate cache
    revalidatePath('/menu');
    return { message: 'เพิ่มเมนูเรียบร้อยแล้ว!' };
  } catch (error) {
    console.error('Database Error:', error);
    return { message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' };
  }
}

export async function updateMenuItem(prevState: unknown, formData: FormData) {
  const originalName = formData.get('originalName') as string;
  const validatedFields = menuSchema.safeParse({
    name: formData.get('name'),
    price: formData.get('price'),
    ingredients: formData.get('ingredients'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'ข้อมูลไม่ครบถ้วน ไม่สามารถแก้ไขเมนูได้',
    };
  }

  const { name, price, ingredients } = validatedFields.data;

  try {
    const sheet = await getSheet('Menu', ['name', 'price', 'ingredients', 'date']);
    const rows = await sheet.getRows();
    const rowToUpdate = rows.find(row => row.get('name') === originalName);

    if (rowToUpdate) {
      rowToUpdate.set('name', name);
      rowToUpdate.set('price', String(price));
      rowToUpdate.set('ingredients', ingredients);
      // Optional: Update date? rowToUpdate.set('date', new Date().toISOString());

      await rowToUpdate.save();

      invalidateCache('Menu');
      revalidatePath('/menu');
      return { success: true, message: 'แก้ไขเมนูเรียบร้อยแล้ว!' };
    }

    return { success: false, message: 'ไม่พบเมนูที่ต้องการแก้ไข' };
  } catch (error) {
    console.error('Update Error:', error);
    return { success: false, message: 'เกิดข้อผิดพลาดในการแก้ไข' };
  }
}

export async function saveMenuItem(prevState: unknown, formData: FormData) {
  if (formData.get('originalName')) {
    return updateMenuItem(prevState, formData);
  } else {
    return addMenuItem(prevState, formData);
  }
}

export async function deleteMenuItem(name: string) {
  try {
    const sheet = await getSheet('Menu', ['name', 'price', 'ingredients', 'date']);
    const rows = await sheet.getRows(); // Need fresh rows for delete
    const rowToDelete = rows.find(row => row.get('name') === name);

    if (rowToDelete) {
      await rowToDelete.delete();
      invalidateCache('Menu'); // Invalidate cache
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
    const rows = await getCachedRows('Menu', ['name', 'price', 'ingredients', 'date']);
    return rows.map((row: GoogleSpreadsheetRow) => {
      const ingredientsRaw = row.get('ingredients');
      let ingredients = [];
      try {
        ingredients = ingredientsRaw ? JSON.parse(ingredientsRaw) : [];
      } catch {
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
    const stockItems = await getStockItems(); // Uses cache
    const menuItems = await getMenuItems(); // Uses cache

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
        const stockItem = stockItems.find((s) => s.name === ing.name);
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

    invalidateCache('Orders'); // Invalidate cache
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
    // Use Cached Rows
    const rows = await getCachedRows('Orders', ['items', 'totalPrice', 'totalCost', 'date']);
    const stockRows = await getCachedRows('Stock', ['name', 'quantity', 'price', 'user', 'date']);

    let totalSales = 0;
    let totalCost = 0; // Cost of goods sold (ingredients used)
    let totalStockExpenditure = 0; // Money spent on buying stock
    const itemSales: Record<string, { quantity: number, sales: number }> = {};
    const orders: { date: string; items: { name: string; quantity: number; price: number }[]; totalPrice: number; totalCost: number }[] = [];

    // Helper to check if a date matches the filter
    const isDateInFilter = (dateStr: string) => {
      const rowDate = new Date(dateStr);
      if (filterType === 'day' && dateValue) {
        const rowDateStr = rowDate.toISOString().split('T')[0];
        return rowDateStr === dateValue;
      } else if (filterType === 'month' && dateValue) {
        const rowMonthStr = rowDate.toISOString().slice(0, 7);
        return rowMonthStr === dateValue;
      } else if (filterType === 'year' && dateValue) {
        const rowYearStr = rowDate.getFullYear().toString();
        return rowYearStr === dateValue;
      } else if (filterType === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return rowDate >= start && rowDate <= end;
      }
      return true; // 'all'
    };

    // Process Orders
    rows.forEach((row: GoogleSpreadsheetRow) => {
      if (isDateInFilter(row.get('date'))) {
        totalSales += Number(row.get('totalPrice'));
        totalCost += Number(row.get('totalCost'));

        const itemsRaw = row.get('items');
        let items = [];
        try {
          items = itemsRaw ? JSON.parse(itemsRaw) : [];
        } catch {
          console.warn('Failed to parse order items:', itemsRaw);
        }

        orders.push({
          date: row.get('date'),
          items,
          totalPrice: Number(row.get('totalPrice')),
          totalCost: Number(row.get('totalCost')),
        });

        items.forEach((item: { name: string; quantity: number; price: number }) => {
          if (!itemSales[item.name]) {
            itemSales[item.name] = { quantity: 0, sales: 0 };
          }
          itemSales[item.name].quantity += item.quantity;
          itemSales[item.name].sales += item.price * item.quantity;
        });
      }
    });

    // Process Stock Expenditure
    stockRows.forEach((row: GoogleSpreadsheetRow) => {
      if (isDateInFilter(row.get('date'))) {
        totalStockExpenditure += Number(row.get('price'));
      }
    });

    orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      totalSales,
      totalCost, // COGS
      grossProfit: totalSales - totalCost,
      totalStockExpenditure,
      netProfit: totalSales - totalStockExpenditure,
      itemSales,
      orders,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return {
      totalSales: 0,
      totalCost: 0,
      grossProfit: 0,
      totalStockExpenditure: 0,
      netProfit: 0,
      itemSales: {},
      orders: []
    };
  }
}
