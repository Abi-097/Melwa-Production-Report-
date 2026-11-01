import React, { useRef, useState } from 'react';
import { ProductionReport } from '../types';
import { formatTotalDowntime } from '../utils/timeCalculations';
import { Download, Printer, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportPdfViewProps {
  report: ProductionReport;
  onBack: () => void;
}

export const ReportPdfView: React.FC<ReportPdfViewProps> = ({ report, onBack }) => {
  const paperRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadPdf = async () => {
    if (!paperRef.current) return;
    try {
      setDownloading(true);
      const element = paperRef.current;

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Master_Production_Report_${report.reportNumber || report.date}.pdf`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      // Fallback to print
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper for selectable/underlined machine lines
  const machineLines = ['T1', 'T2', 'T3', 'T4', 'T5', 'C1', 'C2', 'PURLIN'];
  const shifts = ['Day', 'Night'];
  const products = ['Pipe', 'Bar'];
  const bladeTypes = ['HSS', 'TCT'];
  const bladeCodes = ['PT4', 'PT5', 'PT6', 'PT7'];

  // Pad delay rows to maintain exact sheet height (minimum 7 rows)
  const delayRows = [...report.delays];
  while (delayRows.length < 6) {
    delayRows.push({
      id: `empty-${delayRows.length}`,
      fromTime: '',
      toTime: '',
      durationMinutes: 0,
      department: '',
      explanation: '',
    });
  }

  // Ensure at least 2 production/damage columns
  const prodCols = report.productionColumns && report.productionColumns.length > 0
    ? report.productionColumns
    : [
        { sizeHeader: '2inch', thickness: '', length: '', bundles: '', bars: '', looseBars: '', coils: '' },
        { sizeHeader: '3 x 1 1/2', thickness: '', length: '', bundles: '', bars: '', looseBars: '', coils: '' },
      ];

  const damageCols = report.damageColumns && report.damageColumns.length > 0
    ? report.damageColumns
    : [
        { weldedBars: '', scrapBars: '', printZnIssue: '', blackWhitePatch: '' },
        { weldedBars: '', scrapBars: '', printZnIssue: '', blackWhitePatch: '' },
      ];

  return (
    <div className="min-h-screen bg-slate-200 py-6 px-2 sm:px-6">
      {/* Action Navigation Bar */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between no-print bg-white p-3 rounded-lg shadow-sm border border-slate-300">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {downloadSuccess && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>PDF Downloaded!</span>
            </span>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Sheet</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-md transition-colors shadow-xs"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Physical Paper Sheet Replica (Master Production Report R06) */}
      <div className="flex justify-center">
        <div
          ref={paperRef}
          className="print-page w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-6 sm:p-8 shadow-xl border border-slate-400 font-sans text-xs relative select-none"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Outer Border Box matching the PDF document */}
          <div className="border-[2px] border-slate-800 p-3 flex flex-col justify-between h-full min-h-[275mm]">
            <div>
              {/* Report Header Title */}
              <div className="text-center pb-2 border-b-[2px] border-slate-800 mb-3">
                <h1 className="text-base sm:text-lg font-bold tracking-wide uppercase text-slate-900">
                  Master Production Report R06
                </h1>
              </div>

              {/* Top Meta Grid - Exact match with CamScanner PDF */}
              <div className="grid grid-cols-12 gap-x-3 gap-y-2 text-[11px] pb-3 border-b border-slate-800">
                {/* Left Column (Cols 1-7) */}
                <div className="col-span-7 space-y-1.5">
                  {/* Date */}
                  <div className="flex items-baseline">
                    <span className="font-semibold w-28 shrink-0">Date:</span>
                    <span className="font-mono text-xs font-medium border-b border-dotted border-slate-700 flex-1 px-1">
                      {report.date || '—'}
                    </span>
                  </div>

                  {/* Production Line */}
                  <div className="flex items-baseline">
                    <span className="font-semibold w-28 shrink-0">Production Line:</span>
                    <div className="flex flex-wrap items-center gap-1 font-mono text-[11px]">
                      {machineLines.map((line, idx) => {
                        const isSelected = report.productionLine === line;
                        return (
                          <React.Fragment key={line}>
                            <span
                              className={`px-1 ${
                                isSelected
                                  ? 'font-bold underline decoration-slate-900 decoration-2 underline-offset-3 text-blue-900'
                                  : 'text-slate-700'
                              }`}
                            >
                              {line}
                            </span>
                            {idx < machineLines.length - 1 && <span className="text-slate-400">/</span>}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Operator */}
                  <div className="flex items-baseline">
                    <span className="font-semibold w-28 shrink-0">Operator:</span>
                    <span className="font-medium border-b border-dotted border-slate-700 flex-1 px-1">
                      {report.operator || '—'}
                    </span>
                  </div>

                  {/* Operational Time */}
                  <div className="flex items-baseline">
                    <span className="font-semibold w-28 shrink-0">Operational Time:</span>
                    <span className="font-mono border-b border-dotted border-slate-700 flex-1 px-1">
                      {report.operationalTime || '—'}
                    </span>
                  </div>

                  {/* Size */}
                  <div className="flex items-baseline">
                    <span className="font-semibold w-28 shrink-0">Size:</span>
                    <span className="font-medium border-b border-dotted border-slate-700 flex-1 px-1">
                      {report.size || '—'}
                    </span>
                  </div>
                </div>

                {/* Right Column (Cols 8-12) */}
                <div className="col-span-5 space-y-1.5 pl-2 border-l border-slate-300">
                  {/* Shift */}
                  <div className="flex items-baseline">
                    <span className="font-semibold w-24 shrink-0">Shift:</span>
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      {shifts.map((s, idx) => {
                        const isSelected = report.shift === s;
                        return (
                          <React.Fragment key={s}>
                            <span
                              className={`px-1 ${
                                isSelected
                                  ? 'font-bold underline decoration-slate-900 decoration-2 underline-offset-3 text-blue-900'
                                  : 'text-slate-700'
                              }`}
                            >
                              {s}
                            </span>
                            {idx < shifts.length - 1 && <span className="text-slate-400">/</span>}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Avg Mill Speed */}
                  <div className="flex items-baseline">
                    <span className="font-semibold w-24 shrink-0">Avg. Mill Speed:</span>
                    <span className="font-mono border-b border-dotted border-slate-700 flex-1 px-1">
                      {report.avgMillSpeed || '—'}
                    </span>
                  </div>

                  {/* Shift Duration */}
                  <div className="flex items-baseline">
                    <span className="font-semibold w-24 shrink-0">Shift Duration:</span>
                    <span className="font-mono border-b border-dotted border-slate-700 flex-1 px-1">
                      {report.shiftDuration || '—'}
                    </span>
                  </div>

                  {/* Product */}
                  <div className="flex items-baseline">
                    <span className="font-semibold w-24 shrink-0">Product:</span>
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      {products.map((p, idx) => {
                        const isSelected = report.product === p;
                        return (
                          <React.Fragment key={p}>
                            <span
                              className={`px-1 ${
                                isSelected
                                  ? 'font-bold underline decoration-slate-900 decoration-2 underline-offset-3 text-blue-900'
                                  : 'text-slate-700'
                              }`}
                            >
                              {p}
                            </span>
                            {idx < products.length - 1 && <span className="text-slate-400">/</span>}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* TABLE 1: PRODUCTION DETAILS */}
              <div className="mt-3">
                <table className="w-full border-collapse border border-slate-800 text-[11px]">
                  <thead>
                    <tr>
                      <th
                        colSpan={1 + prodCols.length * 2}
                        className="border border-slate-800 bg-slate-100 py-1 font-bold text-center uppercase tracking-wider"
                      >
                        Production Details
                      </th>
                    </tr>
                    <tr className="bg-slate-50">
                      <th className="border border-slate-800 p-1 w-44 text-left font-semibold">Specification</th>
                      {prodCols.map((c, i) => (
                        <th
                          key={i}
                          colSpan={2}
                          className="border border-slate-800 p-1 font-bold text-center font-mono"
                        >
                          {c.sizeHeader || `Size ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-800 p-1 font-medium">Thickness & Length</td>
                      {prodCols.map((c, i) => (
                        <React.Fragment key={i}>
                          <td className="border border-slate-800 p-1 text-center font-mono w-20">
                            {c.thickness || '—'}
                          </td>
                          <td className="border border-slate-800 p-1 text-center font-mono w-20">
                            {c.length || '—'}
                          </td>
                        </React.Fragment>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1 font-medium">No. of Bundles & Bars</td>
                      {prodCols.map((c, i) => (
                        <React.Fragment key={i}>
                          <td className="border border-slate-800 p-1 text-center font-mono">
                            {c.bundles || '—'}
                          </td>
                          <td className="border border-slate-800 p-1 text-center font-mono">
                            {c.bars || '—'}
                          </td>
                        </React.Fragment>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1 font-medium">Loose Bars</td>
                      {prodCols.map((c, i) => (
                        <td
                          key={i}
                          colSpan={2}
                          className="border border-slate-800 p-1 text-center font-mono"
                        >
                          {c.looseBars || '—'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1 font-medium">RM Consumption (No. of Coils)</td>
                      {prodCols.map((c, i) => (
                        <td
                          key={i}
                          colSpan={2}
                          className="border border-slate-800 p-1 text-center font-mono"
                        >
                          {c.coils || '—'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* TABLE 2: DAMAGE DETAILS */}
              <div className="mt-2.5">
                <table className="w-full border-collapse border border-slate-800 text-[11px]">
                  <thead>
                    <tr>
                      <th
                        colSpan={1 + prodCols.length * 2}
                        className="border border-slate-800 bg-slate-100 py-1 font-bold text-center uppercase tracking-wider"
                      >
                        Damage Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-800 p-1 w-44 font-medium">Welded Bars</td>
                      {damageCols.map((d, i) => (
                        <td key={i} colSpan={2} className="border border-slate-800 p-1 text-center font-mono">
                          {d.weldedBars || '—'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1 font-medium">Scrap Bars</td>
                      {damageCols.map((d, i) => (
                        <td key={i} colSpan={2} className="border border-slate-800 p-1 text-center font-mono">
                          {d.scrapBars || '—'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1 font-medium">Print Issue / Zn Issue</td>
                      {damageCols.map((d, i) => (
                        <td key={i} colSpan={2} className="border border-slate-800 p-1 text-center font-mono">
                          {d.printZnIssue || '—'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1 font-medium">Black Patch / White Patch</td>
                      {damageCols.map((d, i) => (
                        <td key={i} colSpan={2} className="border border-slate-800 p-1 text-center font-mono">
                          {d.blackWhitePatch || '—'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* TABLE 3: DELAYS */}
              <div className="mt-2.5">
                <table className="w-full border-collapse border border-slate-800 text-[11px]">
                  <thead>
                    <tr>
                      <th
                        colSpan={6}
                        className="border border-slate-800 bg-slate-100 py-1 font-bold text-center uppercase tracking-wider"
                      >
                        Delays
                      </th>
                    </tr>
                    <tr className="bg-slate-50">
                      <th colSpan={2} className="border border-slate-800 p-1 text-center font-semibold w-24">
                        Time
                      </th>
                      <th rowSpan={2} className="border border-slate-800 p-1 text-center font-semibold w-20">
                        Duration (Min)
                      </th>
                      <th rowSpan={2} className="border border-slate-800 p-1 text-left font-semibold w-32">
                        Department
                      </th>
                      <th rowSpan={2} className="border border-slate-800 p-1 text-left font-semibold w-40">
                        Explanation
                      </th>
                      <th rowSpan={2} className="border border-slate-800 p-1 text-left font-semibold">
                        Remark
                      </th>
                    </tr>
                    <tr className="bg-slate-50">
                      <th className="border border-slate-800 p-1 text-center font-mono w-12">From</th>
                      <th className="border border-slate-800 p-1 text-center font-mono w-12">To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delayRows.map((d, idx) => {
                      const displayDuration = d.durationMinutes > 0
                        ? d.durationMinutes >= 60
                          ? `${Math.floor(d.durationMinutes / 60).toString().padStart(2, '0')}H ${d.durationMinutes % 60 ? (d.durationMinutes % 60) + 'M' : '00M'}`
                          : `${d.durationMinutes}MIN`
                        : '';
                      return (
                        <tr key={idx} className="h-6">
                          <td className="border border-slate-800 px-1 py-0.5 text-center font-mono text-[11px]">
                            {d.fromTime || ''}
                          </td>
                          <td className="border border-slate-800 px-1 py-0.5 text-center font-mono text-[11px]">
                            {d.toTime || ''}
                          </td>
                          <td className="border border-slate-800 px-1 py-0.5 text-center font-mono text-[11px] font-semibold">
                            {displayDuration}
                          </td>
                          <td className="border border-slate-800 px-1 py-0.5 text-[11px]">
                            {d.department || ''}
                          </td>
                          <td className="border border-slate-800 px-1 py-0.5 text-[11px]">
                            {d.explanation || ''}
                          </td>
                          <td className="border border-slate-800 px-1 py-0.5 text-[11px]">
                            {d.remark || ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td
                        colSpan={2}
                        className="border border-slate-800 p-1.5 font-bold text-right bg-slate-50 uppercase text-[11px]"
                      >
                        Total Downtime:
                      </td>
                      <td
                        colSpan={4}
                        className="border border-slate-800 p-1.5 font-bold font-mono text-sm text-blue-900 bg-slate-50"
                      >
                        {formatTotalDowntime(report.totalDowntimeMinutes)}
                        {report.totalDowntimeMinutes > 0 && (
                          <span className="text-xs text-slate-500 font-sans font-normal ml-2">
                            ({report.totalDowntimeMinutes} minutes total)
                          </span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* TABLE 4: SAW CUTTER DETAILS & REMARKS / SUGGESTIONS */}
              <div className="mt-2.5 grid grid-cols-12 border border-slate-800 text-[11px]">
                {/* Left: Saw Cutter Details */}
                <div className="col-span-6 border-r border-slate-800">
                  <div className="bg-slate-100 py-1 font-bold text-center border-b border-slate-800 uppercase tracking-wider">
                    Saw Cutter Details
                  </div>
                  <div className="p-2 space-y-1.5">
                    {/* Blade Type */}
                    <div className="flex items-baseline">
                      <span className="w-28 font-semibold">Blade Type:</span>
                      <div className="flex items-center gap-1 font-mono">
                        {bladeTypes.map((bt, idx) => {
                          const isSelected = report.sawCutter?.bladeType === bt;
                          return (
                            <React.Fragment key={bt}>
                              <span
                                className={`px-1 ${
                                  isSelected
                                    ? 'font-bold underline decoration-slate-900 decoration-2 underline-offset-3 text-blue-900'
                                    : 'text-slate-700'
                                }`}
                              >
                                {bt}
                              </span>
                              {idx < bladeTypes.length - 1 && <span className="text-slate-400">/</span>}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>

                    {/* Blade Model / PT codes */}
                    <div className="flex items-baseline">
                      <span className="w-28 font-semibold">Blade Model:</span>
                      <div className="flex items-center gap-1 font-mono text-[10.5px]">
                        {bladeCodes.map((bc, idx) => {
                          const isSelected = report.sawCutter?.bladeCode === bc;
                          return (
                            <React.Fragment key={bc}>
                              <span
                                className={`px-1 ${
                                  isSelected
                                    ? 'font-bold underline decoration-slate-900 decoration-2 underline-offset-3 text-blue-900'
                                    : 'text-slate-700'
                                }`}
                              >
                                {bc}
                              </span>
                              {idx < bladeCodes.length - 1 && <span className="text-slate-400">/</span>}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>

                    {/* Serial Number */}
                    <div className="flex items-baseline">
                      <span className="w-28 font-semibold">Serial Number:</span>
                      <span className="font-mono flex-1 border-b border-dotted border-slate-700 px-1">
                        {report.sawCutter?.serialNumber || '—'}
                      </span>
                    </div>

                    {/* Total No of Cuts */}
                    <div className="flex items-baseline">
                      <span className="w-28 font-semibold">Total No of Cuts:</span>
                      <span className="font-mono flex-1 border-b border-dotted border-slate-700 px-1">
                        {report.sawCutter?.totalNoOfCuts || '—'}
                      </span>
                    </div>

                    {/* Total Weight */}
                    <div className="flex items-baseline">
                      <span className="w-28 font-semibold">Total Weight (MT):</span>
                      <span className="font-mono flex-1 border-b border-dotted border-slate-700 px-1">
                        {report.sawCutter?.totalWeightMt || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Remarks / Suggestions */}
                <div className="col-span-6 flex flex-col">
                  <div className="bg-slate-100 py-1 font-bold text-center border-b border-slate-800 uppercase tracking-wider">
                    Remarks / Suggestions
                  </div>
                  <div className="p-2 flex-1 text-slate-800 text-[11px] leading-relaxed whitespace-pre-wrap font-sans">
                    {report.remarks || 'No remarks provided.'}
                  </div>
                </div>
              </div>
            </div>

            {/* SIGN-OFF FOOTER BLOCK - Matching the bottom of the PDF */}
            <div className="mt-4 pt-2 border-t-[1.5px] border-slate-800 grid grid-cols-2 gap-6 text-[10.5px]">
              {/* Left Signoff: Prepared By */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Prepared By: Shift In Charge</span>
                  <span className="italic font-serif text-blue-900 text-xs px-2">
                    {report.signOff?.shiftInChargeOption?.substring(0, 4) || 'Ragu'}
                  </span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-14 font-semibold text-slate-600">Name:</span>
                  <div className="flex flex-wrap items-center gap-1 font-mono text-[10.5px]">
                    {['Raguwaran', 'Keshees Ram', 'Parasuram'].map((name, idx) => {
                      const isSelected = (
                        report.signOff?.shiftInChargeOption ||
                        report.signOff?.preparedByName ||
                        ''
                      ).toLowerCase().includes(name.toLowerCase());
                      return (
                        <React.Fragment key={name}>
                          <span
                            className={`px-0.5 ${
                              isSelected
                                ? 'font-bold underline decoration-slate-900 decoration-2 underline-offset-3 text-blue-900'
                                : 'text-slate-700'
                            }`}
                          >
                            {name}
                          </span>
                          {idx < 2 && <span className="text-slate-400">/</span>}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between text-slate-600 text-[10px]">
                  <span>Issue No: {report.signOff?.issueNo || '01'}</span>
                  <span>Reviewed by: {report.signOff?.reviewedBy || 'MD'}</span>
                </div>
              </div>

              {/* Right Signoff: Checked By */}
              <div className="space-y-1 pl-4 border-l border-slate-300">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Checked By: Production Engineer</span>
                  <span className="italic font-serif text-blue-900 text-xs px-2">Mayuran</span>
                </div>
                <div className="flex items-baseline">
                  <span className="w-14 font-semibold text-slate-600">Name:</span>
                  <span className="font-medium border-b border-dotted border-slate-700 flex-1 px-1">
                    {report.signOff?.checkedByName || 'S Mayuran'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 text-[10px]">
                  <span>Date of Issue: {report.signOff?.dateOfIssue || report.date || '2016-10-14'}</span>
                  <span>Approved by: {report.signOff?.approvedBy || 'GM'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
