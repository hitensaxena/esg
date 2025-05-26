/**
 * Converts an array of objects to a CSV string
 * @param data Array of objects to convert to CSV
 * @param headers Optional custom headers (defaults to object keys)
 * @param delimiter CSV delimiter (default: ',')
 * @returns CSV string
 */
export const jsonToCsv = <T extends Record<string, any>>(
  data: T[],
  headers?: Array<{ key: keyof T; label: string }>,
  delimiter = ','
): string => {
  if (!data.length) return '';
  
  // Use provided headers or extract from first object
  const headerData = headers || 
    Object.keys(data[0]).map(key => ({
      key,
      label: String(key).charAt(0).toUpperCase() + String(key).slice(1).replace(/([A-Z])/g, ' $1').trim()
    }));
  
  // Escape CSV values
  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    // Escape quotes and wrap in quotes if contains delimiter, newline, or quote
    const needsQuotes = [delimiter, '\"', '\n', '\r'].some(char => str.includes(char));
    const escaped = str.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };
  
  // Build CSV rows
  const rows = [];
  
  // Add header row
  rows.push(headerData.map(h => escapeCsv(h.label)).join(delimiter));
  
  // Add data rows
  for (const item of data) {
    const row = headerData.map(({ key }) => {
      const value = item[key];
      // Handle nested objects and arrays
      if (value && typeof value === 'object') {
        return escapeCsv(JSON.stringify(value));
      }
      return escapeCsv(value);
    });
    rows.push(row.join(delimiter));
  }
  
  return rows.join('\n');
};

/**
 * Triggers a file download in the browser
 * @param content File content as string
 * @param filename Name of the file to download
 * @param type MIME type of the file
 */
export const downloadFile = (
  content: string,
  filename: string,
  type = 'text/csv;charset=utf-8;'
): void => {
  // Create a Blob with the content
  const blob = new Blob([content], { type });
  
  // Create a temporary anchor element
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // Set the download attributes
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Append to body, click and remove
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Exports data as a CSV file
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 * @param headers Optional custom headers
 */
export const exportToCsv = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Array<{ key: keyof T; label: string }>
): void => {
  if (!data.length) {
    console.warn('No data to export');
    return;
  }
  
  // Ensure filename has .csv extension
  const csvFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  
  // Convert data to CSV
  const csvContent = jsonToCsv(data, headers);
  
  // Trigger download
  downloadFile(csvContent, csvFilename);
};

/**
 * Exports data as a JSON file
 * @param data Data to export (will be stringified)
 * @param filename Name of the file (without extension)
 * @param pretty Whether to format the JSON with indentation
 */
export const exportToJson = (
  data: any,
  filename: string,
  pretty = true
): void => {
  // Ensure filename has .json extension
  const jsonFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
  
  // Convert data to JSON string
  const jsonContent = pretty 
    ? JSON.stringify(data, null, 2) 
    : JSON.stringify(data);
  
  // Trigger download
  downloadFile(jsonContent, jsonFilename, 'application/json');
};
