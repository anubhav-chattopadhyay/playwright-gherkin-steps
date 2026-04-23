export type Row = Record<string, string>;

export class DataTable {
  private rows: Row[];

  constructor(table: string) {
    const lines = table
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const headers = this.parseLine(lines[0]);

    this.rows = lines.slice(1).map(line => {
      const values = this.parseLine(line);
      return headers.reduce((acc, header, i) => {
        acc[header.trim()] = values[i]?.trim() ?? '';
        return acc;
      }, {} as Row);
    });
  }

  private parseLine(line: string): string[] {
    const cells = line.split('|').map(cell => cell.trim());
    // slice(1, -1) drops only the empty strings from the leading and trailing pipe
    return cells.slice(1, cells.length - 1);
  }

  hashes(): Row[] {
    return this.rows;
  }

  first(): Row {
    return this.rows[0];
  }

  column(name: string): string[] {
    return this.rows.map(row => row[name]);
  }
}
