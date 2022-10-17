const nodemailer = require('nodemailer');


exports.SendEmail = (to, subject = '', html) => {
  let transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, // use SSL
    auth: {
      user: process.env.SMTP_USER_NAME,
      pass: process.env.SMTP_PASS
    }
  });

  const message = {
    from: process.env.SMTP_EMAIL,
    to: to,
    subject: subject,
    html: html
  };
  transport.sendMail(message, function (err, info) {
    if (err) {
      console.log(err)
    } else {
      console.log(info);
    }
  });
};