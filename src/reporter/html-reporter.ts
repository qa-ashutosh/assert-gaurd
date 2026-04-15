import fs from 'fs';
import path from 'path';
import type { ScanResult, Violation } from '../types';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function severityBadge(sev: string): string {
  const map: Record<string, string> = {
    error: 'background:#FCEBEB;color:#A32D2D',
    warn:  'background:#FAEEDA;color:#854F0B',
    info:  'background:#E6F1FB;color:#185FA5',
  };
  return `<span style="display:inline-flex;align-items:center;font-size:11px;padding:2px 8px;border-radius:20px;font-weight:500;${map[sev] ?? ''}">${sev}</span>`;
}

function violationRows(violations: Violation[]): string {
  return violations.map(v => {
    const rel = path.relative(process.cwd(), v.file);
    return `
      <tr>
        <td><code style="font-size:12px;color:#534AB7">${escapeHtml(v.rule)}</code><br>
            <span style="font-size:11px;color:#888780">${escapeHtml(rel)}</span></td>
        <td>${severityBadge(v.severity)}</td>
        <td><span style="font-size:11px;font-family:monospace;background:#F1EFE8;color:#5F5E5A;padding:2px 6px;border-radius:4px">line ${v.line}</span></td>
        <td style="font-size:12px;color:#444441">${escapeHtml(v.message)}</td>
        <td style="font-size:11px;color:#888780">${escapeHtml(v.hint)}</td>
      </tr>`;
  }).join('');
}

export function writeHtmlReport(result: ScanResult, outputDir: string): string {
  fs.mkdirSync(outputDir, { recursive: true });
  const outPath = path.join(outputDir, 'assert-guard-report.html');

  const gateColor = result.gateStatus === 'failed' ? '#A32D2D' : '#3B6D11';
  const gateBg    = result.gateStatus === 'failed' ? '#FCEBEB' : '#EAF3DE';
  const gateIcon  = result.gateStatus === 'failed' ? '✗' : '✔';
  const gateText  = result.gateStatus === 'failed'
    ? `Quality gate FAILED — ${result.errors} error(s) must be resolved`
    : 'Quality gate PASSED — all checks clear';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>assert-guard · Quality Gate Report</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F8F7F4;color:#2C2C2A;padding:2rem}
  .container{max-width:1000px;margin:0 auto}
  .topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid #E8E7E3}
  .brand{display:flex;align-items:center;gap:10px}
  .brand-icon{width:32px;height:32px;background:#EEEDFE;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px}
  .brand-name{font-size:16px;font-weight:600;color:#2C2C2A}
  .brand-ver{font-size:12px;color:#888780}
  .run-meta{font-size:12px;color:#888780;text-align:right;line-height:1.7}
  .gate-banner{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:8px;margin-bottom:1.5rem;background:${gateBg};border:1px solid ${gateColor}33}
  .gate-text{font-size:13px;font-weight:600;color:${gateColor}}
  .metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:1.5rem}
  .metric{background:#fff;border-radius:8px;padding:12px 14px;border:1px solid #E8E7E3}
  .metric-label{font-size:11px;color:#888780;margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em}
  .metric-val{font-size:24px;font-weight:600}
  .panel{background:#fff;border-radius:10px;border:1px solid #E8E7E3;padding:16px;margin-bottom:1.5rem;overflow-x:auto}
  .panel-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#888780;margin-bottom:14px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;padding:8px 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#888780;border-bottom:1px solid #E8E7E3}
  td{padding:10px 12px;border-bottom:1px solid #F1EFE8;vertical-align:top}
  tr:last-child td{border-bottom:none}
  .footer{font-size:11px;color:#888780;text-align:center;padding-top:1.5rem;border-top:1px solid #E8E7E3;margin-top:1.5rem}
  code{font-family:ui-monospace,monospace}
</style>
</head>
<body>
<div class="container">
  <div class="topbar">
    <div class="brand">
      <div class="brand-icon">▲</div>
      <div>
        <div class="brand-name">assert-guard</div>
        <div class="brand-ver">v1.0.0 · quality gate report</div>
      </div>
    </div>
    <div class="run-meta">
      Generated ${new Date().toLocaleString()}<br>
      ${result.files} files · ${result.rulesApplied} rules · ${result.durationMs}ms
    </div>
  </div>

  <div class="gate-banner">
    <span style="font-size:16px;color:${gateColor}">${gateIcon}</span>
    <span class="gate-text">${gateText}</span>
  </div>

  <div class="metrics">
    <div class="metric"><div class="metric-label">Files scanned</div><div class="metric-val">${result.files}</div></div>
    <div class="metric"><div class="metric-label">Rules applied</div><div class="metric-val" style="color:#185FA5">${result.rulesApplied}</div></div>
    <div class="metric"><div class="metric-label">Passed</div><div class="metric-val" style="color:#3B6D11">${result.passed}</div></div>
    <div class="metric"><div class="metric-label">Errors</div><div class="metric-val" style="color:#A32D2D">${result.errors}</div></div>
    <div class="metric"><div class="metric-label">Warnings</div><div class="metric-val" style="color:#854F0B">${result.warnings}</div></div>
  </div>

  ${result.violations.length > 0 ? `
  <div class="panel">
    <div class="panel-title">Violations (${result.violations.length})</div>
    <table>
      <thead><tr><th>Rule / File</th><th>Severity</th><th>Location</th><th>Issue</th><th>Fix hint</th></tr></thead>
      <tbody>${violationRows(result.violations)}</tbody>
    </table>
  </div>` : `
  <div class="panel" style="text-align:center;padding:2rem;color:#3B6D11">
    <div style="font-size:24px;margin-bottom:8px">✔</div>
    <div style="font-weight:600">No violations found</div>
    <div style="font-size:13px;color:#888780;margin-top:4px">All ${result.files} files passed all ${result.rulesApplied} rules</div>
  </div>`}

  <div class="footer">
    assert-guard · open source · 
    <code>npx assert-guard --dir ./tests --format html</code>
  </div>
</div>
</body>
</html>`;

  fs.writeFileSync(outPath, html, 'utf-8');
  return outPath;
}
