// server/index.js
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors'); // For handling CORS
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (!match) return;
      const [, key, rawValue = ''] = match;
      if (!process.env[key]) {
        process.env[key] = rawValue.trim().replace(/^['"]|['"]$/g, '');
      }
    });
}

const app = express();
const PORT = process.env.PORT || 3002;
const recentMessages = new Map();
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');

    if (!origin || isLocalOrigin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  }
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true });
});

// Email sending route
app.post('/send-email', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const message = String(req.body.message || '').trim();

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }

  const messageHash = crypto
    .createHash('sha256')
    .update(`${name}|${email}|${message}`)
    .digest('hex');
  const now = Date.now();
  const previousSendTime = recentMessages.get(messageHash);

  if (previousSendTime && now - previousSendTime < 15000) {
    return res.status(200).json({ message: 'Duplicate message ignored' });
  }

  const yahooUser = String(process.env.YAHOO_USER || '').trim();
  const yahooAppPassword = String(process.env.YAHOO_APP_PASSWORD || '').replace(/\s/g, '');
  const recipientEmail = String(process.env.CONTACT_TO_EMAIL || yahooUser).trim();

  if (!yahooUser || !yahooAppPassword || !recipientEmail) {
    return res.status(500).json({ error: 'Email settings are not configured' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(yahooUser) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    return res.status(500).json({ error: 'Yahoo sender or contact recipient email is invalid' });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.mail.yahoo.com',
    port: 465,
    secure: true,
    auth: {
      user: yahooUser,
      pass: yahooAppPassword
    }
  });

  const mailOptions = {
    from: `"Vinmoore Website" <${yahooUser}>`,
    to: recipientEmail,
    envelope: {
      from: yahooUser,
      to: recipientEmail
    },
    subject: 'New Vinmoore website message',
    text: [
      'New message from the Vinmoore website.',
      '',
      `Name: ${name}`,
      `Customer email: ${email}`,
      '',
      'Message:',
      message
    ].join('\n')
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    recentMessages.set(messageHash, now);
    setTimeout(() => recentMessages.delete(messageHash), 15000);
    console.log('Email sent:', info.response);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      error: 'Error sending email',
      details: process.env.NODE_ENV === 'production' ? undefined : error.message,
      smtp: process.env.NODE_ENV === 'production' ? undefined : {
        code: error.code,
        command: error.command,
        responseCode: error.responseCode,
        response: error.response
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
