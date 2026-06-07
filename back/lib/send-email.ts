import nodemailer from 'nodemailer';
import { render } from '@react-email/render';

// Singleton transporter — создаётся один раз, не при каждом вызове
let _transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return _transporter;
}

export const sendEmail = async (to: string, subject: string, template: React.ReactElement) => {
  const transporter = getTransporter();

  // render() может быть async в новых версиях @react-email/render
  const html = await Promise.resolve(render(template));

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });

  return info;
};
