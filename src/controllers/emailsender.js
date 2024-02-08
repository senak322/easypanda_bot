import nodemailer from 'nodemailer';
import dotenv from "dotenv";

dotenv.config();

// Настройте транспорт для nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Используйте вашу почтовую службу, например Gmail
  auth: {
    user: process.env.USN, // Ваш адрес электронной почты
    pass: process.env.PWD, // Ваш пароль от почты
  },
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