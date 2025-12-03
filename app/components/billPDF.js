// billPDF.js

import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';

const billPDF = async (userDetails, customerInfo, bill, items, charges, totalAmount) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // ---------------- ITEMS ----------------
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ccc;">${item.name || item.itemName}</td>
      <td style="padding: 8px; border: 1px solid #ccc;">${item.quantity}</td>
      <td style="padding: 8px; border: 1px solid #ccc;">${item.price}</td>
      <td style="padding: 8px; border: 1px solid #ccc;">
        ${Number(item.price) * Number(item.quantity)}
      </td>
    </tr>
  `).join('');

  // ---------------- EXTRA CHARGES ----------------
  const chargesHtml = charges.map(item => {
    const value = item.discountType === "charge"
      ? `Rs ${item.enteredValue}`
      : `${item.enteredValue}%`;

    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ccc;">${item.type || "-"}</td>
        <td style="padding: 8px; border: 1px solid #ccc;">${item.name}</td>
        <td style="padding: 8px; border: 1px solid #ccc;">${value}</td>
        <td style="padding: 8px; border: 1px solid #ccc;">${item.finalAmount}</td>
      </tr>
    `;
  }).join('');

  // ---------------- HTML CONTENT ----------------
  const htmlContent = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f2f2f2; border: 1px solid #ccc; padding: 8px; }
        td { border: 1px solid #ccc; padding: 8px; }
        .divider { background: #888; height: 3px; margin: 20px 0; }
      </style>
    </head>

    <body>

      <!-- BUSINESS DETAILS -->
      <div class="header">
        <h2>${userDetails?.name}</h2>
        <p>${(userDetails?.address || "").replace(/\n/g, '<br/>')}</p>
        <p>Mobile: ${userDetails?.mobile}</p>
        <p>Date: ${currentDate}</p>
      </div>

      <div class="divider"></div>

      <!-- CUSTOMER DETAILS -->
      <div class="header">
        <h2>${customerInfo?.name}</h2>
        <p>${(customerInfo?.address || "").replace(/\n/g, '<br/>')}</p>
        <p>Mobile: ${customerInfo?.mobile}</p>
      </div>

      <!-- ITEMS TABLE -->
      <h3>Items</h3>
      <table>
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- CHARGES TABLE -->
      ${charges.length > 0 ? `
      <h3 style="margin-top: 30px;">Extra Charges</h3>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Name</th>
            <th>Value</th>
            <th>Final Amount</th>
          </tr>
        </thead>
        <tbody>
          ${chargesHtml}
        </tbody>
      </table>
      ` : ''}

      <!-- GRAND TOTAL -->
      <h2 style="text-align: right; margin-top: 20px;">
        Grand Total: ₹ ${totalAmount}
      </h2>

    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false, // important for iOS
    });

    // Save inside app folder
    const fileName = `bill-${Date.now()}.pdf`;
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
