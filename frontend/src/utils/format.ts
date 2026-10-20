export const number = (value: number, decimals = 0) => new Intl.NumberFormat('es-CL', { maximumFractionDigits: decimals }).format(value);
export const dateLabel = (value: string) => new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
export const monthLabel = (value: string, long = false) => new Intl.DateTimeFormat('es-CL', { month: long ? 'long' : 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}-01T00:00:00Z`));
export function downloadCsv(rows: string[][], filename: string) {
  const csv = '\uFEFF' + rows.map(row => row.map(cell => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
