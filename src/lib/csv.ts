export interface ImportedTransaction {
  amount: number;
  date: string;
  description: string;
  type: "income" | "expense";
  categoryName?: string;
}

/** Splits one CSV line, honouring quoted fields and escaped quotes. */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

const ALIASES: Record<keyof ImportedTransaction | "categoryName", string[]> = {
  amount: ["amount", "value", "total"],
  date: ["date", "datetime", "timestamp", "transaction date"],
  description: ["description", "note", "notes", "memo", "details"],
  type: ["type", "direction", "kind"],
  categoryName: ["categoryname", "category", "category name"],
};

function findColumn(header: string[], key: keyof typeof ALIASES): number {
  const wanted = ALIASES[key];
  return header.findIndex((h) => wanted.includes(h.toLowerCase().trim()));
}

/**
 * Parses an exported transactions CSV. Column order is resolved from the
 * header row where possible, so both FinHash exports and hand-made sheets work.
 */
export function parseTransactionsCsv(text: string): ImportedTransaction[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const header = splitCsvLine(lines[0]!);
  const index = {
    amount: findColumn(header, "amount"),
    date: findColumn(header, "date"),
    description: findColumn(header, "description"),
    type: findColumn(header, "type"),
    categoryName: findColumn(header, "categoryName"),
  };

  // Legacy Convex export: _creationTime,_id,amount,categoryId,date,description,isRecurring,type,categoryName
  const legacy =
    index.amount === -1 && header.length >= 9
      ? { amount: 2, date: 4, description: 5, type: 7, categoryName: 8 }
      : null;

  const map = legacy ?? index;
  if (map.amount === -1 || map.date === -1 || map.type === -1) return [];

  const rows: ImportedTransaction[] = [];

  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);

    const amount = parseFloat((cells[map.amount] ?? "").replace(/[^0-9.-]/g, ""));
    const date = cells[map.date] ?? "";
    if (!Number.isFinite(amount) || amount === 0) continue;
    if (!date || Number.isNaN(new Date(date).getTime())) continue;

    const rawType = (cells[map.type] ?? "").toLowerCase();
    const type: "income" | "expense" =
      /income|credit|deposit|in\b/.test(rawType) ? "income" : "expense";

    rows.push({
      amount: Math.abs(amount),
      date,
      description: (map.description >= 0 ? cells[map.description] : "") || "",
      type,
      categoryName:
        map.categoryName >= 0 ? cells[map.categoryName] || undefined : undefined,
    });
  }

  return rows;
}
