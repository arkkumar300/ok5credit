import { View } from "react-native";

export const TERMS_CONTENT = `
Last Updated: ${new Date().toDateString()}

Welcome to OK Credit Ledger App.

By using this application, you agree to the following terms and conditions:

1. Purpose of the App
This app helps businesses and individuals record credit (you gave), payments (you got), and ledger transactions digitally. The app does not provide loans or financial guarantees.

2. User Responsibility
You are responsible for:
• Ensuring transaction entries are accurate
• Maintaining confidentiality of your account
• Verifying customer and supplier details

3. Data Accuracy
The app stores data exactly as entered by the user. We are not responsible for incorrect balances due to wrong entries.

4. Payments & Settlements
All payments and settlements recorded in the app are for reference only. Actual financial transactions happen outside the app.

5. Image Uploads
You may upload bill photos or payment proofs. You confirm that you have the right to upload such content.

6. Account Suspension
We reserve the right to suspend or deactivate accounts involved in misuse, fraud, or violation of these terms.

7. Limitation of Liability
We are not liable for any financial loss, disputes, or damages arising from the use of this app.

8. Changes to Terms
These terms may be updated from time to time. Continued use of the app means acceptance of updated terms.
`;

export const PRIVACY_CONTENT = `
Last Updated: ${new Date().toDateString()}

Your privacy is important to us.

1. Information We Collect
We may collect:
• Name, phone number, email
• Customer and supplier details
• Transaction records
• Uploaded images (bills, receipts)

2. How We Use Data
Your data is used to:
• Display ledger balances
• Maintain transaction history
• Improve app functionality

3. Data Storage & Security
We use secure servers and standard security practices to protect your data. However, no system is 100% secure.

4. Data Sharing
We do NOT sell or share your data with third parties, except when required by law.

5. User Control
You can update or delete your data from within the app. Deactivated accounts may retain records for legal compliance.

6. Permissions
Camera and storage permissions are used only for uploading transaction images.

7. Children’s Privacy
This app is intended for business use and not for children under 18.

8. Policy Updates
This policy may be updated. Continued use of the app implies acceptance of changes.
`;
const ConditionalPolicy = () => {

    return (
        <View>

            <LegalScreen
                title="Terms & Conditions"
                content={TERMS_CONTENT}
            />

            <LegalScreen
                title="Privacy Policy"
                content={PRIVACY_CONTENT}
            />
        </View>

    )
}

export default ConditionalPolicy;
