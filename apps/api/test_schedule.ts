import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const student = await prisma.user.findFirst({ where: { role: 'student' } });
  if (!student) return console.log("No student found");
  
  console.log("Student ID:", student.id);
  
  const due = await prisma.$queryRaw`
    SELECT count(*) FROM sm2_progress WHERE student_id = ${student.id}::uuid AND next_review_date <= CURRENT_DATE;
  `;
  console.log("Due count:", due);
  
  const newQ = await prisma.$queryRaw`
    SELECT count(q.id)
    FROM assignment_questions aq
    JOIN assignments a ON a.id = aq.assignment_id
    JOIN questions q ON q.id = aq.question_id
    LEFT JOIN sm2_progress sp ON sp.question_id = q.id AND sp.student_id = ${student.id}::uuid
    LEFT JOIN assignment_students ast ON ast.assignment_id = a.id AND ast.student_id = ${student.id}::uuid
    JOIN class_members cm ON cm.class_id = a.class_id AND cm.student_id = ${student.id}::uuid
    WHERE 
      a.is_published = true 
      AND a.deleted_at IS NULL
      AND a.mode = 'adaptive'
      AND cm.is_active = true
      AND (a.is_all_students = true OR ast.id IS NOT NULL)
      AND sp.id IS NULL
      AND q.deleted_at IS NULL
      AND (a.deadline IS NULL OR a.deadline >= CURRENT_DATE)
  `;
  console.log("New Q count:", newQ);
}

main().catch(console.error).finally(() => prisma.$disconnect());
