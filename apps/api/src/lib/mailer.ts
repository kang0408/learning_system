import nodemailer from 'nodemailer';

// Helper to create appropriate transporter
const getTransporter = () => {
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

export const sendOTP = async (email: string, code: string, purpose: 'register' | 'forgot_password') => {
  console.log(`🔑 [OTP Server Log] Mã xác thực gửi tới ${email} (${purpose}): [ ${code} ]`);
  
  const subject = purpose === 'register' 
    ? 'Xác thực đăng ký tài khoản' 
    : 'Yêu cầu khôi phục mật khẩu';
    
  const text = purpose === 'register'
    ? `Mã OTP xác thực đăng ký của bạn là: ${code}. Mã này có hiệu lực trong 5 phút.`
    : `Mã OTP khôi phục mật khẩu của bạn là: ${code}. Mã này có hiệu lực trong 5 phút.`;

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to: email,
      subject,
      text,
    });
    
    console.log(`✅ [Email] Đã gửi OTP thành công tới ${email}: ${info.response || info.messageId}`);
    return true;
  } catch (error) {
    console.error('[Email Error] Lỗi khi gửi OTP qua SMTP:', error);
    return false;
  }
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

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromAddress(),
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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h3 style="color: #ef4444;">Xin chào ${studentName},</h3>
      <p>Bài tập <strong>${assignmentTitle}</strong> của bạn sẽ hết hạn vào lúc <strong style="color: #ef4444;">${deadline.toLocaleString('vi-VN')}</strong>.</p>
      <p>Hiện tại hệ thống ghi nhận bạn chưa hoàn thành bài tập này. Hãy nhanh chóng đăng nhập và hoàn thành trước khi hết hạn nhé!</p>
    </div>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: getFromAddress(),
      to: email,
      subject,
      html,
    });
    console.log(`[Email] Gửi nhắc nhở hạn chót thành công tới ${email}`);
  } catch (error) {
    console.error(`[Email Error] Không thể gửi nhắc nhở hạn chót tới ${email}:`, error);
  }
};
