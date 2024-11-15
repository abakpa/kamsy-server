// server/index.js
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors'); // For handling CORS

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Email sending route
app.post('/send-email', (req, res) => {
  // const { name, email, message } = req.body;
  console.log(name,email,message)
  const recipientEmail = 'callmcjoe@gmail.com'; // Replace with recipient email

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'callmcjoe@gmail.com', // Replace with your email
      pass: 'kpshwjizfpbbgjwq'   // Replace with your email password or app password
    }
  });

  const mailOptions = {
    from: email,
    to: recipientEmail,
    subject: `New Contact Us Message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      res.status(500).send('Error sending email');
    } else {
      console.log('Email sent:', info.response);
      res.status(200).send('Email sent successfully');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
