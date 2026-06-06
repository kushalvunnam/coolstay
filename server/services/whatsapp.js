const https = require('https');
const querystring = require('querystring');

/**
 * Sends a WhatsApp reminder to a tenant.
 * If Twilio credentials are provided, it attempts programmatic dispatch.
 * Otherwise, it logs to console and returns a direct WhatsApp click-to-chat link.
 */
exports.sendWhatsAppRentReminder = async ({ name, phone, billingMonth, amountDue, dueDate }) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

  // Format phone number to E.164 (without '+' for wa.me links, but with '+' for Twilio API)
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  // Default country code (e.g. India +91 if length is 10 digits)
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }
  const twilioToPhone = `whatsapp:+${cleanPhone}`;
  const directWaPhone = cleanPhone;

  // Build the message body
  const messageBody = `Hello *${name}*, this is a reminder from *CoolStay Management* 🏠.\n\nYour rent for the month of *${billingMonth}* is due. Please find the details below:\n\n💵 *Amount Due:* Rs. ${amountDue}\n📅 *Due Date:* ${new Date(dueDate).toLocaleDateString()}\n\nPlease pay online via the CoolStay app or at the management desk.\n\nThank you!`;

  const encodedMsg = encodeURIComponent(messageBody);
  const clickToChatUrl = `https://wa.me/${directWaPhone}?text=${encodedMsg}`;

  // Check if Twilio API keys are set up
  if (accountSid && authToken) {
    return new Promise((resolve) => {
      const postData = querystring.stringify({
        From: fromWhatsAppNumber,
        To: twilioToPhone,
        Body: messageBody
      });

      const options = {
        hostname: 'api.twilio.com',
        port: 4443,
        path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => { responseData += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[WhatsApp Service] programmatic dispatch success to ${phone}`);
            resolve({
              success: true,
              method: 'twilio',
              whatsappUrl: clickToChatUrl
            });
          } else {
            console.error(`[WhatsApp Service] Twilio API Error (Status ${res.statusCode}):`, responseData);
            resolve({
              success: false,
              method: 'none',
              error: `Twilio API Error status ${res.statusCode}`,
              whatsappUrl: clickToChatUrl
            });
          }
        });
      });

      req.on('error', (e) => {
        console.error('[WhatsApp Service] https connection error:', e);
        resolve({
          success: false,
          method: 'none',
          error: e.message,
          whatsappUrl: clickToChatUrl
        });
      });

      req.write(postData);
      req.end();
    });
  } else {
    // Return simulated details and the fallback link
    console.log(`\n================ SIMULATED WHATSAPP REMINDER ================`);
    console.log(`To: ${phone}`);
    console.log(`Message:\n${messageBody}`);
    console.log(`Fallback Link: ${clickToChatUrl}`);
    console.log(`=============================================================\n`);

    return {
      success: true,
      method: 'simulation',
      whatsappUrl: clickToChatUrl
    };
  }
};
