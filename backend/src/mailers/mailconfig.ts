import * as nodemailer from "nodemailer";
import * as dotenv from "dotenv";
dotenv.config();

export default async function mailBoiler(
  receiver: string,
  message: string,
  subject: string
): Promise<void> {
  console.log("Sending mail to", receiver);
  console.log(process.env.SMTP_USER);
  console.log(process.env.SMTP_PASS);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: true, // only in dev
    },
  });

  const mailOptions = {
  from: `"AVP Academy Mailer" <${process.env.SMTP_USER}>`,
  replyTo: "info@avpsiddhaacedamy.com", 
    to: receiver,
    subject,
    html: message,
  };
  console.log(mailOptions.from, mailOptions.to);

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
