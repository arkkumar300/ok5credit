import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';

const billPDF = async (userDetails, customerInfo, bill,charges, items, totalAmount) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const itemsHtml = items.map((item, i) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ccc;">${item.name || item.itemName}</td>
      <td style="padding: 8px; border: 1px solid #ccc;">${item.quantity}</td>
      <td style="padding: 8px; border: 1px solid #ccc;">${item.price}</td>
      <td style="padding: 8px; border: 1px solid #ccc;">${Number(item.price) * Number(item.quantity)}</td>
    </tr>
  `).join('');

  const chargesHtml = items.map((item, i) => `
    <tr>
    <td style="padding: 8px; border: 1px solid #ccc;">${item.type}</td>
      <td style="padding: 8px; border: 1px solid #ccc;">${item.name || item.itemName}</td>
      <td style="padding: 8px; border: 1px solid #ccc;">${Number(item.discountType==="charge"? " Rs " :  " % "), Number(item.discountType)}</td>
      <td style="padding: 8px; border: 1px solid #ccc;">${item.finalAmount}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .divider {
          text-align: center;
          margin-bottom: 10px;
          width: 100%;
          background-color: #aaaaaa;
          height: 3px;
        }

        .info, .items {
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          background: #f2f2f2;
          border: 1px solid #ccc;
          padding: 8px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>${userDetails?.name}</h2>
        <p>${userDetails?.address?.replace(/\n/g, '<br/>')}</p>
        <p>Mobile: ${userDetails?.mobile}</p>
        <p>Date: ${currentDate}</p>
      </div>
      <div class="divider"></div>
      <div class="header">
        <h2>${customerInfo?.name}</h2>
        <p>${customerInfo?.address?.replace(/\n/g, '<br/>')}</p>
        <p>Mobile: ${customerInfo?.mobile}</p>
        <p>Date: ${currentDate}</p>
      </div>

      <div class="items">
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tbody>
            ${chargesHtml}
          </tbody>
        </table>
        <h3 style="text-align: right;">Grand Total: ₹ ${totalAmount}</h3>
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });

    // Optional: move to app's document directory and rename
    const fileName = `bill-${Date.now()}.pdf`;
    const newUri = FileSystem.documentDirectory + fileName;
    await FileSystem.moveAsync({ from: uri, to: newUri });

    return {
      uri: newUri,
      name: fileName,
      type: 'application/pdf'
    };
  } catch (err) {
    console.error("PDF generation failed:", err);
    return null;
  }
};

export default billPDF;