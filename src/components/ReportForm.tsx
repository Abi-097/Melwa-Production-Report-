import React, { useState, useMemo } from 'react';
import {
  BladeCode,
  BladeType,
  DamageColumnData,
  DelayRow,
  MachineLine,
  MasterDepartment,
  ProductionColumnData,
  ProductionReport,
  ProductType,
  SawCutterData,
  ShiftType,
  SignOffData,
} from '../types';
import {
  calculateMinutesBetween,
  calculateShiftDurationFromOperationalTime,
  formatDurationDisplay,
  formatTotalDowntime,
} from '../utils/timeCalculations';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Save,
  Download,
  AlertTriangle,
  ArrowLeft,
  Eye,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

interface ReportFormProps {
  initialReport?: ProductionReport | null;
  departments: MasterDepartment[];
  onSave: (report: ProductionReport) => Promise<void>;
  onCancel: () => void;
  onPreviewPdf: (report: ProductionReport) => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({
  initialReport,
  departments,
  onSave,
  onCancel,
  onPreviewPdf,
}) => {
  const { currentUser, canWrite } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState<string>(
    initialReport?.date || new Date().toISOString().split('T')[0]
  );
  const [productionLine, setProductionLine] = useState<MachineLine>(
    initialReport?.productionLine || 'T1'
  );
  const [operator, setOperator] = useState<string>(
    initialReport?.operator || (currentUser?.username ? `Operator (${currentUser.username})` : '')
  );
  const [operationalTime, setOperationalTime] = useState<string>(
    initialReport?.operationalTime || '08:00PM - 06:00AM'
  );
  const [size, setSize] = useState<string>(
    initialReport?.size || '2 inch and 3 x 1 1/2'
  );
  const [shift, setShift] = useState<ShiftType>(
    initialReport?.shift || 'Night'
  );
  const [avgMillSpeed, setAvgMillSpeed] = useState<string>(
    initialReport?.avgMillSpeed || '37.2 m/min'
  );
  const [shiftDuration, setShiftDuration] = useState<string>(
    initialReport?.shiftDuration || '10 Hours'
  );
  const [product, setProduct] = useState<ProductType>(
    initialReport?.product || 'Pipe'
  );

  // Table 1: Production Details
  const [productionColumns, setProductionColumns] = useState<ProductionColumnData[]>(
    initialReport?.productionColumns || [
      { sizeHeader: '2inch', thickness: '2MM', length: '5.8M', bundles: '12', bars: '444', looseBars: '15', coils: '09' },
      { sizeHeader: '3 x 1 1/2', thickness: '1.6MM', length: '5.5M', bundles: '68', bars: '2380', looseBars: 'N/A', coils: '14' },
    ]
  );

  // Table 2: Damage Details
  const [damageColumns, setDamageColumns] = useState<DamageColumnData[]>(
    initialReport?.damageColumns || [
      { weldedBars: '02', scrapBars: '02', printZnIssue: 'N/A', blackWhitePatch: 'N/A' },
      { weldedBars: '13', scrapBars: '22', printZnIssue: 'N/A', blackWhitePatch: 'N/A' },
    ]
  );

  // Table 3: Delays
  const [delays, setDelays] = useState<DelayRow[]>(
    initialReport?.delays || [
      {
        id: 'delay-1',
        fromTime: '08:00',
        toTime: '08:10',
        durationMinutes: 10,
        department: 'Production',
        explanation: 'Machine Starting',
      },
      {
        id: 'delay-2',
        fromTime: '10:00',
        toTime: '12:30',
        durationMinutes: 150,
        department: 'Roll Change / Tooling',
        explanation: 'Roll Change and alligement',
      },
      {
        id: 'delay-3',
        fromTime: '12:40',
        toTime: '12:50',
        durationMinutes: 10,
        department: 'Production',
        explanation: 'limit switch alarm',
      },
      {
        id: 'delay-4',
        fromTime: '05:50',
        toTime: '06:00',
        durationMinutes: 10,
        department: 'Production',
        explanation: 'Scarp Packing',
        remark: 'End of shift clearance',
      },
    ]
  );

  // Table 4: Saw Cutter Details & Remarks
  const [sawCutter, setSawCutter] = useState<SawCutterData>(
    initialReport?.sawCutter || {
      bladeType: 'TCT',
      bladeCode: 'PT5',
      serialNumber: 'SN-9942B',
      totalNoOfCuts: '1420',
      totalWeightMt: '42.8',
    }
  );
  const [remarks, setRemarks] = useState<string>(
    initialReport?.remarks || 'Roll change completed smoothly. Mill speed maintained above 37m/min throughout high-run period.'
  );

  // Footer: Sign Off
  const [signOff, setSignOff] = useState<SignOffData>(
    initialReport?.signOff || {
      preparedByName: 'Raguwaran',
      shiftInChargeOption: 'Raguwaran',
      issueNo: '01',
      reviewedBy: 'MD',
      checkedByName: 'S Mayuran',
      dateOfIssue: '2016-10-14',
      approvedBy: 'GM',
    }
  );

  // Automatic calculation of Total Downtime
  const totalDowntimeMinutes = useMemo(() => {
    return delays.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  }, [delays]);

  // Production line machine options
  const machineLines: MachineLine[] = ['T1', 'T2', 'T3', 'T4', 'T5', 'C1', 'C2', 'PURLIN'];
  const shiftOptions: ShiftType[] = ['Day', 'Night'];
  const productOptions: ProductType[] = ['Pipe', 'Bar'];
  const bladeTypeOptions: BladeType[] = ['HSS', 'TCT'];
  const bladeCodeOptions: BladeCode[] = ['PT4', 'PT5', 'PT6', 'PT7'];
  const shiftInChargeOptions = ['Raguwaran', 'Keshees Ram', 'Parasuram'];

  // Automatically calculate shift duration whenever operational time changes
  const handleOperationalTimeChange = (val: string) => {
    setOperationalTime(val);
    const autoDuration = calculateShiftDurationFromOperationalTime(val);
    if (autoDuration) {
      setShiftDuration(autoDuration);
    }
  };

  // Handle delay time change with auto-duration calculation
  const handleDelayTimeChange = (id: string, field: 'fromTime' | 'toTime', value: string) => {
    setDelays((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const newFrom = field === 'fromTime' ? value : row.fromTime;
        const newTo = field === 'toTime' ? value : row.toTime;
        const duration = calculateMinutesBetween(newFrom, newTo);
        return {
          ...row,
          [field]: value,
          durationMinutes: duration,
        };
      })
    );
  };

  // Handle delay department change & reset explanation to first valid or blank
  const handleDelayDeptChange = (id: string, deptName: string) => {
    const deptObj = departments.find((d) => d.name === deptName);
    const defaultExpl = deptObj && deptObj.explanations.length > 0 ? deptObj.explanations[0] : '';
    setDelays((prev) =>
      prev.map((row) => (row.id === id ? { ...row, department: deptName, explanation: defaultExpl } : row))
    );
  };

  const handleDelayExplChange = (id: string, explanation: string) => {
    setDelays((prev) =>
      prev.map((row) => (row.id === id ? { ...row, explanation } : row))
    );
  };

  const handleDelayRemarkChange = (id: string, remark: string) => {
    setDelays((prev) =>
      prev.map((row) => (row.id === id ? { ...row, remark } : row))
    );
  };

  const addDelayRow = () => {
    const defaultDept = departments[0]?.name || 'Production';
    const defaultExpl = departments[0]?.explanations[0] || '';
    const newRow: DelayRow = {
      id: `delay-${Date.now()}`,
      fromTime: '',
      toTime: '',
      durationMinutes: 0,
      department: defaultDept,
      explanation: defaultExpl,
      remark: '',
    };
    setDelays((prev) => [...prev, newRow]);
  };

  const removeDelayRow = (id: string) => {
    setDelays((prev) => prev.filter((r) => r.id !== id));
  };

  // Add / remove size column in Tables 1 & 2
  const addSizeColumn = () => {
    const colIndex = productionColumns.length + 1;
    setProductionColumns((prev) => [
      ...prev,
      {
        sizeHeader: `Size ${colIndex}`,
        thickness: '',
        length: '',
        bundles: '',
        bars: '',
        looseBars: '',
        coils: '',
      },
    ]);
    setDamageColumns((prev) => [
      ...prev,
      {
        weldedBars: '',
        scrapBars: '',
        printZnIssue: '',
        blackWhitePatch: '',
      },
    ]);
  };

  const removeSizeColumn = (index: number) => {
    if (productionColumns.length <= 1) return;
    setProductionColumns((prev) => prev.filter((_, idx) => idx !== index));
    setDamageColumns((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateProdCol = (index: number, field: keyof ProductionColumnData, value: string) => {
    setProductionColumns((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const updateDamageCol = (index: number, field: keyof DamageColumnData, value: string) => {
    setDamageColumns((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Construct current report object for preview or saving
  const buildCurrentReport = (): ProductionReport => {
    const reportNumber =
      initialReport?.reportNumber ||
      `R06-${date.replace(/-/g, '')}-${productionLine}`;

    return {
      id: initialReport?.id || `report-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reportNumber,
      date,
      productionLine,
      operator,
      operationalTime,
      size,
      shift,
      avgMillSpeed,
      shiftDuration,
      product,
      productionColumns,
      damageColumns,
      delays,
      totalDowntimeMinutes,
      sawCutter,
      remarks,
      signOff,
      submittedBy: initialReport?.submittedBy || currentUser?.username || 'ANONYMOUS',
      submittedAt: initialReport?.submittedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!canWrite) {
      setValidationError('You currently have Read-Only permissions. Contact SUPERUSER for Write access.');
      return;
    }

    if (!date) {
      setValidationError('Please select a production date.');
      return;
    }

    if (!operator.trim()) {
      setValidationError('Please specify the Operator name.');
      return;
    }

    try {
      setSubmitting(true);
      const report = buildCurrentReport();
      await onSave(report);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Error submitting report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-6">
      {/* Top Bar Navigation & Actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {initialReport ? 'Edit Production Report R06' : 'New Master Production Report R06'}
            </h2>
            <div className="text-[11px] text-slate-500 font-mono">
              Signed in as: <strong className="text-slate-800">{currentUser?.username}</strong> · Access:{' '}
              <span className={`font-semibold ${canWrite ? 'text-emerald-700' : 'text-amber-700'}`}>
                {canWrite ? 'Read & Write' : 'Read-Only'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPreviewPdf(buildCurrentReport())}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Paper Replica / PDF Preview</span>
          </button>

          {canWrite && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Submit Form</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Permission alert for Read-only users */}
      {!canWrite && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-center gap-2 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            <strong>Read-Only Mode:</strong> Your account ({currentUser?.username}) has read access only. You can view all report details, preview the exact paper replica, and download PDFs, but cannot submit modifications.
          </span>
        </div>
      )}

      {/* Success Notification */}
      {saveSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Production Report saved successfully to database!</span>
          </div>
          <button
            onClick={() => onPreviewPdf(buildCurrentReport())}
            className="font-bold underline hover:text-emerald-950 inline-flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Official PDF</span>
          </button>
        </div>
      )}

      {/* Validation Error Message */}
      {validationError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-lg flex items-center gap-2 text-xs text-rose-800">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* PHYSICAL FORM CONTAINER - REPLICA DESIGN */}
      <form onSubmit={handleSubmit} className="bg-white border-2 border-slate-800 rounded-xl shadow-md overflow-hidden p-4 sm:p-6 text-slate-900">
        {/* Form Document Header */}
        <div className="text-center pb-3 border-b-2 border-slate-800 mb-4">
          <h1 className="text-base sm:text-xl font-extrabold uppercase tracking-wide text-slate-900 flex items-center justify-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-700 no-print" />
            <span>Master Production Report R06</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">Industrial Quality & Operational Logsheet</p>
        </div>

        {/* METADATA GRID: DATE, MACHINE LINE, OPERATOR, SHIFT, SPEED, PRODUCT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pb-4 border-b-2 border-slate-800 text-xs">
          {/* Left Column (Line, Date, Operator, Operational Time, Size) */}
          <div className="md:col-span-7 space-y-3">
            {/* 1. Date (Calendar Picker) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <label className="w-32 font-bold text-slate-800 shrink-0 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Date:</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={!canWrite}
                required
                className="w-full sm:w-56 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* 2. Production Line with Automatic Underline */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <label className="w-32 font-bold text-slate-800 shrink-0">
                Production Line:
              </label>
              <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-1.5 rounded border border-slate-200">
                {machineLines.map((line, idx) => {
                  const isSelected = productionLine === line;
                  return (
                    <React.Fragment key={line}>
                      <button
                        type="button"
                        onClick={() => canWrite && setProductionLine(line)}
                        disabled={!canWrite}
                        className={`px-2 py-1 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-100 text-blue-900 underline decoration-slate-900 decoration-3 underline-offset-4 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {line}
                      </button>
                      {idx < machineLines.length - 1 && <span className="text-slate-300 select-none">/</span>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* 3. Operator (Text Field) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <label className="w-32 font-bold text-slate-800 shrink-0">
                Operator:
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                disabled={!canWrite}
                placeholder="e.g. Agilandaswaran / Aakash"
                required
                className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* 4. Operational Time (Text Field with auto Shift Duration calculation) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                <label className="w-32 font-bold text-slate-800 shrink-0 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Operational Time:</span>
                </label>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={operationalTime}
                    onChange={(e) => handleOperationalTimeChange(e.target.value)}
                    disabled={!canWrite}
                    placeholder="e.g. 8:00PM - 6:00AM or 8:00am - 6:00pm"
                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
              {/* Presets that auto-calculate shift duration */}
              <div className="sm:pl-32 flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-slate-400 mr-1">Presets:</span>
                {[
                  { label: '8:00PM - 6:00AM (10H Night)', val: '8:00PM - 6:00AM', s: 'Night' as ShiftType },
                  { label: '8:00AM - 6:00PM (10H Day)', val: '8:00AM - 6:00PM', s: 'Day' as ShiftType },
                  { label: '8:00AM - 8:00PM (12H Day)', val: '8:00AM - 8:00PM', s: 'Day' as ShiftType },
                  { label: '8:00PM - 8:00AM (12H Night)', val: '8:00PM - 8:00AM', s: 'Night' as ShiftType },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (canWrite) {
                        handleOperationalTimeChange(item.val);
                        setShift(item.s);
                      }
                    }}
                    disabled={!canWrite}
                    className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded border border-slate-200 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Size (Text Field) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <label className="w-32 font-bold text-slate-800 shrink-0">
                Size:
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                disabled={!canWrite}
                placeholder="e.g. 2 inch and 3 x 1 1/2"
                className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Right Column (Shift, Mill Speed, Shift Duration, Product) */}
          <div className="md:col-span-5 space-y-3 md:pl-4 md:border-l md:border-slate-300">
            {/* 6. Shift with Automatic Underline */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <label className="w-28 font-bold text-slate-800 shrink-0">
                Shift:
              </label>
              <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded border border-slate-200">
                {shiftOptions.map((s, idx) => {
                  const isSelected = shift === s;
                  return (
                    <React.Fragment key={s}>
                      <button
                        type="button"
                        onClick={() => canWrite && setShift(s)}
                        disabled={!canWrite}
                        className={`px-3 py-1 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-100 text-blue-900 underline decoration-slate-900 decoration-3 underline-offset-4 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {s}
                      </button>
                      {idx < shiftOptions.length - 1 && <span className="text-slate-300 select-none">/</span>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* 7. Avg Mill Speed (Text Field) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <label className="w-28 font-bold text-slate-800 shrink-0">
                Avg. Mill Speed:
              </label>
              <input
                type="text"
                value={avgMillSpeed}
                onChange={(e) => setAvgMillSpeed(e.target.value)}
                disabled={!canWrite}
                placeholder="e.g. 37.2 m/min"
                className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* 8. Shift Duration (Text Field) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <label className="w-28 font-bold text-slate-800 shrink-0">
                Shift Duration:
              </label>
              <input
                type="text"
                value={shiftDuration}
                onChange={(e) => setShiftDuration(e.target.value)}
                disabled={!canWrite}
                placeholder="e.g. 10 Hours"
                className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* 9. Product (Pipe / Bar) with Automatic Underline */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <label className="w-28 font-bold text-slate-800 shrink-0">
                Product:
              </label>
              <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded border border-slate-200">
                {productOptions.map((p, idx) => {
                  const isSelected = product === p;
                  return (
                    <React.Fragment key={p}>
                      <button
                        type="button"
                        onClick={() => canWrite && setProduct(p)}
                        disabled={!canWrite}
                        className={`px-3 py-1 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-100 text-blue-900 underline decoration-slate-900 decoration-3 underline-offset-4 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                      {idx < productOptions.length - 1 && <span className="text-slate-300 select-none">/</span>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TABLE 1: PRODUCTION DETAILS */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>1. Production Details</span>
            </h3>
            {canWrite && (
              <button
                type="button"
                onClick={addSizeColumn}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Size Column</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-800">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-800">
                  <th className="p-2 border-r border-slate-800 text-left w-52 font-bold">
                    Specification Item
                  </th>
                  {productionColumns.map((col, idx) => (
                    <th key={idx} colSpan={2} className="p-1 border-r border-slate-800 text-center bg-slate-50">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="text"
                          value={col.sizeHeader}
                          onChange={(e) => updateProdCol(idx, 'sizeHeader', e.target.value)}
                          disabled={!canWrite}
                          placeholder={`Size ${idx + 1}`}
                          className="w-28 text-center font-mono font-bold text-xs bg-white border border-slate-300 px-1 py-0.5 rounded"
                        />
                        {canWrite && productionColumns.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSizeColumn(idx)}
                            title="Remove this size column"
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Thickness & Length */}
                <tr className="border-b border-slate-800">
                  <td className="p-2 border-r border-slate-800 font-semibold bg-slate-50/50">
                    Thickness & Length
                  </td>
                  {productionColumns.map((col, idx) => (
                    <React.Fragment key={idx}>
                      <td className="p-1 border-r border-slate-800 text-center">
                        <input
                          type="text"
                          value={col.thickness}
                          onChange={(e) => updateProdCol(idx, 'thickness', e.target.value)}
                          disabled={!canWrite}
                          placeholder="e.g. 2MM"
                          className="w-full text-center font-mono text-xs px-1 py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-800 text-center">
                        <input
                          type="text"
                          value={col.length}
                          onChange={(e) => updateProdCol(idx, 'length', e.target.value)}
                          disabled={!canWrite}
                          placeholder="e.g. 5.8M"
                          className="w-full text-center font-mono text-xs px-1 py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white"
                        />
                      </td>
                    </React.Fragment>
                  ))}
                </tr>

                {/* No. of Bundles & Bars */}
                <tr className="border-b border-slate-800">
                  <td className="p-2 border-r border-slate-800 font-semibold bg-slate-50/50">
                    No. of Bundles & Bars
                  </td>
                  {productionColumns.map((col, idx) => (
                    <React.Fragment key={idx}>
                      <td className="p-1 border-r border-slate-800 text-center">
                        <input
                          type="text"
                          value={col.bundles}
                          onChange={(e) => updateProdCol(idx, 'bundles', e.target.value)}
                          disabled={!canWrite}
                          placeholder="Bundles (12)"
                          className="w-full text-center font-mono text-xs px-1 py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-800 text-center">
                        <input
                          type="text"
                          value={col.bars}
                          onChange={(e) => updateProdCol(idx, 'bars', e.target.value)}
                          disabled={!canWrite}
                          placeholder="Bars (444)"
                          className="w-full text-center font-mono text-xs px-1 py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white"
                        />
                      </td>
                    </React.Fragment>
                  ))}
                </tr>

                {/* Loose Bars */}
                <tr className="border-b border-slate-800">
                  <td className="p-2 border-r border-slate-800 font-semibold bg-slate-50/50">
                    Loose Bars
                  </td>
                  {productionColumns.map((col, idx) => (
                    <td key={idx} colSpan={2} className="p-1 border-r border-slate-800 text-center">
                      <input
                        type="text"
                        value={col.looseBars}
                        onChange={(e) => updateProdCol(idx, 'looseBars', e.target.value)}
                        disabled={!canWrite}
                        placeholder="e.g. 15 or N/A"
                        className="w-full text-center font-mono text-xs px-1 py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white"
                      />
                    </td>
                  ))}
                </tr>

                {/* RM Consumption (No. of Coils) */}
                <tr>
                  <td className="p-2 border-r border-slate-800 font-semibold bg-slate-50/50">
                    RM Consumption (No. of Coils)
                  </td>
                  {productionColumns.map((col, idx) => (
                    <td key={idx} colSpan={2} className="p-1 border-r border-slate-800 text-center">
                      <input
                        type="text"
                        value={col.coils}
                        onChange={(e) => updateProdCol(idx, 'coils', e.target.value)}
                        disabled={!canWrite}
                        placeholder="e.g. 09 or 14"
                        className="w-full text-center font-mono font-bold text-xs px-1 py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TABLE 2: DAMAGE DETAILS */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            <span>2. Damage Details</span>
          </h3>

          <div className="overflow-x-auto border border-slate-800">
            <table className="w-full border-collapse text-xs">
              <tbody>
                {/* Welded Bars */}
                <tr className="border-b border-slate-800">
                  <td className="p-2 border-r border-slate-800 font-semibold bg-slate-50/50 w-52">
                    Welded Bars
                  </td>
                  {damageColumns.map((dam, idx) => (
                    <td key={idx} colSpan={2} className="p-1 border-r border-slate-800 text-center">
                      <input
                        type="text"
                        value={dam.weldedBars}
                        onChange={(e) => updateDamageCol(idx, 'weldedBars', e.target.value)}
                        disabled={!canWrite}
                        placeholder="e.g. 02"
                        className="w-full text-center font-mono text-xs px-1 py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white"
                      />
                    </td>
                  ))}
                </tr>

                {/* Scrap Bars */}
                <tr className="border-b border-slate-800">
                  <td className="p-2 border-r border-slate-800 font-semibold bg-slate-50/50">
                    Scrap Bars
                  </td>
                  {damageColumns.map((dam, idx) => (
                    <td key={idx} colSpan={2} className="p-1 border-r border-slate-800 text-center">
                      <input
                        type="text"
                        value={dam.scrapBars}
                        onChange={(e) => updateDamageCol(idx, 'scrapBars', e.target.value)}
                        disabled={!canWrite}
                        placeholder="e.g. 02"
                        className="w-full text-center font-mono text-xs px-1 py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white"
                      />
                    </td>
                  ))}
                </tr>

                {/* Print Issue / Zn Issue */}
                <tr className="border-b border-slate-800">
                  <td className="p-2 border-r border-slate-800 font-semibold bg-slate-50/50">
                    Print Issue / Zn Issue
                  </td>
                  {damageColumns.map((dam, idx) => (
                    <td key={idx} colSpan={2} className="p-1 border-r border-slate-800 text-center">
                      <input
                        type="text"
                        value={dam.printZnIssue}
                        onChange={(e) => updateDamageCol(idx, 'printZnIssue', e.target.value)}
                        disabled={!canWrite}
                        placeholder="e.g. N/A"
                        className="w-full text-center font-mono text-xs px-1 py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white"
                      />
                    </td>
                  ))}
                </tr>

                {/* Black Patch / White Patch */}
                <tr>
                  <td className="p-2 border-r border-slate-800 font-semibold bg-slate-50/50">
                    Black Patch / White Patch
                  </td>
                  {damageColumns.map((dam, idx) => (
                    <td key={idx} colSpan={2} className="p-1 border-r border-slate-800 text-center">
                      <input
                        type="text"
                        value={dam.blackWhitePatch}
                        onChange={(e) => updateDamageCol(idx, 'blackWhitePatch', e.target.value)}
                        disabled={!canWrite}
                        placeholder="e.g. N/A"
                        className="w-full text-center font-mono text-xs px-1 py-1 bg-slate-50 border border-slate-200 rounded focus:bg-white"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TABLE 3: DELAYS (AUTO-CALCULATED DURATION & DOWNTIME) */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span>3. Delays & Downtime Tracking</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Enter From and To times — duration is calculated automatically. Choose department to see its relevant explanations.
              </p>
            </div>
            {canWrite && (
              <button
                type="button"
                onClick={addDelayRow}
                className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Delay Log</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-800">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-800">
                  <th colSpan={2} className="p-1.5 border-r border-slate-800 text-center font-bold w-44">
                    Time (From / To)
                  </th>
                  <th className="p-1.5 border-r border-slate-800 text-center font-bold w-24">
                    Duration (Min)
                  </th>
                  <th className="p-1.5 border-r border-slate-800 text-left font-bold w-40">
                    Department
                  </th>
                  <th className="p-1.5 border-r border-slate-800 text-left font-bold w-48">
                    Explanation
                  </th>
                  <th className="p-1.5 border-r border-slate-800 text-left font-bold">
                    Remark
                  </th>
                  {canWrite && <th className="p-1.5 text-center w-10"></th>}
                </tr>
              </thead>
              <tbody>
                {delays.map((row, idx) => {
                  const currentDept = departments.find((d) => d.name === row.department) || departments[0];
                  const explanationOptions = currentDept ? currentDept.explanations : [];

                  return (
                    <tr key={row.id} className="border-b border-slate-800 hover:bg-slate-50/60">
                      {/* From Time */}
                      <td className="p-1 border-r border-slate-300 w-22">
                        <input
                          type="time"
                          value={row.fromTime}
                          onChange={(e) => handleDelayTimeChange(row.id, 'fromTime', e.target.value)}
                          disabled={!canWrite}
                          className="w-full px-1.5 py-1 text-xs font-mono bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                        />
                      </td>

                      {/* To Time */}
                      <td className="p-1 border-r border-slate-800 w-22">
                        <input
                          type="time"
                          value={row.toTime}
                          onChange={(e) => handleDelayTimeChange(row.id, 'toTime', e.target.value)}
                          disabled={!canWrite}
                          className="w-full px-1.5 py-1 text-xs font-mono bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                        />
                      </td>

                      {/* Auto Calculated Duration */}
                      <td className="p-1 border-r border-slate-800 text-center font-mono font-bold text-xs bg-slate-50 text-blue-900 w-24">
                        {formatDurationDisplay(row.durationMinutes)}
                      </td>

                      {/* Department Dropdown */}
                      <td className="p-1 border-r border-slate-800 w-40">
                        <select
                          value={row.department}
                          onChange={(e) => handleDelayDeptChange(row.id, e.target.value)}
                          disabled={!canWrite}
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                        >
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.name}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Filtered Explanation Dropdown */}
                      <td className="p-1 border-r border-slate-800 w-48">
                        <select
                          value={row.explanation}
                          onChange={(e) => handleDelayExplChange(row.id, e.target.value)}
                          disabled={!canWrite}
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                        >
                          {explanationOptions.map((exp, eIdx) => (
                            <option key={eIdx} value={exp}>
                              {exp}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Remark Column */}
                      <td className="p-1 border-r border-slate-800">
                        <input
                          type="text"
                          value={row.remark || ''}
                          onChange={(e) => handleDelayRemarkChange(row.id, e.target.value)}
                          disabled={!canWrite}
                          placeholder="e.g. Line inspection..."
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                        />
                      </td>

                      {/* Delete Row */}
                      {canWrite && (
                        <td className="p-1 text-center w-10">
                          <button
                            type="button"
                            onClick={() => removeDelayRow(row.id)}
                            title="Remove row"
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}

                {delays.length === 0 && (
                  <tr>
                    <td colSpan={canWrite ? 7 : 6} className="p-4 text-center text-slate-400 text-xs italic">
                      No delay incidents logged for this shift. Click "Add Delay Log" to record machine stoppages.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-800">
                  <td colSpan={2} className="p-2 font-bold text-right uppercase text-xs">
                    Total Downtime:
                  </td>
                  <td colSpan={canWrite ? 5 : 4} className="p-2 font-mono font-bold text-sm text-blue-900">
                    <span className="text-base">{formatTotalDowntime(totalDowntimeMinutes)}</span>
                    <span className="text-xs text-slate-600 font-sans font-normal ml-3">
                      ({totalDowntimeMinutes} total downtime minutes)
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TABLE 4: SAW CUTTER DETAILS & REMARKS / SUGGESTIONS */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 border-2 border-slate-800 text-xs">
          {/* Left: Saw Cutter Details */}
          <div className="md:col-span-6 border-b md:border-b-0 md:border-r border-slate-800 p-3 space-y-2.5 bg-white">
            <div className="font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-200">
              4. Saw Cutter Details
            </div>

            {/* Blade Type (HSS / TCT) with Underline */}
            <div className="flex items-center gap-3">
              <span className="w-32 font-bold text-slate-700">Blade Type:</span>
              <div className="flex items-center gap-2">
                {bladeTypeOptions.map((bt, idx) => {
                  const isSelected = sawCutter.bladeType === bt;
                  return (
                    <React.Fragment key={bt}>
                      <button
                        type="button"
                        onClick={() => canWrite && setSawCutter((prev) => ({ ...prev, bladeType: bt }))}
                        disabled={!canWrite}
                        className={`px-2 py-0.5 font-mono font-bold text-xs rounded transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-100 text-blue-900 underline decoration-slate-900 decoration-3 underline-offset-4'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {bt}
                      </button>
                      {idx < bladeTypeOptions.length - 1 && <span className="text-slate-300">/</span>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Blade Model (PT4 / PT5 / PT6 / PT7) with Underline */}
            <div className="flex items-center gap-3">
              <span className="w-32 font-bold text-slate-700">Blade Model:</span>
              <div className="flex items-center gap-1">
                {bladeCodeOptions.map((bc, idx) => {
                  const isSelected = sawCutter.bladeCode === bc;
                  return (
                    <React.Fragment key={bc}>
                      <button
                        type="button"
                        onClick={() => canWrite && setSawCutter((prev) => ({ ...prev, bladeCode: bc }))}
                        disabled={!canWrite}
                        className={`px-1.5 py-0.5 font-mono font-bold text-xs rounded transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-100 text-blue-900 underline decoration-slate-900 decoration-3 underline-offset-4'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {bc}
                      </button>
                      {idx < bladeCodeOptions.length - 1 && <span className="text-slate-300">/</span>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Serial Number */}
            <div className="flex items-center gap-3">
              <span className="w-32 font-bold text-slate-700">Serial Number:</span>
              <input
                type="text"
                value={sawCutter.serialNumber}
                onChange={(e) => setSawCutter((prev) => ({ ...prev, serialNumber: e.target.value }))}
                disabled={!canWrite}
                placeholder="e.g. SN-9942B"
                className="flex-1 px-2 py-1 text-xs font-mono bg-slate-50 border border-slate-300 rounded"
              />
            </div>

            {/* Total No of Cuts */}
            <div className="flex items-center gap-3">
              <span className="w-32 font-bold text-slate-700">Total No of Cuts:</span>
              <input
                type="text"
                value={sawCutter.totalNoOfCuts}
                onChange={(e) => setSawCutter((prev) => ({ ...prev, totalNoOfCuts: e.target.value }))}
                disabled={!canWrite}
                placeholder="e.g. 1420"
                className="flex-1 px-2 py-1 text-xs font-mono bg-slate-50 border border-slate-300 rounded"
              />
            </div>

            {/* Total Weight (MT) */}
            <div className="flex items-center gap-3">
              <span className="w-32 font-bold text-slate-700">Total Weight (MT):</span>
              <input
                type="text"
                value={sawCutter.totalWeightMt}
                onChange={(e) => setSawCutter((prev) => ({ ...prev, totalWeightMt: e.target.value }))}
                disabled={!canWrite}
                placeholder="e.g. 42.8"
                className="flex-1 px-2 py-1 text-xs font-mono bg-slate-50 border border-slate-300 rounded"
              />
            </div>
          </div>

          {/* Right: Remarks / Suggestions */}
          <div className="md:col-span-6 p-3 flex flex-col bg-white">
            <div className="font-bold uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-200 mb-2">
              Remarks / Suggestions
            </div>
            <textarea
              rows={6}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={!canWrite}
              placeholder="Record any special machine observations, metal grade shifts, or maintenance recommendations..."
              className="w-full flex-1 p-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none font-sans"
            ></textarea>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* FOOTER SIGN-OFF BLOCKS */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-5 pt-3 border-t-2 border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Prepared By */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>Prepared By: Shift In Charge</span>
              <span className="text-[11px] font-mono text-slate-500">Stamp / Sign</span>
            </div>

            {/* 3 options for Shift In Charge with automatic underline */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Shift In Charge (Choose one to underline):
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-slate-300 rounded-lg">
                {shiftInChargeOptions.map((opt, idx) => {
                  const isSelected = (signOff.shiftInChargeOption || 'Raguwaran') === opt;
                  return (
                    <React.Fragment key={opt}>
                      <button
                        type="button"
                        onClick={() => {
                          if (canWrite) {
                            setSignOff((prev) => ({
                              ...prev,
                              shiftInChargeOption: opt,
                              preparedByName: opt,
                            }));
                          }
                        }}
                        disabled={!canWrite}
                        className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-100 text-blue-900 font-bold underline decoration-slate-900 decoration-3 underline-offset-4 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                      {idx < shiftInChargeOptions.length - 1 && <span className="text-slate-300 select-none">/</span>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-16 font-semibold text-slate-600 text-xs">Name:</label>
              <input
                type="text"
                value={signOff.preparedByName}
                onChange={(e) => setSignOff((prev) => ({ ...prev, preparedByName: e.target.value }))}
                disabled={!canWrite}
                placeholder="e.g. Raguwaran"
                className="flex-1 px-2.5 py-1 text-xs font-medium bg-white border border-slate-300 rounded font-mono text-slate-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Issue No:</span>
                <input
                  type="text"
                  value={signOff.issueNo}
                  onChange={(e) => setSignOff((prev) => ({ ...prev, issueNo: e.target.value }))}
                  disabled={!canWrite}
                  className="w-16 px-1.5 py-0.5 font-mono text-xs bg-white border border-slate-300 rounded"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Reviewed by:</span>
                <input
                  type="text"
                  value={signOff.reviewedBy}
                  onChange={(e) => setSignOff((prev) => ({ ...prev, reviewedBy: e.target.value }))}
                  disabled={!canWrite}
                  className="w-20 px-1.5 py-0.5 font-mono text-xs bg-white border border-slate-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* Checked By */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>Checked By: Production Engineer</span>
              <span className="text-[11px] font-mono text-slate-500">Approval Stamp</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-16 font-semibold text-slate-600">Name:</label>
              <input
                type="text"
                value={signOff.checkedByName}
                onChange={(e) => setSignOff((prev) => ({ ...prev, checkedByName: e.target.value }))}
                disabled={!canWrite}
                placeholder="e.g. S Mayuran"
                className="flex-1 px-2 py-1 text-xs bg-white border border-slate-300 rounded"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Date of Issue:</span>
                <input
                  type="date"
                  value={signOff.dateOfIssue}
                  onChange={(e) => setSignOff((prev) => ({ ...prev, dateOfIssue: e.target.value }))}
                  disabled={!canWrite}
                  className="w-32 px-1.5 py-0.5 font-mono text-xs bg-white border border-slate-300 rounded"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Approved by:</span>
                <input
                  type="text"
                  value={signOff.approvedBy}
                  onChange={(e) => setSignOff((prev) => ({ ...prev, approvedBy: e.target.value }))}
                  disabled={!canWrite}
                  className="w-20 px-1.5 py-0.5 font-mono text-xs bg-white border border-slate-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel / Return to Table
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPreviewPdf(buildCurrentReport())}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Preview & Download PDF</span>
            </button>

            {canWrite ? (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : 'Submit Report'}</span>
              </button>
            ) : (
              <span className="text-xs font-semibold text-amber-700 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                Read-Only Access
              </span>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
