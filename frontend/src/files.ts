import { strToU8, zipSync, Unzip, UnzipInflate, strFromU8 } from "fflate";
import { TABLES } from "./types";

export const MAX_BYTES = 20 * 1024 * 1024;
export function download(data: BlobPart, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csvZip(files: Record<string, string>): Uint8Array {
  return zipSync(
    Object.fromEntries(
      Object.entries(files).map(([name, data]) => [
        name,
        [strToU8(data), { mtime: new Date("2000-01-01T00:00:00Z") }],
      ]),
    ),
    { level: 6 },
  );
}
export function readCsvZip(input: Uint8Array): Record<string, string> {
  if (input.byteLength > MAX_BYTES) throw new Error("invalid_file");
  const expected = new Set(["metadata.json", ...TABLES.map((t) => `${t}.csv`)]);
  const result: Record<string, string> = {};
  let total = 0;
  let failed: Error | undefined;
  const unzip = new Unzip((file) => {
    if (
      !expected.has(file.name) ||
      file.name in result ||
      (file.originalSize ?? 0) > MAX_BYTES
    ) {
      failed = new Error("invalid_file");
      file.terminate();
      return;
    }
    result[file.name] = "";
    const chunks: Uint8Array[] = [];
    file.ondata = (error, chunk, final) => {
      if (error) {
        failed = new Error("invalid_file");
        file.terminate();
        return;
      }
      total += chunk.byteLength;
      if (total > MAX_BYTES) {
        failed = new Error("invalid_file");
        file.terminate();
        return;
      }
      chunks.push(chunk);
      if (final) {
        const bytes = new Uint8Array(
          chunks.reduce((sum, c) => sum + c.byteLength, 0),
        );
        let offset = 0;
        for (const part of chunks) {
          bytes.set(part, offset);
          offset += part.byteLength;
        }
        result[file.name] = strFromU8(bytes);
      }
    };
    file.start();
  });
  unzip.register(UnzipInflate);
  unzip.push(input, true);
  if (failed) throw new Error("invalid_file");
  if (Object.keys(result).length === expected.size) return result;
  const metadata = JSON.parse(result["metadata.json"] ?? "null") as {
    schema_version?: number;
  } | null;
  const optional = new Set(["seed_lots.csv", "cultivation_journal.csv"]);
  if (
    !metadata ||
    typeof metadata.schema_version !== "number" ||
    [...expected].some(
      (name) =>
        !(name in result) &&
        !(metadata.schema_version! < 4 && optional.has(name)),
    )
  )
    throw new Error("invalid_file");
  return result;
}
