import { CompleteStudentReportData } from '../student-report.service';
import { reportCss } from './report.css';

export function generateStudentReportHtml(data: CompleteStudentReportData): string {
  const { student_info, class_info, summary, sm2_summary, topic_performance, weak_topics, assignments, error_questions, ai_insights, generated_at } = data;

  const formattedDate = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(generated_at));

  // Limit to top 6 topics for spacious bar chart
  const displayTopics = topic_performance.slice(0, 6);
  const topicLabels = JSON.stringify(displayTopics.map(t => t.topic));
  const topicAccuracies = JSON.stringify(displayTopics.map(t => t.accuracy_pct));

  const sm2DataCounts = JSON.stringify([
    sm2_summary.mastered_count,
    sm2_summary.learning_in_progress,
    sm2_summary.learning_at_risk,
    sm2_summary.new_count
  ]);

  const atRiskTotal = sm2_summary.learning_at_risk + sm2_summary.due_today;
  const subjectDisplay = class_info.subject && class_info.subject !== 'Chưa biết' ? class_info.subject : 'Chung';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Báo Cáo Chẩn Đoán Học Lực - ${student_info.name}</title>
  <style>
    ${reportCss}
    .benchmark-sub {
      font-size: 8.5pt;
      color: #64748b;
      margin-top: 3px;
      font-weight: 600;
    }
    .benchmark-sub strong {
      color: #334155;
    }
    .weak-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
      margin-top: 10px;
    }
    .weak-table th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      text-align: left;
      padding: 8px 10px;
      font-size: 9.5pt;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border: 1px solid #cbd5e1;
    }
    .weak-table td {
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      color: #334155;
      font-size: 9.5pt;
    }
    .error-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-top: 10px;
    }
    .error-table th {
      background-color: #0f172a;
      color: #ffffff;
      font-weight: 800;
      text-align: left;
      padding: 8px 10px;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border: 1px solid #334155;
    }
    .error-table td {
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      color: #1e293b;
      font-size: 9pt;
      vertical-align: top;
    }
    .error-table tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .student-wrong-tag {
      color: #b91c1c;
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      padding: 3px 6px;
      border-radius: 4px;
      font-weight: 700;
      display: inline-block;
      margin-top: 2px;
      font-size: 8.5pt;
    }
    .correct-tag {
      color: #15803d;
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 3px 6px;
      border-radius: 4px;
      font-weight: 700;
      display: inline-block;
      margin-top: 2px;
      font-size: 8.5pt;
    }
    .explanation-snippet {
      font-size: 8pt;
      color: #475569;
      margin-top: 5px;
      padding-top: 4px;
      border-top: 1px dashed #e2e8f0;
      line-height: 1.35;
    }
    .type-badge {
      display: inline-block;
      padding: 2px 5px;
      background-color: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      font-size: 7.5pt;
      font-weight: 600;
      color: #475569;
      margin-top: 3px;
    }
    .freq-tag {
      display: inline-block;
      padding: 1px 5px;
      background-color: #fee2e2;
      color: #991b1b;
      border-radius: 3px;
      font-size: 7.5pt;
      font-weight: 700;
      margin-left: 4px;
    }
    .page-break-section {
      page-break-before: always;
      break-before: page;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
</head>
<body>
  <div class="page-container">

    <!-- ==================== TRANG 1 ==================== -->
    <div class="report-header">
      <div class="header-titles">
        <h1>Báo Cáo Chẩn Đoán Năng Lực Học Sinh</h1>
        <div class="subtitle">Học sinh: ${student_info.name} — Lớp: ${class_info.name} (${subjectDisplay})</div>
      </div>
      <div class="header-meta">
        <div><strong>Giáo viên / Gia sư:</strong> ${class_info.teacher_name}</div>
        <div><strong>Email học sinh:</strong> ${student_info.email}</div>
        <div><strong>Ngày xuất:</strong> ${formattedDate}</div>
      </div>
    </div>

    <!-- Khối 4 Chỉ số KPI Chẩn đoán & Benchmark -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Điểm tích lũy</div>
        <div class="metric-value">${summary.cumulative_score}</div>
        <div class="benchmark-sub">TB lớp: <strong>${summary.class_average_score}</strong></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Độ chính xác</div>
        <div class="metric-value">${summary.accuracy_pct}%</div>
        <div class="benchmark-sub">TB lớp: <strong>${summary.class_average_accuracy_pct}%</strong></div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Kiến thức thành thạo</div>
        <div class="metric-value">${sm2_summary.mastered_count} <span style="font-size: 11pt; font-weight: normal; color: #64748b;">/ ${sm2_summary.total_questions} câu</span></div>
        <div class="benchmark-sub">Ghi nhớ dài hạn</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Cần ôn tập gấp</div>
        <div class="metric-value" style="color: ${atRiskTotal > 0 ? '#dc2626' : '#16a34a'};">${atRiskTotal} <span style="font-size: 11pt; font-weight: normal; color: #64748b;">câu</span></div>
        <div class="benchmark-sub">${atRiskTotal > 0 ? 'Có nguy cơ quên' : 'Tiến độ rất tốt'}</div>
      </div>
    </div>

    <!-- Khối Đánh giá Sư phạm Chẩn đoán (AI) -->
    <div class="section-block">
      <div class="section-title">I. Đánh Giá Sư Phạm Chẩn Đoán</div>
      
      <div class="assessment-box">
        <h3>1.1. Nhận định tổng quan năng lực & thói quen làm bài</h3>
        <p>${ai_insights.executive_summary}</p>
      </div>

      <div class="assessment-box warning">
        <h3>1.2. Phân tích điểm mạnh & Lỗ hổng kiến thức cốt lõi</h3>
        <p>${ai_insights.strengths_and_weaknesses}</p>
      </div>

      <div class="assessment-box">
        <h3>1.3. Đánh giá mức độ ghi nhớ kiến thức dài hạn (Spaced Repetition)</h3>
        <p>${ai_insights.sm2_learning_analysis}</p>
      </div>
    </div>

    <!-- ==================== TRANG 2: BIỂU ĐỒ & LỖ HỔNG ==================== -->
    <div class="section-block page-break-section">
      <div class="section-title">II. Hệ Thống Biểu Đồ Chẩn Đoán Trực Quan</div>
      
      <div class="charts-stack">
        <!-- Biểu đồ Cột ngang Chủ đề -->
        <div class="chart-card">
          <div class="chart-title">Tỷ lệ chính xác theo Chuyên đề kiến thức (%)</div>
          <div class="chart-wrapper bar-wrapper">
            <canvas id="topicAccuracyChart"></canvas>
          </div>
        </div>

        <!-- Biểu đồ Tròn SM2 -->
        <div class="chart-card">
          <div class="chart-title">Phân bố mức độ ghi nhớ kiến thức dài hạn</div>
          <div class="chart-wrapper donut-wrapper">
            <canvas id="sm2DistributionChart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Bảng danh mục lỗ hổng cần kèm cặp (Weak Topics) -->
    <div class="section-block avoid-break">
      <div class="section-title">III. Danh Mục Lỗ Hổng Kiến Thức Cần Phụ Đạo</div>
      ${weak_topics.length > 0 ? `
        <table class="weak-table">
          <thead>
            <tr>
              <th style="width: 40px;" class="text-center">STT</th>
              <th>Chuyên đề kiến thức yếu</th>
              <th class="text-center" style="width: 120px;">Độ chính xác</th>
              <th class="text-center" style="width: 110px;">Số câu sai</th>
              <th>Trọng tâm gia sư cần lưu ý</th>
            </tr>
          </thead>
          <tbody>
            ${weak_topics.map((wt, idx) => `
              <tr>
                <td class="text-center"><strong>${idx + 1}</strong></td>
                <td><strong>${wt.topic}</strong></td>
                <td class="text-center"><span class="badge badge-danger">${wt.accuracy_pct}%</span></td>
                <td class="text-center"><strong>${wt.error_count} / ${wt.total_answers} câu</strong></td>
                <td style="font-size: 9.5pt; color: #475569;">Tập trung chữa lỗi sai, hướng dẫn mẹo nhận biết và giao bài tập củng cố riêng.</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `
        <div class="assessment-box" style="border-left-color: #16a34a;">
          <h3>Không phát hiện lỗ hổng kiến thức nghiêm trọng</h3>
          <p>Học sinh đạt tỷ lệ chính xác trên 60% ở toàn bộ các chuyên đề đã thực hành. Gia sư có thể tiếp tục mở rộng sang các dạng bài nâng cao.</p>
        </div>
      `}
    </div>

    <!-- ==================== TRANG 3: NHẬT KÝ BÀI TẬP ==================== -->
    <div class="section-block page-break-section">
      <div class="section-title">IV. Bảng Chi Tiết Kết Quả Các Bài Tập Đã Giao</div>
      
      <table class="grade-table">
        <thead>
          <tr>
            <th class="text-center" style="width: 45px;">STT</th>
            <th>Tên bài tập</th>
            <th class="text-center" style="width: 80px;">Điểm số</th>
            <th class="text-center" style="width: 100px;">Độ chính xác</th>
            <th class="text-center" style="width: 90px;">Số lần thử</th>
            <th class="text-center" style="width: 110px;">Trạng thái</th>
            <th class="text-center" style="width: 110px;">Ngày hoàn thành</th>
          </tr>
        </thead>
        <tbody>
          ${assignments.length > 0 ? assignments.map((a, index) => {
            const completedDateStr = a.completed_at 
              ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(a.completed_at))
              : 'Chưa có';
            
            const badgeClass = a.status === 'Hoàn thành' ? 'badge-success' : 'badge-warning';

            return `
              <tr>
                <td class="text-center"><strong>${index + 1}</strong></td>
                <td><strong>${a.title}</strong></td>
                <td class="text-center font-bold">${a.score}</td>
                <td class="text-center font-bold">${a.accuracy_pct}%</td>
                <td class="text-center">${a.attempts_count}</td>
                <td class="text-center"><span class="badge ${badgeClass}">${a.status}</span></td>
                <td class="text-center" style="color: #64748b;">${completedDateStr}</td>
              </tr>
            `;
          }).join('') : `
            <tr>
              <td colspan="7" class="text-center" style="padding: 24px; font-weight: bold;">Lớp học hiện tại chưa có bài tập nào được giao cho học sinh.</td>
            </tr>
          `}
        </tbody>
      </table>
    </div>

    <!-- ==================== TRANG 4+: ERROR QUESTIONS LOG ==================== -->
    <div class="section-block page-break-section">
      <div class="section-title">V. Danh Mục Toàn Bộ Các Câu Hỏi Học Sinh Đã Làm Sai (Sổ Tay Chữa Bài 1-1)</div>
      
      ${error_questions && error_questions.length > 0 ? `
        <div style="font-size: 10pt; color: #475569; margin-bottom: 8px;">
          Tổng hợp toàn bộ <strong>${error_questions.length} câu hỏi</strong> học sinh đã trả lời sai qua tất cả các bài tập. Gia sư sử dụng bảng này để chữa bài chi tiết trong buổi học.
        </div>

        <table class="error-table">
          <thead>
            <tr>
              <th class="text-center" style="width: 35px;">STT</th>
              <th style="width: 110px;">Chuyên đề</th>
              <th>Nội dung câu hỏi</th>
              <th style="width: 140px;">Học sinh chọn sai</th>
              <th style="width: 160px;">Đáp án đúng & Giải thích</th>
              <th class="text-center" style="width: 65px;">Thời gian</th>
            </tr>
          </thead>
          <tbody>
            ${error_questions.map((eq, idx) => `
              <tr>
                <td class="text-center"><strong>${idx + 1}</strong></td>
                <td>
                  <strong>${eq.topic}</strong>
                  <div><span class="type-badge">${eq.question_type}</span></div>
                  ${eq.error_count > 1 ? `<div><span class="freq-tag">Sai ${eq.error_count} lần</span></div>` : ''}
                </td>
                <td>
                  <div style="font-weight: 600; color: #0f172a; line-height: 1.4;">${eq.content}</div>
                </td>
                <td>
                  <span class="student-wrong-tag">${eq.student_answer}</span>
                </td>
                <td>
                  <span class="correct-tag">${eq.correct_answer}</span>
                  ${eq.explanation && eq.explanation !== 'Chưa có giải thích chi tiết.' ? `
                    <div class="explanation-snippet"><strong>Giải thích:</strong> ${eq.explanation}</div>
                  ` : ''}
                </td>
                <td class="text-center" style="font-size: 8.5pt; color: #64748b;">
                  ${eq.response_time_seconds > 0 ? `${eq.response_time_seconds}s` : '-'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `
        <div class="assessment-box" style="border-left-color: #16a34a; background-color: #f0fdf4;">
          <h3 style="color: #166534;">Học sinh chưa có câu trả lời sai nào</h3>
          <p style="color: #15803d;">Học sinh đã trả lời chính xác toàn bộ các câu hỏi trong tất cả các bài tập đã nộp. Năng lực làm bài đạt độ chuẩn xác tuyệt đối.</p>
        </div>
      `}
    </div>

  </div>

  <!-- Chart.js Render Engine -->
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      // 1. Topic Horizontal Bar Chart
      const ctxTopic = document.getElementById('topicAccuracyChart');
      if (ctxTopic) {
        new Chart(ctxTopic, {
          type: 'bar',
          data: {
            labels: ${topicLabels},
            datasets: [{
              label: 'Độ chính xác (%)',
              data: ${topicAccuracies},
              backgroundColor: '#2563eb',
              borderRadius: 4,
              barThickness: 16
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
              legend: { display: false },
              tooltip: { enabled: false }
            },
            scales: {
              x: {
                min: 0,
                max: 100,
                ticks: {
                  stepSize: 20,
                  font: { size: 9, family: '-apple-system, sans-serif' },
                  color: '#475569'
                },
                grid: { color: '#e2e8f0' }
              },
              y: {
                ticks: {
                  font: { size: 9.5, weight: 'bold', family: '-apple-system, sans-serif' },
                  color: '#0f172a'
                },
                grid: { display: false }
              }
            }
          }
        });
      }

      // 2. SM2 Spaced Repetition Donut Chart
      const ctxSm2 = document.getElementById('sm2DistributionChart');
      if (ctxSm2) {
        new Chart(ctxSm2, {
          type: 'doughnut',
          data: {
            labels: ['Đã thành thạo', 'Đang rèn luyện', 'Cần ôn tập gấp', 'Kiến thức mới'],
            datasets: [{
              data: ${sm2DataCounts},
              backgroundColor: ['#16a34a', '#2563eb', '#dc2626', '#94a3b8'],
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            cutout: '62%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 12,
                  boxHeight: 12,
                  padding: 10,
                  font: { size: 9, weight: 'bold', family: '-apple-system, sans-serif' },
                  color: '#334155'
                }
              },
              tooltip: { enabled: false }
            }
          }
        });
      }
    });
  </script>
</body>
</html>`;
}
