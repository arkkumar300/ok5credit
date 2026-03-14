// billPDF.js

import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';

const billPDF = async (userDetails, customerInfo, bill, items, charges, totalAmount) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // ---------------- ITEMS ----------------
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border: 1px solid #E2E8F0; color: #1E293B;">${item.name || item.itemName}</td>
      <td style="padding: 10px; border: 1px solid #E2E8F0; color: #1E293B; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border: 1px solid #E2E8F0; color: #1E293B; text-align: right;">₹${Number(item.price).toFixed(2)}</td>
      <td style="padding: 10px; border: 1px solid #E2E8F0; color: #1E293B; text-align: right; font-weight: 500;">
        ₹${(Number(item.price) * Number(item.quantity)).toFixed(2)}
      </td>
    </tr>
  `).join('');

  // ---------------- EXTRA CHARGES ----------------
  const chargesHtml = charges.map(item => {
    const value = item.discountType === "amount"
      ? `₹ ${item.enteredValue}`
      : `${item.enteredValue}%`;

    const amountClass = item.type === "charge" ? "charge-positive" : "charge-negative";
    const sign = item.type === "charge" ? "+" : "-";

    return `
      <tr>
        <td style="padding: 10px; border: 1px solid #E2E8F0; color: #1E293B; text-transform: capitalize;">${item.type || "-"}</td>
        <td style="padding: 10px; border: 1px solid #E2E8F0; color: #1E293B;">${item.name}</td>
        <td style="padding: 10px; border: 1px solid #E2E8F0; color: #1E293B; text-align: center;">
          <span style="background: ${item.type === "charge" ? '#E8F5E9' : '#FEE2E2'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; color: ${item.type === "charge" ? '#0A4D3C' : '#EF4444'};">
            ${value}
          </span>
        </td>
        <td style="padding: 10px; border: 1px solid #E2E8F0; text-align: right; font-weight: 500; color: ${item.type === "charge" ? '#0A4D3C' : '#EF4444'};">
          ${sign} ₹${parseFloat(item.finalAmount).toFixed(2)}
        </td>
      </tr>
    `;
  }).join('');

  // Calculate subtotals
  const itemsTotal = items.reduce((sum, item) =>
    sum + (Number(item.price) * Number(item.quantity)), 0
  );

  const chargesTotal = charges.reduce((sum, item) => {
    const amount = parseFloat(item.finalAmount) || 0;
    return item.type === "charge" ? sum + amount : sum - amount;
  }, 0);

  // ---------------- HTML CONTENT ----------------
  const htmlContent = `
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          padding: 30px;
          background: #F8FAFC;
          color: #1E293B;
        }

        .bill-container {
          max-width: 800px;
          margin: 0 auto;
          background: #FFFFFF;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }

        .bill-content {
          padding: 30px;
        }

        .header-section {
          text-align: center;
          margin-bottom: 24px;
          position: relative;
        }

        .company-name {
          color: #0A4D3C;
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }

        .company-tagline {
          color: #64748B;
          font-size: 12px;
          letter-spacing: 1px;
          margin-bottom: 16px;
          text-transform: uppercase;
        }

        .business-name {
          color: #1E293B;
          font-size: 20px;
          font-weight: 600;
          margin: 16px 0 8px;
          text-transform: capitalize;
          padding-top: 16px;
          border-top: 1px dashed #E2E8F0;
        }

        .business-detail {
          color: #64748B;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 4px;
        }

        .divider {
          height: 2px;
          background: linear-gradient(90deg, transparent, #0A4D3C, transparent);
          margin: 24px 0;
        }

        .customer-section {
          background: #F8FAFC;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          border: 1px solid #E2E8F0;
        }

        .customer-name {
          color: #0A4D3C;
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
          text-transform: capitalize;
        }

        .info-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748B;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .bill-info {
          display: flex;
          justify-content: space-between;
          background: #F8FAFC;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          border: 1px solid #E2E8F0;
        }

        .bill-info-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bill-info-label {
          color: #64748B;
          font-size: 13px;
        }

        .bill-info-value {
          color: #0A4D3C;
          font-weight: 600;
          font-size: 14px;
        }

        .table-title {
          color: #0A4D3C;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        th {
          background: #0A4D3C;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 12px 10px;
          text-align: left;
        }

        th:first-child {
          padding-left: 16px;
        }

        th:last-child {
          padding-right: 16px;
        }

        td {
          padding: 12px 10px;
          border-bottom: 1px solid #E2E8F0;
          background: #FFFFFF;
          font-size: 13px;
        }

        td:first-child {
          padding-left: 16px;
        }

        td:last-child {
          padding-right: 16px;
        }

        .amount-cell {
          font-weight: 500;
          color: #1E293B;
        }

        .capitalize {
          text-transform: capitalize;
        }

        .summary-section {
          background: #F8FAFC;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #E2E8F0;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px dashed #E2E8F0;
        }

        .summary-row:last-child {
          border-bottom: none;
        }

        .summary-label {
          color: #64748B;
          font-size: 14px;
        }

        .summary-value {
          color: #1E293B;
          font-weight: 500;
          font-size: 14px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 16px 0 8px;
          border-top: 2px solid #0A4D3C;
          margin-top: 8px;
        }

        .total-label {
          color: #0A4D3C;
          font-size: 18px;
          font-weight: 700;
        }

        .total-value {
          color: #0A4D3C;
          font-size: 24px;
          font-weight: 800;
        }

        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #E2E8F0;
          color: #94A3B8;
          font-size: 12px;
        }

        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .badge-positive {
          background: #E8F5E9;
          color: #0A4D3C;
        }

        .badge-negative {
          background: #FEE2E2;
          color: #EF4444;
        }

        .charge-positive {
          color: #0A4D3C;
        }

        .charge-negative {
          color: #EF4444;
        }

        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          opacity: 0.03;
          font-size: 60px;
          color: #0A4D3C;
          font-weight: 900;
          white-space: nowrap;
          pointer-events: none;
          z-index: 0;
        }

        @media print {
          body {
            background: white;
            padding: 0;
          }
          .bill-container {
            box-shadow: none;
          }
        }
      </style>
    </head>

    <body>
      <div class="bill-container">
        <div class="bill-content">
          <!-- WATERMARK -->
          <div class="watermark">AQUA CREDIT</div>

          <!-- COMPANY HEADER -->
          <div class="header-section">
            <h1 class="company-name">AQUA CREDIT</h1>
            <div class="company-tagline">Digital Khata • Smart Business</div>

            <!-- BUSINESS DETAILS -->
            <h2 class="business-name">${userDetails?.name || 'Business Name'}</h2>
            ${userDetails?.address ? `
              <div class="business-detail">${(userDetails?.address || "").replace(/\n/g, '<br/>')}</div>
            ` : ''}
            <div class="business-detail">📞 ${userDetails?.mobile || 'N/A'}</div>
          </div>

          <div class="divider"></div>

          <!-- CUSTOMER DETAILS -->
          <div class="customer-section">
            <h2 class="customer-name">${customerInfo?.name || 'Customer Name'}</h2>
            ${customerInfo?.address ? `
              <div class="info-row">📍 ${(customerInfo?.address || "").replace(/\n/g, '<br/>')}</div>
            ` : ''}
            <div class="info-row">📞 ${customerInfo?.mobile || 'N/A'}</div>
          </div>

          <!-- BILL INFO -->
          <div class="bill-info">
            <div class="bill-info-item">
              <span class="bill-info-label">Bill No:</span>
              <span class="bill-info-value">${bill || 'N/A'}</span>
            </div>
            <div class="bill-info-item">
              <span class="bill-info-label">Date:</span>
              <span class="bill-info-value">${currentDate}</span>
            </div>
          </div>

          <!-- ITEMS TABLE -->
          <h3 class="table-title">📦 Items</h3>
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Item Name</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Rate (₹)</th>
                <th style="text-align: right;">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- CHARGES TABLE -->
          ${charges.length > 0 ? `
            <h3 class="table-title" style="margin-top: 30px;">💰 Extra Charges & Discounts</h3>
            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">Type</th>
                  <th style="text-align: left;">Name</th>
                  <th style="text-align: center;">Value</th>
                  <th style="text-align: right;">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${chargesHtml}
              </tbody>
            </table>
          ` : ''}

          <!-- SUMMARY -->
          <div class="summary-section">
            <div class="summary-row">
              <span class="summary-label">Items Subtotal</span>
              <span class="summary-value">₹ ${itemsTotal.toFixed(2)}</span>
            </div>

            ${charges.length > 0 ? `
              <div class="summary-row">
                <span class="summary-label">Charges & Discounts</span>
                <span class="summary-value" style="color: ${chargesTotal >= 0 ? '#0A4D3C' : '#EF4444'};">
                  ${chargesTotal >= 0 ? '+' : ''}₹ ${Math.abs(chargesTotal).toFixed(2)}
                </span>
              </div>
            ` : ''}

            <div class="total-row">
              <span class="total-label">Grand Total</span>
              <span class="total-value">₹ ${parseFloat(totalAmount).toFixed(2)}</span>
            </div>
          </div>

          <!-- FOOTER -->
          <div class="footer">
            <p>Thank you for your business!</p>
            <p style="margin-top: 4px;">This is a computer generated invoice from Aqua Credit</p>
            <p style="margin-top: 8px; font-size: 10px;">Powered by Aqua Credit • Digital Khata Solution</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false, // important for iOS
    });

    // Save inside app folder
    const fileName = `aqua-credit-bill-${Date.now()}.pdf`;
    const newUri = FileSystem.documentDirectory + fileName;

    await FileSystem.moveAsync({ from: uri, to: newUri });

    return {
      uri: newUri,
      name: fileName,
      type: "application/pdf",
    };

  } catch (err) {
    console.error("PDF generation failed:", err);
    return null;
  }
};

export default billPDF;