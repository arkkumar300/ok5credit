import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

const handleDownloadPDF = async () => {
  try {
    const htmlContent = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial;
              padding: 20px;
            }
            h1 {
              text-align: center;
              color: #007B83;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 10px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
          </style>
        </head>
        <body>
          <h1>ARK STORES</h1>
          <table>
            <tr>
              <th>Khata Type</th>
              <th>Customers/Suppliers</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
            <tr>
              <td>Customer Khata</td>
              <td>1 Customer</td>
              <td>₹900</td>
              <td>You Get</td>
            </tr>
            <tr>
              <td>Supplier Khata</td>
              <td>1 Supplier</td>
              <td>₹100</td>
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