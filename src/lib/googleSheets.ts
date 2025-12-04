import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SPREADSHEET_ID) {
  throw new Error('Google Sheets credentials missing');
}

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

export const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID, serviceAccountAuth);

let cachedDoc: GoogleSpreadsheet | null = null;
let cachedAt = 0;
const CACHE_TTL = 60000; // 60 seconds

export async function loadDoc() {
  const now = Date.now();

  if (cachedDoc && (now - cachedAt < CACHE_TTL)) {
    return cachedDoc;
  }

  await doc.loadInfo();
  cachedDoc = doc;
  cachedAt = now;

  return doc;
}

export async function getSheet(title: string, headerValues: string[]) {
  await loadDoc();
  let sheet = doc.sheetsByTitle[title];
  if (!sheet) {
    sheet = await doc.addSheet({ title, headerValues });
  }
  return sheet;
}

// Row Caching
let rowsCache: Record<string, { rows: any[], timestamp: number }> = {};
const DATA_CACHE_TTL = 30000; // 30 seconds

export async function getCachedRows(title: string, headerValues: string[]) {
  const now = Date.now();
  if (rowsCache[title] && (now - rowsCache[title].timestamp < DATA_CACHE_TTL)) {
    return rowsCache[title].rows;
  }

  const sheet = await getSheet(title, headerValues);
  const rows = await sheet.getRows();

  rowsCache[title] = {
    rows: rows,
    timestamp: now
  };

  return rows;
}

export function invalidateCache(title: string) {
  if (rowsCache[title]) {
    delete rowsCache[title];
  }
}
