require('dotenv').config();
const nodemailer = require('nodemailer');

const testSMTP = async () => {
  console.log('Testing SMTP connection...');
  console.log('HOST:', process.env.SMTP_HOST);
  console.log('USER:', process.env.SMTP_USER || 'MISSING');
  console.log('PASS:', process.env.SMTP_PASS ? '********' : 'MISSING');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n❌ ERROR: You must open the backend/.env file and fill out SMTP_USER and SMTP_PASS first.');
    console.log('If you are using Gmail, you need to generate an "App Password" to use here.\n');
    process.exit(1);
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection configuration
    await transporter.verify();
    console.log('\n✅ Server is ready to take our messages. SMTP Connected Successfully!');

    // Optionally send a test email
    const info = await transporter.sendMail({
      from: `"ShiftSync" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // sending it to yourself!
      subject: "Hello from ShiftSync System Testing ✔", 
      text: "If you received this, Nodemailer is working perfectly in ShiftSync!", 
    });

    console.log('\n✅ Test email sent perfectly! Message ID: %s', info.messageId);

  } catch (err) {
    console.error('\n❌ SMTP Connection Failed:', err.message);
  }
};

testSMTP();
