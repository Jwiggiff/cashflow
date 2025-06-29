export interface CSVTransaction {
  date: string;
  merchant: string;
  expense: number;
  income: number;
  balance: number;
}

export function parseCSV(csvContent: string): CSVTransaction[] {
  const lines = csvContent.trim().split('\n');
  const transactions: CSVTransaction[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma, but handle quoted fields
    const columns = parseCSVLine(line);
    
    if (columns.length < 5) {
      console.warn(`Skipping line ${i + 1}: insufficient columns`);
      continue;
    }

    const [date, merchant, expenseStr, incomeStr, balanceStr] = columns;

    // Parse amounts - remove any currency symbols and convert to numbers
    const expense = parseAmount(expenseStr);
    const income = parseAmount(incomeStr);
    const balance = parseAmount(balanceStr);

    transactions.push({
      date: date.trim(),
      merchant: merchant.trim(),
      expense,
      income,
      balance
    });
  }

  return transactions;
}

function parseCSVLine(line: string): string[] {
  const columns: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      columns.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  columns.push(current);
  return columns.map(col => col.replace(/^"|"$/g, '')); // Remove surrounding quotes
}

function parseAmount(amountStr: string): number {
  if (!amountStr || amountStr.trim() === '') {
    return 0;
  }
  
  // Remove currency symbols, commas, and spaces, then convert to number
  const cleaned = amountStr.replace(/[$,£€¥\s]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
} 