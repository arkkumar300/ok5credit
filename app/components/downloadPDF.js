import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * Export tabular data to PDF (Excel-style) using expo-print and share it.
 * @param {Array} data - Array of objects
 * @param {String} fileName - Desired file name
 */
const exportDataAsPDF = async (data, fileName) => {
  try {
    // List of keys to exclude (adjust if you have more)
    const excludedKeys = ['initial', 'color'];

    // Get headers excluding photo keys
    const tableHeaders = Object.keys(data[0] || {})
      .filter(key => !excludedKeys.includes(key))
      .map(key => `<th>${key}</th>`)
      .join('');

    // Generate rows excluding photo keys
    const tableRows = data
      .map(row => {
        const cells = Object.entries(row)
          .filter(([key]) => !excludedKeys.includes(key))
          .map(([_, val]) => `<td>${val}</td>`)
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            table {
              width: 100%;
              border-collapse: collapse;
              font-family: Arial, sans-serif;
            }
            th, td {
              border: 1px solid #dddddd;
              text-align: left;
              padding: 8px;
            }
            th {
              background-color: #f2f2f2;
            }
          </style>
        </head>
        <body>
          <h2>${fileName}</h2>
          <table>
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `;

    // Print to PDF
    const { uri } = await Print.printToFileAsync({ html });

    // Share the PDF
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Share ${fileName}.pdf`,
    });
  } catch (err) {
    console.error('❌ Error exporting data as PDF:', err);
    alert('Failed to export PDF');
  }
};

export default exportDataAsPDF;
