import { PrismaClient, Prisma } from '@prisma/client';

export class UsersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUserById(id: string, select?: Prisma.UserSelect) {
    return this.prisma.user.findUnique({
      where: { id },
      select
    });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput, select?: Prisma.UserSelect) {
    return this.prisma.user.update({
      where: { id },
      data,
      select
    });
  }

  async createOtp(email: string, code: string, purpose: string, expires_at: Date) {
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
}
