const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TARGET_EMAIL = process.env.TARGET_EMAIL || 'infinitewebsolutionss@gmail.com';
const OUTBOX_FILE = path.join(__dirname, 'data', 'email_outbox.json');

// Initialize Nodemailer Transporter if credentials exist
let transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_PASS !== 'your_gmail_app_password_here') {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  console.log(`📧 Nodemailer configured for live Gmail dispatch to ${TARGET_EMAIL}`);
} else {
  console.log(`ℹ️ SMTP credentials not fully configured in .env. Email notifications will be logged to outbox & console.`);
}

function logToOutbox(emailRecord) {
  try {
    let outbox = [];
    if (fs.existsSync(OUTBOX_FILE)) {
      outbox = JSON.parse(fs.readFileSync(OUTBOX_FILE, 'utf8'));
    }
    outbox.unshift(emailRecord);
    fs.writeFileSync(OUTBOX_FILE, JSON.stringify(outbox, null, 2));
  } catch (err) {
    console.error('Error writing to outbox:', err);
  }
}

/**
 * Send Quote Notification Email to infinitewebsolutionss@gmail.com
 */
async function sendQuoteNotification(quoteData) {
  const subject = `🚀 New Client Quote Request [${quoteData.id}] - ${quoteData.name}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #0f172a;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <div style="border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin: 0;">Infinite Web Solutions</h2>
          <p style="color: #10b981; font-weight: bold; margin: 4px 0 0 0;">New Client Quote Request Received</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #475569;">Reference ID:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #10b981;">${quoteData.id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Client Name:</td>
            <td style="padding: 8px 0;">${quoteData.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Client Email:</td>
            <td style="padding: 8px 0;"><a href="mailto:${quoteData.email}" style="color: #06b6d4;">${quoteData.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Primary Service:</td>
            <td style="padding: 8px 0;">${quoteData.service}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Add-on Modules:</td>
            <td style="padding: 8px 0;">${(quoteData.addons && quoteData.addons.length) ? quoteData.addons.join(', ') : 'None'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Estimated Budget:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #059669; font-size: 18px;">${quoteData.estimatedPrice}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Submitted At:</td>
            <td style="padding: 8px 0; color: #64748b;">${new Date(quoteData.createdAt).toLocaleString()}</td>
          </tr>
        </table>

        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center;">
          <a href="mailto:${quoteData.email}?subject=Re:%20Infinite%20Web%20Solutions%20Quote%20[${quoteData.id}]" style="background-color: #0f172a; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Reply to Client Directly</a>
        </div>

      </div>
    </div>
  `;

  const emailRecord = {
    id: quoteData.id,
    type: 'quote',
    to: TARGET_EMAIL,
    subject,
    html: htmlContent,
    sentAt: new Date().toISOString()
  };

  logToOutbox(emailRecord);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Infinite Web Solutions API" <${process.env.SMTP_USER}>`,
        to: TARGET_EMAIL,
        subject: subject,
        html: htmlContent
      });
      console.log(`✅ Live Gmail notification sent to ${TARGET_EMAIL} for quote ${quoteData.id}`);
      return { success: true, liveSent: true };
    } catch (err) {
      console.error(`❌ Failed to send live Gmail:`, err.message);
      return { success: true, liveSent: false, error: err.message };
    }
  }

  console.log(`📧 [EMAIL NOTIFICATION DISPATCHED TO ${TARGET_EMAIL}]`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Client: ${quoteData.name} <${quoteData.email}> | Price: ${quoteData.estimatedPrice}`);
  return { success: true, liveSent: false };
}

/**
 * Send Contact Message Notification Email
 */
async function sendContactNotification(contactData) {
  const subject = `📩 New Contact Message [${contactData.id}] - ${contactData.name}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #0f172a;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <div style="border-bottom: 2px solid #06b6d4; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin: 0;">Infinite Web Solutions</h2>
          <p style="color: #06b6d4; font-weight: bold; margin: 4px 0 0 0;">New Website Inquiry Received</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 140px; color: #475569;">Reference ID:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #06b6d4;">${contactData.id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Name:</td>
            <td style="padding: 8px 0;">${contactData.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email:</td>
            <td style="padding: 8px 0;"><a href="mailto:${contactData.email}">${contactData.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Phone:</td>
            <td style="padding: 8px 0;">${contactData.phone || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Service:</td>
            <td style="padding: 8px 0;">${contactData.service}</td>
          </tr>
        </table>

        <div style="background: #f8fafc; border-left: 4px solid #06b6d4; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">
          <h4 style="margin: 0 0 8px 0; color: #334155;">Message Details:</h4>
          <p style="margin: 0; color: #0f172a; line-height: 1.5;">${contactData.message}</p>
        </div>

        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center;">
          <a href="mailto:${contactData.email}?subject=Re:%20Infinite%20Web%20Solutions%20Inquiry%20[${contactData.id}]" style="background-color: #0f172a; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Reply to Client</a>
        </div>

      </div>
    </div>
  `;

  const emailRecord = {
    id: contactData.id,
    type: 'contact',
    to: TARGET_EMAIL,
    subject,
    html: htmlContent,
    sentAt: new Date().toISOString()
  };

  logToOutbox(emailRecord);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Infinite Web Solutions API" <${process.env.SMTP_USER}>`,
        to: TARGET_EMAIL,
        subject: subject,
        html: htmlContent
      });
      console.log(`✅ Live Gmail notification sent to ${TARGET_EMAIL} for contact ${contactData.id}`);
      return { success: true, liveSent: true };
    } catch (err) {
      console.error(`❌ Failed to send live Gmail:`, err.message);
      return { success: true, liveSent: false, error: err.message };
    }
  }

  console.log(`📧 [CONTACT NOTIFICATION DISPATCHED TO ${TARGET_EMAIL}]`);
  console.log(`   Subject: ${subject}`);
  console.log(`   From: ${contactData.name} <${contactData.email}>`);
  return { success: true, liveSent: false };
}

module.exports = {
  sendQuoteNotification,
  sendContactNotification,
  TARGET_EMAIL
};
