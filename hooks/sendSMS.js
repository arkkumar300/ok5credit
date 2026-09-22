// Send OTP via SMS Gateway
export const sendSMS = async (mobile, otp) => {
  
    const message = encodeURIComponent(
      `AquaCredit: Your Login OTP is ${otp}. Please do not share it with anyone.
  It is valid for 10 minutes - SIKHI SERVICES.`
    );
  
    const url = `https://smslogin.co/v3/api.php?username=SIKHISERVICES&apikey=4f841d38d93faea3a7c2&mobile=${mobile}&senderid=SSSVLD&message=${message}&templateid=1407176310035661372`;
  
    const response = await fetch(url);
    return response.text(); // API returns plain text / xml
  };
  

  export const sendTransaction = async (
    mobile,
    customerName,
    amount,
    userName,
    invoiceQuery
  ) => {
    // Build invoice URL using the URL registered in the SMS template
    const invoiceUrl = `https://admin.aquacredit.in/bill.html?id=${encodeURIComponent(
      invoiceQuery
    )}`;
  
    // Message must match the DLT/template text
    const message = `AquaCredit: Dear ${customerName}, approve bill ${amount}/- from ${userName}. Visit: ${invoiceUrl} -SIKHI SERVICES`;
  
    // Encode message for API request
    const encodedMessage = encodeURIComponent(message);
  
    // Construct SMS API URL
    const url =
      `https://smslogin.co/v3/api.php` +
      `?username=SIKHISERVICES` +
      `&apikey=4f841d38d93faea3a7c2` +
      `&mobile=${encodeURIComponent(mobile)}` +
      `&senderid=SSSVLD` +
      `&message=${encodedMessage}` +
      `&templateid=1477178903143180752`;
  
    const response = await fetch(url);
  
    if (!response.ok) {
      throw new Error(`SMS API failed: ${response.status}`);
    }
  
    return response.text();
  };
  