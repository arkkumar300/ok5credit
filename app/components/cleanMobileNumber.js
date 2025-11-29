const  cleanMobileNumber = (number) => {
    if (!number) return "";
  console.log("rrr::",number)
    // Remove all non-numeric characters
    let cleaned = number.replace(/\D/g, "");
  
    // Remove leading country code (91 or 091 or +91 etc.)
    if (cleaned.startsWith("91") && cleaned.length > 10) {
      cleaned = cleaned.substring(cleaned.length - 10);
    }
  
    // If number is still more than 10 digits, take last 10 digits
    if (cleaned.length > 10) {
      cleaned = cleaned.slice(-10);
    }
  
    return cleaned;
  };

  export default cleanMobileNumber;
