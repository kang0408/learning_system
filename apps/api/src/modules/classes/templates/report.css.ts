export const reportCss = `
  @page {
    size: A4 portrait;
    margin: 12mm 14mm 14mm 14mm;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #0f172a;
    background-color: #ffffff;
    line-height: 1.6;
    font-size: 12.5pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page-container {
    width: 100%;
  }

  .page-break {
    page-break-after: always;
    break-after: page;
  }

  .avoid-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Header Section */
  .report-header {
    border-bottom: 2px solid #0f172a;
    padding-bottom: 10px;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .header-titles h1 {
    font-size: 18pt;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -0.5px;
    color: #0f172a;
    margin-bottom: 4px;
    line-height: 1.2;
  }

  .header-titles .subtitle {
    font-size: 11.5pt;
    font-weight: 700;
    color: #334155;
  }

  .header-meta {
    text-align: right;
    font-size: 9.5pt;
    color: #475569;
    line-height: 1.45;
  }

  /* Key Metrics Grid */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 18px;
  }

  .metric-card {
    border: 1.5px solid #cbd5e1;
    background-color: #f8fafc;
    padding: 10px 12px;
    border-radius: 6px;
  }

  .metric-label {
    font-size: 8.5pt;
    font-weight: 800;
    text-transform: uppercase;
    color: #64748b;
    letter-spacing: 0.4px;
    margin-bottom: 4px;
  }

  .metric-value {
    font-size: 16pt;
    font-weight: 900;
    color: #0f172a;
    line-height: 1.2;
  }

  .metric-sub {
    font-size: 8.5pt;
    color: #64748b;
    margin-top: 3px;
    font-weight: 500;
  }

  /* Academic Section */
  .section-block {
    margin-bottom: 18px;
  }

  .section-title {
    font-size: 13pt;
    font-weight: 900;
    text-transform: uppercase;
    color: #0f172a;
    border-bottom: 2px solid #cbd5e1;
    padding-bottom: 6px;
    margin-bottom: 12px;
    letter-spacing: -0.3px;
  }

  .assessment-box {
    border-left: 4px solid #2563eb;
    background-color: #f8fafc;
    padding: 10px 14px;
    margin-bottom: 12px;
    border-radius: 0 6px 6px 0;
  }

  .assessment-box.warning {
    border-left-color: #d97706;
  }

  .assessment-box h3 {
    font-size: 11pt;
    font-weight: 800;
    color: #1e293b;
    margin-bottom: 5px;
  }

  .assessment-box p {
    font-size: 10pt;
    color: #334155;
    text-align: justify;
    line-height: 1.55;
  }

  /* Action Plan List */
  .action-plan-list {
    list-style: none;
    padding: 0;
    margin-top: 10px;
  }

  .action-plan-item {
    display: flex;
    font-size: 11.5pt;
    color: #334155;
    padding: 11px 16px;
    background-color: #f1f5f9;
    border-radius: 6px;
    margin-bottom: 10px;
    line-height: 1.6;
  }

  .action-plan-num {
    font-weight: 900;
    color: #2563eb;
    margin-right: 12px;
    min-width: 28px;
    font-size: 12pt;
  }

  /* Charts Stacked (Mỗi biểu đồ 1 dòng rộng rãi) */
  .charts-stack {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 24px;
  }

  .chart-card {
    border: 1.5px solid #cbd5e1;
    padding: 16px 20px;
    border-radius: 6px;
    background-color: #ffffff;
  }

  .chart-title {
    font-size: 12.5pt;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 14px;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.2px;
  }

  .chart-wrapper {
    position: relative;
    width: 100%;
  }

  .chart-wrapper.bar-wrapper {
    height: 250px;
  }

  .chart-wrapper.donut-wrapper {
    height: 220px;
  }

  /* Detailed Table (Gradebook) */
  .grade-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10.5pt;
    margin-top: 10px;
  }

  .grade-table thead {
    display: table-header-group;
  }

  .grade-table tr {
    page-break-inside: avoid;
  }

  .grade-table th {
    background-color: #0f172a;
    color: #ffffff;
    font-weight: 800;
    text-align: left;
    padding: 9px 12px;
    font-size: 10pt;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    border: 1px solid #0f172a;
  }

  .grade-table td {
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    color: #334155;
    font-size: 10.5pt;
  }

  .grade-table tbody tr:nth-child(even) {
    background-color: #f8fafc;
  }

  .text-center {
    text-align: center !important;
  }

  .text-right {
    text-align: right !important;
  }

  .badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 9pt;
    font-weight: 800;
    text-transform: uppercase;
  }

  .badge-success {
    background-color: #dcfce7;
    color: #15803d;
  }

  .badge-warning {
    background-color: #fef3c7;
    color: #b45309;
  }

  .badge-danger {
    background-color: #fee2e2;
    color: #b91c1c;
  }
`;
