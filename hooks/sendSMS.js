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
  

  export const sendTransaction = async (mobile, customerName, amount, userName, invoiceQuery) => {
    // Build full URL with query string
    const invoiceUrl = `https://aquaadmin.esotericprojects.tech/bill.html?id=${encodeURIComponent(invoiceQuery)}`;
  
    // Build message according to template
    const message = `AquaCredit: Hello ${customerName}, to approve the quotation of ${amount} from ${userName},\nplease visit ${invoiceUrl}\n-SIKHI SERVICES`;
  
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
  
    // Construct final SMS API URL
    const url = `https://smslogin.co/v3/api.php?username=SIKHISERVICES&apikey=4f841d38d93faea3a7c2&mobile=${mobile}&senderid=SSSVLD&message=${encodedMessage}&templateid=1407176647106245979`;
  
    console.log("SMS URL:", url);
  
    const response = await fetch(url);
    return response.text();
  };
  