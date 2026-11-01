import React, { useState, useMemo } from 'react';
import { ProductionReport } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatTotalDowntime } from '../utils/timeCalculations';
import {
  Search,
  Plus,
  FileText,
  Download,
  Calendar,
  Clock,
  Filter,
  Eye,
  Edit3,
  Trash2,
  Settings,
  Users,
  LogOut,
  ChevronRight,
  TrendingDown,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ReportTableProps {
  reports: ProductionReport[];
  onOpenNewForm: () => void;
  onEditReport: (report: ProductionReport) => void;
  onViewPdf: (report: ProductionReport) => void;
  onDeleteReport: (reportId: string) => void;
  onOpenMasterFile: () => void;
  onOpenUserManagement: () => void;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  reports,
  onOpenNewForm,
  onEditReport,
  onViewPdf,
  onDeleteReport,
  onOpenMasterFile,
  onOpenUserManagement,
}) => {
  const { currentUser, logout, isSuperUser, canWrite } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [lineFilter, setLineFilter] = useState<string>('ALL');
  const [shiftFilter, setShiftFilter] = useState<string>('ALL');

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      // Line filter
      if (lineFilter !== 'ALL' && rep.productionLine !== lineFilter) return false;
      // Shift filter
      if (shiftFilter !== 'ALL' && rep.shift !== shiftFilter) return false;

      // Text search
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      return (
        rep.reportNumber.toLowerCase().includes(term) ||
        rep.date.toLowerCase().includes(term) ||
        rep.operator.toLowerCase().includes(term) ||
        rep.productionLine.toLowerCase().includes(term) ||
        rep.shift.toLowerCase().includes(term) ||
        rep.product.toLowerCase().includes(term) ||
        (rep.size && rep.size.toLowerCase().includes(term)) ||
        (rep.submittedBy && rep.submittedBy.toLowerCase().includes(term)) ||
        (rep.signOff?.preparedByName && rep.signOff.preparedByName.toLowerCase().includes(term)) ||
        rep.delays.some(
          (d) =>
            d.department.toLowerCase().includes(term) ||
            d.explanation.toLowerCase().includes(term) ||
            (d.remark && d.remark.toLowerCase().includes(term))
        )
      );
    });
  }, [reports, searchTerm, lineFilter, shiftFilter]);

  // Aggregate Key Metrics
  const metrics = useMemo(() => {
    const totalReports = reports.length;
    const totalDowntimeMinutes = reports.reduce((acc, r) => acc + (r.totalDowntimeMinutes || 0), 0);
    const totalCoils = reports.reduce((acc, r) => {
      const coilsFromCols = r.productionColumns?.reduce((cAcc, col) => {
        const val = parseInt(col.coils, 10);
        return isNaN(val) ? cAcc : cAcc + val;
      }, 0) || 0;
      return acc + coilsFromCols;
    }, 0);

    return {
      totalReports,
      totalDowntimeHours: (totalDowntimeMinutes / 60).toFixed(1),
      totalCoils,
    };
  }, [reports]);

  const machineLines = ['ALL', 'T1', 'T2', 'T3', 'T4', 'T5', 'C1', 'C2', 'PURLIN'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Application Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 rounded">
              Doc R06
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Master Production Report Records
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mill floor operations, shift output, delays tracking, and official PDF documents repository.
          </p>
        </div>

        {/* User Session and Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Master File Button */}
          <button
            onClick={onOpenMasterFile}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            title="Configure Departments and Explanations"
          >
            <Settings className="w-4 h-4 text-slate-600" />
            <span>Master File</span>
          </button>

          {/* User Management Button (Super User Only) */}
          {isSuperUser && (
            <button
              onClick={onOpenUserManagement}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer"
              title="Manage Team Accounts & Form Access"
            >
              <Users className="w-4 h-4 text-purple-600" />
              <span>User Access</span>
            </button>
          )}

          {/* New Report Button */}
          {canWrite ? (
            <button
              onClick={onOpenNewForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Production Report</span>
            </button>
          ) : (
            <button
              onClick={onOpenNewForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Open Form (Read-Only)</span>
            </button>
          )}

          {/* Current User Badge & Logout */}
          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
          <div className="flex items-center gap-2 pl-1">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-800 font-mono">{currentUser?.username}</div>
              <div className="text-[10px] text-slate-400 capitalize">
                {isSuperUser ? 'Super User' : canWrite ? 'Write Access' : 'Read-Only'}
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Industrial Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Reports</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{metrics.totalReports}</div>
          <div className="text-[11px] text-slate-500 mt-1">Archived logsheets in database</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Downtime Logged</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {metrics.totalDowntimeHours} <span className="text-sm font-sans font-normal text-slate-500">Hours</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Calculated across all delay events</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">RM Consumption</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {metrics.totalCoils} <span className="text-sm font-sans font-normal text-slate-500">Coils</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Total raw material coils logged</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs mb-6 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reports by date, operator, machine line, shift, product, or delay explanation..."
              className="block w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Shift Segmented Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
            {['ALL', 'Day', 'Night'].map((s) => (
              <button
                key={s}
                onClick={() => setShiftFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  shiftFilter === s ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'ALL' ? 'All Shifts' : `${s} Shift`}
              </button>
            ))}
          </div>
        </div>

        {/* Machine Line Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-xs">
          <span className="text-slate-500 font-medium text-[11px] shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Line:</span>
          </span>
          {machineLines.map((line) => {
            const isSelected = lineFilter === line;
            return (
              <button
                key={line}
                onClick={() => setLineFilter(line)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {line}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Reports Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Report Number</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Line</th>
                <th className="py-3 px-4">Shift</th>
                <th className="py-3 px-4">Product & Size</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4 text-center">Downtime</th>
                <th className="py-3 px-4 text-center">Coils / Bundles</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((report) => {
                const totalBundles = report.productionColumns?.reduce((acc, col) => {
                  const b = parseInt(col.bundles, 10);
                  return isNaN(b) ? acc : acc + b;
                }, 0) || 0;

                const totalCoils = report.productionColumns?.reduce((acc, col) => {
                  const c = parseInt(col.coils, 10);
                  return isNaN(c) ? acc : acc + c;
                }, 0) || 0;

                return (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Report Number */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {report.reportNumber}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-700 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{report.date}</span>
                      </div>
                    </td>

                    {/* Machine Line */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-900 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded">
                        {report.productionLine}
                      </span>
                    </td>

                    {/* Shift */}
                    <td className="py-3 px-4 text-slate-700">
                      <span className={`inline-block font-medium ${report.shift === 'Night' ? 'text-indigo-700' : 'text-amber-700'}`}>
                        {report.shift}
                      </span>
                    </td>

                    {/* Product & Size */}
                    <td className="py-3 px-4 text-slate-800">
                      <div className="font-medium">{report.product}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{report.size}</div>
                    </td>

                    {/* Operator */}
                    <td className="py-3 px-4 text-slate-700 truncate max-w-[160px]">
                      {report.operator}
                    </td>

                    {/* Downtime */}
                    <td className="py-3 px-4 text-center font-mono">
                      <span className={`font-semibold ${report.totalDowntimeMinutes > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                        {formatTotalDowntime(report.totalDowntimeMinutes)}
                      </span>
                    </td>

                    {/* Coils & Bundles */}
                    <td className="py-3 px-4 text-center font-mono text-slate-700">
                      <span>{totalCoils} coils</span>
                      <span className="text-slate-400 mx-1">·</span>
                      <span>{totalBundles} bndl</span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit / View Form */}
                        <button
                          onClick={() => onEditReport(report)}
                          title={canWrite ? 'Edit Report' : 'View Report'}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        >
                          {canWrite ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>

                        {/* View & Download PDF */}
                        <button
                          onClick={() => onViewPdf(report)}
                          title="View exact paper replica & Download PDF"
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Delete for Superuser */}
                        {isSuperUser && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete report ${report.reportNumber}?`)) {
                                onDeleteReport(report.id);
                              }
                            }}
                            title="Delete Report"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No production reports found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm
                        ? 'Try adjusting your search criteria or filters.'
                        : 'Click "New Production Report" above to start logging mill runs.'}
                    </p>
                    {canWrite && !searchTerm && (
                      <button
                        onClick={onOpenNewForm}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create First Report</span>
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="py-3 px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{filteredReports.length}</strong> of{' '}
            <strong className="text-slate-800">{reports.length}</strong> submitted reports
          </span>
          <span className="font-mono text-[11px]">CamScanner R06 Standard</span>
        </div>
      </div>
    </div>
  );
};
