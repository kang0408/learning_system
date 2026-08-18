import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial Admin user...');
  const adminEmail = process.env.ADMIN_INIT_EMAIL || 'admin@system.com';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_INIT_PASSWORD || 'Admin123!@#', 10);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password_hash: passwordHash,
        full_name: 'System Administrator',
        role: 'admin',
        is_active: true,
      }
    });
    console.log('Default admin created successfully:', admin.email, 'ID:', admin.id);
  } else {
    console.log('Admin account already exists:', adminEmail);
  }
}

main()
  .catch((e) => {
    console.error('Error during admin seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
