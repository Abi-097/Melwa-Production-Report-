import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { ReportTable } from './components/ReportTable';
import { ReportForm } from './components/ReportForm';
import { ReportPdfView } from './components/ReportPdfView';
import { MasterFileManager } from './components/MasterFileManager';
import { UserManagementModal } from './components/UserManagementModal';
import { MasterDepartment, ProductionReport } from './types';
import {
  fetchReports,
  saveReport,
  removeReport,
  fetchDepartments,
  saveDepartment,
  deleteDepartment,
  testConnection,
} from './firebase';
import { Loader2 } from 'lucide-react';

type ActiveView = 'table' | 'form' | 'pdf_preview' | 'master_file' | 'user_management';

const MainAppContent: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('table');
  const [reports, setReports] = useState<ProductionReport[]>([]);
  const [departments, setDepartments] = useState<MasterDepartment[]>([]);
  const [editingReport, setEditingReport] = useState<ProductionReport | null>(null);
  const [previewingReport, setPreviewingReport] = useState<ProductionReport | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Initialize data on mount
  useEffect(() => {
    const loadAllData = async () => {
      setDataLoading(true);
      await testConnection();
      const [loadedReports, loadedDepartments] = await Promise.all([
        fetchReports(),
        fetchDepartments(),
      ]);
      setReports(loadedReports);
      setDepartments(loadedDepartments);
      setDataLoading(false);
    };
    loadAllData();
  }, []);

  // Show login screen if not authenticated
  if (authLoading || (!currentUser && !dataLoading)) {
    return <LoginScreen />;
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm font-medium tracking-wide">Loading Master Production Report System...</p>
      </div>
    );
  }

  // Handlers
  const handleOpenNewForm = () => {
    setEditingReport(null);
    setActiveView('form');
  };

  const handleEditReport = (report: ProductionReport) => {
    setEditingReport(report);
    setActiveView('form');
  };

  const handleViewPdf = (report: ProductionReport) => {
    setPreviewingReport(report);
    setActiveView('pdf_preview');
  };

  const handleSaveReport = async (report: ProductionReport) => {
    await saveReport(report);
    const updated = await fetchReports();
    setReports(updated);
    setPreviewingReport(report);
    setActiveView('pdf_preview');
  };

  const handleDeleteReport = async (reportId: string) => {
    await removeReport(reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  };

  const handleSaveDepartment = async (dept: MasterDepartment) => {
    await saveDepartment(dept);
    const updated = await fetchDepartments();
    setDepartments(updated);
  };

  const handleDeleteDepartment = async (deptId: string) => {
    await deleteDepartment(deptId);
    const updated = await fetchDepartments();
    setDepartments(updated);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {activeView === 'table' && (
        <ReportTable
          reports={reports}
          onOpenNewForm={handleOpenNewForm}
          onEditReport={handleEditReport}
          onViewPdf={handleViewPdf}
          onDeleteReport={handleDeleteReport}
          onOpenMasterFile={() => setActiveView('master_file')}
          onOpenUserManagement={() => setActiveView('user_management')}
        />
      )}

      {activeView === 'form' && (
        <ReportForm
          initialReport={editingReport}
          departments={departments}
          onSave={handleSaveReport}
          onCancel={() => setActiveView('table')}
          onPreviewPdf={(rep) => {
            setPreviewingReport(rep);
            setActiveView('pdf_preview');
          }}
        />
      )}

      {activeView === 'pdf_preview' && previewingReport && (
        <ReportPdfView
          report={previewingReport}
          onBack={() => setActiveView('table')}
        />
      )}

      {activeView === 'master_file' && (
        <MasterFileManager
          departments={departments}
          onSaveDepartment={handleSaveDepartment}
          onDeleteDepartment={handleDeleteDepartment}
          onClose={() => setActiveView('table')}
        />
      )}

      {activeView === 'user_management' && (
        <UserManagementModal onClose={() => setActiveView('table')} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
