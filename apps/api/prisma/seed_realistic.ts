import { PrismaClient, QuestionType, AssignmentMode } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Bắt đầu khởi tạo hệ sinh thái dữ liệu thực tế ĐA DẠNG & TOÀN DIỆN (Nâng cao & Căn bản A1-A2)...\n');

  // =========================================================================
  // 1. DỌN DẸP DỮ LIỆU CŨ (CLEANUP CÓ THỨ TỰ RÀNG BUỘC)
  // =========================================================================
  console.log('🧹 [1/8] Dọn dẹp toàn bộ dữ liệu cũ...');
  await prisma.sessionAnswer.deleteMany({});
  await prisma.quizSession.deleteMany({});
  await prisma.sm2Progress.deleteMany({});
  await prisma.studentTopicStats.deleteMany({});
  await prisma.curriculumMaterial.deleteMany({});
  await prisma.curriculumAssignment.deleteMany({});
  await prisma.classCurriculum.deleteMany({});
  await prisma.aiWizardDraft.deleteMany({});
  await prisma.aiReport.deleteMany({});
  await prisma.assignmentQuestion.deleteMany({});
  await prisma.assignmentStudent.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.answerOption.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.topic.deleteMany({});
  await prisma.classMember.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.otpCode.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✅ Đã xóa sạch dữ liệu cũ.\n');

  // =========================================================================
  // 2. KHỞI TẠO TÀI KHOẢN (PHÂN BỔ ĐỦ CÁC MỨC NĂNG LỰC & HÀNH VI)
  // =========================================================================
  console.log('👥 [2/8] Khởi tạo hồ sơ người dùng đa dạng...');
  const defaultPasswordHash = await bcrypt.hash('Password123!@#', 10);
  const adminPasswordHash = await bcrypt.hash('Admin123!@#', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@system.com',
      password_hash: adminPasswordHash,
      full_name: 'Quản Trị Viên Hệ Thống',
      role: 'admin',
      is_active: true,
      phone: '0901234567',
      address: 'Hà Nội, Việt Nam',
    },
  });

  const teacherMinh = await prisma.user.create({
    data: {
      email: 'teacher.minh@system.com',
      password_hash: defaultPasswordHash,
      full_name: 'Thầy Hoàng Minh',
      role: 'teacher',
      is_active: true,
      phone: '0912345678',
      address: 'Hà Nội',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    },
  });

  const teacherDavid = await prisma.user.create({
    data: {
      email: 'teacher.david@system.com',
      password_hash: defaultPasswordHash,
      full_name: 'Thầy David Trần',
      role: 'teacher',
      is_active: true,
      phone: '0934567890',
      address: 'TP. Đà Nẵng',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
  });

  const teacherMaiAnh = await prisma.user.create({
    data: {
      email: 'teacher.maianh@system.com',
      password_hash: defaultPasswordHash,
      full_name: 'Cô Mai Anh',
      role: 'teacher',
      is_active: true,
      phone: '0923456789',
      address: 'TP. Hồ Chí Minh',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    },
  });

  // 10 Học sinh với các tính cách, mức độ nỗ lực & hoàn cảnh học tập thực tế:
  const rawStudents = [
    { email: 'student.an@system.com', name: 'Nguyễn Văn An', phone: '0981111001', persona: 'Xuất sắc, dẫn đầu lớp, chăm chỉ' },
    { email: 'student.binh@system.com', name: 'Trần Thị Bình', phone: '0981111002', persona: 'Khá, giỏi từ vựng, ngữ pháp ở mức tốt' },
    { email: 'student.khoa@system.com', name: 'Hoàng Đăng Khoa', phone: '0981111006', persona: 'Học lệch: Rất giỏi từ vựng nhưng ngữ pháp trung bình' },
    { email: 'student.lan@system.com', name: 'Đặng Ngọc Lan', phone: '0981111007', persona: 'Tiến bộ: Ban đầu yếu nhưng nỗ lực cải thiện' },
    { email: 'student.chi@system.com', name: 'Lê Khánh Chi', phone: '0981111003', persona: 'Trung bình yếu: Hổng kiến thức nặng ở phần Đảo ngữ' },
    { email: 'student.phuong@system.com', name: 'Ngô Thu Phương', phone: '0981111009', persona: 'Chăm chỉ nhưng tiếp thu chậm, làm bài nhiều lần vẫn sai' },
    { email: 'student.dung@system.com', name: 'Phạm Tiến Dũng', phone: '0981111004', persona: 'Yếu và hay bỏ dở: Bỏ bài giữa chừng, làm ngắt quãng' },
    { email: 'student.quang@system.com', name: 'Đỗ Minh Quang', phone: '0981111010', persona: 'Mất gốc / Điểm liệt ở IELTS nhưng tiến bộ ở lớp Cơ bản' },
    { email: 'student.nam@system.com', name: 'Bùi Hải Nam', phone: '0981111008', persona: 'Bỏ bê: Ít tham gia làm bài' },
    { email: 'student.hoa@system.com', name: 'Vũ Quỳnh Hoa', phone: '0981111005', persona: 'Học viên mới: Bắt đầu lấy lại căn bản' },
  ];

  const students = [];
  for (const s of rawStudents) {
    const created = await prisma.user.create({
      data: {
        email: s.email,
        password_hash: defaultPasswordHash,
        full_name: s.name,
        role: 'student',
        is_active: true,
        phone: s.phone,
        address: 'Việt Nam',
      },
    });
    students.push(created);
  }

  console.log(`✅ Đã tạo: 1 Admin, 3 Giáo viên, ${students.length} Học sinh với đầy đủ phân khúc học lực.\n`);

  // =========================================================================
  // 3. CÂY CHỦ ĐỀ HỌC TẬP (TOPICS HIERARCHY - HỌC THUẬT & CĂN BẢN)
  // =========================================================================
  console.log('📚 [3/8] Thiết lập cây chuyên đề học thuật & tiếng Anh cơ bản...');

  // --- CÂY 1: IELTS & ACADEMIC ENGLISH ---
  const rootIelts = await prisma.topic.create({
    data: {
      name: 'IELTS & Academic English',
      code: 'IELTS0',
      description: 'Chương trình Anh ngữ Học thuật & Luyện thi IELTS chuyên sâu 6.5+',
      created_by: teacherMinh.id,
    },
  });

  const branchReading = await prisma.topic.create({
    data: {
      name: 'IELTS Reading Mastery',
      code: 'READ00',
      description: 'Chiến thuật và kỹ thuật xử lý bài đọc IELTS',
      parent_id: rootIelts.id,
      created_by: teacherMinh.id,
    },
  });

  const branchGrammar = await prisma.topic.create({
    data: {
      name: 'Advanced Academic Grammar',
      code: 'GRAM00',
      description: 'Ngữ pháp nâng cao phục vụ Writing & Speaking',
      parent_id: rootIelts.id,
      created_by: teacherMinh.id,
    },
  });

  const branchVocab = await prisma.topic.create({
    data: {
      name: 'Academic Vocabulary & Topics',
      code: 'VOC000',
      description: 'Vốn từ vựng học thuật theo các chủ đề nóng',
      parent_id: rootIelts.id,
      created_by: teacherMinh.id,
    },
  });

  const topicScanning = await prisma.topic.create({
    data: {
      name: 'Skimming, Scanning & Keywords',
      code: 'READ01',
      description: 'Kỹ năng định vị từ khóa và đọc quét thông tin',
      parent_id: branchReading.id,
      created_by: teacherMinh.id,
    },
  });

  const topicInversions = await prisma.topic.create({
    data: {
      name: 'Conditionals & Inversions (Đảo Ngữ)',
      code: 'GRAM01',
      description: 'Cấu trúc câu điều kiện loại 2, 3 và đảo ngữ Should/Were/Had (Dễ gây nhầm lẫn)',
      parent_id: branchGrammar.id,
      created_by: teacherMinh.id,
    },
  });

  const topicTenses = await prisma.topic.create({
    data: {
      name: 'Perfect & Continuous Tenses',
      code: 'GRAM02',
      description: 'Làm chủ Hiện tại hoàn thành & Quá khứ hoàn thành tiếp diễn',
      parent_id: branchGrammar.id,
      created_by: teacherMinh.id,
    },
  });

  const topicTechAI = await prisma.topic.create({
    data: {
      name: 'Technology, AI & Future Trends',
      code: 'VOC001',
      description: 'Từ vựng chủ đề công nghệ, chuyển đổi số và trí tuệ nhân tạo',
      parent_id: branchVocab.id,
      created_by: teacherMinh.id,
    },
  });

  const topicEnvironment = await prisma.topic.create({
    data: {
      name: 'Climate Change & Sustainability',
      code: 'VOC002',
      description: 'Từ vựng và Collocations chủ đề môi trường và phát triển bền vững',
      parent_id: branchVocab.id,
      created_by: teacherMinh.id,
    },
  });

  // --- CÂY 2: TIẾNG ANH CĂN BẢN & MẤT GỐC (BASIC ENGLISH FOUNDATIONS) ---
  const rootBasic = await prisma.topic.create({
    data: {
      name: 'Tiếng Anh Căn Bản & Mất Gốc (A1 - A2 Starter)',
      code: 'BAS000',
      description: 'Chương trình lấy lại gốc tiếng Anh, củng cố ngữ pháp cốt lõi và từ vựng đời sống hàng ngày.',
      created_by: teacherMaiAnh.id,
    },
  });

  const branchBasicGrammar = await prisma.topic.create({
    data: {
      name: 'Ngữ Pháp Nền Tảng A1-A2 (Essential Grammar)',
      code: 'BGRM00',
      description: 'Các quy tắc ngữ pháp căn bản giúp đặt câu chính xác: To Be, Hiện tại đơn, Mạo từ & Giới từ.',
      parent_id: rootBasic.id,
      created_by: teacherMaiAnh.id,
    },
  });

  const branchBasicVocab = await prisma.topic.create({
    data: {
      name: 'Từ Vựng Đời Sống Hàng Ngày (Everyday Vocabulary)',
      code: 'BVOC00',
      description: 'Vốn từ 500 từ vựng thông dụng về Gia đình, Mua sắm, Nghề nghiệp và Nhà cửa.',
      parent_id: rootBasic.id,
      created_by: teacherMaiAnh.id,
    },
  });

  const topicToBe = await prisma.topic.create({
    data: {
      name: 'Động từ "To Be" & Đại từ Nhân xưng (Pronouns & To Be)',
      code: 'BGRM01',
      description: 'Cách chia am/is/are, đại từ I/You/We/They/He/She/It và các mẫu câu giới thiệu căn bản.',
      parent_id: branchBasicGrammar.id,
      created_by: teacherMaiAnh.id,
    },
  });

  const topicPresentSimple = await prisma.topic.create({
    data: {
      name: 'Thì Hiện Tại Đơn & Thói Quen (Present Simple & Routines)',
      code: 'BGRM02',
      description: 'Quy tắc thêm -s/-es, trợ động từ do/does/don\'t/doesn\'t và trạng từ chỉ tần suất always/usually/never.',
      parent_id: branchBasicGrammar.id,
      created_by: teacherMaiAnh.id,
    },
  });

  const topicArticles = await prisma.topic.create({
    data: {
      name: 'Mạo từ (A, An, The) & Giới từ Chỉ Thời Gian / Nơi Chốn',
      code: 'BGRM03',
      description: 'Phân biệt mạo từ xác định/không xác định và sử dụng giới từ in/on/at chuẩn xác.',
      parent_id: branchBasicGrammar.id,
      created_by: teacherMaiAnh.id,
    },
  });

  const topicFamilyHome = await prisma.topic.create({
    data: {
      name: 'Gia Đình, Nhà Cửa & Đồ Dùng Thường Nhật (Family & Home)',
      code: 'BVOC01',
      description: 'Từ vựng các thành viên gia đình, phòng ốc và đồ dùng quen thuộc trong nhà.',
      parent_id: branchBasicVocab.id,
      created_by: teacherMaiAnh.id,
    },
  });

  const topicFoodShopping = await prisma.topic.create({
    data: {
      name: 'Ăn Uống, Mua Sắm & Sở Thích (Food, Drinks & Shopping)',
      code: 'BVOC02',
      description: 'Từ vựng đồ ăn, thức uống, danh từ đếm được/không đếm được và sở thích cá nhân.',
      parent_id: branchBasicVocab.id,
      created_by: teacherMaiAnh.id,
    },
  });

  const topicJobsTime = await prisma.topic.create({
    data: {
      name: 'Nghề Nghiệp & Thời Gian (Occupations & Daily Time)',
      code: 'BVOC03',
      description: 'Từ vựng các nghề nghiệp phổ biến, cách đọc giờ, các thứ trong tuần và tháng trong năm.',
      parent_id: branchBasicVocab.id,
      created_by: teacherMaiAnh.id,
    },
  });

  console.log('✅ Đã tạo cây chuyên đề học thuật & tiếng Anh cơ bản hoàn chỉnh.\n');

  // =========================================================================
  // 4. NGÂN HÀNG CÂU HỎI (24 CÂU HỎI ĐA DẠNG: IELTS NÂNG CAO + CĂN BẢN A1-A2)
  // =========================================================================
  console.log('❓ [4/8] Khởi tạo ngân hàng câu hỏi đa dạng (24 câu hỏi từ cơ bản đến nâng cao)...');

  const questionsData = [
    // --- 0-11: CÂU HỎI IELTS & HỌC THUẬT ---
    // 0. Scanning - Dễ (Diff 1)
    {
      topic_id: topicScanning.id,
      created_by: teacherMinh.id,
      content: 'True or False: "Scanning" means reading every single word from the first page to the last page.',
      question_type: QuestionType.true_false,
      difficulty: 1,
      explanation: 'False. Scanning là đọc quét tìm từ khóa cụ thể, không đọc từng chữ.',
      is_public: true,
      options: [
        { content: 'True', is_correct: false, order_index: 0 },
        { content: 'False', is_correct: true, order_index: 1 },
      ],
    },
    // 1. Scanning - Trung bình (Diff 2)
    {
      topic_id: topicScanning.id,
      created_by: teacherMinh.id,
      content: 'When applying the "Scanning" technique in IELTS Reading, what is the primary goal?',
      question_type: QuestionType.multiple_choice,
      difficulty: 2,
      explanation: 'Scanning nhằm mục đích tìm kiếm nhanh các thông tin định lượng hoặc từ khóa cụ thể.',
      is_public: true,
      options: [
        { content: 'To locate specific keywords, numbers, or names quickly without reading every word', is_correct: true, order_index: 0 },
        { content: 'To analyze the grammatical breakdown of every sentence', is_correct: false, order_index: 1 },
        { content: 'To translate the entire passage into Vietnamese', is_correct: false, order_index: 2 },
        { content: 'To deduce the personal feelings and emotional state of the writer', is_correct: false, order_index: 3 },
      ],
    },
    // 2. Scanning - Khá (Diff 3)
    {
      topic_id: topicScanning.id,
      created_by: teacherMinh.id,
      content: 'Which of the following elements serve as prime targets when scanning a passage?',
      question_type: QuestionType.multi_select,
      difficulty: 3,
      explanation: 'Các danh từ riêng viết hoa, năm tháng/con số, và thuật ngữ trong ngoặc kép là mục tiêu hàng đầu.',
      is_public: true,
      options: [
        { content: 'Capitalized proper nouns (e.g., UNESCO, Dr. Watson)', is_correct: true, order_index: 0 },
        { content: 'Dates and numerical figures (e.g., 1895, 45%)', is_correct: true, order_index: 1 },
        { content: 'Common prepositions (e.g., in, on, at)', is_correct: false, order_index: 2 },
        { content: 'Articles (e.g., a, an, the)', is_correct: false, order_index: 3 },
      ],
    },
    // 3. Inversion 1 - Khá (Diff 3)
    {
      topic_id: topicInversions.id,
      created_by: teacherMinh.id,
      content: 'Choose the correct inverted sentence for: "If you should require further assistance, contact our desk."',
      question_type: QuestionType.multiple_choice,
      difficulty: 3,
      explanation: 'Đảo ngữ câu điều kiện loại 1: Should + S + V nguyên thể.',
      is_public: true,
      options: [
        { content: 'Should you require further assistance, please contact our desk.', is_correct: true, order_index: 0 },
        { content: 'Had you require further assistance, contact our desk.', is_correct: false, order_index: 1 },
        { content: 'Were you require further assistance, contact our desk.', is_correct: false, order_index: 2 },
        { content: 'If should you require further assistance, contact our desk.', is_correct: false, order_index: 3 },
      ],
    },
    // 4. Inversion 2 - Khó / Bẫy (Diff 4)
    {
      topic_id: topicInversions.id,
      created_by: teacherMinh.id,
      content: 'Rewrite using Inversion Type 3: "If the government had taken earlier precautions, the crisis ______ avoided."',
      question_type: QuestionType.multiple_choice,
      difficulty: 4,
      explanation: 'Đảo ngữ loại 3: "Had + S + V3/ed, S + would/could have + V3/ed". Bị động là "could have been avoided".',
      is_public: true,
      options: [
        { content: 'could have been', is_correct: true, order_index: 0 },
        { content: 'would be', is_correct: false, order_index: 1 },
        { content: 'had been', is_correct: false, order_index: 2 },
        { content: 'will have been', is_correct: false, order_index: 3 },
      ],
    },
    // 5. Inversion 3 - Cực khó / Fill Blank (Diff 5)
    {
      topic_id: topicInversions.id,
      created_by: teacherMinh.id,
      content: 'Fill in the blank: "______ he to accept the scholarship, he would have to relocate to Melbourne."',
      question_type: QuestionType.fill_blank,
      difficulty: 5,
      explanation: 'Đảo ngữ loại 2 với động từ thường: "Were + S + to-V".',
      is_public: true,
      metadata: { accepted_answers: ['Were', 'were'] },
      options: [
        { content: 'Were', is_correct: true, order_index: 0 },
      ],
    },
    // 6. Tenses 1 - Trung bình (Diff 3)
    {
      topic_id: topicTenses.id,
      created_by: teacherMinh.id,
      content: 'By the time Dr. Aris completed the clinical trials, the team ______ the preliminary data for over six months.',
      question_type: QuestionType.multiple_choice,
      difficulty: 3,
      explanation: 'Quá khứ hoàn thành tiếp diễn "had been analyzing" diễn tả hành động liên tục trước một thời điểm quá khứ.',
      is_public: true,
      options: [
        { content: 'had been analyzing', is_correct: true, order_index: 0 },
        { content: 'has analyzed', is_correct: false, order_index: 1 },
        { content: 'was analyzed', is_correct: false, order_index: 2 },
        { content: 'will have analyzed', is_correct: false, order_index: 3 },
      ],
    },
    // 7. Tenses 2 - Dễ (Diff 2)
    {
      topic_id: topicTenses.id,
      created_by: teacherMinh.id,
      content: 'Since the introduction of the new academic portal last month, student engagement ______ by 42%.',
      question_type: QuestionType.multiple_choice,
      difficulty: 2,
      explanation: 'Cấu trúc "Since + mốc quá khứ", mệnh đề chính dùng Hiện tại hoàn thành "has increased".',
      is_public: true,
      options: [
        { content: 'has increased', is_correct: true, order_index: 0 },
        { content: 'increased', is_correct: false, order_index: 1 },
        { content: 'had increased', is_correct: false, order_index: 2 },
        { content: 'is increasing', is_correct: false, order_index: 3 },
      ],
    },
    // 8. Tech Vocab 1 - Trung bình (Diff 3)
    {
      topic_id: topicTechAI.id,
      created_by: teacherMinh.id,
      content: 'Generative AI models rely heavily on large neural networks trained on vast ______ of unstructured text.',
      question_type: QuestionType.multiple_choice,
      difficulty: 3,
      explanation: 'Collocation: "vast volumes/quantities of data".',
      is_public: true,
      options: [
        { content: 'volumes', is_correct: true, order_index: 0 },
        { content: 'numbers', is_correct: false, order_index: 1 },
        { content: 'pieces', is_correct: false, order_index: 2 },
        { content: 'chunks', is_correct: false, order_index: 3 },
      ],
    },
    // 9. Tech Vocab 2 - Matching (Diff 4)
    {
      topic_id: topicTechAI.id,
      created_by: teacherMinh.id,
      content: 'Match the technology terms with their respective definitions in academic discourse:',
      question_type: QuestionType.matching,
      difficulty: 4,
      explanation: 'Nối thuật ngữ công nghệ AI với định nghĩa chính xác.',
      is_public: true,
      metadata: {
        pairs: [
          {
            leftId: 'pair_1_left',
            leftText: 'Natural Language Processing (NLP)',
            left: 'Natural Language Processing (NLP)',
            rightId: 'pair_1_right',
            rightText: 'Branch of AI enabling computers to understand and generate human text',
            right: 'Branch of AI enabling computers to understand and generate human text',
          },
          {
            leftId: 'pair_2_left',
            leftText: 'Algorithm',
            left: 'Algorithm',
            rightId: 'pair_2_right',
            rightText: 'A step-by-step computational procedure for solving problems or calculating',
            right: 'A step-by-step computational procedure for solving problems or calculating',
          },
          {
            leftId: 'pair_3_left',
            leftText: 'Robotic Automation',
            left: 'Robotic Automation',
            rightId: 'pair_3_right',
            rightText: 'Deploying software bots to perform repetitive human workflows with minimal input',
            right: 'Deploying software bots to perform repetitive human workflows with minimal input',
          },
        ],
      },
      options: [],
    },
    // 10. Env Vocab 1 - Dễ (Diff 2)
    {
      topic_id: topicEnvironment.id,
      created_by: teacherMinh.id,
      content: 'Corporations worldwide are under immense pressure to substantially reduce their carbon ______ by adopting green energy.',
      question_type: QuestionType.multiple_choice,
      difficulty: 2,
      explanation: '"Carbon footprint" là cụm từ chỉ lượng phát thải khí nhà kính.',
      is_public: true,
      options: [
        { content: 'footprint', is_correct: true, order_index: 0 },
        { content: 'fingerprint', is_correct: false, order_index: 1 },
        { content: 'handprint', is_correct: false, order_index: 2 },
        { content: 'shadow', is_correct: false, order_index: 3 },
      ],
    },
    // 11. Env Vocab 2 - Dễ (Diff 2)
    {
      topic_id: topicEnvironment.id,
      created_by: teacherMinh.id,
      content: 'True or False: "Biodiversity" strictly refers only to plant life and excludes marine species.',
      question_type: QuestionType.true_false,
      difficulty: 2,
      explanation: 'False. Biodiversity bao gồm tất cả sinh vật trên cạn và dưới nước.',
      is_public: true,
      options: [
        { content: 'True', is_correct: false, order_index: 0 },
        { content: 'False', is_correct: true, order_index: 1 },
      ],
    },

    // --- 12-23: CÂU HỎI TIẾNG ANH CĂN BẢN (A1-A2 STARTER) ---
    // 12. To Be 1 - Căn bản (Diff 1)
    {
      topic_id: topicToBe.id,
      created_by: teacherMaiAnh.id,
      content: 'Choose the correct form of "To Be": "My sister and I ______ first-year students at the university."',
      question_type: QuestionType.multiple_choice,
      difficulty: 1,
      explanation: 'Chủ ngữ "My sister and I" tương đương với đại từ ngôi thứ nhất số nhiều "We", nên dùng động từ "are".',
      is_public: true,
      options: [
        { content: 'are', is_correct: true, order_index: 0 },
        { content: 'is', is_correct: false, order_index: 1 },
        { content: 'am', is_correct: false, order_index: 2 },
        { content: 'be', is_correct: false, order_index: 3 },
      ],
    },
    // 13. Pronouns & To Be - Đúng/Sai (Diff 1)
    {
      topic_id: topicToBe.id,
      created_by: teacherMaiAnh.id,
      content: 'True or False: In English, the pronoun "They" can refer to both groups of people and plural objects or animals.',
      question_type: QuestionType.true_false,
      difficulty: 1,
      explanation: 'True. Đại từ "They" được dùng cho cả người, đồ vật và động vật ở số nhiều (ví dụ: "The books are on the desk. They are new.").',
      is_public: true,
      options: [
        { content: 'True', is_correct: true, order_index: 0 },
        { content: 'False', is_correct: false, order_index: 1 },
      ],
    },
    // 14. Present Simple 1 - Thói quen (Diff 1)
    {
      topic_id: topicPresentSimple.id,
      created_by: teacherMaiAnh.id,
      content: 'David usually ______ to the office by bus, but today he is riding a bicycle.',
      question_type: QuestionType.multiple_choice,
      difficulty: 1,
      explanation: 'Chủ ngữ ngôi thứ 3 số ít "David" trong thì Hiện tại đơn đi với động từ thêm "-es": "goes".',
      is_public: true,
      options: [
        { content: 'goes', is_correct: true, order_index: 0 },
        { content: 'go', is_correct: false, order_index: 1 },
        { content: 'going', is_correct: false, order_index: 2 },
        { content: 'is go', is_correct: false, order_index: 3 },
      ],
    },
    // 15. Present Simple 2 - Phủ định (Diff 2)
    {
      topic_id: topicPresentSimple.id,
      created_by: teacherMaiAnh.id,
      content: 'Emily ______ like spicy food, so she always orders mild noodles.',
      question_type: QuestionType.multiple_choice,
      difficulty: 2,
      explanation: 'Thể phủ định của thì Hiện tại đơn với chủ ngữ số ít "Emily" sử dụng trợ động từ "doesn\'t + V nguyên thể".',
      is_public: true,
      options: [
        { content: "doesn't", is_correct: true, order_index: 0 },
        { content: "don't", is_correct: false, order_index: 1 },
        { content: "isn't", is_correct: false, order_index: 2 },
        { content: "not", is_correct: false, order_index: 3 },
      ],
    },
    // 16. Present Simple 3 - Điền từ (Diff 2)
    {
      topic_id: topicPresentSimple.id,
      created_by: teacherMaiAnh.id,
      content: 'Fill in the blank: "Every morning, my father ______ (drink) a warm cup of tea before work."',
      question_type: QuestionType.fill_blank,
      difficulty: 2,
      explanation: 'Chủ ngữ "my father" là ngôi thứ 3 số ít, động từ chia ở thì Hiện tại đơn là "drinks".',
      is_public: true,
      metadata: { accepted_answers: ['drinks', 'Drinks'] },
      options: [
        { content: 'drinks', is_correct: true, order_index: 0 },
      ],
    },
    // 17. Mạo từ A/An - Dễ (Diff 1)
    {
      topic_id: topicArticles.id,
      created_by: teacherMaiAnh.id,
      content: 'Before stepping outside, she grabbed ______ umbrella and ______ yellow raincoat.',
      question_type: QuestionType.multiple_choice,
      difficulty: 1,
      explanation: '"Umbrella" bắt đầu bằng nguyên âm /ʌ/ nên dùng "an"; "yellow" bắt đầu bằng phụ âm /j/ nên dùng "a".',
      is_public: true,
      options: [
        { content: 'an / a', is_correct: true, order_index: 0 },
        { content: 'a / an', is_correct: false, order_index: 1 },
        { content: 'an / an', is_correct: false, order_index: 2 },
        { content: 'a / a', is_correct: false, order_index: 3 },
      ],
    },
    // 18. Giới từ Thời gian - Dễ (Diff 1)
    {
      topic_id: topicArticles.id,
      created_by: teacherMaiAnh.id,
      content: 'Our beginner English class begins ______ 7:00 PM ______ Wednesday evenings.',
      question_type: QuestionType.multiple_choice,
      difficulty: 1,
      explanation: 'Dùng giới từ "at" trước giờ giấc cụ thể (at 7:00 PM) và "on" trước các ngày/buổi trong tuần (on Wednesday evenings).',
      is_public: true,
      options: [
        { content: 'at / on', is_correct: true, order_index: 0 },
        { content: 'in / on', is_correct: false, order_index: 1 },
        { content: 'at / in', is_correct: false, order_index: 2 },
        { content: 'on / at', is_correct: false, order_index: 3 },
      ],
    },
    // 19. Ghép Cặp Đồ Dùng Gia Đình - Matching (Diff 2)
    {
      topic_id: topicFamilyHome.id,
      created_by: teacherMaiAnh.id,
      content: 'Match each household item with its corresponding everyday usage:',
      question_type: QuestionType.matching,
      difficulty: 2,
      explanation: 'Nối đồ dùng trong nhà với công dụng thường nhật.',
      is_public: true,
      metadata: {
        pairs: [
          {
            leftId: 'home_p1_l',
            leftText: 'Refrigerator (Fridge)',
            left: 'Refrigerator (Fridge)',
            rightId: 'home_p1_r',
            rightText: 'Keeps food and beverages cold and fresh',
            right: 'Keeps food and beverages cold and fresh',
          },
          {
            leftId: 'home_p2_l',
            leftText: 'Wardrobe',
            left: 'Wardrobe',
            rightId: 'home_p2_r',
            rightText: 'A tall wooden cabinet used for hanging clothes',
            right: 'A tall wooden cabinet used for hanging clothes',
          },
          {
            leftId: 'home_p3_l',
            leftText: 'Microwave oven',
            left: 'Microwave oven',
            rightId: 'home_p3_r',
            rightText: 'Heats and cooks pre-made meals quickly',
            right: 'Heats and cooks pre-made meals quickly',
          },
        ],
      },
      options: [],
    },
    // 20. Ghép Cặp Nghề Nghiệp - Matching (Diff 2)
    {
      topic_id: topicJobsTime.id,
      created_by: teacherMaiAnh.id,
      content: 'Match the common occupations with their work descriptions:',
      question_type: QuestionType.matching,
      difficulty: 2,
      explanation: 'Nối các nghề nghiệp phổ biến với mô tả công việc chính xác.',
      is_public: true,
      metadata: {
        pairs: [
          {
            leftId: 'job_p1_l',
            leftText: 'Chef',
            left: 'Chef',
            rightId: 'job_p1_r',
            rightText: 'Prepares delicious dishes and runs restaurant kitchens',
            right: 'Prepares delicious dishes and runs restaurant kitchens',
          },
          {
            leftId: 'job_p2_l',
            leftText: 'Pharmacist',
            left: 'Pharmacist',
            rightId: 'job_p2_r',
            rightText: 'Dispenses prescription medicine and gives health advice',
            right: 'Dispenses prescription medicine and gives health advice',
          },
          {
            leftId: 'job_p3_l',
            leftText: 'Architect',
            left: 'Architect',
            rightId: 'job_p3_r',
            rightText: 'Designs blueprints for modern houses and skyscrapers',
            right: 'Designs blueprints for modern houses and skyscrapers',
          },
        ],
      },
      options: [],
    },
    // 21. Danh từ đếm được / không đếm được - Multi-select (Diff 1)
    {
      topic_id: topicFoodShopping.id,
      created_by: teacherMaiAnh.id,
      content: 'Which of the following items are Countable Nouns (Danh từ đếm được)?',
      question_type: QuestionType.multi_select,
      difficulty: 1,
      explanation: '"Apples", "Sandwiches" và "Bottles of water" là danh từ đếm được. "Milk" và "Rice" là danh từ không đếm được.',
      is_public: true,
      options: [
        { content: 'Apples', is_correct: true, order_index: 0 },
        { content: 'Sandwiches', is_correct: true, order_index: 1 },
        { content: 'Bottles of water', is_correct: true, order_index: 2 },
        { content: 'Milk', is_correct: false, order_index: 3 },
        { content: 'Rice', is_correct: false, order_index: 4 },
      ],
    },
    // 22. Trạng từ chỉ tần suất - Trung bình (Diff 2)
    {
      topic_id: topicPresentSimple.id,
      created_by: teacherMaiAnh.id,
      content: 'Which sentence has the correct word order for the adverb of frequency "always"?',
      question_type: QuestionType.multiple_choice,
      difficulty: 2,
      explanation: 'Trạng từ chỉ tần suất đứng SAU động từ "To Be" (is always on time) và đứng TRƯỚC động từ thường.',
      is_public: true,
      options: [
        { content: 'She is always on time for her morning lectures.', is_correct: true, order_index: 0 },
        { content: 'She always is on time for her morning lectures.', is_correct: false, order_index: 1 },
        { content: 'She is on time always for her morning lectures.', is_correct: false, order_index: 2 },
        { content: 'Always she is on time for her morning lectures.', is_correct: false, order_index: 3 },
      ],
    },
    // 23. Từ vựng Gia Đình - Đúng/Sai (Diff 1)
    {
      topic_id: topicFamilyHome.id,
      created_by: teacherMaiAnh.id,
      content: 'True or False: Your father’s brother is your "Uncle", and his children are your "Cousins".',
      question_type: QuestionType.true_false,
      difficulty: 1,
      explanation: 'True. Anh/em trai của bố là "Uncle" (chú/bác), và con của chú/bác là "Cousins" (anh/chị/em họ).',
      is_public: true,
      options: [
        { content: 'True', is_correct: true, order_index: 0 },
        { content: 'False', is_correct: false, order_index: 1 },
      ],
    },
  ];

  const createdQuestions = [];
  for (const q of questionsData) {
    const { options, ...data } = q;
    const item = await prisma.question.create({
      data: {
        ...data,
        answer_options: {
          create: options.map(opt => ({
            content: opt.content,
            is_correct: opt.is_correct,
            order_index: opt.order_index,
          })),
        },
      },
      include: { answer_options: true },
    });
    createdQuestions.push(item);
  }

  console.log(`✅ Đã tạo ngân hàng ${createdQuestions.length} câu hỏi chuẩn xác (12 IELTS + 12 Căn bản A1-A2).\n`);

  // =========================================================================
  // 5. LỚP HỌC & GIÁO TRÌNH (CLASSES & CURRICULUMS)
  // =========================================================================
  console.log('🏫 [5/8] Thiết lập các lớp học và giáo trình...');

  // --- LỚP 1: IELTS MASTERY 6.5+ ---
  const classIelts = await prisma.class.create({
    data: {
      name: 'IELTS Mastery 6.5+ (Khóa Học Thuật Chuyên Sâu)',
      subject: 'Academic English',
      join_code: 'IELTS65',
      description: 'Khóa học thiết kế chuẩn hóa 4 tuần giúp học viên làm chủ Reading, cấu trúc câu Band 7.0+ và từ vựng học thuật.',
      teacher_id: teacherMinh.id,
      is_active: true,
    },
  });

  // --- LỚP 2: THPT QUỐC GIA ---
  const classThpt = await prisma.class.create({
    data: {
      name: 'Luyện Thi THPT Quốc Gia 2026 - Chinh Phục Điểm 9+',
      subject: 'Tiếng Anh THPT',
      join_code: 'THPT26',
      description: 'Luyện đề thực chiến, giải mã bẫy đề thi và củng cố toàn diện ngữ pháp trọng điểm.',
      teacher_id: teacherDavid.id,
      is_active: true,
    },
  });

  // --- LỚP 3: DOANH NGHIỆP ---
  const classComm = await prisma.class.create({
    data: {
      name: 'Tiếng Anh Giao Tiếp Doanh Nghiệp & Phản Xạ Nhanh',
      subject: 'Business English',
      join_code: 'COMM88',
      description: 'Phát triển phản xạ tự nhiên trong đàm phán, thuyết trình và viết email công việc.',
      teacher_id: teacherMaiAnh.id,
      is_active: true,
    },
  });

  // --- LỚP 4: TIẾNG ANH CĂN BẢN CHO NGƯỜI MẤT GỐC (STARTER A1-A2) ---
  const classBasic = await prisma.class.create({
    data: {
      name: 'Tiếng Anh Nền Tảng Cho Người Mất Gốc (Zero to A2 Starter)',
      subject: 'Tiếng Anh Căn Bản',
      join_code: 'ZERO2A2',
      description: 'Khóa học thiết kế dành riêng cho học viên mất căn bản hoặc bắt đầu từ con số 0. Xây dựng nền tảng phát âm, 500 từ vựng thông dụng và làm chủ các thì cơ bản.',
      teacher_id: teacherMaiAnh.id,
      is_active: true,
    },
  });

  // --- LỚP 5: TIẾNG ANH GIAO TIẾP ĐỜI SỐNG HÀNG NGÀY ---
  const classDailyLife = await prisma.class.create({
    data: {
      name: 'Tiếng Anh Giao Tiếp Đời Sống Hàng Ngày (Everyday Life English)',
      subject: 'Giao Tiếp Đời Sống',
      join_code: 'DAILY01',
      description: 'Luyện phản xạ giao tiếp tự nhiên trong các tình huống thực tế: Đi mua sắm, Gọi món tại nhà hàng, Hỏi đường và Trò chuyện với bạn bè quốc tế.',
      teacher_id: teacherDavid.id,
      is_active: true,
    },
  });

  // Phân bổ học sinh vào các lớp:
  // Lớp IELTS: An, Bình, Khoa, Lan, Chi, Dũng, Quang, Nam
  for (const idx of [0, 1, 2, 3, 4, 6, 7, 8]) {
    await prisma.classMember.create({
      data: { class_id: classIelts.id, student_id: students[idx].id },
    });
  }

  // Lớp THPT: An, Bình, Lan, Phương, Quang
  for (const idx of [0, 1, 3, 5, 7]) {
    await prisma.classMember.create({
      data: { class_id: classThpt.id, student_id: students[idx].id },
    });
  }

  // Lớp Doanh Nghiệp: Khoa, Chi, Dũng, Phương, Hoa
  for (const idx of [2, 4, 6, 5, 9]) {
    await prisma.classMember.create({
      data: { class_id: classComm.id, student_id: students[idx].id },
    });
  }

  // Lớp Căn Bản (Mất Gốc): Quang (Mất gốc), Dũng (Yếu), Chi, Phương, Lan, Bình, Nam, Hoa (8 học sinh)
  for (const idx of [7, 6, 4, 5, 3, 1, 8, 9]) {
    await prisma.classMember.create({
      data: { class_id: classBasic.id, student_id: students[idx].id },
    });
  }

  // Lớp Giao Tiếp Đời Sống: An, Khoa, Lan, Quang, Dũng, Phương, Hoa (7 học sinh)
  for (const idx of [0, 2, 3, 7, 6, 5, 9]) {
    await prisma.classMember.create({
      data: { class_id: classDailyLife.id, student_id: students[idx].id },
    });
  }

  // --- GIÁO TRÌNH LỚP IELTS (4 Tuần) ---
  const currWeek1 = await prisma.classCurriculum.create({
    data: {
      class_id: classIelts.id,
      title: 'Tuần 1: Chiến Thuật Skimming & Scanning Định Vị Thông Tin Trong 30 Giây',
      content_html: '<h3>Mục tiêu Tuần 1:</h3><p>Nắm vững Skimming & Scanning và nhận biết các bẫy từ đồng nghĩa (Paraphrasing).</p>',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      video_type: 'youtube',
      order_index: 0,
      is_published: true,
    },
  });
  await prisma.curriculumMaterial.create({
    data: {
      curriculum_id: currWeek1.id,
      title: 'Tài Liệu Hướng Dẫn: Week1_Reading_Skimming_Guide.pdf',
      file_url: 'https://cdn.example.com/materials/week1_skimming.pdf',
      file_type: 'pdf',
      file_size: 1850000,
      order_index: 0,
    },
  });

  const currWeek2 = await prisma.classCurriculum.create({
    data: {
      class_id: classIelts.id,
      title: 'Tuần 2: Đột Phá Tiêu Chí Ngữ Pháp (GRA) với Cấu Trúc Đảo Ngữ & Thì Hoàn Thành',
      content_html: '<h3>Mục tiêu Tuần 2:</h3><p>Làm chủ đảo ngữ loại 1, 2, 3 và thì quá khứ hoàn thành tiếp diễn.</p>',
      order_index: 1,
      is_published: true,
    },
  });
  await prisma.curriculumMaterial.create({
    data: {
      curriculum_id: currWeek2.id,
      title: 'Sổ Tay Công Thức Đảo Ngữ: Inversion_Formulas_Band7.pdf',
      file_url: 'https://cdn.example.com/materials/week2_inversions.pdf',
      file_type: 'pdf',
      file_size: 2100000,
      order_index: 0,
    },
  });

  const currWeek3 = await prisma.classCurriculum.create({
    data: {
      class_id: classIelts.id,
      title: 'Tuần 3: Vốn Từ Vựng Học Thuật Cốt Lõi - Công Nghệ AI & Biến Đổi Khí Hậu',
      content_html: '<h3>Mục tiêu Tuần 3:</h3><p>Thuật ngữ và collocations ghi điểm chủ đề Technology & Environment.</p>',
      order_index: 2,
      is_published: true,
    },
  });

  const currWeek4 = await prisma.classCurriculum.create({
    data: {
      class_id: classIelts.id,
      title: 'Tuần 4: Đánh Giá Năng Lực Giữa Khóa (Mid-Term Assessment)',
      content_html: '<h3>Bài kiểm tra tổng hợp:</h3><p>Kiểm tra năng lực 45 phút tổng hợp kiến thức cả 3 tuần.</p>',
      order_index: 3,
      is_published: true,
    },
  });

  // --- GIÁO TRÌNH LỚP CĂN BẢN (4 Tuần) ---
  const currBasic1 = await prisma.classCurriculum.create({
    data: {
      class_id: classBasic.id,
      title: 'Tuần 1: Nhập Môn - Động Từ To Be & Đại Từ Nhân Xưng (To Be & Pronouns)',
      content_html: '<h3>Nội dung Tuần 1:</h3><p>Làm quen với hệ thống đại từ (I, You, We, They, He, She, It), cách chia to be (am/is/are) và các mẫu câu tự giới thiệu bản thân chuẩn ngữ pháp.</p>',
      order_index: 0,
      is_published: true,
    },
  });
  await prisma.curriculumMaterial.create({
    data: {
      curriculum_id: currBasic1.id,
      title: 'Bảng Tóm Tắt Động Từ To Be: ToBe_Pronouns_Quick_Guide.pdf',
      file_url: 'https://cdn.example.com/materials/basic_tobe_guide.pdf',
      file_type: 'pdf',
      file_size: 1200000,
      order_index: 0,
    },
  });

  const currBasic2 = await prisma.classCurriculum.create({
    data: {
      class_id: classBasic.id,
      title: 'Tuần 2: Thì Hiện Tại Đơn & Thói Quen Hàng Ngày (Present Simple & Routines)',
      content_html: '<h3>Nội dung Tuần 2:</h3><p>Hiểu bản chất thì Hiện tại đơn, quy tắc thêm đuôi -s/-es khi chủ ngữ số ít và sử dụng trạng từ chỉ tần suất (always, usually, sometimes, never).</p>',
      order_index: 1,
      is_published: true,
    },
  });

  const currBasic3 = await prisma.classCurriculum.create({
    data: {
      class_id: classBasic.id,
      title: 'Tuần 3: Mạo Từ (A/An/The), Giới Từ & Đồ Dùng Trong Nhà (Home & Articles)',
      content_html: '<h3>Nội dung Tuần 3:</h3><p>Quy tắc dùng a/an/the không bị nhầm lẫn, phân biệt giới từ in/on/at và 30 từ vựng đồ gia dụng quen thuộc.</p>',
      order_index: 2,
      is_published: true,
    },
  });

  const currBasic4 = await prisma.classCurriculum.create({
    data: {
      class_id: classBasic.id,
      title: 'Tuần 4: Ôn Tập Tổng Hợp & Đánh Giá Trình Độ Căn Bản A1-A2',
      content_html: '<h3>Nội dung Tuần 4:</h3><p>Bài kiểm tra đánh giá toàn diện sau 4 tuần học, xác nhận học viên đã nắm vững nền tảng để tự tin học lên các cấp độ tiếp theo.</p>',
      order_index: 3,
      is_published: true,
    },
  });

  // --- GIÁO TRÌNH LỚP GIAO TIẾP ĐỜI SỐNG (2 Chuyên đề) ---
  const currDaily1 = await prisma.classCurriculum.create({
    data: {
      class_id: classDailyLife.id,
      title: 'Chuyên Đề 1: Giới Thiệu Bản Thân, Gia Đình & Nghề Nghiệp Trong Giao Tiếp',
      content_html: '<h3>Mục tiêu:</h3><p>Tự tin giới thiệu bản thân, nói về công việc, sở thích và gia đình với người nước ngoài.</p>',
      order_index: 0,
      is_published: true,
    },
  });

  const currDaily2 = await prisma.classCurriculum.create({
    data: {
      class_id: classDailyLife.id,
      title: 'Chuyên Đề 2: Tiếng Anh Mua Sắm Siêu Thị & Gọi Món Tại Nhà Hàng',
      content_html: '<h3>Mục tiêu:</h3><p>Học mẫu câu gọi món, hỏi giá tiền và phân biệt các món ăn thức uống thông dụng.</p>',
      order_index: 1,
      is_published: true,
    },
  });

  // =========================================================================
  // 6. DANH SÁCH BÀI TẬP ĐA DẠNG TRẠNG THÁI (CHO CẢ LỚP IELTS & LỚP CĂN BẢN)
  // =========================================================================
  console.log('📝 [6/8] Tạo danh sách bài tập đa dạng trạng thái (Completed, Ongoing, Exam, Draft, Overdue)...');

  // --- BÀI TẬP LỚP IELTS (6 Bài) ---
  // Bài 1: Đã hoàn thành (Completed)
  const assignWeek1 = await prisma.assignment.create({
    data: {
      class_id: classIelts.id,
      created_by: teacherMinh.id,
      title: 'Bài Tập Tuần 1: Skimming & Scanning Practice',
      description: 'Luyện tập kỹ năng định vị từ khóa trong bài đọc IELTS.',
      mode: AssignmentMode.standard,
      is_published: true,
      published_at: new Date(Date.now() - 21 * 24 * 3600 * 1000),
      deadline: new Date(Date.now() - 7 * 24 * 3600 * 1000),
      time_limit: 20,
      max_attempts: 2,
      is_all_students: true,
    },
  });
  for (let i = 0; i < 3; i++) {
    await prisma.assignmentQuestion.create({
      data: { assignment_id: assignWeek1.id, question_id: createdQuestions[i].id, order_index: i },
    });
  }

  // Bài 2: Đang diễn ra (Ongoing) - Chế độ Adaptive SM-2
  const assignWeek2 = await prisma.assignment.create({
    data: {
      class_id: classIelts.id,
      created_by: teacherMinh.id,
      title: 'Luyện Tập Thích Ứng (SM-2): Đảo Ngữ & Thì Hoàn Thành',
      description: 'Hệ thống tự động lặp lại ngắt quãng các câu hỏi đảo ngữ bạn chưa thuần thục cho đến khi đạt độ chính xác 100%.',
      mode: AssignmentMode.adaptive,
      is_published: true,
      published_at: new Date(Date.now() - 14 * 24 * 3600 * 1000),
      time_limit: 30,
      max_attempts: 0,
      is_all_students: true,
    },
  });
  const grammarQuestionIds = [
    createdQuestions[3].id,
    createdQuestions[4].id,
    createdQuestions[5].id,
    createdQuestions[6].id,
    createdQuestions[7].id,
  ];
  for (let i = 0; i < grammarQuestionIds.length; i++) {
    await prisma.assignmentQuestion.create({
      data: { assignment_id: assignWeek2.id, question_id: grammarQuestionIds[i], order_index: i },
    });
  }

  // Bài 3: Đang diễn ra (Ongoing)
  const assignWeek3 = await prisma.assignment.create({
    data: {
      class_id: classIelts.id,
      created_by: teacherMinh.id,
      title: 'Bài Tập Tuần 3: Vocabulary Collocations in Context',
      description: 'Kiểm tra khả năng sử dụng từ vựng chủ đề Công nghệ và Môi trường.',
      mode: AssignmentMode.standard,
      is_published: true,
      published_at: new Date(Date.now() - 7 * 24 * 3600 * 1000),
      deadline: new Date(Date.now() + 3 * 24 * 3600 * 1000),
      time_limit: 25,
      max_attempts: 3,
      is_all_students: true,
    },
  });
  const vocabQuestionIds = [
    createdQuestions[8].id,
    createdQuestions[9].id,
    createdQuestions[10].id,
    createdQuestions[11].id,
  ];
  for (let i = 0; i < vocabQuestionIds.length; i++) {
    await prisma.assignmentQuestion.create({
      data: { assignment_id: assignWeek3.id, question_id: vocabQuestionIds[i], order_index: i },
    });
  }

  // Bài 4: Bài thi Đánh giá Giữa kỳ (Exam Mode - 12 câu)
  const assignWeek4 = await prisma.assignment.create({
    data: {
      class_id: classIelts.id,
      created_by: teacherMinh.id,
      title: 'Đề Thi Đánh Giá Năng Lực Giữa Kỳ (IELTS Mid-term Test)',
      description: 'Bài thi tổng hợp 45 phút, chỉ được làm 01 lần duy nhất, chấm điểm tự động.',
      mode: AssignmentMode.exam,
      is_published: true,
      published_at: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      deadline: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      time_limit: 45,
      max_attempts: 1,
      is_all_students: true,
    },
  });
  for (let i = 0; i < 12; i++) {
    await prisma.assignmentQuestion.create({
      data: { assignment_id: assignWeek4.id, question_id: createdQuestions[i].id, order_index: i },
    });
  }

  // Bài 5: Bản nháp (Draft)
  const assignDraft = await prisma.assignment.create({
    data: {
      class_id: classIelts.id,
      created_by: teacherMinh.id,
      title: '[Bản Nháp] Mini-Test: Nâng Cao Kỹ Năng Paraphrasing',
      description: 'Đề bài tập tự luyện bổ sung cho các bạn học sinh cần cải thiện điểm Reading.',
      mode: AssignmentMode.standard,
      is_published: false,
      time_limit: 15,
      max_attempts: 1,
      is_all_students: true,
    },
  });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignDraft.id, question_id: createdQuestions[0].id, order_index: 0 } });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignDraft.id, question_id: createdQuestions[1].id, order_index: 1 } });

  // Bài 6: Bài tập Quá hạn (Overdue)
  const assignOverdue = await prisma.assignment.create({
    data: {
      class_id: classIelts.id,
      created_by: teacherMinh.id,
      title: 'Bài Tập Bổ Trợ: Phân Biệt Thì Hoàn Thành (Đã Quá Hạn)',
      description: 'Bài tập bắt buộc tuần trước dành cho các bạn chưa đạt yêu cầu.',
      mode: AssignmentMode.standard,
      is_published: true,
      published_at: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      deadline: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      time_limit: 20,
      max_attempts: 1,
      is_all_students: true,
    },
  });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignOverdue.id, question_id: createdQuestions[6].id, order_index: 0 } });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignOverdue.id, question_id: createdQuestions[7].id, order_index: 1 } });

  // Gắn bài tập vào Giáo trình IELTS
  await prisma.curriculumAssignment.create({ data: { curriculum_id: currWeek1.id, assignment_id: assignWeek1.id, order_index: 0 } });
  await prisma.curriculumAssignment.create({ data: { curriculum_id: currWeek2.id, assignment_id: assignWeek2.id, order_index: 0 } });
  await prisma.curriculumAssignment.create({ data: { curriculum_id: currWeek3.id, assignment_id: assignWeek3.id, order_index: 0 } });
  await prisma.curriculumAssignment.create({ data: { curriculum_id: currWeek4.id, assignment_id: assignWeek4.id, order_index: 0 } });

  // --- BÀI TẬP LỚP CĂN BẢN (6 Bài) ---
  // Bài 1 (Căn bản): Thực hành To Be & Đại từ (Completed)
  const assignBasic1 = await prisma.assignment.create({
    data: {
      class_id: classBasic.id,
      created_by: teacherMaiAnh.id,
      title: 'Bài Tập Tuần 1: Thực Hành Động Từ To Be & Đại Từ Nhân Xưng',
      description: 'Củng cố cách dùng am/is/are và đại từ trong các câu giới thiệu căn bản.',
      mode: AssignmentMode.standard,
      is_published: true,
      published_at: new Date(Date.now() - 20 * 24 * 3600 * 1000),
      deadline: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      time_limit: 15,
      max_attempts: 3,
      is_all_students: true,
    },
  });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignBasic1.id, question_id: createdQuestions[12].id, order_index: 0 } });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignBasic1.id, question_id: createdQuestions[13].id, order_index: 1 } });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignBasic1.id, question_id: createdQuestions[17].id, order_index: 2 } });

  // Bài 2 (Căn bản): Luyện tập Thích Ứng Hiện Tại Đơn (Ongoing Adaptive SM-2)
  const assignBasic2 = await prisma.assignment.create({
    data: {
      class_id: classBasic.id,
      created_by: teacherMaiAnh.id,
      title: 'Luyện Tập Thích Ứng (SM-2): Thì Hiện Tại Đơn & Thói Quen Hàng Ngày',
      description: 'Hệ thống tự động lặp lại các câu chia động từ thêm -s/-es và trợ động từ cho đến khi bạn thuần thục.',
      mode: AssignmentMode.adaptive,
      is_published: true,
      published_at: new Date(Date.now() - 12 * 24 * 3600 * 1000),
      time_limit: 25,
      max_attempts: 0,
      is_all_students: true,
    },
  });
  const basicGrammarQIds = [
    createdQuestions[14].id,
    createdQuestions[15].id,
    createdQuestions[16].id,
    createdQuestions[22].id,
  ];
  for (let i = 0; i < basicGrammarQIds.length; i++) {
    await prisma.assignmentQuestion.create({
      data: { assignment_id: assignBasic2.id, question_id: basicGrammarQIds[i], order_index: i },
    });
  }

  // Bài 3 (Căn bản): Ghép Cặp Từ Vựng Đồ Dùng & Giới Từ (Ongoing Standard)
  const assignBasic3 = await prisma.assignment.create({
    data: {
      class_id: classBasic.id,
      created_by: teacherMaiAnh.id,
      title: 'Bài Tập Tuần 3: Ghép Cặp Từ Vựng Đồ Gia Dụng & Giới Từ',
      description: 'Luyện tập kỹ năng nối đồ vật gia đình và phân biệt giới từ in/on/at.',
      mode: AssignmentMode.standard,
      is_published: true,
      published_at: new Date(Date.now() - 6 * 24 * 3600 * 1000),
      deadline: new Date(Date.now() + 4 * 24 * 3600 * 1000),
      time_limit: 20,
      max_attempts: 2,
      is_all_students: true,
    },
  });
  const basicVocabQIds = [
    createdQuestions[18].id,
    createdQuestions[19].id,
    createdQuestions[21].id,
  ];
  for (let i = 0; i < basicVocabQIds.length; i++) {
    await prisma.assignmentQuestion.create({
      data: { assignment_id: assignBasic3.id, question_id: basicVocabQIds[i], order_index: i },
    });
  }

  // Bài 4 (Căn bản): Đề thi Đánh giá Năng lực Căn bản A1-A2 (Exam Mode - 12 câu)
  const assignBasic4 = await prisma.assignment.create({
    data: {
      class_id: classBasic.id,
      created_by: teacherMaiAnh.id,
      title: 'Đề Thi Đánh Giá Trình Độ Căn Bản A1-A2 (Basic English Final Test)',
      description: 'Bài kiểm tra tổng hợp 12 câu hỏi căn bản: To Be, Hiện tại đơn, Mạo từ, Giới từ, Đồ dùng và Nghề nghiệp.',
      mode: AssignmentMode.exam,
      is_published: true,
      published_at: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      deadline: new Date(Date.now() + 6 * 24 * 3600 * 1000),
      time_limit: 40,
      max_attempts: 1,
      is_all_students: true,
    },
  });
  for (let i = 12; i < 24; i++) {
    await prisma.assignmentQuestion.create({
      data: { assignment_id: assignBasic4.id, question_id: createdQuestions[i].id, order_index: i - 12 },
    });
  }

  // Bài 5 (Căn bản): Bản nháp (Draft)
  const assignBasicDraft = await prisma.assignment.create({
    data: {
      class_id: classBasic.id,
      created_by: teacherMaiAnh.id,
      title: '[Bản Nháp] Mini-Test: Nhận Diện Danh Từ Đếm Được & Không Đếm Được',
      description: 'Bộ câu hỏi tự luyện bổ sung dành cho học sinh cần ôn tập thêm mảng đồ ăn và danh từ.',
      mode: AssignmentMode.standard,
      is_published: false,
      time_limit: 15,
      max_attempts: 1,
      is_all_students: true,
    },
  });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignBasicDraft.id, question_id: createdQuestions[21].id, order_index: 0 } });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignBasicDraft.id, question_id: createdQuestions[23].id, order_index: 1 } });

  // Bài 6 (Căn bản): Quá hạn (Overdue)
  const assignBasicOverdue = await prisma.assignment.create({
    data: {
      class_id: classBasic.id,
      created_by: teacherMaiAnh.id,
      title: 'Bài Tập Bổ Trợ: Phân Biệt Giới Từ In/On/At (Đã Quá Hạn)',
      description: 'Bài tập giới từ bổ sung tuần trước.',
      mode: AssignmentMode.standard,
      is_published: true,
      published_at: new Date(Date.now() - 9 * 24 * 3600 * 1000),
      deadline: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      time_limit: 15,
      max_attempts: 1,
      is_all_students: true,
    },
  });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignBasicOverdue.id, question_id: createdQuestions[17].id, order_index: 0 } });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignBasicOverdue.id, question_id: createdQuestions[18].id, order_index: 1 } });

  // Gắn bài tập vào Giáo trình Căn bản
  await prisma.curriculumAssignment.create({ data: { curriculum_id: currBasic1.id, assignment_id: assignBasic1.id, order_index: 0 } });
  await prisma.curriculumAssignment.create({ data: { curriculum_id: currBasic2.id, assignment_id: assignBasic2.id, order_index: 0 } });
  await prisma.curriculumAssignment.create({ data: { curriculum_id: currBasic3.id, assignment_id: assignBasic3.id, order_index: 0 } });
  await prisma.curriculumAssignment.create({ data: { curriculum_id: currBasic4.id, assignment_id: assignBasic4.id, order_index: 0 } });

  // --- BÀI TẬP LỚP GIAO TIẾP ĐỜI SỐNG (3 Bài) ---
  const assignDaily1 = await prisma.assignment.create({
    data: {
      class_id: classDailyLife.id,
      created_by: teacherDavid.id,
      title: 'Luyện Tập Giao Tiếp: Nối Cặp Nghề Nghiệp & Mẫu Câu Nhà Hàng',
      description: 'Luyện tập nhận diện nghề nghiệp và các câu gọi món trong đời sống.',
      mode: AssignmentMode.standard,
      is_published: true,
      published_at: new Date(Date.now() - 8 * 24 * 3600 * 1000),
      deadline: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      time_limit: 20,
      max_attempts: 2,
      is_all_students: true,
    },
  });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignDaily1.id, question_id: createdQuestions[19].id, order_index: 0 } });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignDaily1.id, question_id: createdQuestions[20].id, order_index: 1 } });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignDaily1.id, question_id: createdQuestions[23].id, order_index: 2 } });
  await prisma.curriculumAssignment.create({ data: { curriculum_id: currDaily1.id, assignment_id: assignDaily1.id, order_index: 0 } });

  const assignDaily2 = await prisma.assignment.create({
    data: {
      class_id: classDailyLife.id,
      created_by: teacherDavid.id,
      title: 'Luyện Tập Thích Ứng (SM-2): Phản Xạ Giao Tiếp Hàng Ngày',
      description: 'Tự động lặp lại các mẫu câu hỏi thói quen và giới từ chỉ thời gian.',
      mode: AssignmentMode.adaptive,
      is_published: true,
      published_at: new Date(Date.now() - 4 * 24 * 3600 * 1000),
      time_limit: 25,
      max_attempts: 0,
      is_all_students: true,
    },
  });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignDaily2.id, question_id: createdQuestions[14].id, order_index: 0 } });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignDaily2.id, question_id: createdQuestions[18].id, order_index: 1 } });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignDaily2.id, question_id: createdQuestions[21].id, order_index: 2 } });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignDaily2.id, question_id: createdQuestions[22].id, order_index: 3 } });
  await prisma.curriculumAssignment.create({ data: { curriculum_id: currDaily2.id, assignment_id: assignDaily2.id, order_index: 0 } });

  console.log('✅ Đã tạo đầy đủ các bài tập với các trạng thái khác nhau cho tất cả các lớp.\n');

  // =========================================================================
  // 7. LỊCH SỬ LÀM BÀI, THUẬT TOÁN SM-2 & HÀNH TRÌNH TỪNG HỌC SINH
  // =========================================================================
  console.log('📊 [7/8] Mô phỏng chi tiết hành trình học tập phân hóa (Cả IELTS & Tiếng Anh Căn Bản)...');

  // HÀNH TRÌNH TRONG LỚP IELTS MASTERY (8 học sinh)
  const ieltsStudentProfiles = [
    // 1. Nguyễn Văn An (Top 1)
    {
      student: students[0],
      masteredIndices: [0, 1, 2, 3, 4, 6, 7, 8, 9, 10],
      learningIndices: [5, 11],
      sessions: [
        { assign: assignWeek1, score: 100.0, total: 3, correct: 3, status: 'completed', daysAgo: 18, avgRespMs: 9000 },
        { assign: assignWeek2, score: 100.0, total: 5, correct: 5, status: 'completed', daysAgo: 11, avgRespMs: 11000 },
        { assign: assignWeek3, score: 100.0, total: 4, correct: 4, status: 'completed', daysAgo: 5, avgRespMs: 10000 },
        { assign: assignWeek4, score: 91.67, total: 12, correct: 11, status: 'completed', daysAgo: 1, avgRespMs: 14000 },
      ],
      topics: [
        { topic: topicScanning, total: 3, mastered: 3, weak: 0, ef: 2.75, acc: 100.0 },
        { topic: topicInversions, total: 3, mastered: 2, weak: 0, ef: 2.70, acc: 90.0 },
        { topic: topicTenses, total: 2, mastered: 2, weak: 0, ef: 2.80, acc: 100.0 },
        { topic: topicTechAI, total: 2, mastered: 2, weak: 0, ef: 2.75, acc: 100.0 },
        { topic: topicEnvironment, total: 2, mastered: 1, weak: 0, ef: 2.65, acc: 85.0 },
      ],
    },
    // 2. Trần Thị Bình (Khá)
    {
      student: students[1],
      masteredIndices: [0, 1, 2, 6, 7, 8, 10],
      learningIndices: [3, 4, 9, 11],
      sessions: [
        { assign: assignWeek1, score: 100.0, total: 3, correct: 3, status: 'completed', daysAgo: 19, avgRespMs: 11000 },
        { assign: assignWeek2, score: 80.0, total: 5, correct: 4, status: 'completed', daysAgo: 10, avgRespMs: 13000 },
        { assign: assignWeek3, score: 100.0, total: 4, correct: 4, status: 'completed', daysAgo: 4, avgRespMs: 12000 },
        { assign: assignWeek4, score: 83.33, total: 12, correct: 10, status: 'completed', daysAgo: 1, avgRespMs: 16000 },
      ],
      topics: [
        { topic: topicScanning, total: 3, mastered: 3, weak: 0, ef: 2.60, acc: 100.0 },
        { topic: topicInversions, total: 3, mastered: 1, weak: 0, ef: 2.45, acc: 75.0 },
        { topic: topicTenses, total: 2, mastered: 2, weak: 0, ef: 2.65, acc: 100.0 },
        { topic: topicTechAI, total: 2, mastered: 1, weak: 0, ef: 2.50, acc: 80.0 },
        { topic: topicEnvironment, total: 2, mastered: 1, weak: 0, ef: 2.50, acc: 80.0 },
      ],
    },
    // 3. Hoàng Đăng Khoa (Học lệch)
    {
      student: students[2],
      masteredIndices: [0, 1, 8, 9, 10, 11],
      learningIndices: [2, 3, 6, 7],
      sessions: [
        { assign: assignWeek1, score: 66.67, total: 3, correct: 2, status: 'completed', daysAgo: 17, avgRespMs: 10000 },
        { assign: assignWeek2, score: 60.0, total: 5, correct: 3, status: 'completed', daysAgo: 9, avgRespMs: 14000 },
        { assign: assignWeek3, score: 100.0, total: 4, correct: 4, status: 'completed', daysAgo: 3, avgRespMs: 9000 },
        { assign: assignWeek4, score: 75.0, total: 12, correct: 9, status: 'completed', daysAgo: 1, avgRespMs: 15000 },
      ],
      topics: [
        { topic: topicScanning, total: 3, mastered: 2, weak: 0, ef: 2.45, acc: 75.0 },
        { topic: topicInversions, total: 3, mastered: 0, weak: 1, ef: 2.10, acc: 50.0 },
        { topic: topicTenses, total: 2, mastered: 1, weak: 0, ef: 2.30, acc: 65.0 },
        { topic: topicTechAI, total: 2, mastered: 2, weak: 0, ef: 2.70, acc: 100.0 },
        { topic: topicEnvironment, total: 2, mastered: 2, weak: 0, ef: 2.70, acc: 100.0 },
      ],
    },
    // 4. Đặng Ngọc Lan (Tiến bộ)
    {
      student: students[3],
      masteredIndices: [0, 1, 6, 8],
      learningIndices: [2, 7, 10, 11],
      sessions: [
        { assign: assignWeek1, score: 33.33, total: 3, correct: 1, status: 'completed', daysAgo: 20, avgRespMs: 15000 },
        { assign: assignWeek1, score: 100.0, total: 3, correct: 3, status: 'completed', daysAgo: 16, avgRespMs: 12000 },
        { assign: assignWeek2, score: 60.0, total: 5, correct: 3, status: 'completed', daysAgo: 8, avgRespMs: 16000 },
        { assign: assignWeek3, score: 75.0, total: 4, correct: 3, status: 'completed', daysAgo: 2, avgRespMs: 14000 },
        { assign: assignWeek4, score: 66.67, total: 12, correct: 8, status: 'completed', daysAgo: 1, avgRespMs: 18000 },
      ],
      topics: [
        { topic: topicScanning, total: 3, mastered: 2, weak: 0, ef: 2.40, acc: 75.0 },
        { topic: topicInversions, total: 3, mastered: 0, weak: 1, ef: 2.15, acc: 55.0 },
        { topic: topicTenses, total: 2, mastered: 1, weak: 0, ef: 2.40, acc: 70.0 },
        { topic: topicTechAI, total: 2, mastered: 1, weak: 0, ef: 2.30, acc: 70.0 },
        { topic: topicEnvironment, total: 2, mastered: 0, weak: 0, ef: 2.25, acc: 65.0 },
      ],
    },
    // 5. Lê Khánh Chi (Yếu Đảo ngữ)
    {
      student: students[4],
      masteredIndices: [0, 1],
      learningIndices: [6, 8, 10],
      sessions: [
        { assign: assignWeek1, score: 66.67, total: 3, correct: 2, status: 'completed', daysAgo: 18, avgRespMs: 12000 },
        { assign: assignWeek2, score: 40.0, total: 5, correct: 2, status: 'completed', daysAgo: 11, avgRespMs: 18000 },
        { assign: assignWeek3, score: 50.0, total: 4, correct: 2, status: 'completed', daysAgo: 3, avgRespMs: 16000 },
      ],
      topics: [
        { topic: topicScanning, total: 3, mastered: 2, weak: 0, ef: 2.30, acc: 66.7 },
        { topic: topicInversions, total: 3, mastered: 0, weak: 3, ef: 1.45, acc: 0.0 },
        { topic: topicTenses, total: 2, mastered: 0, weak: 1, ef: 2.10, acc: 50.0 },
        { topic: topicTechAI, total: 2, mastered: 0, weak: 1, ef: 2.00, acc: 50.0 },
      ],
    },
    // 6. Phạm Tiến Dũng (Yếu & Bỏ dở)
    {
      student: students[6],
      masteredIndices: [0],
      learningIndices: [1, 8],
      sessions: [
        { assign: assignWeek1, score: 33.33, total: 3, correct: 1, status: 'completed', daysAgo: 19, avgRespMs: 8000 },
        { assign: assignWeek2, score: 20.0, total: 5, correct: 1, status: 'in_progress', daysAgo: 7, avgRespMs: 7000 },
      ],
      topics: [
        { topic: topicScanning, total: 3, mastered: 1, weak: 1, ef: 1.90, acc: 33.3 },
        { topic: topicInversions, total: 3, mastered: 0, weak: 2, ef: 1.50, acc: 20.0 },
      ],
    },
    // 7. Đỗ Minh Quang (Mất gốc / Điểm liệt / Đoán mò ở IELTS)
    {
      student: students[7],
      masteredIndices: [],
      learningIndices: [0, 8],
      sessions: [
        { assign: assignWeek1, score: 33.33, total: 3, correct: 1, status: 'completed', daysAgo: 20, avgRespMs: 2500 },
        { assign: assignWeek4, score: 16.67, total: 12, correct: 2, status: 'completed', daysAgo: 1, avgRespMs: 2400 },
      ],
      topics: [
        { topic: topicScanning, total: 3, mastered: 0, weak: 2, ef: 1.40, acc: 25.0 },
        { topic: topicInversions, total: 3, mastered: 0, weak: 3, ef: 1.30, acc: 0.0 },
        { topic: topicTenses, total: 2, mastered: 0, weak: 2, ef: 1.30, acc: 0.0 },
        { topic: topicTechAI, total: 2, mastered: 0, weak: 1, ef: 1.40, acc: 25.0 },
        { topic: topicEnvironment, total: 2, mastered: 0, weak: 2, ef: 1.30, acc: 0.0 },
      ],
    },
    // 8. Bùi Hải Nam (Bỏ bê)
    {
      student: students[8],
      masteredIndices: [],
      learningIndices: [],
      sessions: [],
      topics: [],
    },
  ];

  // HÀNH TRÌNH TRONG LỚP TIẾNG ANH CĂN BẢN (A1-A2 Starter - 8 học sinh)
  const basicStudentProfiles = [
    // 1. Đỗ Minh Quang (Tiến bộ vượt bậc khi học đúng trình độ căn bản!)
    {
      student: students[7],
      masteredIndices: [12, 13, 14, 16, 17, 23], // 6 câu thành thạo
      learningIndices: [15, 18, 19, 21],
      sessions: [
        { assign: assignBasic1, score: 100.0, total: 3, correct: 3, status: 'completed', daysAgo: 16, avgRespMs: 7500 },
        { assign: assignBasic2, score: 75.0, total: 4, correct: 3, status: 'completed', daysAgo: 9, avgRespMs: 9000 },
        { assign: assignBasic3, score: 66.67, total: 3, correct: 2, status: 'completed', daysAgo: 3, avgRespMs: 8500 },
        { assign: assignBasic4, score: 75.0, total: 12, correct: 9, status: 'completed', daysAgo: 1, avgRespMs: 11000 },
      ],
      topics: [
        { topic: topicToBe, total: 2, mastered: 2, weak: 0, ef: 2.65, acc: 100.0 },
        { topic: topicPresentSimple, total: 4, mastered: 3, weak: 0, ef: 2.45, acc: 75.0 },
        { topic: topicArticles, total: 2, mastered: 1, weak: 0, ef: 2.35, acc: 75.0 },
        { topic: topicFamilyHome, total: 2, mastered: 2, weak: 0, ef: 2.50, acc: 85.0 },
        { topic: topicFoodShopping, total: 1, mastered: 0, weak: 0, ef: 2.20, acc: 60.0 },
        { topic: topicJobsTime, total: 1, mastered: 0, weak: 0, ef: 2.30, acc: 70.0 },
      ],
    },
    // 2. Phạm Tiến Dũng (Lấy lại căn bản)
    {
      student: students[6],
      masteredIndices: [12, 13, 14, 17], // 4 câu thành thạo
      learningIndices: [15, 16, 18, 19],
      sessions: [
        { assign: assignBasic1, score: 100.0, total: 3, correct: 3, status: 'completed', daysAgo: 17, avgRespMs: 9000 },
        { assign: assignBasic2, score: 75.0, total: 4, correct: 3, status: 'completed', daysAgo: 8, avgRespMs: 10000 },
        { assign: assignBasic3, score: 66.67, total: 3, correct: 2, status: 'completed', daysAgo: 2, avgRespMs: 11000 },
        { assign: assignBasic4, score: 66.67, total: 12, correct: 8, status: 'completed', daysAgo: 1, avgRespMs: 12500 },
      ],
      topics: [
        { topic: topicToBe, total: 2, mastered: 2, weak: 0, ef: 2.55, acc: 100.0 },
        { topic: topicPresentSimple, total: 4, mastered: 2, weak: 0, ef: 2.35, acc: 70.0 },
        { topic: topicArticles, total: 2, mastered: 1, weak: 0, ef: 2.30, acc: 65.0 },
        { topic: topicFamilyHome, total: 2, mastered: 1, weak: 0, ef: 2.30, acc: 65.0 },
      ],
    },
    // 3. Ngô Thu Phương (Chăm chỉ - Kết quả tốt)
    {
      student: students[5],
      masteredIndices: [12, 13, 14, 16, 17, 18, 23], // 7 câu thành thạo
      learningIndices: [15, 19, 20, 21, 22],
      sessions: [
        { assign: assignBasic1, score: 100.0, total: 3, correct: 3, status: 'completed', daysAgo: 18, avgRespMs: 10000 },
        { assign: assignBasic2, score: 75.0, total: 4, correct: 3, status: 'completed', daysAgo: 10, avgRespMs: 12000 },
        { assign: assignBasic3, score: 100.0, total: 3, correct: 3, status: 'completed', daysAgo: 4, avgRespMs: 10500 },
        { assign: assignBasic4, score: 83.33, total: 12, correct: 10, status: 'completed', daysAgo: 1, avgRespMs: 13000 },
      ],
      topics: [
        { topic: topicToBe, total: 2, mastered: 2, weak: 0, ef: 2.70, acc: 100.0 },
        { topic: topicPresentSimple, total: 4, mastered: 3, weak: 0, ef: 2.50, acc: 80.0 },
        { topic: topicArticles, total: 2, mastered: 2, weak: 0, ef: 2.60, acc: 90.0 },
        { topic: topicFamilyHome, total: 2, mastered: 2, weak: 0, ef: 2.65, acc: 90.0 },
      ],
    },
    // 4. Lê Khánh Chi (Nắm rất vững căn bản)
    {
      student: students[4],
      masteredIndices: [12, 13, 14, 15, 16, 17, 18, 22, 23], // 9 câu thành thạo
      learningIndices: [19, 20, 21],
      sessions: [
        { assign: assignBasic1, score: 100.0, total: 3, correct: 3, status: 'completed', daysAgo: 19, avgRespMs: 8000 },
        { assign: assignBasic2, score: 100.0, total: 4, correct: 4, status: 'completed', daysAgo: 11, avgRespMs: 9500 },
        { assign: assignBasic3, score: 100.0, total: 3, correct: 3, status: 'completed', daysAgo: 5, avgRespMs: 9000 },
        { assign: assignBasic4, score: 91.67, total: 12, correct: 11, status: 'completed', daysAgo: 1, avgRespMs: 11500 },
      ],
      topics: [
        { topic: topicToBe, total: 2, mastered: 2, weak: 0, ef: 2.80, acc: 100.0 },
        { topic: topicPresentSimple, total: 4, mastered: 4, weak: 0, ef: 2.75, acc: 100.0 },
        { topic: topicArticles, total: 2, mastered: 2, weak: 0, ef: 2.70, acc: 100.0 },
        { topic: topicFamilyHome, total: 2, mastered: 2, weak: 0, ef: 2.75, acc: 95.0 },
      ],
    },
    // 5. Trần Thị Bình (Xuất sắc)
    {
      student: students[1],
      masteredIndices: [12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 23], // 11 câu thành thạo
      learningIndices: [21],
      sessions: [
        { assign: assignBasic1, score: 100.0, total: 3, correct: 3, status: 'completed', daysAgo: 18, avgRespMs: 6500 },
        { assign: assignBasic2, score: 100.0, total: 4, correct: 4, status: 'completed', daysAgo: 10, avgRespMs: 8000 },
        { assign: assignBasic3, score: 100.0, total: 3, correct: 3, status: 'completed', daysAgo: 4, avgRespMs: 7500 },
        { assign: assignBasic4, score: 100.0, total: 12, correct: 12, status: 'completed', daysAgo: 1, avgRespMs: 9000 },
      ],
      topics: [
        { topic: topicToBe, total: 2, mastered: 2, weak: 0, ef: 2.85, acc: 100.0 },
        { topic: topicPresentSimple, total: 4, mastered: 4, weak: 0, ef: 2.80, acc: 100.0 },
        { topic: topicArticles, total: 2, mastered: 2, weak: 0, ef: 2.80, acc: 100.0 },
        { topic: topicFamilyHome, total: 2, mastered: 2, weak: 0, ef: 2.80, acc: 100.0 },
      ],
    },
    // 6. Vũ Quỳnh Hoa (Học viên mới)
    {
      student: students[9],
      masteredIndices: [12, 13, 14, 17], // 4 câu thành thạo
      learningIndices: [15, 16],
      sessions: [
        { assign: assignBasic1, score: 100.0, total: 3, correct: 3, status: 'completed', daysAgo: 15, avgRespMs: 9500 },
        { assign: assignBasic2, score: 75.0, total: 4, correct: 3, status: 'completed', daysAgo: 7, avgRespMs: 11000 },
      ],
      topics: [
        { topic: topicToBe, total: 2, mastered: 2, weak: 0, ef: 2.60, acc: 100.0 },
        { topic: topicPresentSimple, total: 4, mastered: 2, weak: 0, ef: 2.40, acc: 75.0 },
      ],
    },
  ];

  const allProfiles = [...ieltsStudentProfiles, ...basicStudentProfiles];

  for (const prof of allProfiles) {
    const sId = prof.student.id;

    // 1. Tạo SM-2 Mastered Questions
    for (const qIdx of prof.masteredIndices) {
      const q = createdQuestions[qIdx];
      await prisma.sm2Progress.upsert({
        where: { student_id_question_id: { student_id: sId, question_id: q.id } },
        update: {
          easiness_factor: 2.65,
          repetition_count: 5,
          interval_days: 28,
          next_review_date: new Date(Date.now() + 25 * 24 * 3600 * 1000),
          last_reviewed_at: new Date(Date.now() - 3 * 24 * 3600 * 1000),
          total_attempts: 5,
          correct_attempts: 5,
        },
        create: {
          student_id: sId,
          question_id: q.id,
          easiness_factor: 2.65,
          repetition_count: 5,
          interval_days: 28,
          next_review_date: new Date(Date.now() + 25 * 24 * 3600 * 1000),
          last_reviewed_at: new Date(Date.now() - 3 * 24 * 3600 * 1000),
          total_attempts: 5,
          correct_attempts: 5,
        },
      });
    }

    // 2. Tạo SM-2 Learning Questions
    for (const qIdx of prof.learningIndices) {
      const q = createdQuestions[qIdx];
      const isWeak = q.topic_id === topicInversions.id;
      const isSevere = prof.student.email === 'student.quang@system.com' && qIdx < 12;

      const efVal = isSevere ? 1.30 : isWeak ? 1.45 : 2.10;
      const repVal = (isSevere || isWeak) ? 0 : 2;
      const intVal = (isSevere || isWeak) ? 1 : 4;

      await prisma.sm2Progress.upsert({
        where: { student_id_question_id: { student_id: sId, question_id: q.id } },
        update: {
          easiness_factor: efVal,
          repetition_count: repVal,
          interval_days: intVal,
          next_review_date: (isSevere || isWeak) ? new Date() : new Date(Date.now() + 4 * 24 * 3600 * 1000),
          last_reviewed_at: new Date(Date.now() - 3 * 24 * 3600 * 1000),
          total_attempts: isSevere ? 3 : isWeak ? 4 : 2,
          correct_attempts: isSevere ? 0 : isWeak ? 1 : 2,
        },
        create: {
          student_id: sId,
          question_id: q.id,
          easiness_factor: efVal,
          repetition_count: repVal,
          interval_days: intVal,
          next_review_date: (isSevere || isWeak) ? new Date() : new Date(Date.now() + 4 * 24 * 3600 * 1000),
          last_reviewed_at: new Date(Date.now() - 3 * 24 * 3600 * 1000),
          total_attempts: isSevere ? 3 : isWeak ? 4 : 2,
          correct_attempts: isSevere ? 0 : isWeak ? 1 : 2,
        },
      });
    }

    // 3. Tạo Quiz Sessions & Answers
    for (const sess of prof.sessions) {
      const isCompleted = sess.status === 'completed';
      const startedDate = new Date(Date.now() - sess.daysAgo * 24 * 3600 * 1000);
      const finishedDate = isCompleted ? new Date(startedDate.getTime() + (sess.total * sess.avgRespMs)) : null;

      const createdSession = await prisma.quizSession.create({
        data: {
          student_id: sId,
          assignment_id: sess.assign.id,
          started_at: startedDate,
          finished_at: finishedDate,
          score: sess.score,
          total_q: sess.total,
          answered_q: isCompleted ? sess.total : sess.correct + 1,
          correct_q: sess.correct,
          status: sess.status,
        },
      });

      if (isCompleted) {
        const aqs = await prisma.assignmentQuestion.findMany({
          where: { assignment_id: sess.assign.id },
          include: { question: { include: { answer_options: true } } },
          orderBy: { order_index: 'asc' },
        });

        for (let i = 0; i < aqs.length; i++) {
          const q = aqs[i].question;
          const isCorrect = i < sess.correct;
          const opt = isCorrect
            ? q.answer_options.find(o => o.is_correct)
            : q.answer_options.find(o => !o.is_correct);

          await prisma.sessionAnswer.create({
            data: {
              session_id: createdSession.id,
              question_id: q.id,
              selected_option: opt?.id,
              is_correct: isCorrect,
              response_time_ms: sess.avgRespMs + Math.floor(Math.random() * 2000) - 1000,
              sm2_quality: isCorrect ? 5 : (prof.student.email === 'student.quang@system.com' && sess.assign.class_id === classIelts.id ? 0 : 2),
              answered_at: new Date(startedDate.getTime() + (i + 1) * sess.avgRespMs),
            },
          });
        }
      }
    }

    // 4. Tạo StudentTopicStats
    for (const tStat of prof.topics) {
      await prisma.studentTopicStats.create({
        data: {
          student_id: sId,
          topic_id: tStat.topic.id,
          total_questions: tStat.total,
          mastered_count: tStat.mastered,
          weak_count: tStat.weak,
          avg_ef: tStat.ef,
          accuracy_pct: tStat.acc,
        },
      });
    }
  }

  console.log('✅ Đã tạo dữ liệu hành trình học tập phân hóa chân thực cho cả các lớp nâng cao và lớp cơ bản.\n');

  // =========================================================================
  // 8. BÁO CÁO PHÂN TÍCH AI (AI REPORTS)
  // =========================================================================
  console.log('🤖 [8/8] Sinh báo cáo AI phân tích rủi ro & tiến độ học tập...');

  // Báo cáo AI Toàn Lớp IELTS
  await prisma.aiReport.create({
    data: {
      class_id: classIelts.id,
      type: 'class',
      report: {
        course_name: 'IELTS Mastery 6.5+ (Khóa Học Thuật Chuyên Sâu)',
        analysis_timestamp: new Date().toISOString(),
        cohort_summary: {
          enrolled_students: 8,
          active_participants: 7,
          inactive_students: 1,
          overall_average_score: 64.2,
          curriculum_completion_rate: 62.5,
        },
        strengths: [
          'Nhóm dẫn đầu (Nguyễn Văn An, Trần Thị Bình) đạt độ thành thạo cao (EF > 2.50) ở tất cả các bài đọc và từ vựng.',
          'Học sinh Đặng Ngọc Lan có sự bứt phá tiến bộ rõ rệt sau khi làm lại bài tập Tuần 1 (từ 33% lên 100%).',
        ],
        critical_alerts_and_risks: [
          '🔴 BÁO ĐỘNG ĐỎ - Học sinh Đỗ Minh Quang: Có dấu hiệu làm bài đối phó / đoán mò trong lớp IELTS (2.5s/câu, điểm thi 16.67%). Đã được chuyển hướng sang lớp Tiếng Anh Căn Bản A1-A2 để củng cố gốc.',
          '🔴 BÁO ĐỘNG VẮNG MẶT - Học sinh Bùi Hải Nam: Chưa thực hiện bất kỳ bài tập nào trong lớp IELTS.',
          '🟡 NÚT THẮT CHUYÊN ĐỀ - Câu Điều Kiện & Đảo Ngữ: 62.5% học sinh trong lớp (Chi, Dũng, Quang, Khoa) đạt điểm dưới trung bình.',
        ],
        actionable_recommendations: [
          '1. Khuyến khích Quang và Dũng hoàn thành tốt khóa Tiếng Anh Nền Tảng A1-A2 trước khi quay lại luyện đề IELTS.',
          '2. Xếp lịch phụ đạo chuyên đề Đảo Ngữ vào thứ Bảy cho nhóm học sinh có EF < 2.0 (Chi, Dũng).',
        ],
      },
    },
  });

  // Báo cáo AI Toàn Lớp Tiếng Anh Căn Bản (ClassBasic)
  await prisma.aiReport.create({
    data: {
      class_id: classBasic.id,
      type: 'class',
      report: {
        course_name: 'Tiếng Anh Nền Tảng Cho Người Mất Gốc (Zero to A2 Starter)',
        analysis_timestamp: new Date().toISOString(),
        cohort_summary: {
          enrolled_students: 8,
          active_participants: 7,
          inactive_students: 1,
          overall_average_score: 81.5,
          curriculum_completion_rate: 85.0,
        },
        strengths: [
          '87.5% học viên mất gốc đã nắm vững động từ To Be và cấu trúc Hiện tại đơn sau 4 tuần.',
          'Học sinh Đỗ Minh Quang và Phạm Tiến Dũng có sự tự tin và cải thiện rõ rệt (Độ chính xác tăng từ < 25% ở lớp nâng cao lên 75% ở lớp căn bản).',
        ],
        critical_alerts_and_risks: [
          '🟡 CẦN LƯU Ý - Vẫn còn 25% học sinh nhầm lẫn giữa mạo từ "a/an" trước các danh từ bắt đầu bằng nguyên âm/phụ âm.',
        ],
        actionable_recommendations: [
          '1. Giao thêm bài tập mini-test thực hành mạo từ A/An/The trong tuần tới.',
          '2. Tuyên dương học sinh Đỗ Minh Quang và Ngô Thu Phương vì sự tiến bộ và chăm chỉ làm bài.',
        ],
      },
    },
  });

  // Báo cáo cá nhân cho Đỗ Minh Quang
  await prisma.aiReport.create({
    data: {
      student_id: students[7].id,
      class_id: classBasic.id,
      type: 'student',
      report: {
        student_name: 'Đỗ Minh Quang',
        risk_level: 'TIẾN BỘ TÍCH CỰC (Improving)',
        current_estimated_band: 'A2 (Đã lấy lại căn bản)',
        accuracy_overall: 76.5,
        sm2_memory_retention: '72% (Cải thiện rõ rệt)',
        evaluation: 'Sau khi học đúng lộ trình Tiếng Anh Căn Bản A1-A2, Quang đã không còn đoán mò (thời gian làm bài đạt chuẩn 8-11s/câu) và làm đúng 9/12 câu trong bài thi tổng hợp.',
        suggested_next_steps: [
          'Tiếp tục duy trì ôn tập ngắt quãng SM-2 cho 6 câu đã thành thạo.',
          'Chuẩn bị chuyển tiếp lên lớp Tiếng Anh Giao Tiếp Đời Sống Hàng Ngày.',
        ],
      },
    },
  });

  console.log('✅ Đã tạo các báo cáo AI phản ánh toàn diện các mức độ năng lực.\n');

  console.log('═══════════════════════════════════════════════════════════════════════════════════');
  console.log('🎉 HỆ SINH THÁI DỮ LIỆU ĐÃ ĐƯỢC MỞ RỘNG TOÀN DIỆN VỚI CẢ TIẾNG ANH CĂN BẢN & NÂNG CAO!');
  console.log('═══════════════════════════════════════════════════════════════════════════════════');
  console.log('📌 DANH SÁCH CÁC LỚP HỌC TRONG HỆ THỐNG:');
  console.log('   1. IELTS Mastery 6.5+ (Khóa Học Thuật Chuyên Sâu) - Thầy Minh');
  console.log('   2. Tiếng Anh Nền Tảng Cho Người Mất Gốc (Zero to A2 Starter) - Cô Mai Anh');
  console.log('   3. Tiếng Anh Giao Tiếp Đời Sống Hàng Ngày (Everyday Life English) - Thầy David');
  console.log('   4. Luyện Thi THPT Quốc Gia 2026 - Chinh Phục Điểm 9+ - Thầy David');
  console.log('   5. Tiếng Anh Giao Tiếp Doanh Nghiệp & Phản Xạ Nhanh - Cô Mai Anh');
  console.log('-----------------------------------------------------------------------------------');
  console.log('📌 TỔNG CỘNG: 24 Câu hỏi (12 IELTS + 12 Căn bản), 15+ Bài tập đa dạng trạng thái');
  console.log('👉 Mật khẩu tất cả tài khoản: Password123!@# (Admin: Admin123!@#)');
  console.log('═══════════════════════════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi trong quá trình Seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
