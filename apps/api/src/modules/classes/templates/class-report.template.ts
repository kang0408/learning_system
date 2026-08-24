import { CompleteClassReportData } from '../class-report.service';
import { reportCss } from './report.css';

export function generateClassReportHtml(data: CompleteClassReportData): string {
  const { class_info, summary, sm2_summary, topics, students, ai_insights, generated_at } = data;

  const formattedDate = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(generated_at));

  // Limit to top 6 topics for super clean and spacious bar chart
  const displayTopics = topics.slice(0, 6);
  const topicLabels = JSON.stringify(displayTopics.map(t => t.topic));
  const topicAccuracies = JSON.stringify(displayTopics.map(t => t.accuracy_pct));

  const sm2DataCounts = JSON.stringify([
    sm2_summary.mastered_count,
    sm2_summary.learning_in_progress,
    sm2_summary.learning_at_risk,
    sm2_summary.new_count
  ]);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Báo Cáo Toàn Diện Lớp Học - ${class_info.name}</title>
  <style>
    ${reportCss}
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
</head>
<body>
  <div class="page-container">

    <!-- ==================== TRANG 1 ==================== -->
    <div class="report-header">
      <div class="header-titles">
        <h1>Báo Cáo Toàn Diện Chất Lượng Lớp Học</h1>
        <div class="subtitle">Lớp: ${class_info.name} — Môn: ${class_info.subject}</div>
      </div>
      <div class="header-meta">
        <div><strong>Giáo viên:</strong> ${class_info.teacher_name}</div>
        <div><strong>Mã lớp:</strong> ${class_info.join_code}</div>
        <div><strong>Ngày xuất:</strong> ${formattedDate}</div>
      </div>
    </div>

    <!-- Khối 4 Chỉ số KPI cốt lõi -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Sĩ số lớp học</div>
        <div class="metric-value">${summary.total_students}</div>
        <div class="metric-sub">Học sinh chính thức</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Tỷ lệ chuyên cần (7 ngày)</div>
        <div class="metric-value">${summary.active_rate_pct}%</div>
        <div class="metric-sub">${summary.active_students_7d} / ${summary.total_students} học sinh</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Điểm trung bình lớp</div>
        <div class="metric-value">${summary.average_score.toFixed(1)} / 10</div>
        <div class="metric-sub">Tổng hợp bài kiểm tra</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Độ hoàn thành bài tập</div>
        <div class="metric-value">${summary.completion_rate_pct}%</div>
        <div class="metric-sub">Tiến độ phân phối</div>
      </div>
    </div>

    <!-- Khối Đánh giá Sư phạm Chuyên sâu (AI) -->
    <div class="section-block">
      <div class="section-title">I. Đánh Giá Sư Phạm</div>
      
      <div class="assessment-box">
        <h3>1.1. Nhận định tổng quan năng lực học tập</h3>
        <p>${ai_insights.executive_summary}</p>
      </div>

      <div class="assessment-box warning">
        <h3>1.2. Phân tích lỗ hổng kiến thức và kỹ năng trọng tâm</h3>
        <p>${ai_insights.strengths_and_weaknesses}</p>
      </div>

      <div class="assessment-box">
        <h3>1.3. Đánh giá mức độ ghi nhớ kiến thức dài hạn</h3>
        <p>${ai_insights.sm2_learning_analysis}</p>
      </div>
    </div>

    <!-- Ngắt sang Trang 2 -->
    <div class="page-break"></div>

    <!-- ==================== TRANG 2 ==================== -->
    <div class="section-block">
      <div class="section-title">II. Hệ Thống Biểu Đồ Phân Tích Trực Quan</div>
      
      <div class="charts-stack">
        <!-- Biểu đồ Cột ngang Chủ đề -->
        <div class="chart-card">
          <div class="chart-title">Độ chính xác theo Chuyên đề kiến thức (%)</div>
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
    <!-- Ngắt sang Trang 3 (Bảng điểm chi tiết) -->
    <div class="page-break"></div>

    <!-- ==================== TRANG 3+ ==================== -->
    <div class="section-block">
      <div class="section-title">III. Bảng Tổng Hợp Chi Tiết Học Sinh</div>
      
      <table class="grade-table">
        <thead>
          <tr>
            <th class="text-center" style="width: 50px;">STT</th>
            <th>Họ và tên</th>
            <th class="text-center" style="width: 100px;">Số bài làm</th>
            <th class="text-center" style="width: 90px;">Điểm số</th>
            <th class="text-center" style="width: 110px;">Độ chính xác</th>
            <th class="text-center" style="width: 140px;">Kiến thức thành thạo</th>
            <th class="text-center" style="width: 110px;">Hoạt động cuối</th>
          </tr>
        </thead>
        <tbody>
          ${students.length > 0 ? students.map((s, index) => {
            const lastActiveStr = s.last_active_at 
              ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(s.last_active_at))
              : 'Chưa có';
            
            const badgeClass = s.accuracy >= 80 ? 'badge-success' : s.accuracy >= 50 ? 'badge-warning' : 'badge-danger';

            return `
              <tr>
                <td class="text-center"><strong>${index + 1}</strong></td>
                <td><strong>${s.name}</strong></td>
                <td class="text-center font-bold">${s.sessions_count}</td>
                <td class="text-center font-bold">${s.score}</td>
                <td class="text-center"><span class="badge ${badgeClass}">${s.accuracy}%</span></td>
                <td class="text-center">${s.sm2_mastered_q} / ${s.sm2_total_q} câu</td>
                <td class="text-center" style="color: #64748b;">${lastActiveStr}</td>
              </tr>
            `;
          }).join('') : `
            <tr>
              <td colspan="7" class="text-center" style="padding: 24px; font-weight: bold;">Lớp học hiện tại chưa có thành viên học sinh.</td>
            </tr>
          `}
        </tbody>
      </table>
    </div>

  </div>

  <script>
    window.chartRenderComplete = false;

    window.onload = function() {
      try {
        // 1. Topic Accuracy Chart (Horizontal Bar)
        const ctxTopics = document.getElementById('topicAccuracyChart').getContext('2d');
        new Chart(ctxTopics, {
          type: 'bar',
          data: {
            labels: ${topicLabels},
            datasets: [{
              label: 'Độ chính xác (%)',
              data: ${topicAccuracies},
              backgroundColor: '#2563eb',
              borderRadius: 4,
              barThickness: 20
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: {
                min: 0,
                max: 100,
                ticks: { font: { size: 12, weight: 'bold' }, color: '#475569' },
                grid: { color: '#e2e8f0' }
              },
              y: {
                ticks: { font: { size: 13, weight: 'bold' }, color: '#0f172a' },
                grid: { display: false }
              }
            }
          }
        });

        // 2. SM2 Memory Distribution Chart (Donut)
        const ctxSm2 = document.getElementById('sm2DistributionChart').getContext('2d');
        new Chart(ctxSm2, {
          type: 'doughnut',
          data: {
            labels: ['Đã thành thạo', 'Đang rèn luyện', 'Cần ôn tập gấp', 'Kiến thức mới'],
            datasets: [{
              data: ${sm2DataCounts},
              backgroundColor: ['#16a34a', '#2563eb', '#dc2626', '#94a3b8'],
              borderWidth: 3,
              borderColor: '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 16,
                  font: { size: 12.5, weight: 'bold' },
                  color: '#1e293b',
                  padding: 16
                }
              }
            }
          }
        });

        // Signal complete
        window.chartRenderComplete = true;
      } catch (err) {
        console.error('Chart render error:', err);
        window.chartRenderComplete = true;
      }
    };
  </script>
</body>
</html>`;
}
