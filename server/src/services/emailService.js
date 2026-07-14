const nodemailer = require('nodemailer');

// We will initialize the transporter asynchronously if using Ethereal
let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Ethereal test account
    console.log('[EmailService] SMTP_HOST not found. Generating Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    console.log('[EmailService] Ethereal test account created.');
  }

  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailTransporter = await getTransporter();
    const fromEmail = process.env.FROM_EMAIL || 'noreply@rentflatmatefinder.com';
    
    const info = await mailTransporter.sendMail({
      from: `"Rent Flatmate Finder" <${fromEmail}>`,
      to,
      subject,
      html
    });

    // Only log if we are NOT running Jest tests to prevent async bleeding
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[EmailService] Email sent to ${to}: ${info.messageId}`);
      
      // If we are using ethereal, print the test message URL so we can view it
      if (!process.env.SMTP_HOST) {
        console.log(`[EmailService] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    }
  } catch (error) {
    // Non-blocking fault tolerance: log the error but don't throw
    console.error(`[EmailService] Failed to send email to ${to}. Error:`, error.message);
  }
};

const notifyOwnerNewInterest = (ownerEmail, ownerName, tenantName, listingTitle) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4F46E5;">New Interest in Your Listing!</h2>
        <p>Hello ${ownerName},</p>
        <p><strong>${tenantName}</strong> has expressed interest in your listing: <strong>${listingTitle}</strong>.</p>
        <p>Log in to your dashboard to review their profile and make a decision.</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Go to Dashboard</a>
    </div>
  `;
  sendEmail({ to: ownerEmail, subject: 'New Interest in Your Listing', html });
};

const notifyOwnerHighCompatibilityInterest = (ownerEmail, ownerName, tenantName, listingTitle, score) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4F46E5;">High Compatibility Match!</h2>
        <p>Hello ${ownerName},</p>
        <p><strong>${tenantName}</strong> is highly compatible with your listing: <strong>${listingTitle}</strong>.</p>
        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 18px;"><strong>Compatibility Score:</strong> ${score}/100</p>
        </div>
        <p>Log in to your dashboard to review their profile.</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Go to Dashboard</a>
    </div>
  `;
  sendEmail({ to: ownerEmail, subject: 'Highly Compatible Tenant Interested!', html });
};

const notifyTenantRequestAccepted = (tenantEmail, tenantName, ownerName, listingTitle, contactInfo) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #10B981;">Interest Accepted!</h2>
        <p>Hello ${tenantName},</p>
        <p>Great news! <strong>${ownerName}</strong> has accepted your interest for <strong>${listingTitle}</strong>.</p>
        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Owner Contact Info:</strong> ${contactInfo}</p>
        </div>
        <p>You can now log in and chat with them or contact them directly.</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Go to Dashboard</a>
    </div>
  `;
  sendEmail({ to: tenantEmail, subject: 'Your Interest Was Accepted!', html });
};

const notifyTenantRequestDeclined = (tenantEmail, tenantName, listingTitle) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #EF4444;">Interest Update</h2>
        <p>Hello ${tenantName},</p>
        <p>Unfortunately, your interest for <strong>${listingTitle}</strong> was declined by the owner.</p>
        <p>Don't worry, there are plenty of other great listings available on our platform.</p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/listings" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Browse More Listings</a>
    </div>
  `;
  sendEmail({ to: tenantEmail, subject: 'Update on Your Interest Request', html });
};

module.exports = {
  notifyOwnerNewInterest,
  notifyOwnerHighCompatibilityInterest,
  notifyTenantRequestAccepted,
  notifyTenantRequestDeclined
};
