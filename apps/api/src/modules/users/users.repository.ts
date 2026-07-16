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
}
