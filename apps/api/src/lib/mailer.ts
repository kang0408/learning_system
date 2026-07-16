import nodemailer from 'nodemailer';
import { config } from '../config';

// Create a reusable transporter object using the default SMTP transport
// In a real application, you would configure this with actual SMTP credentials (e.g., AWS SES, SendGrid)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for port 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'test@ethereal.email',
    pass: process.env.SMTP_PASS || 'password',
  },
});

export const sendOTP = async (email: string, code: string, purpose: 'register' | 'forgot_password') => {
  const subject = purpose === 'register' 
    ? 'Xác thực đăng ký tài khoản' 
    : 'Yêu cầu khôi phục mật khẩu';
    
  const text = purpose === 'register'
    ? `Mã OTP xác thực đăng ký của bạn là: ${code}. Mã này có hiệu lực trong 5 phút.`
    : `Mã OTP khôi phục mật khẩu của bạn là: ${code}. Mã này có hiệu lực trong 5 phút.`;

  try {
    const info = await transporter.sendMail({
      from: '"Hệ thống học tập" <no-reply@language-learning.com>',
      to: email,
      subject,
      text,
    });
    
    // Log URL for ethereal testing
    if (process.env.NODE_ENV !== 'production' && info.messageId) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
