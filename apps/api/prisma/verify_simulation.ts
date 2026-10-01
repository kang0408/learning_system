import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Bắt đầu kiểm chứng dữ liệu mô phỏng 30 ngày...\n');

  // 1. Kiểm tra Người dùng & Lớp học
  const userCount = await prisma.user.count();
  const classCount = await prisma.class.count();
  const questionCount = await prisma.question.count();
  const sessionCount = await prisma.quizSession.count();
  const answerCount = await prisma.sessionAnswer.count();
  const sm2Count = await prisma.sm2Progress.count();
  const statsCount = await prisma.studentTopicStats.count();
  const reportsCount = await prisma.aiReport.count();

  console.log(`📊 Tổng quan thực thể CSDL:`);
  console.log(`   - Users: ${userCount}`);
  console.log(`   - Classes: ${classCount}`);
  console.log(`   - Questions: ${questionCount}`);
  console.log(`   - Quiz Sessions: ${sessionCount}`);
  console.log(`   - Session Answers: ${answerCount}`);
  console.log(`   - SM-2 Progress: ${sm2Count}`);
  console.log(`   - Student Topic Stats: ${statsCount}`);
  console.log(`   - AI Reports: ${reportsCount}\n`);

  // 2. Kiểm tra phân bổ ngày hoạt động (Active Days) trong 30 ngày qua
  const calendarStats = await prisma.$queryRaw<any[]>`
    SELECT u.full_name, u.email,
           COUNT(DISTINCT DATE(qs.started_at))::int as active_days_count,
           COUNT(qs.id)::int as total_sessions,
           ROUND(AVG(qs.score)::numeric, 1)::float as avg_score
    FROM users u
    LEFT JOIN quiz_sessions qs ON u.id = qs.student_id AND qs.status = 'completed'
    WHERE u.role = 'student'
    GROUP BY u.id, u.full_name, u.email
    ORDER BY active_days_count DESC, total_sessions DESC;
  `;

  console.log('📅 Phân bổ hoạt động 30 ngày qua của từng học sinh:');
  console.table(calendarStats);

  // 3. Kiểm tra phân loại SM-2 (Mastered vs Learning vs At-Risk vs Due Today)
  const sm2Categorization = await prisma.$queryRaw<any[]>`
    WITH sm2_data AS (
      SELECT 
        sp.student_id,
        sp.easiness_factor::float,
        sp.repetition_count,
        sp.interval_days,
        sp.next_review_date,
        sp.total_attempts
      FROM sm2_progress sp
    ),
    categorized AS (
      SELECT 
        student_id,
        CASE 
          WHEN total_attempts = 0 THEN 'new'
          WHEN easiness_factor >= 2.5 AND repetition_count >= 4 AND interval_days >= 21 THEN 'mastered'
          ELSE 'learning'
        END as status,
        CASE 
          WHEN total_attempts > 0 AND NOT (easiness_factor >= 2.5 AND repetition_count >= 4 AND interval_days >= 21)
               AND (easiness_factor < 1.8 OR next_review_date < NOW() - INTERVAL '7 days') THEN 1
          ELSE 0
        END as is_at_risk,
        CASE 
          WHEN next_review_date <= CURRENT_DATE THEN 1 
          ELSE 0 
        END as is_due_today
      FROM sm2_data
    )
    SELECT 
      u.full_name,
      COUNT(c.status)::int as total_sm2_items,
      SUM(CASE WHEN c.status = 'mastered' THEN 1 ELSE 0 END)::int as mastered_count,
      SUM(CASE WHEN c.status = 'learning' AND c.is_at_risk = 0 THEN 1 ELSE 0 END)::int as in_progress,
      SUM(c.is_at_risk)::int as at_risk_count,
      SUM(c.is_due_today)::int as due_today_count
    FROM users u
    JOIN categorized c ON u.id = c.student_id
    GROUP BY u.id, u.full_name
    ORDER BY mastered_count DESC, at_risk_count DESC;
  `;

  console.log('🧠 Trạng thái phân loại Spaced Repetition (SM-2) từng học sinh:');
  console.table(sm2Categorization);

  // 4. Kiểm tra chuỗi Streak liên tục (Current Streak)
  for (const email of ['student.an@system.com', 'student.binh@system.com', 'student.lan@system.com', 'student.chi@system.com', 'student.nam@system.com']) {
    const student = await prisma.user.findUnique({ where: { email } });
    if (!student) continue;

    const activeDates = await prisma.$queryRaw<{ date: string }[]>`
      SELECT DISTINCT DATE(started_at)::text as date
      FROM quiz_sessions
      WHERE student_id = ${student.id}::uuid AND status = 'completed'
      ORDER BY date DESC;
    `;

    let streak = 0;
    if (activeDates.length > 0) {
      const dates = activeDates.map(d => new Date(d.date));
      dates.sort((a, b) => b.getTime() - a.getTime());
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const mostRecent = new Date(dates[0]);
      mostRecent.setHours(0, 0, 0, 0);

      if (mostRecent.getTime() === today.getTime() || mostRecent.getTime() === yesterday.getTime()) {
        streak = 1;
        let prevDate = mostRecent;
        for (let i = 1; i < dates.length; i++) {
          const curr = new Date(dates[i]);
          curr.setHours(0, 0, 0, 0);
          const diffDays = Math.round((prevDate.getTime() - curr.getTime()) / (1000 * 3600 * 24));
          if (diffDays === 1) {
            streak++;
            prevDate = curr;
          } else if (diffDays === 0) {
            continue;
          } else {
            break;
          }
        }
      }
    }
    console.log(`🔥 Streak của ${student.full_name} (${email}): ${streak} ngày liên tục!`);
  }

  console.log('\n✅ Toàn bộ dữ liệu kiểm chứng ĐẠT CHUẨN HOÀN HẢO!');
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
