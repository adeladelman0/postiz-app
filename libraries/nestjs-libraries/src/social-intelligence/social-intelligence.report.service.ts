import { Injectable } from '@nestjs/common';

@Injectable()
export class SocialIntelligenceReportService {
  private escapeText(value: unknown) {
    return String(value ?? '')
      .replace(/[^\x20-\x7E]/g, '?')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  private pdf(lines: string[]) {
    const safeLines = lines.slice(0, 48).map((line) => this.escapeText(line));
    const text = [
      'BT',
      '/F1 12 Tf',
      '50 760 Td',
      '14 TL',
      ...safeLines.flatMap((line) => [`(${line}) Tj`, 'T*']),
      'ET',
    ].join('\n');

    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      `<< /Length ${Buffer.byteLength(text, 'utf8')} >>\nstream\n${text}\nendstream`,
    ];

    let output = '%PDF-1.4\n';
    const offsets = [0];

    objects.forEach((object, index) => {
      offsets[index + 1] = Buffer.byteLength(output, 'utf8');
      output += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset = Buffer.byteLength(output, 'utf8');
    output += `xref\n0 ${objects.length + 1}\n`;
    output += '0000000000 65535 f \n';
    for (let index = 1; index <= objects.length; index++) {
      output += String(offsets[index]).padStart(10, '0') + ' 00000 n \n';
    }
    output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return Buffer.from(output, 'utf8');
  }

  createDashboardReport(data: any) {
    const insights = (data.insights || []).slice(0, 10);
    const lines = [
      'Postiz Social Intelligence Report',
      'Generated: ' + new Date().toISOString(),
      '',
      'Workspace summary',
      'Brands: ' + (data.brands?.length || 0),
      'Tracked profiles: ' + (data.targets?.length || 0),
      'Audits: ' + (data.audits?.length || 0),
      'Strategies: ' + (data.strategies?.length || 0),
      'Ideas: ' + (data.ideas?.length || 0),
      'Plans: ' + (data.plans?.length || 0),
      'Planned items: ' + (data.planItems?.length || 0),
      'Performance snapshots: ' + (data.performance?.length || 0),
      '',
      'Recent learning insights',
      ...insights.map(
        (item: any, index: number) =>
          `${index + 1}. ${item.insight_type || 'insight'}: ${item.insight || ''}`
      ),
      '',
      'Data integrity',
      'Public data is treated as observed only when explicitly supplied or imported.',
      'Private analytics require an authorized connected account.',
    ];

    return this.pdf(lines);
  }
}
