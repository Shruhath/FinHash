import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { parseTransactionsCsv, type ImportedTransaction } from "@shared/csv";

/** Opens the system picker and parses the chosen CSV. */
export async function pickTransactionsCsv(): Promise<ImportedTransaction[] | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["text/csv", "text/comma-separated-values", "public.comma-separated-values-text", "*/*"],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const file = new FileSystem.File(result.assets[0].uri);
  return parseTransactionsCsv(file.textSync());
}

export interface ExportRow {
  date: number;
  type: string;
  category: string;
  description?: string;
  amount: number;
}

/**
 * Writes a CSV into the cache directory and hands it to the share sheet,
 * which is the only way to get a file off-device on iOS.
 */
export async function exportTransactionsCsv(rows: ExportRow[]) {
  const header = "date,type,category,description,amount";
  const body = rows
    .map((row) => {
      const note = (row.description ?? "").replace(/"/g, '""');
      return `${new Date(row.date).toISOString()},${row.type},"${row.category}","${note}",${row.amount}`;
    })
    .join("\n");

  const name = `finhash-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  const file = new FileSystem.File(FileSystem.Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(`${header}\n${body}`);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      dialogTitle: "Export transactions",
      UTI: "public.comma-separated-values-text",
    });
  }

  return file.uri;
}
