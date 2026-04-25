import * as ExcelJS from 'exceljs';

export interface ColunaXlsx {
  header: string;
  key: string;
  width?: number;
  format?: 'date' | 'datetime' | 'number' | 'currency' | 'weight';
}

const FORMATS: Record<NonNullable<ColunaXlsx['format']>, string> = {
  date: 'dd/mm/yyyy',
  datetime: 'dd/mm/yyyy hh:mm',
  number: '#,##0.00',
  currency: 'R$ #,##0.00',
  weight: '#,##0.000 "kg"',
};

export async function gerarXlsx(
  sheetName: string,
  colunas: ColunaXlsx[],
  rows: Record<string, unknown>[],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Solution Ticket';
  wb.created = new Date();
  const ws = wb.addWorksheet(sheetName);

  ws.columns = colunas.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? 18,
    style: c.format ? { numFmt: FORMATS[c.format] } : undefined,
  }));

  // header bold
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' },
  };

  for (const r of rows) ws.addRow(r);

  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: colunas.length } };
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  const arr = await wb.xlsx.writeBuffer();
  return Buffer.from(arr);
}

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
