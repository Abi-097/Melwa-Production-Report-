import React, { useState } from 'react';
import { MasterDepartment } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  HelpCircle,
  ArrowLeft,
  Save,
  AlertCircle,
} from 'lucide-react';

interface MasterFileManagerProps {
  departments: MasterDepartment[];
  onSaveDepartment: (dept: MasterDepartment) => Promise<void>;
  onDeleteDepartment: (deptId: string) => Promise<void>;
  onClose: () => void;
}

export const MasterFileManager: React.FC<MasterFileManagerProps> = ({
  departments,
  onSaveDepartment,
  onDeleteDepartment,
  onClose,
}) => {
  const { isSuperUser, canWrite } = useAuth();
  const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id || '');
  const [newDeptName, setNewDeptName] = useState('');
  const [newExplanationText, setNewExplanationText] = useState('');
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editingDeptName, setEditingDeptName] = useState('');
  const [editingExplIdx, setEditingExplIdx] = useState<number | null>(null);
  const [editingExplText, setEditingExplText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeDept = departments.find((d) => d.id === selectedDeptId) || departments[0];

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    const newDept: MasterDepartment = {
      id: `dept-${Date.now()}`,
      name: newDeptName.trim(),
      explanations: ['General Inspection / Setup'],
    };

    await onSaveDepartment(newDept);
    setSelectedDeptId(newDept.id);
    setNewDeptName('');
    showStatus(`Department "${newDept.name}" created successfully.`);
  };

  const handleRenameDepartment = async (dept: MasterDepartment) => {
    if (!editingDeptName.trim()) return;
    const updated: MasterDepartment = {
      ...dept,
      name: editingDeptName.trim(),
    };
    await onSaveDepartment(updated);
    setEditingDeptId(null);
    showStatus('Department name updated.');
  };

  const handleDeleteDept = async (deptId: string, deptName: string) => {
    if (departments.length <= 1) {
      alert('You must keep at least one department in the system.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove department "${deptName}" and all its explanations?`)) {
      await onDeleteDepartment(deptId);
      const remaining = departments.filter((d) => d.id !== deptId);
      if (remaining.length > 0) {
        setSelectedDeptId(remaining[0].id);
      }
      showStatus(`Department "${deptName}" removed.`);
    }
  };

  const handleAddExplanation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDept || !newExplanationText.trim()) return;

    if (activeDept.explanations.includes(newExplanationText.trim())) {
      alert('This explanation already exists in this department.');
      return;
    }

    const updated: MasterDepartment = {
      ...activeDept,
      explanations: [...activeDept.explanations, newExplanationText.trim()],
    };

    await onSaveDepartment(updated);
    setNewExplanationText('');
    showStatus('Delay explanation added.');
  };

  const handleUpdateExplanation = async (idx: number) => {
    if (!activeDept || !editingExplText.trim()) return;

    const updatedList = [...activeDept.explanations];
    updatedList[idx] = editingExplText.trim();

    const updated: MasterDepartment = {
      ...activeDept,
      explanations: updatedList,
    };

    await onSaveDepartment(updated);
    setEditingExplIdx(null);
    showStatus('Explanation updated.');
  };

  const handleDeleteExplanation = async (idx: number) => {
    if (!activeDept) return;
    if (activeDept.explanations.length <= 1) {
      alert('Each department must retain at least one explanation reason.');
      return;
    }

    const updatedList = activeDept.explanations.filter((_, i) => i !== idx);
    const updated: MasterDepartment = {
      ...activeDept,
      explanations: updatedList,
    };

    await onSaveDepartment(updated);
    showStatus('Explanation removed.');
  };

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span>Master File Center</span>
            </h1>
            <p className="text-xs text-slate-500">
              Configure factory departments and their linked delay explanations for Table 3 dropdowns.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>

      {statusMessage && (
        <div className="mb-4 p-3 text-xs bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Grid: Departments List (Left) and Explanations List (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Department Categories */}
        <div className="md:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>1. Departments</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">{departments.length} registered</span>
          </div>

          {/* Department List */}
          <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[420px] pr-1">
            {departments.map((dept) => {
              const isSelected = activeDept?.id === dept.id;
              const isEditing = editingDeptId === dept.id;

              return (
                <div
                  key={dept.id}
                  className={`p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-2xs'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingDeptName}
                        onChange={(e) => setEditingDeptName(e.target.value)}
                        className="w-full text-xs px-2 py-1 bg-white border border-blue-400 rounded focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRenameDepartment(dept)}
                        className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer"
                        title="Save name"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingDeptId(null)}
                        className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedDeptId(dept.id)}
                      className="flex-1 text-left cursor-pointer flex items-center justify-between mr-2"
                    >
                      <span className={`text-xs font-medium ${isSelected ? 'font-bold text-blue-900' : ''}`}>
                        {dept.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({dept.explanations.length})
                      </span>
                    </button>
                  )}

                  {canWrite && !isEditing && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDeptId(dept.id);
                          setEditingDeptName(dept.name);
                        }}
                        title="Rename department"
                        className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDept(dept.id, dept.name)}
                        title="Delete department"
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Department Input */}
          {canWrite && (
            <form onSubmit={handleAddDepartment} className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="New Department name..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          )}
        </div>

        {/* Right: Explanations for the Selected Department */}
        <div className="md:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>2. Delay Explanations for "{activeDept?.name}"</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                These options will appear automatically when an operator selects this department.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {activeDept?.explanations.length || 0} reasons
            </span>
          </div>

          {/* Explanations List */}
          <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[420px] pr-1">
            {activeDept?.explanations.map((expl, idx) => {
              const isEditing = editingExplIdx === idx;

              return (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingExplText}
                        onChange={(e) => setEditingExplText(e.target.value)}
                        className="w-full text-xs px-2 py-1 bg-white border border-blue-400 rounded focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdateExplanation(idx)}
                        className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer"
                        title="Save"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingExplIdx(null)}
                        className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <span className="w-5 text-slate-400 font-mono text-[10px] text-right">{idx + 1}.</span>
                      <span className="text-slate-800 font-medium">{expl}</span>
                    </div>
                  )}

                  {canWrite && !isEditing && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingExplIdx(idx);
                          setEditingExplText(expl);
                        }}
                        title="Edit explanation text"
                        className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExplanation(idx)}
                        title="Remove explanation"
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {(!activeDept || activeDept.explanations.length === 0) && (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                No delay explanations configured for this department yet.
              </div>
            )}
          </div>

          {/* Add Explanation Input */}
          {canWrite && (
            <form onSubmit={handleAddExplanation} className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={newExplanationText}
                onChange={(e) => setNewExplanationText(e.target.value)}
                placeholder={`Add new delay reason for ${activeDept?.name}...`}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Reason</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
