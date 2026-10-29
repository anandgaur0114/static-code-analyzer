import { jsPDF } from 'jspdf';

export function exportAnalysisPDF(analysis, filename = 'code_analysis_report.pdf') {
  if (!analysis) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header banner
  doc.setFillColor(13, 17, 23);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(240, 246, 252);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('STATIC CODE ANALYZER & ACCURACY REPORT', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(139, 148, 158);
  doc.text(`Generated on: ${new Date().toLocaleString()} | Target: ISO C++17`, 14, 19);

  y = 38;

  // Executive Summary Box
  const score = analysis.metrics?.quality_score ?? 100.0;
  const grade = analysis.metrics?.grade || 'A';
  const risk = analysis.metrics?.risk_level || 'Low';

  doc.setDrawColor(48, 54, 61);
  doc.setFillColor(22, 27, 34);
  doc.roundedRect(14, y, pageWidth - 28, 26, 3, 3, 'FD');

  doc.setTextColor(88, 166, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`ACCURACY SCORE: ${score.toFixed(1)}% [GRADE ${grade}]`, 20, y + 9);

  doc.setFontSize(9);
  doc.setTextColor(201, 209, 217);
  doc.text(`Quality Rating: ${analysis.metrics?.description || 'Clean Code'}`, 20, y + 16);
  doc.text(`Total Issues: ${analysis.issues?.length || 0} | Functions: ${analysis.metrics?.functions || 0} | Avg Complexity: ${analysis.metrics?.cyclomatic_complexity || 0} (Risk: ${risk})`, 20, y + 22);

  y += 34;

  // Function Metrics Table
  if (analysis.metrics?.function_metrics && analysis.metrics.function_metrics.length > 0) {
    doc.setTextColor(33, 37, 41);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('FUNCTION METRICS & COMPLEXITY TABLE', 14, y);
    y += 5;

    doc.setFillColor(240, 243, 246);
    doc.rect(14, y, pageWidth - 28, 7, 'F');
    doc.setFontSize(8);
    doc.setTextColor(70, 80, 95);
    doc.text('Function', 18, y + 5);
    doc.text('Lines', 65, y + 5);
    doc.text('LOC', 95, y + 5);
    doc.text('Nesting', 120, y + 5);
    doc.text('Complexity', 145, y + 5);
    doc.text('Risk', 175, y + 5);
    y += 8;

    doc.setFont('helvetica', 'normal');
    for (const fn of analysis.metrics.function_metrics) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(String(fn.name), 18, y + 4);
      doc.text(String(fn.lines), 65, y + 4);
      doc.text(String(fn.loc), 95, y + 4);
      doc.text(String(fn.nesting), 120, y + 4);
      doc.text(String(fn.complexity), 145, y + 4);
      doc.text(String(fn.risk), 175, y + 4);
      y += 6;
    }
    y += 6;
  }

  // Deductions List
  if (analysis.metrics?.deductions && analysis.metrics.deductions.length > 0) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(33, 37, 41);
    doc.text('SCORE DEDUCTION PENALTIES', 14, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    for (const ded of analysis.metrics.deductions) {
      doc.setTextColor(200, 30, 30);
      doc.text(`- ${ded.rule} (-${ded.points}%)`, 18, y + 4);
      y += 5;
    }
    y += 6;
  }

  // Issues Breakdown
  if (analysis.issues && analysis.issues.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(33, 37, 41);
    doc.text(`DETECTED ISSUES & DIAGNOSTICS (${analysis.issues.length})`, 14, y);
    y += 6;

    for (const iss of analysis.issues) {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      const isErr = iss.severity === 'error';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(isErr ? 215 : 180, isErr ? 40 : 120, 30);
      doc.text(`[${iss.severity.toUpperCase()}] Line ${iss.line}:${iss.col} - ${iss.type}`, 16, y);
      y += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      doc.text(doc.splitTextToSize(iss.message, pageWidth - 36), 18, y);
      y += 4;

      if (iss.suggestion) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(40, 110, 180);
        doc.text(`Suggestion: ${iss.suggestion}`, 18, y);
        y += 4.5;
      }
      y += 3;
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(46, 160, 67);
    doc.text('No static analysis issues detected! Code satisfies all quality checks.', 14, y);
  }

  // Footer on each page
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`CodeAccuracy Static Code Analyzer | Page ${i} of ${totalPages}`, pageWidth / 2, 290, { align: 'center' });
  }

  doc.save(filename);
}
