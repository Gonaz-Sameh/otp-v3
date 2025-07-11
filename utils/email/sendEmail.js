const nodemailer = require('nodemailer');
const Email = require('../../models/Email');

// Nodemailer
const sendEmail = async (options) => {
 
  const emails = await Email.find({organization : options.organizationId});
  console.log("emails : " , emails);
  console.log(" options.organizationId : " ,  options.organizationId);
  let email_host = null;
  let email_port = null;
  let email_user = null;
  let email_password = null;
  if(emails && emails.length >0 ){
    //untill now we depend on one email for org 
   email_host = emails[0]?.email_host;
   email_port = emails[0]?.email_port;
   email_user = emails[0]?.email_user;
   email_password = emails[0]?.decryptPassword();
  }else{
   email_host = process.env.EMAIL_HOST;
   email_port = process.env.EMAIL_PORT;
   email_user = process.env.EMAIL_USER;
   email_password = process.env.EMAIL_PASSWORD;
  }

  // 1) Create transporter ( service that will send email like "gmail","Mailgun", "mialtrap", sendGrid)
  const transporter = nodemailer.createTransport({
    host: email_host,
    port: email_port, // if secure false port = 587, if true port= 465
    secure: true,
    //service: 'gmail',
    auth: {
      user:email_user,
      pass:email_password,
    },
  });

  // 2) Define email options (like from, to, subject, email content)
  const mailOpts = {
    from: email_user,
    to: options.email,
    subject: options.subject,
    text: options.message, // Plain text body from the request body
    html: options.html // HTML body from the request body (optional)
  };

  // 3) Send email
  await transporter.sendMail(mailOpts);
};

module.exports = sendEmail;
