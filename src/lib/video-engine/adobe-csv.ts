export function sanitizeStockBasename(title: string): string {
  const safe = title.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").toLowerCase().replace(/^-|-$/g, "").substring(0, 50);
  return safe || "microstock-video";
}

export function stockVideoFilename(title: string, width: number, height: number): string {
  return `${sanitizeStockBasename(title)}-${width}x${height}.mp4`;
}

export function stockCsvFilename(videoFilename: string): string {
  return videoFilename.replace(/\.(mp4|mov|m4v|webm)$/i, "") + ".csv";
}

export function buildAdobeStockCsv(videoFilename: string, title: string, keywords: string, category: string): Blob {
  const escapeCsv = (str: string) => `"${String(str).replace(/"/g, '""')}"`;
  const header = "Filename,Title,Keywords,Category,Releases\n";
  const safeTitle = title.trim();
  const safeKeywords = keywords
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(",");
  const row = `${escapeCsv(videoFilename)},${escapeCsv(safeTitle)},${escapeCsv(safeKeywords)},${category},""\n`;
  return new Blob(["\ufeff" + header + row], { type: "text/csv;charset=utf-8;" });
}
