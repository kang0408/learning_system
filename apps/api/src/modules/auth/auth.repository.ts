import { PrismaClient, User } from '@prisma/client';

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: any): Promise<Pick<User, 'id' | 'email' | 'full_name' | 'role'>> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password_hash: data.password_hash,
        full_name: data.full_name,
        role: data.role
      },
      select: { id: true, email: true, full_name: true, role: true }
    });
  }

  async createOtp(email: string, code: string, purpose: string, expires_at: Date) {
    // Invalidate previous OTPs for this email and purpose
    await this.prisma.otpCode.updateMany({
      where: { email, purpose, is_used: false },
      data: { is_used: true }
    });

    return this.prisma.otpCode.create({
      data: { email, code, purpose, expires_at }
    });
  }

  async findValidOtp(email: string, code: string, purpose: string) {
    return this.prisma.otpCode.findFirst({
      where: {
        email,
        code,
        purpose,
        is_used: false,
        expires_at: { gt: new Date() }
      }
    });
  }

  async markOtpAsUsed(id: string) {
    return this.prisma.otpCode.update({
      where: { id },
      data: { is_used: true }
    });
  }

  async updateUserPassword(email: string, password_hash: string) {
    return this.prisma.user.update({
      where: { email },
      data: { password_hash }
    });
  }
}
