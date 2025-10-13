import { generateRandomString } from "@kottster/common";
import { DataSourceAdapter } from "../models/dataSourceAdapter.model";
import { Readable } from "stream";
import { Response } from 'express';
import ExcelJS from 'exceljs';

type DownloadParameters = Parameters<DataSourceAdapter['getTableRecordsStream']>;

interface ExportOperation {
  parameters: DownloadParameters;
  dataSourceName: string;
  format: keyof typeof ExportFormat;
}

export enum ExportFormat {
  json = 'json',
  csv = 'csv',
  xlsx = 'xlsx',
}

/**
 * Service for exporting files into various formats
 */
export class Exporter {
  private readonly operations: Map<string, ExportOperation> = new Map();

  createOperation({ parameters, dataSourceName, format }: ExportOperation): string {
    const id = generateRandomString(32);
    this.operations.set(id, {
      parameters,
      dataSourceName,
      format,
    });
    return id;
  }

  getOperation(id: string): ExportOperation | undefined {
    const params = this.operations.get(id);
    
    // Delete in 1 minute
    setTimeout(() => {
      this.operations.delete(id);
    }, 60 * 1000);

    return params;
  }

  getHeadersByFormat(format: keyof typeof ExportFormat, filename: string): { [key: string]: string } {
    switch (format) {
      case ExportFormat.json:
        return {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        };
      case ExportFormat.csv:
        return {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        };
      case ExportFormat.xlsx:
        return {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        };
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Flattens a nested object/array structure into a single-level object
   * @example { name: "John", address: { city: "NY" } } => { name: "John", address__city: "NY" }
   */
  private flattenObject(obj: any, prefix: string = ''): Record<string, any> {
    const flattened: Record<string, any> = {};

    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;

      const value = obj[key];
      const newKey = prefix ? `${prefix}__${key}` : key;

      if (value === null || value === undefined) {
        flattened[newKey] = value;
      } else if (value instanceof Date) {
        flattened[newKey] = this.formatDate(value);
      } else if (Array.isArray(value)) {
        const hasObjects = value.some(item => 
          item !== null && 
          item !== undefined && 
          typeof item === 'object' && 
          !Array.isArray(item) &&
          !(item instanceof Date)
        );

        if (hasObjects) {
          value.forEach((item, index) => {
            if (item !== null && item !== undefined && typeof item === 'object' && !(item instanceof Date)) {
              Object.assign(flattened, this.flattenObject(item, `${newKey}__${index}`));
            } else {
              flattened[`${newKey}__${index}`] = item instanceof Date ? this.formatDate(item) : item;
            }
          });
        } else {
          flattened[newKey] = JSON.stringify(value);
        }
      } else if (typeof value === 'object') {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  /**
   * Formats a Date object into a string "YYYY-MM-DD HH:mm:ss"
   * @example new Date("2023-08-15T14:30:00Z") => "2023-08-15 14:30:00"
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  private sortHeaders(headers: string[]): string[] {
    const regularHeaders = headers.filter(h => !h.startsWith('_'));
    const metaHeaders = headers.filter(h => h.startsWith('_'));
    return [...regularHeaders, ...metaHeaders];
  }

  public convertToJSON(stream: Readable, res: Response) {
    res.write('[');

    let isFirst = true;

    stream.on('data', (record) => {
      try {
        const json = JSON.stringify(record);
        if (isFirst) {
          isFirst = false;
          res.write(json);
        } else {
          res.write(',' + json);
        }
      } catch (error) {
        console.error('Error stringifying record:', error);
      }
    });

    stream.on('end', () => {
      res.write(']');
      res.end();
    });

    stream.on('error', (error) => {
      console.error('Export stream error:', error);

      if (!res.headersSent) {
        res.status(500).json({ error: 'Export failed' });
      } else {
        res.end();
      }
    });
  }

  public convertToCSV(stream: Readable, res: Response) {
    let isFirst = true;
    let headers: string[] = [];

    stream.on('data', (record) => {
      try {
        const flatRecord = this.flattenObject(record);

        // On first record, write headers
        if (isFirst) {
          isFirst = false;
          headers = this.sortHeaders(Object.keys(flatRecord));
          res.write(headers.map(h => this.escapeValueForCSV(h)).join(',') + '\n');
        }

        // Write data row
        const values = headers.map(header => {
          const value = flatRecord[header];
          return this.escapeValueForCSV(value);
        });
        res.write(values.join(',') + '\n');
        
      } catch (error) {
        console.error('Error converting record to CSV:', error);
      }
    });

    stream.on('end', () => {
      res.end();
    });

    stream.on('error', (error) => {
      console.error('Export stream error:', error);
      
      if (!res.headersSent) {
        res.status(500).json({ error: 'Export failed' });
      } else {
        res.end();
      }
    });
  }

  private escapeValueForCSV(value: any): string {
    if (value == null) {
      return '';
    }
    
    const str = String(value);
    
    // Escape quotes by doubling them and wrap in quotes if necessary
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    
    return str;
  }

  public async convertToXLSX(stream: Readable, res: Response) {
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
    const sheet = workbook.addWorksheet('Data');

    let isFirst = true;
    let headers: string[] = [];

    stream.on('data', (record) => {
      try {
        const flatRecord = this.flattenObject(record);

        if (isFirst) {
          isFirst = false;
          headers = this.sortHeaders(Object.keys(flatRecord));
          sheet.addRow(headers).commit();
        }

        const values = headers.map((header) => flatRecord[header]);
        sheet.addRow(values).commit();
      } catch (error) {
        console.error('Error writing XLSX row:', error);
      }
    });

    stream.on('end', async () => {
      await workbook.commit();
      res.end();
    });

    stream.on('error', async (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Export failed' });
      } else {
        await workbook.commit();
        res.end();
      }
    });
  }
}