import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ApiService from './ApiServices';
import AsyncStorage from '@react-native-async-storage/async-storage';


const handleCustomerLedgerPDF = async (
  transactions,
  personName,
  personId,
  roleType // "CUSTOMER" | "SUPPLIER"
) => {
  try {
    /* =========================
       FETCH USER ID
    ========================= */
    const userData = await AsyncStorage.getItem('userData');
    const userId = JSON.parse(userData)?.id;

    /* =========================
       FETCH PARTY DETAILS
    ========================= */
    const url =
      roleType === 'CUSTOMER'
        ? `/customers/${personId}`
        : `/supplier/${personId}`;

    const response = await ApiService.post(url, { userId });

    const party =
      response?.data?.customer || response?.data?.supplier;

    if (!party) {
      throw new Error('Party details not found');
    }

    /* =========================
       NORMALIZED PARTY DATA
    ========================= */
    const partyType = response.data.customer ? 'Customer' : 'Supplier';
    const name = party.name || '';
    const mobile = party.mobile || '';
    const address = party.address || 'N/A';
    const currentBalance = party.current_balance || '0.00';

    /* =========================
       LEDGER ROWS
    ========================= */
    const formattedRows =
      transactions && transactions.length > 0
        ? transactions
            .map(
              (tx) => `
          <tr>
            <td>${tx.date || ''}</td>
            <td>${tx.type === 'debit' ? `₹${tx.amount}` : ''}</td>
            <td>${tx.type === 'credit' ? `₹${tx.amount}` : ''}</td>
          </tr>
        `
            )
            .join('')
        : `
          <tr>
            <td colspan="3" style="text-align:center;">
              No transactions available
            </td>
          </tr>
        `;

    /* =========================
       HTML (PDF SAFE)
    ========================= */
    const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #000;
          }

          /* HEADER */
          .header {
            margin-bottom: 15px;
          }

          .title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
          }

          .party-info {
            font-size: 12px;
            margin-bottom: 10px;
          }

          .party-info td {
            padding: 4px 0;
          }

          .separator {
            border-top: 2px solid #000;
            margin: 10px 0 15px 0;
          }

          table.ledger-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }

          table.ledger-table th,
          table.ledger-table td {
            border: 1px solid #ccc;
            padding: 8px;
          }

          table.ledger-table th {
            background-color: #f2f2f2;
          }
        </style>
      </head>

      <body>
        <!-- TITLE -->
        <div class="title">
          ${name} (${partyType}) Ledger Statement
        </div>

        <!-- PARTY DETAILS -->
        <table class="party-info" width="100%">
          <tr>
            <td><strong>Name:</strong> ${name}</td>
            <td><strong>Mobile:</strong> ${mobile}</td>
          </tr>
          <tr>
            <td><strong>Address:</strong> ${address}</td>
            <td><strong>Balance:</strong> ₹${currentBalance}</td>
          </tr>
        </table>

        <div class="separator"></div>

        <!-- LEDGER TABLE -->
        <table class="ledger-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Payment</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            ${formattedRows}
          </tbody>
        </table>
      </body>
    </html>
    `;

    /* =========================
       GENERATE & SHARE PDF
    ========================= */
    const { uri } = await Print.printToFileAsync({ html });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      alert('Sharing not available');
    }
  } catch (error) {
    console.error('Ledger PDF error:', error);
    alert('Failed to generate ledger PDF');
  }
};

export default handleCustomerLedgerPDF;