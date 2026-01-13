import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ApiService from './ApiServices';
import { Alert } from 'react-native';

const exportDataAsPDF = async (data, fileName) => {
  const isRTL = false;

  try {
    if (!data || data.length === 0) {
      Alert.alert('No data available to export');
      return;
    }

    /* =======================
       FETCH USER DETAILS
    ======================= */
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

    /* =======================
       TABLE HEADERS & ROWS
    ======================= */
    const excludedKeys = ['initial', 'color'];

    const tableHeaders = Object.keys(data[0])
      .filter(key => !excludedKeys.includes(key))
      .map(key => `<th>${key}</th>`)
      .join('');

    const tableRows = data
      .map(row => {
        return `
          <tr>
            ${Object.entries(row)
            .filter(([key]) => !excludedKeys.includes(key))
            .map(([_, val]) => `<td>${val ?? ''}</td>`)
            .join('')}
          </tr>
        `;
      })
      .join('');

    /* =======================
       HTML TEMPLATE
    ======================= */
    const html = `
    <html dir="${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #000;
          }

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

          table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }

          table.data-table th,
          table.data-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: ${isRTL ? 'right' : 'left'};
          }

          table.data-table th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
        </style>
      </head>

      <body>
        <!-- HEADER -->
        <div class="header">
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

        <!-- INVOICE INFO -->
        <table class="invoice-info">
          <tr>
            <td><strong>Invoice No:</strong> ${invoiceNumber}</td>
            <td style="text-align:${isRTL ? 'left' : 'right'}">
              <strong>Date:</strong> ${invoiceDate}
            </td>
          </tr>
        </table>

        <h3 style="text-align:center;margin-bottom:10px;">
          ${fileName}
        </h3>

        <!-- DATA TABLE -->
        <table class="data-table">
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
    `;

    /* =======================
       CREATE & SHARE PDF
    ======================= */
    const { uri } = await Print.printToFileAsync({ html });

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Share ${fileName}.pdf`,
    });

  } catch (error) {
    console.error('❌ PDF Export Error:', error);
    Alert.alert('Failed to export PDF');
  }
};

export default exportDataAsPDF;
