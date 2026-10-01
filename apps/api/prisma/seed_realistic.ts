import { PrismaClient, QuestionType, AssignmentMode } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Bắt đầu khởi tạo hệ sinh thái dữ liệu thực tế (1 Admin, 1 Gia Sư, 12 Học Viên, 1 Lớp Duy Nhất)...\n');

  // =========================================================================
  // 1. DỌN DẸP DỮ LIỆU CŨ (CLEANUP THEO THỨ TỰ RÀNG BUỘC TOÀN VẸN)
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
  // 2. KHỞI TẠO TÀI KHOẢN (1 ADMIN, 1 GIA SƯ, 12 HỌC VIÊN ĐA DẠNG PERSONA)
  // =========================================================================
  console.log('👥 [2/8] Khởi tạo tài khoản: 1 Admin, 1 Gia sư, 12 Học viên đa dạng...');
  const defaultPasswordHash = await bcrypt.hash('Password123!@#', 10);
  const adminPasswordHash = await bcrypt.hash('Admin123!@#', 10);

  // 1 Tài khoản Admin
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

  // 1 Tài khoản Gia Sư (Tutor / Teacher)
  const tutor = await prisma.user.create({
    data: {
      email: 'tutor.minh@system.com',
      password_hash: defaultPasswordHash,
      full_name: 'Thầy Hoàng Minh (Gia sư Chuyên ngữ)',
      role: 'teacher',
      is_active: true,
      phone: '0912345678',
      address: 'Hà Nội, Việt Nam',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    },
  });

  // 12 Học viên với đầy đủ tính cách, năng lực và hành vi học tập khác nhau
  const rawStudents = [
    { email: 'student.an@system.com', name: 'Nguyễn Văn An', phone: '0981111001', persona: 'Xuất sắc, dẫn đầu lớp, phản xạ nhanh (4-5s), học bền bỉ 30 ngày' },
    { email: 'student.binh@system.com', name: 'Trần Thị Bình', phone: '0981111002', persona: 'Khá giỏi, học đều 5 ngày/tuần, thỉnh thoảng nhầm đảo ngữ khó' },
    { email: 'student.khoa@system.com', name: 'Hoàng Đăng Khoa', phone: '0981111003', persona: 'Học lệch: Rất giỏi từ vựng (95%) nhưng ngữ pháp đảo ngữ yếu (35%)' },
    { email: 'student.lan@system.com', name: 'Đặng Ngọc Lan', phone: '0981111004', persona: 'Bứt phá ngoạn mục: Tuần đầu 40% -> Tuần 4 đạt 90%, EF phục hồi mạnh' },
    { email: 'student.chi@system.com', name: 'Lê Khánh Chi', phone: '0981111005', persona: 'Nguy cơ rơi rụng (At-risk): Đã ngưng học 12 ngày qua, quên kiến thức nhanh' },
    { email: 'student.phuong@system.com', name: 'Ngô Thu Phương', phone: '0981111006', persona: 'Cần cù nhưng phản xạ chậm (18-24s), điểm tăng tiến chậm mà chắc' },
    { email: 'student.dung@system.com', name: 'Phạm Tiến Dũng', phone: '0981111007', persona: 'Đoán mò, ẩu đoảng (dưới 3s), hay bỏ dở bài tập giữa chừng (in_progress)' },
    { email: 'student.quang@system.com', name: 'Đỗ Minh Quang', phone: '0981111008', persona: 'Mất gốc vươn lên: Từng chán nản nay lấy lại nền tảng đạt 80%+' },
    { email: 'student.nam@system.com', name: 'Bùi Hải Nam', phone: '0981111009', persona: 'Bỏ học (Dropout): Chỉ tham gia đúng 1 bài 28 ngày trước rồi nghỉ hẳn' },
    { email: 'student.hoa@system.com', name: 'Vũ Quỳnh Hoa', phone: '0981111010', persona: 'Học viên mới: Nhập học 7 ngày trước, tích cực hoàn thành bài tập' },
    { email: 'student.kiet@system.com', name: 'Mai Tuấn Kiệt', phone: '0981111011', persona: 'Trung bình khá: Học lực ổn định nhưng ngắt quãng 2-3 ngày mới làm bài' },
    { email: 'student.ngoc@system.com', name: 'Lương Bảo Ngọc', phone: '0981111012', persona: 'Chuyên gia ngữ pháp: Rất giỏi ngữ pháp nhưng đọc hiểu từ vựng cần trau dồi' },
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

  console.log(`✅ Đã tạo: 1 Admin (${admin.email}), 1 Gia sư (${tutor.email}), ${students.length} Học viên.\n`);

  // =========================================================================
  // 3. THIẾT LẬP CÂY CHUYÊN ĐỀ HỌC TẬP (TOPICS HIERARCHY)
  // =========================================================================
  console.log('📚 [3/8] Thiết lập cây chuyên đề học thuật & tiếng Anh giao tiếp phù hợp lớp học...');

  // --- CÂY 1: NGỮ PHÁP TIẾNG ANH TOÀN DIỆN (GRAMMAR MASTERY) ---
  const rootGrammar = await prisma.topic.create({
    data: {
      name: 'Ngữ Pháp Tiếng Anh Toàn Diện (Comprehensive Grammar)',
      code: 'GRM000',
      description: 'Chương trình ngữ pháp hệ thống từ nền tảng A1-A2 đến cấu trúc nâng cao B2-C1.',
      created_by: tutor.id,
    },
  });

  const branchFoundationalGrammar = await prisma.topic.create({
    data: {
      name: 'Ngữ Pháp Nền Tảng & Đặt Câu (Foundational Grammar)',
      code: 'BGRM00',
      description: 'Quy tắc đặt câu cơ bản, chia động từ To Be, thì Hiện tại đơn và mạo từ/giới từ.',
      parent_id: rootGrammar.id,
      created_by: tutor.id,
    },
  });

  const branchAdvancedGrammar = await prisma.topic.create({
    data: {
      name: 'Ngữ Pháp Nâng Cao & Học Thuật (Advanced Academic Grammar)',
      code: 'AGRM00',
      description: 'Cấu trúc câu phức, thì hoàn thành tiếp diễn và các dạng đảo ngữ điều kiện nâng cao.',
      parent_id: rootGrammar.id,
      created_by: tutor.id,
    },
  });

  // Chuyên đề con ngữ pháp nền tảng:
  const topicToBe = await prisma.topic.create({
    data: {
      name: 'Động từ "To Be" & Đại từ Nhân xưng (Pronouns & To Be)',
      code: 'GRM001',
      description: 'Cách chia am/is/are, đại từ nhân xưng và các cấu trúc câu giới thiệu bản thân.',
      parent_id: branchFoundationalGrammar.id,
      created_by: tutor.id,
    },
  });

  const topicPresentSimple = await prisma.topic.create({
    data: {
      name: 'Thì Hiện Tại Đơn & Thói Quen Hàng Ngày (Present Simple & Routines)',
      code: 'GRM002',
      description: 'Quy tắc thêm -s/-es, trợ động từ do/does và trạng từ chỉ tần suất always/usually/never.',
      parent_id: branchFoundationalGrammar.id,
      created_by: tutor.id,
    },
  });

  const topicArticlesPreps = await prisma.topic.create({
    data: {
      name: 'Mạo từ (A, An, The) & Giới từ Thời Gian / Nơi Chốn (Articles & Prepositions)',
      code: 'GRM003',
      description: 'Phân biệt mạo từ xác định/không xác định và sử dụng giới từ in/on/at chuẩn xác.',
      parent_id: branchFoundationalGrammar.id,
      created_by: tutor.id,
    },
  });

  // Chuyên đề con ngữ pháp nâng cao:
  const topicTenses = await prisma.topic.create({
    data: {
      name: 'Các Thì Hoàn Thành & Tiếp Diễn (Perfect & Continuous Tenses)',
      code: 'GRM004',
      description: 'Làm chủ Hiện tại hoàn thành, Quá khứ hoàn thành tiếp diễn và phân biệt mốc thời gian.',
      parent_id: branchAdvancedGrammar.id,
      created_by: tutor.id,
    },
  });

  const topicInversions = await prisma.topic.create({
    data: {
      name: 'Câu Điều Kiện & Đảo Ngữ Nâng Cao (Conditionals & Inversions)',
      code: 'GRM005',
      description: 'Cấu trúc câu điều kiện loại 2, 3 và đảo ngữ Should / Were / Had (Dễ gây nhầm lẫn).',
      parent_id: branchAdvancedGrammar.id,
      created_by: tutor.id,
    },
  });

  // --- CÂY 2: TỪ VỰNG & KỸ NĂNG ĐỌC HIỂU (VOCABULARY & READING SKILLS) ---
  const rootSkills = await prisma.topic.create({
    data: {
      name: 'Từ Vựng & Kỹ Năng Đọc Hiểu (Vocabulary & Reading Mastery)',
      code: 'SKL000',
      description: 'Vốn từ vựng thực tế và kỹ thuật xử lý bài đọc học thuật cũng như giao tiếp.',
      created_by: tutor.id,
    },
  });

  const branchEverydayVocab = await prisma.topic.create({
    data: {
      name: 'Từ Vựng Đời Sống & Giao Tiếp (Everyday & Workplace Vocabulary)',
      code: 'EVOC00',
      description: 'Từ vựng các chủ đề gần gũi: Gia đình, Mua sắm, Nghề nghiệp và Nhà hàng.',
      parent_id: rootSkills.id,
      created_by: tutor.id,
    },
  });

  const branchAcademicVocab = await prisma.topic.create({
    data: {
      name: 'Từ Vựng Học Thuật & Đọc Hiểu (Academic Reading & Topic Collocations)',
      code: 'AVOC00',
      description: 'Kỹ thuật đọc Skimming/Scanning và vốn từ chủ đề Công nghệ, AI và Biến đổi khí hậu.',
      parent_id: rootSkills.id,
      created_by: tutor.id,
    },
  });

  // Chuyên đề con từ vựng đời sống:
  const topicFamilyHome = await prisma.topic.create({
    data: {
      name: 'Gia Đình, Nhà Cửa & Đồ Gia Dụng (Family & Home Essentials)',
      code: 'VOC001',
      description: 'Từ vựng thành viên gia đình, các phòng và thiết bị gia dụng trong gia đình.',
      parent_id: branchEverydayVocab.id,
      created_by: tutor.id,
    },
  });

  const topicFoodJobs = await prisma.topic.create({
    data: {
      name: 'Mua Sắm, Ăn Uống & Nghề Nghiệp (Shopping, Food & Occupations)',
      code: 'VOC002',
      description: 'Danh từ đếm được/không đếm được, từ vựng ăn uống và mô tả các ngành nghề.',
      parent_id: branchEverydayVocab.id,
      created_by: tutor.id,
    },
  });

  // Chuyên đề con từ vựng học thuật & đọc hiểu:
  const topicScanning = await prisma.topic.create({
    data: {
      name: 'Kỹ Thuật Đọc Skimming & Scanning (Reading Strategies & Keywords)',
      code: 'VOC003',
      description: 'Chiến thuật đọc quét định vị từ khóa, năm tháng, số liệu và danh từ riêng.',
      parent_id: branchAcademicVocab.id,
      created_by: tutor.id,
    },
  });

  const topicTechAI = await prisma.topic.create({
    data: {
      name: 'Công Nghệ, AI & Đổi Mới Sáng Tạo (Technology, AI & Innovation)',
      code: 'VOC004',
      description: 'Từ vựng và collocations chủ đề công nghệ số, trí tuệ nhân tạo và chuyển đổi số.',
      parent_id: branchAcademicVocab.id,
      created_by: tutor.id,
    },
  });

  const topicEnvironment = await prisma.topic.create({
    data: {
      name: 'Môi Trường & Phát Triển Bền Vững (Climate Change & Sustainability)',
      code: 'VOC005',
      description: 'Từ vựng chủ đề biến đổi khí hậu, năng lượng xanh và bảo vệ hệ sinh thái.',
      parent_id: branchAcademicVocab.id,
      created_by: tutor.id,
    },
  });

  console.log('✅ Đã tạo cấu trúc cây chuyên đề 10 nhánh hoàn chỉnh phù hợp cho lớp học.\n');

  // =========================================================================
  // 4. NGÂN HÀNG CÂU HỎI (26 CÂU HỎI ĐA DẠNG: ĐỦ LOẠI DẠNG & ĐỘ KHÓ 1-5)
  // =========================================================================
  console.log('❓ [4/8] Khởi tạo ngân hàng câu hỏi đa dạng (26 câu hỏi chuẩn hóa)...');

  const questionsData = [
    // 0. Scanning - Dễ (Diff 1) - True/False
    {
      topic_id: topicScanning.id,
      created_by: tutor.id,
      content: 'True or False: "Scanning" means reading every single word from the very first page to the last page.',
      question_type: QuestionType.true_false,
      difficulty: 1,
      explanation: 'False. Scanning là kỹ thuật đọc quét nhanh để tìm kiếm từ khóa hoặc thông tin cụ thể, không đọc từng chữ.',
      is_public: true,
      options: [
        { content: 'True', is_correct: false, order_index: 0 },
        { content: 'False', is_correct: true, order_index: 1 },
      ],
    },
    // 1. Scanning - Trung bình (Diff 2) - MCQ
    {
      topic_id: topicScanning.id,
      created_by: tutor.id,
      content: 'When applying the "Scanning" technique in reading comprehension, what is the primary goal?',
      question_type: QuestionType.multiple_choice,
      difficulty: 2,
      explanation: 'Scanning nhằm mục đích định vị nhanh các thông tin cụ thể (tên riêng, số liệu, thuật ngữ) mà không cần đọc hết văn bản.',
      is_public: true,
      options: [
        { content: 'To locate specific keywords, numbers, or names quickly without reading every word', is_correct: true, order_index: 0 },
        { content: 'To analyze the grammatical breakdown of every sentence', is_correct: false, order_index: 1 },
        { content: 'To translate the entire passage into Vietnamese', is_correct: false, order_index: 2 },
        { content: 'To deduce the personal feelings and emotional state of the writer', is_correct: false, order_index: 3 },
      ],
    },
    // 2. Scanning - Khá (Diff 3) - Multi-Select
    {
      topic_id: topicScanning.id,
      created_by: tutor.id,
      content: 'Which of the following elements serve as prime targets when scanning a passage?',
      question_type: QuestionType.multi_select,
      difficulty: 3,
      explanation: 'Các danh từ riêng viết hoa (tên tổ chức, người) và mốc thời gian/con số là mục tiêu hàng đầu khi đọc quét.',
      is_public: true,
      options: [
        { content: 'Capitalized proper nouns (e.g., UNESCO, Dr. Watson)', is_correct: true, order_index: 0 },
        { content: 'Dates and numerical figures (e.g., 1895, 45%)', is_correct: true, order_index: 1 },
        { content: 'Common prepositions (e.g., in, on, at)', is_correct: false, order_index: 2 },
        { content: 'Articles (e.g., a, an, the)', is_correct: false, order_index: 3 },
      ],
    },
    // 3. Inversion 1 - Khá (Diff 3) - MCQ
    {
      topic_id: topicInversions.id,
      created_by: tutor.id,
      content: 'Choose the correct inverted sentence for: "If you should require further assistance, contact our desk."',
      question_type: QuestionType.multiple_choice,
      difficulty: 3,
      explanation: 'Đảo ngữ câu điều kiện loại 1: Should + S + V nguyên thể (Should you require further assistance, ...).',
      is_public: true,
      options: [
        { content: 'Should you require further assistance, please contact our desk.', is_correct: true, order_index: 0 },
        { content: 'Had you require further assistance, contact our desk.', is_correct: false, order_index: 1 },
        { content: 'Were you require further assistance, contact our desk.', is_correct: false, order_index: 2 },
        { content: 'If should you require further assistance, contact our desk.', is_correct: false, order_index: 3 },
      ],
    },
    // 4. Inversion 2 - Khó / Bẫy (Diff 4) - MCQ
    {
      topic_id: topicInversions.id,
      created_by: tutor.id,
      content: 'Rewrite using Inversion Type 3: "If the government had taken earlier precautions, the crisis ______ avoided."',
      question_type: QuestionType.multiple_choice,
      difficulty: 4,
      explanation: 'Đảo ngữ loại 3: "Had + S + V3/ed, S + would/could have + V3/ed". Ở thể bị động là "could have been avoided".',
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
      created_by: tutor.id,
      content: 'Fill in the blank: "______ he to accept the scholarship, he would have to relocate to Melbourne."',
      question_type: QuestionType.fill_blank,
      difficulty: 5,
      explanation: 'Đảo ngữ câu điều kiện loại 2 với động từ thường: "Were + S + to-V".',
      is_public: true,
      metadata: { accepted_answers: ['Were', 'were'] },
      options: [
        { content: 'Were', is_correct: true, order_index: 0 },
      ],
    },
    // 6. Tenses 1 - Trung bình (Diff 3) - MCQ
    {
      topic_id: topicTenses.id,
      created_by: tutor.id,
      content: 'By the time Dr. Aris completed the clinical trials, the team ______ the preliminary data for over six months.',
      question_type: QuestionType.multiple_choice,
      difficulty: 3,
      explanation: 'Hành động xảy ra liên tục trước một thời điểm quá khứ dùng Quá khứ hoàn thành tiếp diễn (had been analyzing).',
      is_public: true,
      options: [
        { content: 'had been analyzing', is_correct: true, order_index: 0 },
        { content: 'has analyzed', is_correct: false, order_index: 1 },
        { content: 'was analyzed', is_correct: false, order_index: 2 },
        { content: 'will have analyzed', is_correct: false, order_index: 3 },
      ],
    },
    // 7. Tenses 2 - Dễ (Diff 2) - MCQ
    {
      topic_id: topicTenses.id,
      created_by: tutor.id,
      content: 'Since the introduction of the new academic portal last month, student engagement ______ by 42%.',
      question_type: QuestionType.multiple_choice,
      difficulty: 2,
      explanation: 'Cấu trúc "Since + mốc quá khứ", mệnh đề chính chia ở thì Hiện tại hoàn thành "has increased".',
      is_public: true,
      options: [
        { content: 'has increased', is_correct: true, order_index: 0 },
        { content: 'increased', is_correct: false, order_index: 1 },
        { content: 'had increased', is_correct: false, order_index: 2 },
        { content: 'is increasing', is_correct: false, order_index: 3 },
      ],
    },
    // 8. Tech Vocab 1 - Trung bình (Diff 3) - MCQ
    {
      topic_id: topicTechAI.id,
      created_by: tutor.id,
      content: 'Generative AI models rely heavily on large neural networks trained on vast ______ of unstructured text.',
      question_type: QuestionType.multiple_choice,
      difficulty: 3,
      explanation: 'Collocation thông dụng: "vast volumes/quantities of data/text".',
      is_public: true,
      options: [
        { content: 'volumes', is_correct: true, order_index: 0 },
        { content: 'heights', is_correct: false, order_index: 1 },
        { content: 'weights', is_correct: false, order_index: 2 },
        { content: 'altitudes', is_correct: false, order_index: 3 },
      ],
    },
    // 9. Tech Ethics - Khá (Diff 3) - Multi-Select
    {
      topic_id: topicTechAI.id,
      created_by: tutor.id,
      content: 'Which of the following phrases are related to ethical concerns in Artificial Intelligence?',
      question_type: QuestionType.multi_select,
      difficulty: 3,
      explanation: '"Algorithmic bias" và "Data privacy infringement" là hai vấn đề đạo đức cốt lõi trong AI.',
      is_public: true,
      options: [
        { content: 'Algorithmic bias', is_correct: true, order_index: 0 },
        { content: 'Data privacy infringement', is_correct: true, order_index: 1 },
        { content: 'Photosynthesis enhancement', is_correct: false, order_index: 2 },
        { content: 'Fossil fuel combustion', is_correct: false, order_index: 3 },
      ],
    },
    // 10. Env Vocab 1 - Dễ (Diff 2) - MCQ
    {
      topic_id: topicEnvironment.id,
      created_by: tutor.id,
      content: 'Corporations worldwide are under immense pressure to substantially reduce their carbon ______ by adopting green energy.',
      question_type: QuestionType.multiple_choice,
      difficulty: 2,
      explanation: '"Carbon footprint" là cụm từ cố định chỉ dấu chân carbon / lượng phát thải khí nhà kính.',
      is_public: true,
      options: [
        { content: 'footprint', is_correct: true, order_index: 0 },
        { content: 'fingerprint', is_correct: false, order_index: 1 },
        { content: 'handprint', is_correct: false, order_index: 2 },
        { content: 'shadow', is_correct: false, order_index: 3 },
      ],
    },
    // 11. Env Vocab 2 - Dễ (Diff 2) - True/False
    {
      topic_id: topicEnvironment.id,
      created_by: tutor.id,
      content: 'True or False: "Biodiversity" strictly refers only to plant life and excludes all marine and animal species.',
      question_type: QuestionType.true_false,
      difficulty: 2,
      explanation: 'False. Biodiversity (đa dạng sinh học) bao gồm toàn bộ động vật, thực vật và sinh vật biển.',
      is_public: true,
      options: [
        { content: 'True', is_correct: false, order_index: 0 },
        { content: 'False', is_correct: true, order_index: 1 },
      ],
    },
    // 12. To Be 1 - Căn bản (Diff 1) - MCQ
    {
      topic_id: topicToBe.id,
      created_by: tutor.id,
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
      created_by: tutor.id,
      content: 'True or False: In English, the pronoun "They" can refer to both groups of people and plural objects or animals.',
      question_type: QuestionType.true_false,
      difficulty: 1,
      explanation: 'True. Đại từ "They" được dùng cho cả người, đồ vật và động vật ở dạng số nhiều.',
      is_public: true,
      options: [
        { content: 'True', is_correct: true, order_index: 0 },
        { content: 'False', is_correct: false, order_index: 1 },
      ],
    },
    // 14. Present Simple 1 - Thói quen (Diff 1) - MCQ
    {
      topic_id: topicPresentSimple.id,
      created_by: tutor.id,
      content: 'David usually ______ to the office by bus, but today he is riding a bicycle.',
      question_type: QuestionType.multiple_choice,
      difficulty: 1,
      explanation: 'Chủ ngữ ngôi thứ 3 số ít "David" trong thì Hiện tại đơn đi với động từ thêm đuôi "-es": "goes".',
      is_public: true,
      options: [
        { content: 'goes', is_correct: true, order_index: 0 },
        { content: 'go', is_correct: false, order_index: 1 },
        { content: 'going', is_correct: false, order_index: 2 },
        { content: 'is go', is_correct: false, order_index: 3 },
      ],
    },
    // 15. Present Simple 2 - Phủ định (Diff 2) - MCQ
    {
      topic_id: topicPresentSimple.id,
      created_by: tutor.id,
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
    // 16. Present Simple 3 - Điền từ (Diff 2) - Fill Blank
    {
      topic_id: topicPresentSimple.id,
      created_by: tutor.id,
      content: 'Fill in the blank: "Every morning, my father ______ (drink) a warm cup of green tea before work."',
      question_type: QuestionType.fill_blank,
      difficulty: 2,
      explanation: 'Chủ ngữ "my father" là ngôi thứ 3 số ít, động từ chia ở thì Hiện tại đơn là "drinks".',
      is_public: true,
      metadata: { accepted_answers: ['drinks', 'Drinks'] },
      options: [
        { content: 'drinks', is_correct: true, order_index: 0 },
      ],
    },
    // 17. Trạng từ chỉ tần suất - Trung bình (Diff 2) - MCQ
    {
      topic_id: topicPresentSimple.id,
      created_by: tutor.id,
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
    // 18. Mạo từ A/An - Dễ (Diff 1) - MCQ
    {
      topic_id: topicArticlesPreps.id,
      created_by: tutor.id,
      content: 'Before stepping outside into the rain, she grabbed ______ umbrella and ______ yellow raincoat.',
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
    // 19. Giới từ Thời gian - Dễ (Diff 1) - MCQ
    {
      topic_id: topicArticlesPreps.id,
      created_by: tutor.id,
      content: 'Our comprehensive English lecture begins ______ 7:00 PM ______ Wednesday evenings.',
      question_type: QuestionType.multiple_choice,
      difficulty: 1,
      explanation: 'Dùng giới từ "at" trước giờ giấc cụ thể (at 7:00 PM) và "on" trước các thứ/buổi trong tuần (on Wednesday evenings).',
      is_public: true,
      options: [
        { content: 'at / on', is_correct: true, order_index: 0 },
        { content: 'in / on', is_correct: false, order_index: 1 },
        { content: 'at / in', is_correct: false, order_index: 2 },
        { content: 'on / at', is_correct: false, order_index: 3 },
      ],
    },
    // 20. Ghép Cặp Đồ Dùng Gia Đình - Matching (Diff 2)
    {
      topic_id: topicFamilyHome.id,
      created_by: tutor.id,
      content: 'Match each household item with its corresponding everyday usage:',
      question_type: QuestionType.matching,
      difficulty: 2,
      explanation: 'Nối các đồ dùng quen thuộc trong nhà với công dụng thường nhật tương ứng.',
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
    // 21. Từ vựng Gia Đình - Đúng/Sai (Diff 1)
    {
      topic_id: topicFamilyHome.id,
      created_by: tutor.id,
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
    // 22. Ghép Cặp Nghề Nghiệp - Matching (Diff 2)
    {
      topic_id: topicFoodJobs.id,
      created_by: tutor.id,
      content: 'Match the common occupations with their primary professional responsibilities:',
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
            rightText: 'Prepares gourmet dishes and manages restaurant kitchens',
            right: 'Prepares gourmet dishes and manages restaurant kitchens',
          },
          {
            leftId: 'job_p2_l',
            leftText: 'Pharmacist',
            left: 'Pharmacist',
            rightId: 'job_p2_r',
            rightText: 'Dispenses prescription medicine and provides health counsel',
            right: 'Dispenses prescription medicine and provides health counsel',
          },
          {
            leftId: 'job_p3_l',
            leftText: 'Architect',
            left: 'Architect',
            rightId: 'job_p3_r',
            rightText: 'Designs structural blueprints for houses and skyscrapers',
            right: 'Designs structural blueprints for houses and skyscrapers',
          },
        ],
      },
      options: [],
    },
    // 23. Danh từ đếm được / không đếm được - Multi-select (Diff 1)
    {
      topic_id: topicFoodJobs.id,
      created_by: tutor.id,
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
    // 24. Hội thoại Nhà Hàng - MCQ (Diff 2)
    {
      topic_id: topicFoodJobs.id,
      created_by: tutor.id,
      content: 'When ordering food in an English restaurant, which polite phrase is the most natural?',
      question_type: QuestionType.multiple_choice,
      difficulty: 2,
      explanation: '"Could I please have the grilled salmon?" là mẫu câu lịch sự và tự nhiên nhất khi gọi món.',
      is_public: true,
      options: [
        { content: 'Could I please have the grilled salmon?', is_correct: true, order_index: 0 },
        { content: 'Give me salmon now!', is_correct: false, order_index: 1 },
        { content: 'I want eating fish today.', is_correct: false, order_index: 2 },
        { content: 'Bring fish to table.', is_correct: false, order_index: 3 },
      ],
    },
    // 25. Môi trường & Năng lượng tái tạo - Fill Blank (Diff 4)
    {
      topic_id: topicEnvironment.id,
      created_by: tutor.id,
      content: 'Fill in the blank: "Wind and solar energy are leading examples of ______ (renew) resources that help mitigate global warming."',
      question_type: QuestionType.fill_blank,
      difficulty: 4,
      explanation: 'Dạng tính từ của "renew" bổ nghĩa cho danh từ "resources" là "renewable".',
      is_public: true,
      metadata: { accepted_answers: ['renewable', 'Renewable'] },
      options: [
        { content: 'renewable', is_correct: true, order_index: 0 },
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

  console.log(`✅ Đã tạo ngân hàng ${createdQuestions.length} câu hỏi chuẩn hóa đa dạng thể loại và độ khó.\n`);

  // =========================================================================
  // 5. LỚP HỌC DUY NHẤT & TẤT CẢ HỌC VIÊN (SINGLE COMPREHENSIVE CLASS)
  // =========================================================================
  console.log('🏫 [5/8] Khởi tạo 1 LỚP HỌC DUY NHẤT và gắn toàn bộ 12 học viên vào lớp...');

  const classSingle = await prisma.class.create({
    data: {
      name: 'Lớp Chinh Phục Tiếng Anh Toàn Diện - Academic & Practical English 2026',
      subject: 'Tiếng Anh Toàn Diện',
      join_code: 'ENG2026',
      description: 'Lớp học toàn diện chuẩn hóa kết hợp Ngữ pháp nền tảng đến chuyên sâu, Vốn từ vựng học thuật, Kỹ năng đọc hiểu và Phản xạ giao tiếp đời sống thực tế.',
      teacher_id: tutor.id,
      is_active: true,
    },
  });

  // Phản hồi chi tiết và nhận xét riêng của gia sư cho từng học viên
  const studentFeedbacks: Record<string, string> = {
    'student.an@system.com': 'An có phản xạ từ vựng và ngữ pháp xuất sắc, tư duy rất nhạy bén. Hãy tiếp tục giữ vững phong độ dẫn đầu!',
    'student.binh@system.com': 'Bình học tập rất đều đặn và chỉn chu. Em cần chú ý thêm bẫy đảo ngữ Had/Were ở các bài thi đánh giá.',
    'student.khoa@system.com': 'Vốn từ vựng của Khoa rất phong phú. Thầy khuyên em nên dành thêm thời gian luyện chuyên đề Đảo ngữ và Thì hoàn thành.',
    'student.lan@system.com': 'Thầy rất khen ngợi sự tiến bộ vượt bậc của Lan trong 4 tuần qua! Điểm số tăng từ 40% lên 90% là thành quả xứng đáng.',
    'student.chi@system.com': 'Chi đã không đăng nhập 12 ngày qua. Em hãy sắp xếp thời gian làm ngay các câu hỏi ôn tập ngắt quãng để tránh quên kiến thức.',
    'student.phuong@system.com': 'Phương rất kiên trì và chịu khó. Thầy ghi nhận nỗ lực của em; hãy tập luyện thêm phản xạ để tăng tốc độ làm bài.',
    'student.dung@system.com': 'Dũng cần đọc kỹ đề trước khi bấm chọn, tuyệt đối không nên chọn bừa quá nhanh dưới 3 giây.',
    'student.quang@system.com': 'Quang đã lấy lại được nền tảng tiếng Anh rất tốt, các bài kiểm tra gần đây đều đạt điểm số trên 80%.',
    'student.nam@system.com': 'Thầy chưa thấy Nam nộp bài 3 tuần nay. Em vui lòng liên hệ lại với thầy để thống nhất lộ trình học bù nhé.',
    'student.hoa@system.com': 'Chào mừng Hoa gia nhập lớp! Em đang hòa nhập rất nhanh và hoàn thành các bài tập nền tảng rất tốt.',
    'student.kiet@system.com': 'Kiệt làm bài khá tốt nhưng cần duy trì thói quen học tập đều đặn hơn thay vì ngắt quãng 2-3 ngày.',
    'student.ngoc@system.com': 'Ngọc nắm ngữ pháp rất chắc chắn. Em nên đọc thêm các bài báo tiếng Anh để mở rộng thêm vốn từ vựng thực tế.',
  };

  // Thêm TẤT CẢ 12 học viên vào lớp học duy nhất
  for (const s of students) {
    await prisma.classMember.create({
      data: {
        class_id: classSingle.id,
        student_id: s.id,
        teacher_feedback: studentFeedbacks[s.email] || 'Học viên tích cực tham gia các hoạt động của lớp.',
        feedback_updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      },
    });
  }

  console.log(`✅ Lớp học duy nhất "${classSingle.name}" đã được tạo với toàn bộ ${students.length} học viên tham gia.\n`);

  // --- GIÁO TRÌNH LỚP HỌC (4 TUẦN TOÀN DIỆN) ---
  const currWeek1 = await prisma.classCurriculum.create({
    data: {
      class_id: classSingle.id,
      title: 'Tuần 1: Nền Tảng Ngữ Pháp & Chiến Thuật Skimming/Scanning Định Vị Thông Tin',
      content_html: '<h3>Mục tiêu Tuần 1:</h3><p>Củng cố đại từ, động từ To Be, thì Hiện tại đơn và làm chủ kỹ thuật đọc quét Scanning trong 30 giây.</p>',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      video_type: 'youtube',
      order_index: 0,
      is_published: true,
    },
  });
  await prisma.curriculumMaterial.create({
    data: {
      curriculum_id: currWeek1.id,
      title: 'Tài Liệu Hướng Dẫn: Week1_Grammar_and_Scanning_Guide.pdf',
      file_url: 'https://cdn.example.com/materials/week1_guide.pdf',
      file_type: 'pdf',
      file_size: 1850000,
      order_index: 0,
    },
  });

  const currWeek2 = await prisma.classCurriculum.create({
    data: {
      class_id: classSingle.id,
      title: 'Tuần 2: Nâng Cao - Đột Phá Câu Điều Kiện Đảo Ngữ & Thì Hoàn Thành',
      content_html: '<h3>Mục tiêu Tuần 2:</h3><p>Làm chủ đảo ngữ Should/Were/Had và các thì hiện tại/quá khứ hoàn thành tiếp diễn.</p>',
      order_index: 1,
      is_published: true,
    },
  });
  await prisma.curriculumMaterial.create({
    data: {
      curriculum_id: currWeek2.id,
      title: 'Sổ Tay Công Thức Đảo Ngữ: Week2_Inversion_Formulas.pdf',
      file_url: 'https://cdn.example.com/materials/week2_inversions.pdf',
      file_type: 'pdf',
      file_size: 2100000,
      order_index: 0,
    },
  });

  const currWeek3 = await prisma.classCurriculum.create({
    data: {
      class_id: classSingle.id,
      title: 'Tuần 3: Vốn Từ Vựng Chuyên Sâu - Đời Sống, Công Nghệ AI & Môi Trường Bền Vững',
      content_html: '<h3>Mục tiêu Tuần 3:</h3><p>Mở rộng 100 từ vựng và collocations thông dụng chủ đề Công nghệ, AI và Môi trường sinh thái.</p>',
      order_index: 2,
      is_published: true,
    },
  });
  await prisma.curriculumMaterial.create({
    data: {
      curriculum_id: currWeek3.id,
      title: 'Bộ Collocations Chuyên Đề: Week3_AI_and_Ecology.pdf',
      file_url: 'https://cdn.example.com/materials/week3_vocab.pdf',
      file_type: 'pdf',
      file_size: 2400000,
      order_index: 0,
    },
  });

  const currWeek4 = await prisma.classCurriculum.create({
    data: {
      class_id: classSingle.id,
      title: 'Tuần 4: Đánh Giá Năng Lực Toàn Diện Giữa Khóa (Mid-Term Assessment)',
      content_html: '<h3>Bài kiểm tra tổng hợp:</h3><p>Đánh giá năng lực 45 phút kiểm tra kiến thức đa chuyên đề cả 3 tuần.</p>',
      order_index: 3,
      is_published: true,
    },
  });

  // =========================================================================
  // 6. DANH SÁCH BÀI TẬP ĐA DẠNG TRẠNG THÁI (CHO LỚP HỌC DUY NHẤT)
  // =========================================================================
  console.log('📝 [6/8] Khởi tạo danh sách bài tập đa dạng trạng thái (Completed, Ongoing, Exam, Overdue, Draft)...');

  // Bài 1: Đã hoàn thành (Completed / Past Deadline) - Standard Mode
  const assignWeek1 = await prisma.assignment.create({
    data: {
      class_id: classSingle.id,
      created_by: tutor.id,
      title: 'Bài Tập Tuần 1: Khởi Động Ngữ Pháp & Kỹ Năng Đọc Quét',
      description: 'Luyện tập kỹ năng định vị từ khóa trong bài đọc và ôn tập đại từ nhân xưng.',
      mode: AssignmentMode.standard,
      is_published: true,
      published_at: new Date(Date.now() - 25 * 24 * 3600 * 1000),
      deadline: new Date(Date.now() - 17 * 24 * 3600 * 1000),
      time_limit: 20,
      max_attempts: 2,
      is_all_students: true,
    },
  });
  const assignWeek1QIds = [0, 1, 2, 12];
  for (let i = 0; i < assignWeek1QIds.length; i++) {
    await prisma.assignmentQuestion.create({
      data: { assignment_id: assignWeek1.id, question_id: createdQuestions[assignWeek1QIds[i]].id, order_index: i },
    });
  }

  // Bài 2: Luyện tập thích ứng nền tảng (Adaptive SM-2) - Ongoing
  const assignAdaptiveBasic = await prisma.assignment.create({
    data: {
      class_id: classSingle.id,
      created_by: tutor.id,
      title: 'Luyện Tập Thích Ứng (SM-2): Ngữ Pháp Căn Bản & Động Từ To Be',
      description: 'Hệ thống tự động lặp lại các câu hỏi chia động từ và trạng từ tần suất cho đến khi thuần thục.',
      mode: AssignmentMode.adaptive,
      is_published: true,
      published_at: new Date(Date.now() - 21 * 24 * 3600 * 1000),
      time_limit: 25,
      max_attempts: 0,
      is_all_students: true,
    },
  });
  const adaptiveBasicQIds = [13, 14, 15, 16, 17, 18];
  for (let i = 0; i < adaptiveBasicQIds.length; i++) {
    await prisma.assignmentQuestion.create({
      data: { assignment_id: assignAdaptiveBasic.id, question_id: createdQuestions[adaptiveBasicQIds[i]].id, order_index: i },
    });
  }

  // Bài 3: Đã hoàn thành (Completed / Past Deadline) - Standard Mode
  const assignWeek2 = await prisma.assignment.create({
    data: {
      class_id: classSingle.id,
      created_by: tutor.id,
      title: 'Bài Tập Tuần 2: Chinh Phục Câu Điều Kiện & Đảo Ngữ Nâng Cao',
      description: 'Củng cố các dạng đảo ngữ Should, Were, Had và thì hoàn thành tiếp diễn.',
      mode: AssignmentMode.standard,
      is_published: true,
      published_at: new Date(Date.now() - 16 * 24 * 3600 * 1000),
      deadline: new Date(Date.now() - 8 * 24 * 3600 * 1000),
      time_limit: 25,
      max_attempts: 2,
      is_all_students: true,
    },
  });
  const assignWeek2QIds = [3, 4, 5, 6, 7];
  for (let i = 0; i < assignWeek2QIds.length; i++) {
    await prisma.assignmentQuestion.create({
      data: { assignment_id: assignWeek2.id, question_id: createdQuestions[assignWeek2QIds[i]].id, order_index: i },
    });
  }

  // Bài 4: Luyện tập thích ứng nâng cao (Adaptive SM-2) - Ongoing
  const assignAdaptiveAdv = await prisma.assignment.create({
    data: {
      class_id: classSingle.id,
      created_by: tutor.id,
      title: 'Luyện Tập Thích Ứng (SM-2): Đột Phá Đảo Ngữ & Thì Hoàn Thành',
      description: 'Lặp lại ngắt quãng các mẫu câu bẫy đảo ngữ nâng cao để củng cố phản xạ tự nhiên.',
      mode: AssignmentMode.adaptive,
      is_published: true,
      published_at: new Date(Date.now() - 14 * 24 * 3600 * 1000),
      time_limit: 30,
      max_attempts: 0,
      is_all_students: true,
    },
  });
  const adaptiveAdvQIds = [3, 4, 5, 6, 7];
  for (let i = 0; i < adaptiveAdvQIds.length; i++) {
    await prisma.assignmentQuestion.create({
      data: { assignment_id: assignAdaptiveAdv.id, question_id: createdQuestions[adaptiveAdvQIds[i]].id, order_index: i },
    });
  }

  // Bài 5: Đang diễn ra (Ongoing) - Standard Mode
  const assignWeek3 = await prisma.assignment.create({
    data: {
      class_id: classSingle.id,
      created_by: tutor.id,
      title: 'Bài Tập Tuần 3: Từ Vựng Chuyên Đề & Ghép Cặp Tình Huống',
      description: 'Kiểm tra collocations chủ đề Công nghệ, Môi trường và nối cặp đồ vật, nghề nghiệp.',
      mode: AssignmentMode.standard,
      is_published: true,
      published_at: new Date(Date.now() - 7 * 24 * 3600 * 1000),
      deadline: new Date(Date.now() + 4 * 24 * 3600 * 1000),
      time_limit: 25,
      max_attempts: 3,
      is_all_students: true,
    },
  });
  const assignWeek3QIds = [8, 9, 10, 11, 20, 22];
  for (let i = 0; i < assignWeek3QIds.length; i++) {
    await prisma.assignmentQuestion.create({
      data: { assignment_id: assignWeek3.id, question_id: createdQuestions[assignWeek3QIds[i]].id, order_index: i },
    });
  }

  // Bài 6: Đề Thi Đánh Giá Năng Lực Giữa Kỳ (Exam Mode - 14 câu)
  const assignMidtermExam = await prisma.assignment.create({
    data: {
      class_id: classSingle.id,
      created_by: tutor.id,
      title: 'Đề Thi Đánh Giá Năng Lực Giữa Kỳ (Mid-Term Comprehensive Exam)',
      description: 'Bài thi tổng hợp 45 phút đánh giá toàn diện cả 4 tuần học, chỉ được làm 01 lần duy nhất.',
      mode: AssignmentMode.exam,
      is_published: true,
      published_at: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      deadline: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      time_limit: 45,
      max_attempts: 1,
      is_all_students: true,
    },
  });
  const examQIndices = [0, 1, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 25];
  for (let i = 0; i < examQIndices.length; i++) {
    await prisma.assignmentQuestion.create({
      data: { assignment_id: assignMidtermExam.id, question_id: createdQuestions[examQIndices[i]].id, order_index: i },
    });
  }

  // Bài 7: Bài tập Quá hạn (Overdue)
  const assignOverdue = await prisma.assignment.create({
    data: {
      class_id: classSingle.id,
      created_by: tutor.id,
      title: 'Bài Tập Bổ Trợ: Phân Biệt Giới Từ & Thì Hoàn Thành (Đã Quá Hạn)',
      description: 'Bài tập bắt buộc tuần trước dành cho các học sinh chưa đạt yêu cầu.',
      mode: AssignmentMode.standard,
      is_published: true,
      published_at: new Date(Date.now() - 11 * 24 * 3600 * 1000),
      deadline: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      time_limit: 20,
      max_attempts: 1,
      is_all_students: true,
    },
  });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignOverdue.id, question_id: createdQuestions[6].id, order_index: 0 } });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignOverdue.id, question_id: createdQuestions[19].id, order_index: 1 } });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignOverdue.id, question_id: createdQuestions[25].id, order_index: 2 } });

  // Bài 8: Bản nháp (Draft)
  const assignDraft = await prisma.assignment.create({
    data: {
      class_id: classSingle.id,
      created_by: tutor.id,
      title: '[Bản Nháp] Mini-Test: Nhận Diện Danh Từ & Mạo Từ A/An/The',
      description: 'Bộ câu hỏi tự luyện bổ sung dành cho học sinh cần ôn tập thêm mảng mạo từ.',
      mode: AssignmentMode.standard,
      is_published: false,
      time_limit: 15,
      max_attempts: 1,
      is_all_students: true,
    },
  });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignDraft.id, question_id: createdQuestions[18].id, order_index: 0 } });
  await prisma.assignmentQuestion.create({ data: { assignment_id: assignDraft.id, question_id: createdQuestions[23].id, order_index: 1 } });

  // Gắn các bài tập vào giáo trình của lớp
  await prisma.curriculumAssignment.create({ data: { curriculum_id: currWeek1.id, assignment_id: assignWeek1.id, order_index: 0 } });
  await prisma.curriculumAssignment.create({ data: { curriculum_id: currWeek1.id, assignment_id: assignAdaptiveBasic.id, order_index: 1 } });
  await prisma.curriculumAssignment.create({ data: { curriculum_id: currWeek2.id, assignment_id: assignWeek2.id, order_index: 0 } });
  await prisma.curriculumAssignment.create({ data: { curriculum_id: currWeek2.id, assignment_id: assignAdaptiveAdv.id, order_index: 1 } });
  await prisma.curriculumAssignment.create({ data: { curriculum_id: currWeek3.id, assignment_id: assignWeek3.id, order_index: 0 } });
  await prisma.curriculumAssignment.create({ data: { curriculum_id: currWeek4.id, assignment_id: assignMidtermExam.id, order_index: 0 } });

  console.log('✅ Đã khởi tạo đầy đủ 8 bài tập thuộc đủ trạng thái cho lớp học duy nhất.\n');

  // =========================================================================
  // 7. CỖ MÁY MÔ PHỎNG DÒNG THỜI GIAN 30 NGÀY & THUẬT TOÁN SM-2 CHUẨN XÁC
  // =========================================================================
  console.log('📊 [7/8] Khởi chạy cỗ máy mô phỏng dòng thời gian 30 ngày (Chronological SM-2 Simulation)...');

  function calcSM2Quality(isCorrect: boolean, responseTimeMs: number, difficulty: number = 3, questionType?: string): number {
    const t = Math.max(0, responseTimeMs);
    const scale = 1 + (difficulty - 3) * 0.15;
    let baseFast = 5000;
    let baseMedium = 15000;
    let baseWrong = 20000;

    if (questionType === 'true_false') {
      baseFast = 2500;
      baseMedium = 8000;
      baseWrong = 10000;
    }

    const fastMs = baseFast * scale;
    const mediumMs = baseMedium * scale;
    const wrongMs = baseWrong * scale;

    if (!isCorrect) {
      return t > wrongMs ? 2 : 1;
    }
    if (t === 0) return 1;
    if (t < fastMs) return 5;
    if (t < mediumMs) return 4;
    return 3;
  }

  function stepSM2(
    current: { easiness_factor: number; interval_days: number; repetition_count: number },
    q: number,
    currentDate: Date
  ) {
    const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
    const rawEf = current.easiness_factor + delta;
    const new_ef = Math.max(1.30, Math.round(rawEf * 100) / 100);

    let new_interval = 1;
    let new_repetition_count = 0;

    if (q < 3) {
      new_interval = 1;
      new_repetition_count = 0;
    } else {
      if (current.repetition_count === 0) {
        new_interval = 1;
      } else if (current.repetition_count === 1) {
        new_interval = 6;
      } else {
        new_interval = Math.min(
          180,
          Math.max(
            Math.round(current.interval_days * new_ef),
            current.interval_days + 1
          )
        );
      }
      new_repetition_count = Math.min(50, current.repetition_count + 1);
    }

    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + new_interval);
    nextDate.setHours(0, 0, 0, 0);

    return {
      easiness_factor: new_ef,
      interval_days: new_interval,
      repetition_count: new_repetition_count,
      next_review_date: nextDate,
    };
  }

  interface StudentSM2Item {
    student_id: string;
    question_id: string;
    easiness_factor: number;
    interval_days: number;
    repetition_count: number;
    next_review_date: Date;
    last_reviewed_at: Date;
    total_attempts: number;
    correct_attempts: number;
  }

  const sm2Map = new Map<string, StudentSM2Item>();

  interface StudentConfig {
    student: any;
    activeDays: (dayOffset: number) => boolean;
    getAccuracy: (q: any, dayOffset: number) => number;
    getBaseSpeedMs: (q: any, dayOffset: number) => number;
    assignmentsSchedule: { dayOffset: number; assignment: any; status?: 'completed' | 'in_progress'; dropAfter?: number }[];
    adaptiveAssignment: any;
  }

  const studentConfigs: StudentConfig[] = [
    // 1. Nguyễn Văn An: Siêu chăm chỉ (30 ngày liên tục), phản xạ xuất sắc
    {
      student: students[0],
      activeDays: () => true,
      getAccuracy: () => 0.98,
      getBaseSpeedMs: () => 4500,
      adaptiveAssignment: assignAdaptiveAdv,
      assignmentsSchedule: [
        { dayOffset: 25, assignment: assignWeek1 },
        { dayOffset: 20, assignment: assignAdaptiveBasic },
        { dayOffset: 16, assignment: assignWeek2 },
        { dayOffset: 14, assignment: assignAdaptiveAdv },
        { dayOffset: 7, assignment: assignWeek3 },
        { dayOffset: 3, assignment: assignMidtermExam },
      ],
    },
    // 2. Trần Thị Bình: Khá giỏi, học đều 5 ngày/tuần
    {
      student: students[1],
      activeDays: (d) => [29, 28, 27, 25, 23, 22, 20, 19, 17, 16, 14, 12, 10, 8, 7, 5, 4, 3, 2, 1, 0].includes(d),
      getAccuracy: () => 0.88,
      getBaseSpeedMs: () => 8500,
      adaptiveAssignment: assignAdaptiveAdv,
      assignmentsSchedule: [
        { dayOffset: 25, assignment: assignWeek1 },
        { dayOffset: 20, assignment: assignAdaptiveBasic },
        { dayOffset: 16, assignment: assignWeek2 },
        { dayOffset: 14, assignment: assignAdaptiveAdv },
        { dayOffset: 7, assignment: assignWeek3 },
        { dayOffset: 3, assignment: assignMidtermExam },
      ],
    },
    // 3. Hoàng Đăng Khoa: Học lệch (Từ vựng 95%, Ngữ pháp đảo ngữ 35%)
    {
      student: students[2],
      activeDays: (d) => [28, 26, 25, 22, 20, 18, 16, 14, 11, 9, 7, 5, 3, 1, 0].includes(d),
      getAccuracy: (q) => (q.topic_id === topicInversions.id || q.topic_id === topicTenses.id ? 0.35 : 0.95),
      getBaseSpeedMs: (q) => (q.topic_id === topicInversions.id ? 15000 : 5200),
      adaptiveAssignment: assignAdaptiveAdv,
      assignmentsSchedule: [
        { dayOffset: 25, assignment: assignWeek1 },
        { dayOffset: 20, assignment: assignAdaptiveBasic },
        { dayOffset: 16, assignment: assignWeek2 },
        { dayOffset: 14, assignment: assignAdaptiveAdv },
        { dayOffset: 7, assignment: assignWeek3 },
        { dayOffset: 3, assignment: assignMidtermExam },
      ],
    },
    // 4. Đặng Ngọc Lan: Tiến bộ vượt bậc (Tuần 1: 40% -> Tuần 4: 90%)
    {
      student: students[3],
      activeDays: (d) => [28, 27, 25, 23, 21, 19, 17, 16, 14, 12, 10, 8, 6, 4, 3, 2, 1, 0].includes(d),
      getAccuracy: (q, d) => (d > 18 ? 0.40 : d > 8 ? 0.75 : 0.90),
      getBaseSpeedMs: (q, d) => (d > 18 ? 16000 : d > 8 ? 12000 : 8500),
      adaptiveAssignment: assignAdaptiveAdv,
      assignmentsSchedule: [
        { dayOffset: 25, assignment: assignWeek1 },
        { dayOffset: 21, assignment: assignWeek1 },
        { dayOffset: 20, assignment: assignAdaptiveBasic },
        { dayOffset: 16, assignment: assignWeek2 },
        { dayOffset: 14, assignment: assignAdaptiveAdv },
        { dayOffset: 7, assignment: assignWeek3 },
        { dayOffset: 3, assignment: assignMidtermExam },
      ],
    },
    // 5. Lê Khánh Chi: Bỏ bê ôn tập (At-risk / Nghỉ 12 ngày qua, quên kiến thức đảo ngữ)
    {
      student: students[4],
      activeDays: (d) => d >= 12 && [29, 28, 26, 25, 23, 21, 20, 18, 16, 14, 12].includes(d),
      getAccuracy: () => 0.60,
      getBaseSpeedMs: () => 13000,
      adaptiveAssignment: assignAdaptiveAdv,
      assignmentsSchedule: [
        { dayOffset: 25, assignment: assignWeek1 },
        { dayOffset: 20, assignment: assignAdaptiveBasic },
        { dayOffset: 16, assignment: assignWeek2 },
        { dayOffset: 14, assignment: assignAdaptiveAdv },
      ],
    },
    // 6. Ngô Thu Phương: Cần cù nhưng phản xạ chậm (18-24s, SM2 quality = 3, tăng EF chậm)
    {
      student: students[5],
      activeDays: (d) => [27, 25, 24, 21, 19, 17, 16, 14, 12, 10, 8, 7, 5, 3, 1, 0].includes(d),
      getAccuracy: () => 0.78,
      getBaseSpeedMs: () => 21000,
      adaptiveAssignment: assignAdaptiveBasic,
      assignmentsSchedule: [
        { dayOffset: 25, assignment: assignWeek1 },
        { dayOffset: 20, assignment: assignAdaptiveBasic },
        { dayOffset: 16, assignment: assignWeek2 },
        { dayOffset: 7, assignment: assignWeek3 },
        { dayOffset: 3, assignment: assignMidtermExam },
      ],
    },
    // 7. Phạm Tiến Dũng: Làm ẩu, đoán mò nhanh (3s), hay bỏ dở bài tập
    {
      student: students[6],
      activeDays: (d) => [27, 25, 20, 16, 11, 7, 3].includes(d),
      getAccuracy: () => 0.32,
      getBaseSpeedMs: () => 3100,
      adaptiveAssignment: assignAdaptiveBasic,
      assignmentsSchedule: [
        { dayOffset: 25, assignment: assignWeek1 },
        { dayOffset: 20, assignment: assignAdaptiveBasic, status: 'in_progress', dropAfter: 2 },
        { dayOffset: 16, assignment: assignWeek2, status: 'in_progress', dropAfter: 2 },
        { dayOffset: 7, assignment: assignWeek3 },
        { dayOffset: 3, assignment: assignMidtermExam },
      ],
    },
    // 8. Đỗ Minh Quang: Mất gốc vươn lên ngoạn mục (Điểm tăng từ 30% lên 85%)
    {
      student: students[7],
      activeDays: (d) => d === 28 || d === 25 || (d <= 20 && [20, 18, 16, 14, 12, 10, 8, 7, 5, 3, 2, 0].includes(d)),
      getAccuracy: (q, d) => (d > 18 ? 0.30 : 0.86),
      getBaseSpeedMs: (q, d) => (d > 18 ? 3000 : 9200),
      adaptiveAssignment: assignAdaptiveBasic,
      assignmentsSchedule: [
        { dayOffset: 25, assignment: assignWeek1 },
        { dayOffset: 20, assignment: assignAdaptiveBasic },
        { dayOffset: 16, assignment: assignWeek2 },
        { dayOffset: 7, assignment: assignWeek3 },
        { dayOffset: 3, assignment: assignMidtermExam },
      ],
    },
    // 9. Bùi Hải Nam: Bỏ học (Dropout - chỉ làm 1 bài cách đây 28 ngày rồi bỏ hẳn)
    {
      student: students[8],
      activeDays: (d) => d === 28,
      getAccuracy: () => 0.33,
      getBaseSpeedMs: () => 14000,
      adaptiveAssignment: assignAdaptiveBasic,
      assignmentsSchedule: [
        { dayOffset: 28, assignment: assignWeek1 },
      ],
    },
    // 10. Vũ Quỳnh Hoa: Học viên mới nhập học (mới vào hệ thống 7 ngày gần đây)
    {
      student: students[9],
      activeDays: (d) => d <= 7 && [7, 5, 4, 3, 2, 1, 0].includes(d),
      getAccuracy: () => 0.88,
      getBaseSpeedMs: () => 8800,
      adaptiveAssignment: assignAdaptiveBasic,
      assignmentsSchedule: [
        { dayOffset: 7, assignment: assignWeek3 },
        { dayOffset: 4, assignment: assignAdaptiveBasic },
        { dayOffset: 2, assignment: assignMidtermExam },
      ],
    },
    // 11. Mai Tuấn Kiệt: Trung bình khá, học ngắt quãng 2-3 ngày/lần
    {
      student: students[10],
      activeDays: (d) => [26, 23, 20, 17, 14, 11, 8, 5, 3, 0].includes(d),
      getAccuracy: () => 0.70,
      getBaseSpeedMs: () => 11000,
      adaptiveAssignment: assignAdaptiveAdv,
      assignmentsSchedule: [
        { dayOffset: 26, assignment: assignWeek1 },
        { dayOffset: 20, assignment: assignAdaptiveBasic },
        { dayOffset: 14, assignment: assignWeek2 },
        { dayOffset: 8, assignment: assignWeek3 },
        { dayOffset: 3, assignment: assignMidtermExam },
      ],
    },
    // 12. Lương Bảo Ngọc: Chuyên sâu ngữ pháp (Ngữ pháp 96%, Đọc hiểu 65%)
    {
      student: students[11],
      activeDays: (d) => [28, 27, 24, 22, 20, 19, 16, 15, 13, 11, 9, 7, 6, 4, 3, 1, 0].includes(d),
      getAccuracy: (q) => (q.topic_id === topicScanning.id || q.topic_id === topicTechAI.id ? 0.65 : 0.96),
      getBaseSpeedMs: () => 7200,
      adaptiveAssignment: assignAdaptiveAdv,
      assignmentsSchedule: [
        { dayOffset: 25, assignment: assignWeek1 },
        { dayOffset: 20, assignment: assignAdaptiveBasic },
        { dayOffset: 16, assignment: assignWeek2 },
        { dayOffset: 14, assignment: assignAdaptiveAdv },
        { dayOffset: 7, assignment: assignWeek3 },
        { dayOffset: 3, assignment: assignMidtermExam },
      ],
    },
  ];

  let totalSessionsCreated = 0;
  let totalAnswersCreated = 0;

  // Vòng lặp mô phỏng dòng thời gian 30 ngày (từ 30 ngày trước đến ngày 0)
  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const simDate = new Date(Date.now() - dayOffset * 24 * 3600 * 1000);
    simDate.setHours(19, Math.floor(Math.random() * 45), 0, 0);

    for (const cfg of studentConfigs) {
      if (!cfg.activeDays(dayOffset)) continue;

      // 1. Thực hiện các bài tập được giao (Assignments) trong ngày này
      const scheduled = cfg.assignmentsSchedule.filter(s => s.dayOffset === dayOffset);
      for (const item of scheduled) {
        const aqs = await prisma.assignmentQuestion.findMany({
          where: { assignment_id: item.assignment.id },
          include: { question: { include: { answer_options: true } } },
          orderBy: { order_index: 'asc' },
        });

        if (aqs.length === 0) continue;

        const isCompleted = item.status !== 'in_progress';
        const questionCount = isCompleted ? aqs.length : (item.dropAfter || 2);
        let sessionCorrectCount = 0;

        const qs = await prisma.quizSession.create({
          data: {
            student_id: cfg.student.id,
            assignment_id: item.assignment.id,
            started_at: simDate,
            finished_at: isCompleted ? new Date(simDate.getTime() + questionCount * cfg.getBaseSpeedMs(aqs[0].question, dayOffset)) : null,
            score: null,
            total_q: aqs.length,
            answered_q: questionCount,
            correct_q: 0,
            status: isCompleted ? 'completed' : 'in_progress',
          },
        });
        totalSessionsCreated++;

        for (let i = 0; i < questionCount; i++) {
          const q = aqs[i].question;
          const acc = cfg.getAccuracy(q, dayOffset);
          const isCorrect = Math.random() < acc;
          if (isCorrect) sessionCorrectCount++;

          const baseMs = cfg.getBaseSpeedMs(q, dayOffset);
          const actualRespMs = Math.max(1200, Math.floor(baseMs * (0.85 + Math.random() * 0.3)));
          const qScore = calcSM2Quality(isCorrect, actualRespMs, q.difficulty, q.question_type);

          const opt = isCorrect
            ? q.answer_options.find((o: any) => o.is_correct)
            : q.answer_options.find((o: any) => !o.is_correct);

          await prisma.sessionAnswer.create({
            data: {
              session_id: qs.id,
              question_id: q.id,
              selected_option: opt?.id || null,
              text_answer: q.question_type === 'fill_blank' ? (isCorrect ? 'drinks' : 'drink') : null,
              is_correct: isCorrect,
              response_time_ms: actualRespMs,
              sm2_quality: qScore,
              answered_at: new Date(simDate.getTime() + (i + 1) * actualRespMs),
            },
          });
          totalAnswersCreated++;

          // Cập nhật trạng thái SM-2
          const sm2Key = `${cfg.student.id}_${q.id}`;
          const currentProg = sm2Map.get(sm2Key) || {
            student_id: cfg.student.id,
            question_id: q.id,
            easiness_factor: 2.50,
            interval_days: 1,
            repetition_count: 0,
            next_review_date: simDate,
            last_reviewed_at: simDate,
            total_attempts: 0,
            correct_attempts: 0,
          };

          const updatedSM2 = stepSM2(currentProg, qScore, simDate);
          sm2Map.set(sm2Key, {
            student_id: cfg.student.id,
            question_id: q.id,
            easiness_factor: updatedSM2.easiness_factor,
            interval_days: updatedSM2.interval_days,
            repetition_count: updatedSM2.repetition_count,
            next_review_date: updatedSM2.next_review_date,
            last_reviewed_at: simDate,
            total_attempts: currentProg.total_attempts + 1,
            correct_attempts: currentProg.correct_attempts + (isCorrect ? 1 : 0),
          });
        }

        const scoreValue = isCompleted ? Math.round((sessionCorrectCount / aqs.length) * 100 * 100) / 100 : null;
        await prisma.quizSession.update({
          where: { id: qs.id },
          data: {
            score: scoreValue,
            correct_q: sessionCorrectCount,
          },
        });
      }

      // 2. Ôn tập thích ứng (Adaptive Spaced Review)
      const dueQuestions: { question: any; progress: StudentSM2Item }[] = [];
      for (const [key, prog] of sm2Map.entries()) {
        if (key.startsWith(`${cfg.student.id}_`)) {
          if (prog.next_review_date <= simDate && prog.last_reviewed_at < simDate) {
            const qObj = createdQuestions.find(q => q.id === prog.question_id);
            if (qObj) dueQuestions.push({ question: qObj, progress: prog });
          }
        }
      }

      const activeStudentEmails = [
        'student.an@system.com', 'student.binh@system.com', 'student.lan@system.com',
        'student.khoa@system.com', 'student.phuong@system.com', 'student.quang@system.com',
        'student.hoa@system.com', 'student.ngoc@system.com'
      ];

      const shouldReview = (dueQuestions.length > 0 && activeStudentEmails.includes(cfg.student.email))
        || (['student.an@system.com', 'student.lan@system.com', 'student.quang@system.com'].includes(cfg.student.email) && scheduled.length === 0);

      if (shouldReview) {
        const questionsToReview = dueQuestions.slice(0, 4).map(d => d.question);
        if (questionsToReview.length === 0 && ['student.an@system.com', 'student.lan@system.com', 'student.quang@system.com'].includes(cfg.student.email)) {
          const qIdx1 = (dayOffset * 2) % createdQuestions.length;
          const qIdx2 = (dayOffset * 2 + 1) % createdQuestions.length;
          questionsToReview.push(createdQuestions[qIdx1], createdQuestions[qIdx2]);
        }

        if (questionsToReview.length > 0) {
          let correctCount = 0;
          const reviewDate = new Date(simDate.getTime() + 15 * 60 * 1000);
          const qsReview = await prisma.quizSession.create({
            data: {
              student_id: cfg.student.id,
              assignment_id: cfg.adaptiveAssignment.id,
              started_at: reviewDate,
              finished_at: new Date(reviewDate.getTime() + questionsToReview.length * 7000),
              score: null,
              total_q: questionsToReview.length,
              answered_q: questionsToReview.length,
              correct_q: 0,
              status: 'completed',
            },
          });
          totalSessionsCreated++;

          for (let i = 0; i < questionsToReview.length; i++) {
            const q = questionsToReview[i];
            const acc = cfg.getAccuracy(q, dayOffset);
            const isCorrect = Math.random() < acc;
            if (isCorrect) correctCount++;

            const baseMs = cfg.getBaseSpeedMs(q, dayOffset);
            const actualRespMs = Math.max(1200, Math.floor(baseMs * (0.85 + Math.random() * 0.3)));
            const qScore = calcSM2Quality(isCorrect, actualRespMs, q.difficulty, q.question_type);

            const opt = isCorrect
              ? q.answer_options.find((o: any) => o.is_correct)
              : q.answer_options.find((o: any) => !o.is_correct);

            await prisma.sessionAnswer.create({
              data: {
                session_id: qsReview.id,
                question_id: q.id,
                selected_option: opt?.id || null,
                text_answer: q.question_type === 'fill_blank' ? (isCorrect ? 'drinks' : 'drink') : null,
                is_correct: isCorrect,
                response_time_ms: actualRespMs,
                sm2_quality: qScore,
                answered_at: new Date(reviewDate.getTime() + (i + 1) * actualRespMs),
              },
            });
            totalAnswersCreated++;

            const sm2Key = `${cfg.student.id}_${q.id}`;
            const currentProg = sm2Map.get(sm2Key) || {
              student_id: cfg.student.id,
              question_id: q.id,
              easiness_factor: 2.50,
              interval_days: 1,
              repetition_count: 0,
              next_review_date: reviewDate,
              last_reviewed_at: reviewDate,
              total_attempts: 0,
              correct_attempts: 0,
            };

            const updatedSM2 = stepSM2(currentProg, qScore, reviewDate);
            sm2Map.set(sm2Key, {
              student_id: cfg.student.id,
              question_id: q.id,
              easiness_factor: updatedSM2.easiness_factor,
              interval_days: updatedSM2.interval_days,
              repetition_count: updatedSM2.repetition_count,
              next_review_date: updatedSM2.next_review_date,
              last_reviewed_at: reviewDate,
              total_attempts: currentProg.total_attempts + 1,
              correct_attempts: currentProg.correct_attempts + (isCorrect ? 1 : 0),
            });
          }

          await prisma.quizSession.update({
            where: { id: qsReview.id },
            data: {
              score: Math.round((correctCount / questionsToReview.length) * 100 * 100) / 100,
              correct_q: correctCount,
            },
          });
        }
      }
    }
  }

  console.log(`✅ Hoàn thành mô phỏng 30 ngày: Đã tạo ${totalSessionsCreated} phiên làm bài và ${totalAnswersCreated} câu trả lời chi tiết.`);

  // 3. Lưu toàn bộ kết quả SM-2 thực tế vào CSDL
  console.log('💾 Lưu trữ dữ liệu SM-2 Progress tích lũy...');
  for (const prog of sm2Map.values()) {
    await prisma.sm2Progress.create({
      data: {
        student_id: prog.student_id,
        question_id: prog.question_id,
        easiness_factor: prog.easiness_factor,
        interval_days: prog.interval_days,
        repetition_count: prog.repetition_count,
        next_review_date: prog.next_review_date,
        last_reviewed_at: prog.last_reviewed_at,
        total_attempts: prog.total_attempts,
        correct_attempts: prog.correct_attempts,
      },
    });
  }
  console.log(`✅ Đã lưu ${sm2Map.size} bản ghi SM-2 Progress chân thực.`);

  // 4. Tính toán và lưu StudentTopicStats dựa trên dữ liệu mô phỏng thực tế
  console.log('📈 Tổng hợp chỉ số thống kê theo chuyên đề (StudentTopicStats)...');
  const allTopics = [
    topicToBe, topicPresentSimple, topicArticlesPreps, topicTenses, topicInversions,
    topicFamilyHome, topicFoodJobs, topicScanning, topicTechAI, topicEnvironment,
  ];

  const nowTime = new Date();
  for (const s of students) {
    for (const top of allTopics) {
      const qInTopic = createdQuestions.filter(q => q.topic_id === top.id);
      if (qInTopic.length === 0) continue;

      let totalAttemptsTopic = 0;
      let correctAttemptsTopic = 0;
      let masteredCount = 0;
      let weakCount = 0;
      let efSum = 0;
      let efCount = 0;

      for (const q of qInTopic) {
        const prog = sm2Map.get(`${s.id}_${q.id}`);
        if (prog && prog.total_attempts > 0) {
          totalAttemptsTopic += prog.total_attempts;
          correctAttemptsTopic += prog.correct_attempts;
          efSum += prog.easiness_factor;
          efCount++;

          if (prog.easiness_factor >= 2.5 && prog.repetition_count >= 4 && prog.interval_days >= 21) {
            masteredCount++;
          }
          if (prog.easiness_factor < 1.8 || prog.next_review_date < new Date(nowTime.getTime() - 7 * 24 * 3600 * 1000)) {
            weakCount++;
          }
        }
      }

      if (totalAttemptsTopic > 0) {
        const avgEf = efCount > 0 ? Math.round((efSum / efCount) * 100) / 100 : 2.50;
        const accPct = Math.round((correctAttemptsTopic / totalAttemptsTopic) * 100 * 10) / 10;

        await prisma.studentTopicStats.create({
          data: {
            student_id: s.id,
            topic_id: top.id,
            total_questions: qInTopic.length,
            mastered_count: masteredCount,
            weak_count: weakCount,
            avg_ef: avgEf,
            accuracy_pct: accPct,
          },
        });
      }
    }
  }
  console.log('✅ Đã cập nhật xong bảng StudentTopicStats chuẩn xác.\n');

  // =========================================================================
  // 8. BÁO CÁO PHÂN TÍCH AI & BẢN NHÁP GIÁO ÁN (AI REPORTS & WIZARDS)
  // =========================================================================
  console.log('🤖 [8/8] Sinh báo cáo AI và dữ liệu phụ trợ (AiReport, AiWizardDraft, OtpCode)...');

  // Báo cáo AI Toàn Diện Lớp Học (Class AI Report)
  await prisma.aiReport.create({
    data: {
      class_id: classSingle.id,
      type: 'class',
      report: {
        course_name: classSingle.name,
        analysis_timestamp: new Date().toISOString(),
        cohort_summary: {
          enrolled_students: 12,
          active_participants: 10,
          at_risk_students: 2,
          overall_average_score: 75.8,
          curriculum_completion_rate: 79.2,
        },
        topic_mastery_breakdown: [
          { topic_name: 'Động từ "To Be" & Đại từ Nhân xưng', accuracy: 94.2, status: 'Xuất sắc' },
          { topic_name: 'Thì Hiện Tại Đơn & Thói Quen Hàng Ngày', accuracy: 88.5, status: 'Tốt' },
          { topic_name: 'Gia Đình, Nhà Cửa & Đồ Gia Dụng', accuracy: 92.0, status: 'Xuất sắc' },
          { topic_name: 'Kỹ Thuật Đọc Skimming & Scanning', accuracy: 81.3, status: 'Tốt' },
          { topic_name: 'Công Nghệ, AI & Đổi Mới Sáng Tạo', accuracy: 76.5, status: 'Khá' },
          { topic_name: 'Môi Trường & Phát Triển Bền Vững', accuracy: 74.0, status: 'Khá' },
          { topic_name: 'Mạo từ & Giới từ Thời Gian/Nơi Chốn', accuracy: 68.2, status: 'Trung bình - Cần củng cố' },
          { topic_name: 'Các Thì Hoàn Thành & Tiếp Diễn', accuracy: 65.4, status: 'Trung bình - Cần củng cố' },
          { topic_name: 'Câu Điều Kiện & Đảo Ngữ Nâng Cao', accuracy: 54.1, status: 'Báo động - Điểm rơi kiến thức' },
        ],
        strengths: [
          'Nguyễn Văn An xuất sắc duy trì chuỗi 30 ngày học tập liên tục, phản xạ trung bình 4.5s/câu, đạt 100% Mastered ở mọi chuyên đề.',
          'Đặng Ngọc Lan có bước nhảy vọt ấn tượng: Điểm bài tập tăng từ 40% ở tuần 1 lên 90% ở tuần 4, phục hồi hệ số dễ nhớ EF từ 1.70 lên 2.50.',
          'Đỗ Minh Quang sau giai đoạn đầu mất gốc đã lấy lại toàn bộ tự tin, đạt 86% độ chính xác ở các bài tập nền tảng.',
          'Lương Bảo Ngọc đạt độ chính xác ngữ pháp lên tới 96%, là học viên vững nhất mảng cấu trúc câu.',
        ],
        critical_alerts_and_risks: [
          '🔴 BÁO ĐỘNG ĐỎ - Lê Khánh Chi: Đã ngừng truy cập 12 ngày qua; đường cong quên lãng Ebbinghaus khiến trí nhớ giảm sút 62%, có 4 câu hỏi đảo ngữ quá hạn ôn tập.',
          '🔴 HỌC SINH BỎ HỌC - Bùi Hải Nam: Hoàn toàn không đăng nhập sau bài học đầu tiên (28 ngày trước).',
          '🟡 HỌC LỆCH KIẾN THỨC - Hoàng Đăng Khoa: Từ vựng đạt độ thành thạo tuyệt đối (EF=2.75, chính xác 95%) nhưng ngữ pháp Đảo ngữ thường xuyên trả lời sai (EF=1.65, chính xác 35%).',
          '🟡 HÀNH VI LÀM BÀI BẤT THƯỜNG - Phạm Tiến Dũng: Thời gian phản xạ cực nhanh (dưới 3.1s), tỷ lệ chính xác chỉ 32% và bỏ dở giữa chừng 2 bài tập liên tiếp.',
        ],
        actionable_recommendations: [
          '1. Gửi thông báo nhắc nhở tự động (Push Notification & Email) thúc đẩy Lê Khánh Chi quay lại ôn tập 4 câu hỏi SM-2 đang quá hạn.',
          '2. Tổ chức phiên phụ đạo 1-1 chuyên đề Đảo Ngữ Had/Were/Should cho nhóm học sinh có EF < 2.0 (Khoa, Chi, Dũng).',
          '3. Kích hoạt tính năng Pacing Gate (khóa nút bấm 5 giây) với Phạm Tiến Dũng để rèn luyện thói quen đọc kỹ đề bài.',
          '4. Chuẩn bị đề tài thử thách nâng cao Band 7.5+ dành riêng cho Nguyễn Văn An và Lương Bảo Ngọc.',
        ],
      },
    },
  });

  // Báo cáo AI Cá Nhân 1: Nguyễn Văn An (Top Performer)
  await prisma.aiReport.create({
    data: {
      student_id: students[0].id,
      class_id: classSingle.id,
      type: 'student',
      report: {
        student_name: 'Nguyễn Văn An',
        risk_level: 'XUẤT SẮC - DẪN ĐẦU (Top Achiever)',
        current_estimated_band: 'C1 / IELTS 7.5+',
        accuracy_overall: 98.2,
        sm2_memory_retention: '99% (Cực kỳ bền vững)',
        streak_days: 30,
        average_speed_ms: 4500,
        evaluation: 'An thể hiện năng lực xuất sắc và kỷ luật học tập tuyệt đối. Chuỗi 30 ngày học liên tục cùng tốc độ phản xạ 4.5s cho thấy kiến thức đã đạt mức phản xạ vô điều kiện.',
        suggested_next_steps: [
          'Thử sức với các đề thi học thuật mức độ Master/Olympiad.',
          'Tham gia hỗ trợ giải đáp thắc mắc cho các bạn trong lớp để khắc sâu kiến thức.',
        ],
      },
    },
  });

  // Báo cáo AI Cá Nhân 2: Đặng Ngọc Lan (Breakthrough Improver)
  await prisma.aiReport.create({
    data: {
      student_id: students[3].id,
      class_id: classSingle.id,
      type: 'student',
      report: {
        student_name: 'Đặng Ngọc Lan',
        risk_level: 'TIẾN BỘ ĐỘT PHÁ (Breakthrough)',
        current_estimated_band: 'B2 / IELTS 6.0',
        accuracy_overall: 88.5,
        sm2_memory_retention: '86% (Phục hồi mạnh mẽ)',
        streak_days: 5,
        average_speed_ms: 8500,
        evaluation: 'Sự tiến bộ của Lan là điểm sáng lớn nhất của lớp. Điểm số tăng trưởng vượt bậc từ 40% ở tuần 1 lên 90% ở tuần 4, hệ số dễ nhớ phục hồi từ 1.70 lên 2.50.',
        suggested_next_steps: [
          'Duy trì nhịp độ ôn tập ngắt quãng 3 lần/tuần.',
          'Tự tin đăng ký tham gia kỳ thi chứng chỉ mục tiêu trong 2 tháng tới.',
        ],
      },
    },
  });

  // Báo cáo AI Cá Nhân 3: Lê Khánh Chi (At-Risk / Forgetting Curve)
  await prisma.aiReport.create({
    data: {
      student_id: students[4].id,
      class_id: classSingle.id,
      type: 'student',
      report: {
        student_name: 'Lê Khánh Chi',
        risk_level: 'BÁO ĐỘNG ĐỎ (At-Risk / Forgetting Curve)',
        current_estimated_band: 'B1 (Nguy cơ tụt xuống A2)',
        accuracy_overall: 58.4,
        sm2_memory_retention: '36% (Suy giảm nghiêm trọng)',
        streak_days: 0,
        inactive_days: 12,
        evaluation: 'Học sinh đã không truy cập ôn tập suốt 12 ngày qua. Đường cong quên lãng đang làm toàn bộ các cấu trúc câu điều kiện và đảo ngữ đã nạp bị mai một nghiêm trọng.',
        suggested_next_steps: [
          'Cần thực hiện ngay phiên ôn tập Due Today (4 câu hỏi đang chờ).',
          'Đọc lại sổ tay công thức Week2_Inversion_Formulas.pdf trước khi làm bài.',
        ],
      },
    },
  });

  // Báo cáo AI Cá Nhân 4: Hoàng Đăng Khoa (Skewed Learner - Học lệch)
  await prisma.aiReport.create({
    data: {
      student_id: students[2].id,
      class_id: classSingle.id,
      type: 'student',
      report: {
        student_name: 'Hoàng Đăng Khoa',
        risk_level: 'CẦN CÂN BẰNG KIẾN THỨC (Asymmetric Skills)',
        current_estimated_band: 'B2 Từ vựng / B1- Ngữ pháp',
        accuracy_overall: 72.0,
        sm2_memory_retention: 'Từ vựng 96% / Đảo ngữ 35%',
        evaluation: 'Khoa có vốn từ vựng Công nghệ và Môi trường rất phong phú, nhưng thường xuyên vấp ngã ở câu điều kiện loại 2, 3 và đảo ngữ Had/Were.',
        suggested_next_steps: [
          'Tập trung luyện các bài tập thích ứng SM-2 về Đảo ngữ mỗi ngày 15 phút.',
          'Gia sư hướng dẫn riêng công thức hoán đổi vị ngữ của Were và Had.',
        ],
      },
    },
  });

  // Báo cáo AI Cá Nhân 5: Phạm Tiến Dũng (Impulsive / Fast Guesser)
  await prisma.aiReport.create({
    data: {
      student_id: students[6].id,
      class_id: classSingle.id,
      type: 'student',
      report: {
        student_name: 'Phạm Tiến Dũng',
        risk_level: 'CẢNH BÁO HÀNH VI (Careless / High Drop-off)',
        current_estimated_band: 'A2-',
        accuracy_overall: 31.5,
        sm2_memory_retention: '28% (Kém)',
        average_speed_ms: 3100,
        evaluation: 'Dũng có thói quen làm bài vội vã (trung bình dưới 3.1 giây/câu), tỷ lệ bỏ dở giữa chừng cao và đoán mò ngẫu nhiên dẫn đến hệ số SM-2 giảm sâu.',
        suggested_next_steps: [
          'Thực hiện bài thi có giám sát thời gian tối thiểu mỗi câu.',
          'Yêu cầu giải thích lý do chọn đáp án trước khi bấm xác nhận.',
        ],
      },
    },
  });

  // Tạo Bản nháp giáo trình AI của Gia sư (AiWizardDraft)
  await prisma.aiWizardDraft.create({
    data: {
      teacher_id: tutor.id,
      class_id: classSingle.id,
      step: 'curriculum_ready',
      document_name: 'Advanced_Speaking_and_Academic_Writing_Booster.pdf',
      payload: {
        suggested_title: 'Tuần 5: Đột Phá Kỹ Năng Paraphrasing & Phản Xạ Nói IELTS Speaking Part 3',
        estimated_duration_weeks: 1,
        learning_objectives: [
          'Làm chủ 25 collocations nâng cao chủ đề Đô thị hóa và Xã hội số',
          'Nắm chắc 5 cấu trúc câu phức Paraphrasing Band 7.5+',
          'Thực hành phản xạ trả lời câu hỏi phản biện chuyên sâu',
        ],
        generated_questions_count: 6,
      },
    },
  });

  // Tạo mã OTP mẫu (OtpCode)
  await prisma.otpCode.create({
    data: {
      email: 'student.an@system.com',
      code: '849201',
      purpose: 'password_reset',
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
      is_used: false,
    },
  });

  console.log('✅ Đã tạo các báo cáo AI và dữ liệu phụ trợ hoàn chỉnh.\n');

  console.log('═══════════════════════════════════════════════════════════════════════════════════');
  console.log('🎉 HỆ SINH THÁI DỮ LIỆU ĐÃ ĐƯỢC GIẢ LẬP HOÀN CHỈNH 100% VỚI DÒNG THỜI GIAN 30 NGÀY!');
  console.log('═══════════════════════════════════════════════════════════════════════════════════');
  console.log(`📌 TỔNG KẾT DỮ LIỆU MÔ PHỎNG:`);
  console.log(`   - Người dùng: 1 Admin (${admin.email}), 1 Gia sư (${tutor.email}), 12 Học sinh`);
  console.log(`   - Lớp học: 1 LỚP DUY NHẤT ("${classSingle.name}") chứa toàn bộ 12 học viên`);
  console.log(`   - Cây chuyên đề: 10 Chuyên đề học thuật & đời sống có cấu trúc phân cấp`);
  console.log(`   - Ngân hàng câu hỏi: 26 Câu hỏi đầy đủ loại hình (MCQ, Multi-select, T/F, Fill Blank, Matching)`);
  console.log(`   - Bài tập lớp học: 8 Bài tập (Hoàn thành, Đang diễn ra, Thích ứng SM-2, Thi giữa kỳ, Quá hạn, Bản nháp)`);
  console.log(`   - Phiên làm bài: ${totalSessionsCreated} Quiz Sessions trải đều 30 ngày`);
  console.log(`   - Lịch sử trả lời: ${totalAnswersCreated} Session Answers chi tiết`);
  console.log(`   - Trạng thái SM-2: ${sm2Map.size} bản ghi tiến độ lặp lại ngắt quãng`);
  console.log(`   - Đánh giá & Báo cáo: 1 Báo cáo AI lớp học chi tiết + 5 Báo cáo AI học sinh đa dạng + Nhận xét của Gia sư`);
  console.log('-----------------------------------------------------------------------------------');
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
