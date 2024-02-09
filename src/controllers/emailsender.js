import nodemailer from 'nodemailer';
import dotenv from "dotenv";

dotenv.config();

// Настройте транспорт для nodemailer
const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com", // SMTP сервер Outlook
    port: 587, // Стандартный порт для SMTP
    secure: false, // true для порта 465, false для других портов
    auth: {
      user: process.env.USN, // Ваш адрес электронной почты Outlook
      pass: process.env.PWD // Ваш пароль от почты
    },
    tls: {
      ciphers:'SSLv3'
    }
  });


// Функция отправки электронного письма
export async function sendEmail({ to, subject, text, html }) {
  const mailOptions = {
    from: process.env.USN,
    to,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.log(mailOptions);
    console.error('Error sending email:', error);
  }
}