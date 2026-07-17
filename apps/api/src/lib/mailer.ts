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
    console.error('[Email Error] Lỗi khi gửi OTP:', error);
    return false;
  }
};

export const sendNewAssignmentEmail = async (email: string, studentName: string, assignmentTitle: string, deadline: Date | null) => {
  const subject = `[Hệ thống học tập] Bài tập mới: ${assignmentTitle}`;
  const deadlineText = deadline ? `Hạn nộp: ${deadline.toLocaleString('vi-VN')}` : 'Không có hạn nộp';
  const html = `
    <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto;">
      <h3 style="color: #4f46e5;">Xin chào ${studentName},</h3>
      <p>Bạn vừa được giáo viên giao một bài tập mới: <strong>${assignmentTitle}</strong>.</p>
      <p style="color: #ef4444; font-weight: bold;">${deadlineText}</p>
      <p>Hãy đăng nhập vào hệ thống để hoàn thành bài tập nhé!</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"Hệ thống học tập" <no-reply@language-learning.com>',
      to: email,
      subject,
      html,
    });
    console.log(`[Email] Gửi thông báo bài tập mới thành công tới ${email}`);
  } catch (error) {
    console.error(`[Email Error] Không thể gửi thông báo bài tập mới tới ${email}:`, error);
  }
};

export const sendDeadlineReminderEmail = async (email: string, studentName: string, assignmentTitle: string, deadline: Date) => {
  const subject = `[Hệ thống học tập - Khẩn cấp] Bài tập sắp hết hạn: ${assignmentTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto;">
      <h3 style="color: #ef4444;">Xin chào ${studentName},</h3>
      <p>Bài tập <strong>${assignmentTitle}</strong> của bạn sẽ hết hạn vào lúc <strong style="color: #ef4444;">${deadline.toLocaleString('vi-VN')}</strong>.</p>
      <p>Hiện tại hệ thống ghi nhận bạn chưa hoàn thành bài tập này. Hãy nhanh chóng đăng nhập và hoàn thành trước khi hết hạn nhé!</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"Hệ thống học tập" <no-reply@language-learning.com>',
      to: email,
      subject,
      html,
    });
    console.log(`[Email] Gửi nhắc nhở hạn chót thành công tới ${email}`);
  } catch (error) {
    console.error(`[Email Error] Không thể gửi nhắc nhở hạn chót tới ${email}:`, error);
  }
};
