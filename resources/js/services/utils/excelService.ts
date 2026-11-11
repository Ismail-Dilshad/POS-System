/**
 * Excel/XLSX export service using SheetJS (xlsx)
 */
import * as XLSX from 'xlsx';

export interface ExcelWorkbook {
	sheets: Map<string, ExcelWorksheet>;
}

export interface ExcelWorksheet {
	name: string;
	rows: Array<Array<string | number>>;
	columns?: Array<{ width?: number; wch?: number }>;
}

/**
 * Create a new workbook
 */
export function createWorkbook(): ExcelWorkbook {
	return {
		sheets: new Map(),
	};
}

/**
 * Add a worksheet to the workbook
 */
export function addWorksheet(
	workbook: ExcelWorkbook,
	sheetName: string,
): ExcelWorksheet {
	const worksheet: ExcelWorksheet = {
		name: sheetName,
		rows: [],
		columns: [],
	};
	workbook.sheets.set(sheetName, worksheet);
	return worksheet;
}

/**
 * Append rows to a worksheet
 */
export function appendTable(
	worksheet: ExcelWorksheet,
	rows: Array<Array<string | number>>,
): void {
	worksheet.rows.push(...rows);
}

/**
 * Download workbook as XLSX file
 */
export async function downloadWorkbook(
	workbook: ExcelWorkbook,
	filename: string,
): Promise<void> {
	// Create a new XLSX workbook
	const xlsxWorkbook = XLSX.utils.book_new();

	// Add each sheet to the workbook
	workbook.sheets.forEach((sheet) => {
		// Convert rows to XLSX worksheet
		const xlsxSheet = XLSX.utils.aoa_to_sheet(sheet.rows);

		// Apply column widths if specified
		if (sheet.columns && sheet.columns.length > 0) {
			xlsxSheet['!cols'] = sheet.columns.map((col) => ({
				wch: col.wch || col.width || 15,
			}));
		} else {
			// Auto-calculate column widths based on content
			const colWidths: number[] = [];
			sheet.rows.forEach((row) => {
				row.forEach((cell, colIndex) => {
					const cellLength = String(cell).length;
					if (!colWidths[colIndex] || cellLength > colWidths[colIndex]) {
						colWidths[colIndex] = Math.min(cellLength + 2, 50);
					}
				});
			});
			xlsxSheet['!cols'] = colWidths.map((width) => ({ wch: width }));
		}

		// Append the sheet to workbook
		XLSX.utils.book_append_sheet(xlsxWorkbook, xlsxSheet, sheet.name);
	});

	// Generate XLSX binary
	const xlsxBuffer = XLSX.write(xlsxWorkbook, {
		bookType: 'xlsx',
		type: 'array',
	});

	// Ensure filename has .xlsx extension
	const finalFilename = filename.endsWith('.xlsx')
		? filename
		: filename.replace(/\.(csv|xls)$/i, '') + '.xlsx';

	// Create blob and download
	const blob = new Blob([xlsxBuffer], {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	});

	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);
	link.href = url;
	link.download = finalFilename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Download workbook as CSV file (alternative for compatibility)
 */
export async function downloadWorkbookAsCSV(
	workbook: ExcelWorkbook,
	filename: string,
): Promise<void> {
	const sheets = Array.from(workbook.sheets.values());

	let csvContent = '';

	if (sheets.length === 1) {
		const sheet = sheets[0];
		sheet.rows.forEach((row) => {
			csvContent += row.map((cell) => formatCSVCell(cell)).join(',') + '\n';
		});
	} else {
		sheets.forEach((sheet) => {
			csvContent += `\n=== ${sheet.name} ===\n`;
			sheet.rows.forEach((row) => {
				csvContent += row.map((cell) => formatCSVCell(cell)).join(',') + '\n';
			});
		});
	}

	// UTF-8 with BOM for Excel compatibility
	const BOM = '\uFEFF';
	const fullContent = BOM + csvContent;
	const csvData = new TextEncoder().encode(fullContent);

	const finalFilename = filename.endsWith('.csv')
		? filename
		: filename.replace(/\.(xlsx|xls)$/i, '') + '.csv';

	const blob = new Blob([csvData], {
		type: 'text/csv;charset=utf-8;',
	});

	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);
	link.href = url;
	link.download = finalFilename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Format a cell value for CSV
 */
function formatCSVCell(value: string | number): string {
	const str = String(value);

	if (str.includes(',') || str.includes('"') || str.includes('\n')) {
		return `"${str.replace(/"/g, '""')}"`;
	}

	return str;
}

/**
 * Read an XLSX file and return parsed data
 */
export async function readXLSXFile(
	file: File,
): Promise<Array<Array<string | number>>> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const data = e.target?.result;
				const workbook = XLSX.read(data, { type: 'array' });

				// Get first sheet
				const firstSheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[firstSheetName];

				// Convert to array of arrays
				const jsonData = XLSX.utils.sheet_to_json<Array<string | number>>(
					worksheet,
					{ header: 1 },
				);

				resolve(jsonData);
			} catch (error) {
				reject(error);
			}
		};

		reader.onerror = () => reject(reader.error);
		reader.readAsArrayBuffer(file);
	});
}

/**
 * Export configuration for generic data export
 */
export interface ExportConfig<T> {
	sheetName: string;
	filename: string;
	headers: string[];
	rowMapper: (item: T) => (string | number)[];
	summaryRows?: (string | number)[][];
	totalsRow?: (string | number)[];
	columnWidths?: number[];
}

/**
 * Generic data export function - handles both XLSX and CSV
 * Simplifies export logic by centralizing the common pattern
 */
export async function exportData<T>(
	data: T[],
	config: ExportConfig<T>,
	format: 'xlsx' | 'csv' = 'xlsx',
): Promise<void> {
	const workbook = createWorkbook();
	const worksheet = addWorksheet(workbook, config.sheetName);

	// Add summary rows if provided
	if (config.summaryRows && config.summaryRows.length > 0) {
		appendTable(worksheet, config.summaryRows);
	}

	// Add headers
	appendTable(worksheet, [config.headers]);

	// Add data rows
	const dataRows = data.map(config.rowMapper);
	appendTable(worksheet, dataRows);

	// Add totals row if provided
	if (config.totalsRow) {
		appendTable(worksheet, [['TOTALS']]);
		appendTable(worksheet, [config.totalsRow]);
	}

	// Set column widths
	if (config.columnWidths && config.columnWidths.length > 0) {
		worksheet.columns = config.columnWidths.map((width) => ({ width }));
	}

	// Generate filename with date
	const date = new Date().toISOString().split('T')[0];
	const filename = `${config.filename}_${date}`;

	// Download in requested format
	if (format === 'csv') {
		await downloadWorkbookAsCSV(workbook, filename);
	} else {
		await downloadWorkbook(workbook, filename);
	}
}
