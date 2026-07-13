const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Sends an email (best-effort, non-blocking)
 * @param {Object} options 
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Rent Flatmate Finder" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`[EmailService] Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${to}. Error:`, error.message);
  }
};

const getHighCompatibilityTemplate = (score, clientUrl) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4F46E5;">Great news!</h2>
        <p>A highly compatible tenant is interested in your listing.</p>
        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Compatibility Score:</strong> ${score}/100</p>
        </div>
        <p>Log in to your dashboard to review their profile and accept or decline their request.</p>
        <a href="${clientUrl}/dashboard" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
    </div>
  `;
};

const getDecisionOutcomeTemplate = (status, clientUrl) => {
  const color = status === 'accepted' ? '#10B981' : '#EF4444';
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: ${color};">Interest ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
        <p>Your interest request for a listing has been <strong>${status}</strong> by the owner.</p>
        <p>Log in to your dashboard for more details.</p>
        <a href="${clientUrl}/dashboard" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
    </div>
  `;
};

module.exports = {
  sendEmail,
  getHighCompatibilityTemplate,
  getDecisionOutcomeTemplate
};
