import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Setup Nodemailer Transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export const sendOtpEmail = async (toEmail: string, recipientName: string, otp: string): Promise<boolean> => {
  const isSmtpConfigured = 
    !!(EMAIL_USER && EMAIL_PASS) && 
    EMAIL_USER !== 'your-gmail-username@gmail.com' && 
    EMAIL_PASS !== 'your-gmail-app-password';

  if (!isSmtpConfigured) {
    // Development fallback (if credentials are empty)
    if (NODE_ENV !== 'production') {
      console.warn(`[SMTP Email Warning] EMAIL_USER or EMAIL_PASS not set. Falling back to local terminal logs.`);
      console.log(`[Verification EMAIL Mock] To: ${toEmail} | Name: ${recipientName} | OTP Code: ${otp}`);
      return true;
    } else {
      console.error(`[SMTP Email Error] Credentials missing in production. Cannot dispatch OTP to ${toEmail}.`);
      throw new Error('Email delivery is unconfigured. Contact support.');
    }
  }

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #070A13; color: #E2E8F0; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.08);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px; margin: 0; font-weight: 800; letter-spacing: 1px;">AptitudeAI</h2>
        <p style="color: #94A3B8; font-size: 14px; margin-top: 5px;">Interactive Aptitude & Logic Learning Platform</p>
      </div>
      
      <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 30px; border-radius: 8px;">
        <h3 style="color: #FFFFFF; font-size: 18px; margin-top: 0; font-weight: 700;">Confirm Your Account, ${recipientName}!</h3>
        <p style="color: #94A3B8; font-size: 13px; line-height: 1.6;">
          Thank you for registering on AptitudeAI. To verify your email and activate your student dashboard workspace, please enter the 6-digit OTP code below:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; color: #8B5CF6; letter-spacing: 8px; border: 1px dashed rgba(139, 92, 246, 0.4); padding: 12px 24px; border-radius: 6px; background-color: rgba(139, 92, 246, 0.05); display: inline-block;">
            ${otp}
          </span>
          <p style="color: #64748B; font-size: 11px; margin-top: 10px;">This OTP will expire in <strong>10 minutes</strong>.</p>
        </div>
        
        <p style="color: #94A3B8; font-size: 12px; line-height: 1.5; margin-bottom: 0;">
          If you did not initiate this request, you can safely ignore this email. Your account will remain inactive until verified.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 35px; border-t: 1px solid rgba(255,255,255,0.05); padding-top: 20px; color: #475569; font-size: 11px;">
        <p style="margin: 0;">© 2026 AptitudeAI CSE Major Project. All Rights Reserved.</p>
      </div>
    </div>
  `;

  try {
    const mailOptions = {
      from: `"AptitudeAI Support" <${EMAIL_USER}>`,
      to: toEmail,
      subject: 'Verify your account - AptitudeAI Platform',
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error(`[SMTP Email Error] Failed to send email to ${toEmail}:`, error);
    throw new Error('Email dispatcher failed. Try resending.');
  }
};
