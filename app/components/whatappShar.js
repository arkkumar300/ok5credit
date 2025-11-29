import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

const sendWhatsappWithPDF = async (pdfUrl) => {
  try {
    // 1. Download PDF to device
    const fileUri = FileSystem.cacheDirectory + "file.pdf";
    await FileSystem.downloadAsync(pdfUrl, fileUri);

    // 2. Share using WhatsApp
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/pdf",
      dialogTitle: "Send PDF via WhatsApp",
      UTI: "public.pdf",
    });

  } catch (error) {
    console.log("Error sharing PDF:", error);
    alert("Unable to share PDF");
  }
};
export default sendWhatsappWithPDF;