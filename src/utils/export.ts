export function exportToCsv<T extends Record<string, unknown>>(filename: string, rows: T[], columns: { key: string; label: string }[]): void {
  if (!rows.length) return;
  const header = columns.map((col) => col.label).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((col) => {
          const value = row[col.key];
          const stringValue = typeof value === 'string' ? value : JSON.stringify(value ?? '');
          const escaped = stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
          return escaped;
        })
        .join(','),
    )
    .join('\n');
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
