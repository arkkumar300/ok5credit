import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import ApiService from './ApiServices';

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

    const userData = await AsyncStorage.getItem('userData');
    const userId = JSON.parse(userData)?.id;

    const response = await ApiService.get(`/user/${userId}`);
    const userDetails = response?.data;

    if (!userDetails) {
      Alert.alert("User details not found");
      return;
    }

    /* =======================
       MAP USER DETAILS
    ======================= */
    const companyName = userDetails.businessName || '';
    const companyLogo = userDetails.photo || '';
    const companyAddress = userDetails.address || '';
    const gstNumber = userDetails.GST || '';

    const invoiceNumber = `REP-${Date.now()}`;
    const invoiceDate = new Date().toLocaleDateString('en-GB');

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 20px; }
             .header {
            text-align: center;
            margin-bottom: 12px;
          }

          .logo {
            width: 80px;
            margin-bottom: 6px;
          }

          .company-name {
            font-size: 20px;
            font-weight: bold;
          }

          .company-meta {
            font-size: 12px;
            margin-top: 4px;
            line-height: 1.4;
          }

          .separator {
            border-top: 2px solid #000;
            margin: 15px 0;
          }

          .invoice-info {
            width: 100%;
            font-size: 12px;
            margin-bottom: 12px;
          }

          .invoice-info td {
            padding: 4px 0;
          }

            h1 { text-align: center; color: #007B83; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 10px; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>

          
<tr>
    <!-- LOGO (LEFT) -->
    <td style="width:25%; text-align:left; vertical-align:top;">
      ${companyLogo
        ? `<img src="${companyLogo}" style="width:70px;" />`
        : ''
      }
    </td>

    <!-- COMPANY INFO (CENTER) -->
    <td style="width:50%; text-align:center; vertical-align:top;">
      <div style="font-size:20px;font-weight:bold;">
        ${companyName}
      </div>

      <div style="font-size:12px;line-height:1.4;margin-top:4px;">
        ${companyAddress ? `${companyAddress}<br/>` : ''}
        ${gstNumber ? `GST: ${gstNumber}` : ''}
      </div>
    </td>

    <!-- EMPTY (RIGHT – FOR BALANCE) -->
    <td style="width:25%;"></td>
  </tr>
        <div class="separator"></div>
<h1>${businessName}</h1>
        <!-- INVOICE INFO -->
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