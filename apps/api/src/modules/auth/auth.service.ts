import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository';
import { config } from '../../config';
import { ApiError } from '../../lib/ApiError';
import { sendOTP } from '../../lib/mailer';

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendRegistrationOtp(data: { email: string }) {
    const existing = await this.authRepository.findUserByEmail(data.email);
    if (existing) {
      throw new ApiError(400, 'Email already exists');
    }

    const code = this.generateOTP();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    await this.authRepository.createOtp(data.email, code, 'register', expires_at);
    
    await sendOTP(data.email, code, 'register');
    
    return { success: true, message: 'OTP sent successfully' };
  }

  async register(data: any) {
    const existing = await this.authRepository.findUserByEmail(data.email);
    if (existing) {
      throw new ApiError(400, 'Email already exists');
    }

    // Verify OTP
    const validOtp = await this.authRepository.findValidOtp(data.email, data.code, 'register');
    if (!validOtp) {
      throw new ApiError(400, 'Mã OTP không hợp lệ hoặc đã hết hạn');
    }
    
    const password_hash = await bcrypt.hash(data.password, 10);
    
    const user = await this.authRepository.createUser({
      ...data,
      password_hash
    });

    // Mark OTP as used
    await this.authRepository.markOtpAsUsed(validOtp.id);
    
    return user;
  }

  async login(data: any) {
    const user = await this.authRepository.findUserByEmail(data.email);
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Check if account is deactivated or soft-deleted
    if (user.deleted_at || user.is_active === false) {
      throw new ApiError(403, 'Tài khoản của bạn đã bị vô hiệu hóa hoặc xóa khỏi hệ thống');
    }
    
    const isValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isValid) {
      throw new ApiError(401, 'Invalid credentials');
    }
    
    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      config.auth.jwtSecret, 
      { expiresIn: '7d' }
    );
    
    return { token, user: { id: user.id, email: user.email, role: user.role } };
  }

  async forgotPassword(data: { email: string }) {
    const user = await this.authRepository.findUserByEmail(data.email);
    if (!user) {
      return { success: true, message: 'If email exists, OTP has been sent' };
    }

    const code = this.generateOTP();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    await this.authRepository.createOtp(data.email, code, 'forgot_password', expires_at);
    
    await sendOTP(data.email, code, 'forgot_password');
    
    return { success: true, message: 'OTP sent successfully' };
  }

  async verifyResetOtp(data: { email: string; code: string }) {
    const validOtp = await this.authRepository.findValidOtp(data.email, data.code, 'forgot_password');
    if (!validOtp) {
      throw new ApiError(400, 'Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    const reset_token = jwt.sign(
      { email: data.email, purpose: 'reset_password' },
      config.auth.jwtSecret,
      { expiresIn: '15m' }
    );

    // Mark OTP as used because we've converted it to a token
    await this.authRepository.markOtpAsUsed(validOtp.id);

    return { success: true, reset_token };
  }

  async resetPassword(data: any) {
    try {
      const payload = jwt.verify(data.reset_token, config.auth.jwtSecret) as { email: string, purpose: string };
      if (payload.purpose !== 'reset_password') {
        throw new Error('Invalid token purpose');
      }

      const password_hash = await bcrypt.hash(data.new_password, 10);
      await this.authRepository.updateUserPassword(payload.email, password_hash);

      return { success: true, message: 'Mật khẩu đã được đặt lại thành công' };
    } catch (error) {
      throw new ApiError(400, 'Token không hợp lệ hoặc đã hết hạn');
    }
  }

  async sendChangePasswordOtp(userId: string) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const code = this.generateOTP();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    await this.authRepository.createOtp(user.email, code, 'change_password', expires_at);
    
    await sendOTP(user.email, code, 'forgot_password');
    
    return { success: true, message: 'OTP sent successfully' };
  }

  async changePassword(userId: string, data: any) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Verify OTP
    const validOtp = await this.authRepository.findValidOtp(user.email, data.code, 'change_password');
    if (!validOtp) {
      throw new ApiError(400, 'Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    const isValid = await bcrypt.compare(data.old_password, user.password_hash);
    if (!isValid) {
      throw new ApiError(401, 'Mật khẩu cũ không chính xác');
    }

    const password_hash = await bcrypt.hash(data.new_password, 10);
    await this.authRepository.updateUserPassword(user.email, password_hash);
    
    // Mark OTP as used
    await this.authRepository.markOtpAsUsed(validOtp.id);

    return { success: true, message: 'Đổi mật khẩu thành công' };
  }
}
