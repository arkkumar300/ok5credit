import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const handleCustomerLedgerPDF = async (transactions,personName) => {
  const formattedRows = transactions.map((tx,index) => `
   <tr>
      <td>${tx.date}</td>
      <td>${tx.type === 'debit' ? `₹${tx.amount}` : ''}</td>
      <td>${tx.type === 'credit' ? `₹${tx.amount}` : ''}</td>
    </tr>
  `).join('');

  const html = `
    <html>
    <head>
      <style>
        body { font-family: Arial; padding: 20px; }
        h1 { text-align: center; color: #007B83; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <h1>${personName||""} Ledger Statement</h1>
      <table border="1" cellspacing="0" cellpadding="5">
        <tr>
          <th>Date</th>
          <th>Payment</th>
          <th>Credit</th>
        </tr>
        ${formattedRows}
      </table>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  } else {
    alert('Sharing not available');
  }
};

export default handleCustomerLedgerPDF;