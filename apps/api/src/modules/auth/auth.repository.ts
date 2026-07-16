import { PrismaClient, User } from '@prisma/client';

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
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
}
