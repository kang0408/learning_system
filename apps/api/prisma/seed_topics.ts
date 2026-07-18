import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding topics...');
  
  const teacher = await prisma.user.findFirst({
    where: { role: 'teacher' }
  });

  if (!teacher) {
    console.log('No teacher found. Please create a teacher user first or run full seed.');
    return;
  }

  // Clear existing test topics
  await prisma.topic.deleteMany({
    where: {
      name: { in: ['Tiếng Anh', 'Ngữ pháp', 'Thì hiện tại', 'Thì quá khứ', 'Từ vựng', 'Động vật'] }
    }
  });

  const rootTopic = await prisma.topic.create({
    data: {
      name: 'Tiếng Anh',
      description: 'Chủ đề gốc cho môn Tiếng Anh',
      created_by: teacher.id
    }
  });

  const grammarTopic = await prisma.topic.create({
    data: {
      name: 'Ngữ pháp',
      parent_id: rootTopic.id,
      created_by: teacher.id
    }
  });

  await prisma.topic.create({
    data: {
      name: 'Thì hiện tại',
      parent_id: grammarTopic.id,
      created_by: teacher.id
    }
  });

  await prisma.topic.create({
    data: {
      name: 'Thì quá khứ',
      parent_id: grammarTopic.id,
      created_by: teacher.id
    }
  });

  const vocabTopic = await prisma.topic.create({
    data: {
      name: 'Từ vựng',
      parent_id: rootTopic.id,
      created_by: teacher.id
    }
  });

  await prisma.topic.create({
    data: {
      name: 'Động vật',
      parent_id: vocabTopic.id,
      created_by: teacher.id
    }
  });

  console.log('Topics seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
