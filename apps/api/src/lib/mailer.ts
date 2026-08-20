import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Initialize Resend if API key exists
const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Helper to create appropriate SMTP transporter fallback
const getSmtpTransporter = () => {
  const isGmail = 
    process.env.SMTP_HOST?.includes('gmail') || 
    process.env.SMTP_USER?.endsWith('@gmail.com');

  if (isGmail && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER || 'test@ethereal.email',
      pass: process.env.SMTP_PASS || 'password',
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
  });
};

const getFromAddress = () => {
  const user = process.env.SMTP_USER || 'no-reply@language-learning.com';
  return `"Hệ thống học tập" <${user}>`;
};

// Generic mail dispatcher supporting Resend (HTTPS) & SMTP fallback
const dispatchMail = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<boolean> => {
  // Priority 1: Resend HTTP API (Port 443 - Perfect for Cloud like Railway / Vercel)
  if (resendClient) {
    try {
      const from = process.env.RESEND_FROM || 'onboarding@resend.dev';
      const result = await resendClient.emails.send({
        from: `Hệ thống học tập <${from}>`,
        to: [to],
        subject,
        text: text || '',
        html: html || undefined,
      });

      if (result.error) {
        console.error('[Resend Error] Gửi mail thất bại:', result.error);
        return false;
      }

      console.log(`✅ [Resend] Đã gửi mail thành công tới ${to} (ID: ${result.data?.id})`);
      return true;
    } catch (err) {
      console.error('[Resend Error] Ngoại lệ khi gọi Resend API:', err);
      return false;
    }
  }

  // Priority 2: SMTP / Nodemailer fallback
  try {
    const transporter = getSmtpTransporter();
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject,
      text,
      html,
    });
    console.log(`✅ [SMTP] Đã gửi mail thành công tới ${to}: ${info.response || info.messageId}`);
    return true;
  } catch (error) {
    console.error('[Email Error] Lỗi khi gửi mail qua SMTP:', error);
    return false;
  }
};

export const sendOTP = async (email: string, code: string, purpose: 'register' | 'forgot_password') => {
  console.log(`🔑 [OTP Server Log] Mã xác thực gửi tới ${email} (${purpose}): [ ${code} ]`);
  
  const subject = purpose === 'register' 
    ? 'Xác thực đăng ký tài khoản' 
    : 'Yêu cầu khôi phục mật khẩu';
    
  const text = purpose === 'register'
    ? `Mã OTP xác thực đăng ký của bạn là: ${code}. Mã này có hiệu lực trong 5 phút.`
    : `Mã OTP khôi phục mật khẩu của bạn là: ${code}. Mã này có hiệu lực trong 5 phút.`;

  return dispatchMail({
    to: email,
    subject,
    text,
  });
};

export const sendNewAssignmentEmail = async (email: string, studentName: string, assignmentTitle: string, deadline: Date | null) => {
  const subject = `[Hệ thống học tập] Bài tập mới: ${assignmentTitle}`;
  const deadlineText = deadline ? `Hạn nộp: ${deadline.toLocaleString('vi-VN')}` : 'Không có hạn nộp';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h3 style="color: #4f46e5;">Xin chào ${studentName},</h3>
      <p>Bạn vừa được giáo viên giao một bài tập mới: <strong>${assignmentTitle}</strong>.</p>
      <p style="color: #ef4444; font-weight: bold;">${deadlineText}</p>
      <p>Hãy đăng nhập vào hệ thống để hoàn thành bài tập nhé!</p>
    </div>
  `;

  return dispatchMail({
    to: email,
    subject,
    html,
  });
};

export const sendDeadlineReminderEmail = async (email: string, studentName: string, assignmentTitle: string, deadline: Date) => {
  const subject = `[Hệ thống học tập - Khẩn cấp] Bài tập sắp hết hạn: ${assignmentTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h3 style="color: #ef4444;">Xin chào ${studentName},</h3>
      <p>Bài tập <strong>${assignmentTitle}</strong> của bạn sẽ hết hạn vào lúc <strong style="color: #ef4444;">${deadline.toLocaleString('vi-VN')}</strong>.</p>
      <p>Hiện tại hệ thống ghi nhận bạn chưa hoàn thành bài tập này. Hãy nhanh chóng đăng nhập và hoàn thành trước khi hết hạn nhé!</p>
    </div>
  `;

  return dispatchMail({
    to: email,
    subject,
    html,
  });
};
