/**
 * Mengunduh array objek data menjadi file CSV ber-BOM UTF-8
 * agar langsung terbuka rapi per kolom di Microsoft Excel.
 */
export function exportToExcel(filename, headers, rows) {
  const escapeCell = (value) => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvLines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ];

  // Tambahkan BOM (\uFEFF) supaya Excel otomatis mengenali encoding UTF-8 & pemisah kolom
  const csvContent = '\uFEFF' + csvLines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}