
import { google } from 'googleapis';
import { Readable } from 'stream';

// Initialize auth - using the same credentials as Sheets
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  // Use full drive scope to allow uploading to shared folders
  // drive.file scope is too restrictive for shared folders
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Uploads a file to Google Drive and returns the web view link and thumbnail link.
 * @param file The file object from FormData
 * @param folderId The ID of the Google Drive folder to upload to
 */
/**
 * Uploads a file to Google Drive and returns the web view link and thumbnail link.
 * Supports both regular folders (shared with Service Account) and Shared Drives.
 * 
 * IMPORTANT SETUP INSTRUCTIONS:
 * 
 * Option 1: Regular Folder (Easiest)
 * 1. Create a folder in your Google Drive
 * 2. Right-click the folder > Share
 * 3. Add the Service Account email (from GOOGLE_SERVICE_ACCOUNT_EMAIL)
 * 4. Give it "Editor" permission
 * 5. Copy the folder ID from the URL and set GOOGLE_DRIVE_FOLDER_ID
 * 
 * Option 2: Shared Drive (Google Workspace only)
 * 1. Create a Shared Drive in Google Workspace
 * 2. Add the Service Account as a Content Manager
 * 3. Copy the Shared Drive ID and set GOOGLE_DRIVE_FOLDER_ID
 * 
 * @param file The file object from FormData
 * @param folderId The ID of the Google Drive folder or Shared Drive to upload to
 */
export async function uploadToDrive(file: File, folderId: string) {
  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID is not defined');
  }

  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  try {
    // First, verify that we can access the folder
    let folderInfo;
    try {
      folderInfo = await drive.files.get({
        fileId: folderId,
        fields: 'id, name, mimeType',
        supportsAllDrives: true,
      });
      console.log(`✅ สามารถเข้าถึงโฟลเดอร์: ${folderInfo.data.name} (ID: ${folderId})`);
    } catch (accessError: unknown) {
      const error = accessError as { code?: number; message?: string };
      if (error.code === 404) {
        throw new Error(
          `❌ ไม่พบโฟลเดอร์ ID: ${folderId}\n\n` +
          `กรุณาตรวจสอบว่า Folder ID ถูกต้อง\n` +
          `Folder ID ควรจะอยู่ใน URL: https://drive.google.com/drive/folders/[FOLDER_ID]`
        );
      } else if (error.code === 403) {
        throw new Error(
          `❌ Service Account ไม่มีสิทธิ์เข้าถึงโฟลเดอร์นี้\n\n` +
          `📋 ขั้นตอนการแชร์โฟลเดอร์:\n` +
          `1. เปิด Google Drive: https://drive.google.com\n` +
          `2. ไปที่โฟลเดอร์: https://drive.google.com/drive/folders/${folderId}\n` +
          `3. คลิกปุ่ม "Share" (แชร์) ด้านบนขวา\n` +
          `4. ในช่อง "Add people and groups" ให้พิมพ์:\n` +
          `   📧 ${serviceAccountEmail}\n` +
          `5. เลือกสิทธิ์ "Editor" (ผู้แก้ไข) - สำคัญมาก!\n` +
          `6. คลิก "Send" หรือ "Share"\n` +
          `7. รอสักครู่ (ประมาณ 1-2 นาที) เพื่อให้ Google Drive อัพเดท permissions\n\n` +
          `⚠️ ตรวจสอบ:\n` +
          `- Service Account email ต้องถูกต้อง: ${serviceAccountEmail}\n` +
          `- ต้องให้สิทธิ์ "Editor" หรือสูงกว่า (ไม่ใช่ "Viewer")\n` +
          `- หลังจากแชร์แล้ว รอสักครู่ก่อนลองใหม่\n` +
          `- ตรวจสอบว่าเห็น Service Account ในรายชื่อ "Shared with" หรือไม่`
        );
      }
      throw accessError as Error;
    }

    // Verify we have write permissions by checking if we can list files in the folder
    // This helps catch permission issues before attempting upload
    try {
      const listResult = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        pageSize: 1,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      console.log(`✅ มีสิทธิ์อ่านไฟล์ในโฟลเดอร์ (พบ ${listResult.data.files?.length || 0} ไฟล์)`);
    } catch (listError: unknown) {
      const listErr = listError as { code?: number; message?: string };
      if (listErr.code === 403) {
        throw new Error(
          `❌ Service Account ไม่มีสิทธิ์เขียนไฟล์ในโฟลเดอร์นี้\n\n` +
          `📋 กรุณาทำตามขั้นตอนต่อไปนี้:\n` +
          `1. เปิดโฟลเดอร์: https://drive.google.com/drive/folders/${folderId}\n` +
          `2. คลิกปุ่ม "Share" (แชร์)\n` +
          `3. เพิ่ม Service Account email:\n` +
          `   📧 ${serviceAccountEmail}\n` +
          `4. ให้สิทธิ์ "Editor" (ผู้แก้ไข) - สำคัญมาก!\n` +
          `5. คลิก "Send"\n` +
          `6. รอ 1-2 นาที แล้วลองใหม่\n\n` +
          `⚠️ หมายเหตุ: Service Account ต้องมีสิทธิ์ "Editor" หรือสูงกว่าเท่านั้น`
        );
      }
      // If it's not a permission error, continue with upload attempt
      console.warn('Could not verify folder permissions, attempting upload anyway:', listErr.message || 'Unknown error');
    }
    
    // Try to check permissions more explicitly
    try {
      const permissions = await drive.permissions.list({
        fileId: folderId,
        fields: 'permissions(id, emailAddress, role, type)',
        supportsAllDrives: true,
      });
      
      const serviceAccountPermission = permissions.data.permissions?.find(
        (p) => (p.emailAddress === serviceAccountEmail || p.type === 'user')
      ) as { emailAddress?: string | null; role?: string; type?: string } | undefined;
      
      if (serviceAccountPermission) {
        console.log(`📋 สิทธิ์ปัจจุบัน: ${serviceAccountPermission.role} (${serviceAccountPermission.emailAddress || serviceAccountPermission.type})`);
        if (serviceAccountPermission.role !== 'writer' && serviceAccountPermission.role !== 'owner' && serviceAccountPermission.role !== 'fileOrganizer') {
          console.warn(`⚠️ สิทธิ์ "${serviceAccountPermission.role}" อาจไม่เพียงพอสำหรับการเขียนไฟล์`);
        }
      } else {
        console.warn(`⚠️ ไม่พบ Service Account ในรายชื่อ permissions - อาจจะต้องแชร์โฟลเดอร์ใหม่`);
      }
    } catch (permCheckError: unknown) {
      // If we can't check permissions, continue anyway
      const error = permCheckError as { message?: string };
      console.warn('Could not check folder permissions:', error.message || 'Unknown error');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    console.log(`📤 กำลังอัปโหลดไฟล์: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) ไปยังโฟลเดอร์: ${folderId}`);

    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        parents: [folderId],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, webViewLink, webContentLink, thumbnailLink',
      // Required for Shared Drives
      supportsAllDrives: true,
      supportsTeamDrives: true,
    });

    // Make the file readable by anyone with the link (optional, but good for embedding)
    // This allows the frontend to display images/PDFs directly
    try {
      await drive.permissions.create({
        fileId: response.data.id!,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
        supportsTeamDrives: true,
      });
      console.log(`✅ ตั้งค่า permissions สำหรับไฟล์: ${file.name}`);
    } catch (permError) {
      // If permission setting fails, log but don't fail the upload
      console.warn('Could not set public permissions (file may still be accessible via shared folder):', permError);
    }
    
    console.log(`✅ อัปโหลดไฟล์สำเร็จ: ${file.name}`);
    console.log(`   File ID: ${response.data.id}`);
    console.log(`   Web View Link: ${response.data.webViewLink}`);
    
    // NOTE: 'webContentLink' forces download, 'webViewLink' opens in Drive viewer.
    // For images, we can sometimes use logic to display. 
    // Let's return the ID too.
    return {
      id: response.data.id,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink,
      thumbnailLink: response.data.thumbnailLink
    };
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string; status?: number };
    console.error('Google Drive Upload Error:', error);
    console.error('Error details:', {
      code: err.code,
      message: err.message,
      status: err.status,
    });
    
    // Re-throw custom error messages (from folder access check)
    if (error instanceof Error && (
      error.message.includes('ไม่พบโฟลเดอร์') ||
      error.message.includes('ไม่มีสิทธิ์') ||
      error.message.includes('ไม่สามารถอัปโหลด')
    )) {
      throw error;
    }
    
    // Provide helpful error message for storage quota issues
    if (err.message?.includes('storage quota') || (err.code === 403 && !err.message?.includes('ไม่มีสิทธิ์'))) {
      throw new Error(
        `❌ Service Account ไม่สามารถอัปโหลดไฟล์ได้\n\n` +
        `สาเหตุ: Service Account ไม่มี storage quota ของตัวเอง\n` +
        `แม้ว่าจะสามารถอ่านโฟลเดอร์ได้ แต่ไม่สามารถเขียนไฟล์ได้\n\n` +
        `✅ วิธีแก้ไข (ทำตามขั้นตอนนี้อย่างเคร่งครัด):\n\n` +
        `📌 ขั้นตอนที่ 1: ตรวจสอบสิทธิ์ปัจจุบัน\n` +
        `1. เปิดโฟลเดอร์: https://drive.google.com/drive/folders/${folderId}\n` +
        `2. คลิกปุ่ม "Share" (แชร์) ด้านบนขวา\n` +
        `3. ตรวจสอบว่าเห็น Service Account email นี้ในรายชื่อหรือไม่:\n` +
        `   📧 ${serviceAccountEmail}\n\n` +
        `📌 ขั้นตอนที่ 2: แชร์โฟลเดอร์ใหม่ (ถ้ายังไม่มีในรายชื่อ)\n` +
        `1. ในช่อง "Add people and groups" พิมพ์:\n` +
        `   ${serviceAccountEmail}\n` +
        `2. เลือกสิทธิ์ "Editor" (ผู้แก้ไข) - สำคัญมาก! ไม่ใช่ "Viewer"\n` +
        `3. คลิก "Send" หรือ "Share"\n` +
        `4. รอ 2-3 นาที เพื่อให้ Google Drive อัพเดท permissions\n\n` +
        `📌 ขั้นตอนที่ 3: ตรวจสอบสิทธิ์อีกครั้ง\n` +
        `1. เปิดโฟลเดอร์อีกครั้ง\n` +
        `2. คลิก "Share" และตรวจสอบว่าเห็น Service Account\n` +
        `3. ตรวจสอบว่าสิทธิ์เป็น "Editor" หรือ "Content Manager"\n` +
        `4. ถ้ายังเป็น "Viewer" ให้เปลี่ยนเป็น "Editor"\n\n` +
        `⚠️ สิ่งที่ต้องตรวจสอบ:\n` +
        `- Service Account email ต้องถูกต้อง: ${serviceAccountEmail}\n` +
        `- ต้องให้สิทธิ์ "Editor" หรือ "Content Manager" เท่านั้น (ไม่ใช่ "Viewer")\n` +
        `- ต้องเห็น Service Account ในรายชื่อ "Shared with"\n` +
        `- Folder ID ใน .env ต้องถูกต้อง: ${folderId}\n` +
        `- รอ 2-3 นาที หลังจากแชร์แล้วก่อนลองใหม่\n\n` +
        `💡 ถ้ายังไม่ได้ผล:\n` +
        `- ลองสร้างโฟลเดอร์ใหม่และแชร์ใหม่\n` +
        `- หรือใช้ Google Workspace Shared Drive แทน`
      );
    }
    
    throw error as Error;
  }
}
