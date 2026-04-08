const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  
  if (!config.smtp.user || !config.smtp.pass) {
    console.warn('SMTP not configured — emails will be logged to console');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  const transport = getTransporter();
  
  if (!transport) {
    console.log('=== EMAIL (console fallback) ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}`);
    console.log('================================');
    return { messageId: 'console-fallback' };
  }

  const result = await transport.sendMail({
    from: config.smtp.from,
    to,
    subject,
    html,
  });

  return result;
};

const sendInviteEmail = async (email, inviteToken, businessName) => {
  const inviteUrl = `${config.frontend.url}/invite/${inviteToken}`;
  
  return sendEmail({
    to: email,
    subject: `You're invited to join ${businessName} on ShiftSync`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">ShiftSync</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">Employee Scheduling Made Simple</p>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px;">
          <h2 style="color: #333;">You've been invited!</h2>
          <p style="color: #555; line-height: 1.6;">
            <strong>${businessName}</strong> has invited you to join their team on ShiftSync. 
            Click the button below to create your account and start managing your shifts.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #999; font-size: 12px;">
            This invitation expires in 48 hours. If you didn't expect this email, you can ignore it.
          </p>
        </div>
      </div>
    `,
  });
};

const sendShiftReminderEmail = async (email, fullName, shifts) => {
  const shiftList = shifts
    .map(s => `<li><strong>${s.title}</strong> — ${s.start_time} to ${s.end_time}</li>`)
    .join('');

  return sendEmail({
    to: email,
    subject: "Your shifts for today — ShiftSync",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px 12px 0 0;">
          <h2 style="color: white; margin: 0;">⏰ Shift Reminder</h2>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="color: #333;">Hi <strong>${fullName}</strong>,</p>
          <p style="color: #555;">Here are your shifts for today:</p>
          <ul style="color: #555; line-height: 1.8;">${shiftList}</ul>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            Don't forget to clock in on time!
          </p>
        </div>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendInviteEmail, sendShiftReminderEmail };
