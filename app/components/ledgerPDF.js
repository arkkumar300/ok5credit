import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

const handleDownloadPDF = async ({ businessName, customers, suppliers }) => {
  try {

    const customerBalance = customers.reduce(
      (sum, c) => sum + parseFloat(c.current_balance || '0'),
      0
    );

    const supplierBalance = suppliers.reduce(
      (sum, s) => sum + parseFloat(s.current_balance || '0'),
      0
    );

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 20px; }
            h1 { text-align: center; color: #007B83; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 10px; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>${businessName}</h1>

          <table>
            <tr>
              <th>Khata Type</th>
              <th>Total Count</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>

            <tr>
              <td>Customer Khata</td>
              <td>${customers.length} Customers</td>
              <td>₹${customerBalance.toFixed(2)}</td>
              <td>You Get</td>
            </tr>

            <tr>
              <td>Supplier Khata</td>
              <td>${suppliers.length} Suppliers</td>
              <td>₹${supplierBalance.toFixed(2)}</td>
              <td>You Give</td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
      Alert.alert('Success', ' PDF shared successfully!'); 
    } else {
      alert('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('PDF Download Error:', error);
  }
};

export default handleDownloadPDF;