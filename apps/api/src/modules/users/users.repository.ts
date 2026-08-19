import { PrismaClient, Prisma } from '@prisma/client';

export class UsersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUserById(id: string, select?: Prisma.UserSelect) {
    return this.prisma.user.findUnique({
      where: { id },
      select
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  async findUsersPaginated(params: {
    skip: number;
    take: number;
    role?: string;
    is_active?: boolean;
    search?: string;
  }) {
    const where: Prisma.UserWhereInput = {};
    if (params.role) where.role = params.role;
    
    if (params.is_active === false) {
      where.OR = [
        { is_active: false },
        { deleted_at: { not: null } }
      ];
    } else if (params.is_active === true) {
      where.is_active = true;
      where.deleted_at = null;
    }
    // If params.is_active is undefined, no deleted_at filter is applied so all users (including soft deleted) are returned to Admin

    if (params.search) {
      const searchFilter: Prisma.UserWhereInput[] = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { full_name: { contains: params.search, mode: 'insensitive' } },
      ];
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchFilter }
        ];
        delete where.OR;
      } else {
        where.OR = searchFilter;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true,
          avatar_url: true,
          phone: true,
          address: true,
          is_active: true,
          deleted_at: true,
          created_at: true,
          updated_at: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  async findUserDetailById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        avatar_url: true,
        phone: true,
        address: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        _count: {
          select: {
            classes: true,
            class_members: true,
            questions: true,
            quiz_sessions: true,
            assignments: true,
          },
        },
      },
    });
  }

  async createUser(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        phone: true,
        address: true,
        is_active: true,
        created_at: true,
      },
    });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput, select?: Prisma.UserSelect) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: select || {
        id: true,
        email: true,
        full_name: true,
        role: true,
        phone: true,
        address: true,
        is_active: true,
        updated_at: true,
      },
    });
  }

  async softDeleteUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        is_active: false,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
        deleted_at: true,
      },
    });
  }

  async restoreUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        deleted_at: null,
        is_active: true,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
        deleted_at: true,
      },
    });
  }

  async hardDeleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        email: true,
        full_name: true,
      },
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
