
/**
 * Utility to export data to CSV and trigger a download.
 * Handles UTF-8 characters correctly for Excel.
 */
export const exportToCSV = (filename: string, data: any[], headers: { key: string; label: string }[]) => {
    if (!data || data.length === 0) {
        alert('No hay datos para exportar');
        return;
    }

    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(','));

    // Add data rows
    data.forEach(row => {
        const values = headers.map(h => {
            let value = row[h.key];
            
            // Handle nested objects (like company.name)
            if (h.key.includes('.')) {
                const keys = h.key.split('.');
                value = keys.reduce((acc, k) => acc?.[k], row);
            }

            if (value === null || value === undefined) value = '';
            
            const stringValue = String(value);
            return `"${stringValue.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    
    // Add UTF-8 BOM for Excel compatibility
    const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
