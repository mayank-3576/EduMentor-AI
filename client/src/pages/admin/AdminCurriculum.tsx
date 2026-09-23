import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, PlusCircle, Edit3, Trash2, 
  Layers, BookOpen, FileText, CheckCircle2, X, School, Link as LinkIcon 
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';
import { ConfirmModal } from '../../components/ConfirmModal.js';
import { Subject, Topic } from '../../types/index.js';

export const AdminCurriculum: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'subjects' | 'units' | 'pyqs'>('hierarchy');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [curriculumTree, setCurriculumTree] = useState<any>(null);
  const [pyqs, setPyqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subCategory, setSubCategory] = useState('Core Computer Science');
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subSlug, setSubSlug] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subBranchId, setSubBranchId] = useState<number | ''>('');
  const [subSemesterId, setSubSemesterId] = useState<number | ''>('');

  // Unit Modal
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [unitSubjectId, setUnitSubjectId] = useState<number | ''>('');
  const [unitNumber, setUnitNumber] = useState<number>(1);
  const [unitTitle, setUnitTitle] = useState('');
  const [unitDesc, setUnitDesc] = useState('');

  // PYQ Modal
  const [isPYQModalOpen, setIsPYQModalOpen] = useState(false);
  const [pyqSubjectId, setPyqSubjectId] = useState<number | ''>('');
  const [pyqUniversity, setPyqUniversity] = useState('AKTU');
  const [pyqYear, setPyqYear] = useState(2024);
  const [pyqSeason, setPyqSeason] = useState('May/June');
  const [pyqText, setPyqText] = useState('');
  const [pyqMarks, setPyqMarks] = useState(10);
  const [pyqSolution, setPyqSolution] = useState('');

  // Mapping Modal
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [mapSubjectId, setMapSubjectId] = useState<number | ''>('');
  const [mapBranchId, setMapBranchId] = useState<number | ''>('');
  const [mapSemesterId, setMapSemesterId] = useState<number | ''>('');

  // Delete State
  const [deleteItem, setDeleteItem] = useState<{ type: 'subject' | 'mapping' | 'pyq' | 'unit'; id: number; name: string } | null>(null);

  const { notify } = useNotification();

  const loadData = async () => {
    setLoading(true);
    try {
      const [subRes, treeRes, pyqRes] = await Promise.all([
        api.subjects.getAll(),
        api.admin.getCurriculumTree(),
        api.pyq.getAll(),
      ]);

      if (subRes.success) setSubjects(subRes.subjects);
      if (treeRes.success) {
        setCurriculumTree(treeRes.curriculum);
        if (treeRes.curriculum.branches?.length > 0) setSubBranchId(treeRes.curriculum.branches[0].id);
        if (treeRes.curriculum.semesters?.length > 0) setSubSemesterId(treeRes.curriculum.semesters[4]?.id || treeRes.curriculum.semesters[0].id);
      }
      if (pyqRes.success) setPyqs(pyqRes.pyqs);
    } catch (err) {
      console.error('Error loading curriculum data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.admin.createSubject({
        category: subCategory,
        name: subName,
        code: subCode,
        slug: subSlug || subName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: subDesc,
        branchId: subBranchId || undefined,
        semesterId: subSemesterId || undefined,
      });

      if (res.success) {
        notify('success', 'Subject Added!', `Created subject "${subName}" with 5 automatic Units.`);
        setIsSubjectModalOpen(false);
        setSubName('');
        setSubCode('');
        setSubSlug('');
        setSubDesc('');
        await loadData();
      }
    } catch (err: any) {
      notify('error', 'Subject Creation Failed', err.message);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitSubjectId) return;
    try {
      const res = await api.admin.createUnit({
        subjectId: Number(unitSubjectId),
        unitNumber,
        title: unitTitle,
        description: unitDesc,
      });

      if (res.success) {
        notify('success', 'Unit Added!', `Created Unit ${unitNumber}.`);
        setIsUnitModalOpen(false);
        setUnitTitle('');
        setUnitDesc('');
        await loadData();
      }
    } catch (err: any) {
      notify('error', 'Unit Creation Failed', err.message);
    }
  };

  const handleCreatePYQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pyqSubjectId) return;
    try {
      const res = await api.admin.createPYQ({
        subjectId: Number(pyqSubjectId),
        university: pyqUniversity,
        year: Number(pyqYear),
        examSeason: pyqSeason,
        questionText: pyqText,
        marks: Number(pyqMarks),
        solutionNotes: pyqSolution,
      });

      if (res.success) {
        notify('success', 'PYQ Added!', `University question created.`);
        setIsPYQModalOpen(false);
        setPyqText('');
        setPyqSolution('');
        await loadData();
      }
    } catch (err: any) {
      notify('error', 'PYQ Creation Failed', err.message);
    }
  };

  const handleCreateMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSubjectId || !mapBranchId || !mapSemesterId) return;
    try {
      const defDegree = curriculumTree?.degrees?.[0]?.id || 1;
      const res = await api.admin.createCurriculumMapping({
        degreeId: defDegree,
        branchId: Number(mapBranchId),
        semesterId: Number(mapSemesterId),
        subjectId: Number(mapSubjectId),
      });

      if (res.success) {
        notify('success', 'Curriculum Mapped!', 'Subject assigned to branch and semester.');
        setIsMappingModalOpen(false);
        await loadData();
      }
    } catch (err: any) {
      notify('error', 'Mapping Failed', err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      if (deleteItem.type === 'subject') {
        await api.admin.deleteSubject(deleteItem.id);
      } else if (deleteItem.type === 'mapping') {
        await api.admin.deleteCurriculumMapping(deleteItem.id);
      } else if (deleteItem.type === 'pyq') {
        await api.admin.deletePYQ(deleteItem.id);
      }
      notify('info', 'Deleted', `Removed ${deleteItem.type} "${deleteItem.name}".`);
      setDeleteItem(null);
      await loadData();
    } catch (err: any) {
      notify('error', 'Deletion Failed', err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
            <School className="w-3.5 h-3.5" />
            <span>Curriculum-Based CMS Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
            Academic Curriculum Architecture
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Configure Degrees, Branches, Semesters, Units I-V, and university PYQs dynamically. 
            Changes immediately appear for students in that curriculum without frontend changes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSubjectModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Add Subject (with Units I-V)
          </button>
          <button
            onClick={() => setIsMappingModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30 flex items-center gap-1.5"
          >
            <LinkIcon className="w-4 h-4" /> Map to Semester
          </button>
          <button
            onClick={() => setIsPYQModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" /> Add PYQ
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 flex gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`pb-3 px-2 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'hierarchy' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <School className="w-4 h-4" /> Semester Curriculum Mappings ({curriculumTree?.mappings?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-3 px-2 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'subjects' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Subjects ({subjects.length})
        </button>
        <button
          onClick={() => setActiveTab('pyqs')}
          className={`pb-3 px-2 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'pyqs' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" /> University PYQs ({pyqs.length})
        </button>
      </div>

      {/* Tab 1: Semester Curriculum Mappings Table */}
      {activeTab === 'hierarchy' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Degree &gt; Branch &gt; Semester &gt; Subject Allocations</h3>
            <span className="text-xs text-slate-400">Strict Student Filtering Active</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Degree</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {curriculumTree?.mappings?.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{m.degree_name}</td>
                    <td className="py-3 px-4 text-indigo-300 font-semibold">{m.branch_name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono">
                        {m.semester_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{m.subject_name}</td>
                    <td className="py-3 px-4 font-mono text-cyan-400">{m.subject_code}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setDeleteItem({ type: 'mapping', id: m.id, name: `${m.subject_name} in ${m.semester_name}` })}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Subjects Grid */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-lg"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold uppercase tracking-wider text-[10px]">
                    {sub.category}
                  </span>
                  <span className="font-mono text-cyan-400 font-bold">{sub.code}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">{sub.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{sub.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">{sub.unit_count || 5} Units Enrolled</span>
                <button
                  onClick={() => setDeleteItem({ type: 'subject', id: sub.id, name: sub.name })}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: PYQ Management */}
      {activeTab === 'pyqs' && (
        <div className="space-y-4">
          {pyqs.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
                    {p.university} • {p.year} ({p.marks} Marks)
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{p.subject_name}</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white">{p.question_text}</p>
              </div>

              <button
                onClick={() => setDeleteItem({ type: 'pyq', id: p.id, name: p.question_text.slice(0, 30) })}
                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Create Subject with 5 Academic Units</h3>
              <button onClick={() => setIsSubjectModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="e.g. Distributed Cloud Computing"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Code</label>
                  <input
                    type="text"
                    required
                    value={subCode}
                    onChange={(e) => setSubCode(e.target.value)}
                    placeholder="CS505"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="Databases">Databases</option>
                    <option value="Core Computer Science">Core Computer Science</option>
                    <option value="AI & Data">AI & Data</option>
                    <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                    <option value="Backend Development">Backend Development</option>
                  </select>
                </div>
              </div>

              {/* Immediate Branch & Semester Assignment */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assign to Branch</label>
                  <select
                    value={subBranchId}
                    onChange={(e) => setSubBranchId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    {curriculumTree?.branches?.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assign to Semester</label>
                  <select
                    value={subSemesterId}
                    onChange={(e) => setSubSemesterId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    {curriculumTree?.semesters?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  value={subDesc}
                  onChange={(e) => setSubDesc(e.target.value)}
                  placeholder="Syllabus overview..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Publish Subject & 5 Units
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mapping Modal */}
      {isMappingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Map Subject to Semester</h3>
              <button onClick={() => setIsMappingModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateMapping} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subject</label>
                <select
                  required
                  value={mapSubjectId}
                  onChange={(e) => setMapSubjectId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Branch</label>
                <select
                  required
                  value={mapBranchId}
                  onChange={(e) => setMapBranchId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="">Select Branch</option>
                  {curriculumTree?.branches?.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Semester</label>
                <select
                  required
                  value={mapSemesterId}
                  onChange={(e) => setMapSemesterId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="">Select Semester</option>
                  {curriculumTree?.semesters?.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMappingModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Assign Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PYQ Modal */}
      {isPYQModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Add University Question (PYQ)</h3>
              <button onClick={() => setIsPYQModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePYQ} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Subject</label>
                <select
                  required
                  value={pyqSubjectId}
                  onChange={(e) => setPyqSubjectId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">University</label>
                  <input
                    type="text"
                    required
                    value={pyqUniversity}
                    onChange={(e) => setPyqUniversity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Year</label>
                  <input
                    type="number"
                    required
                    value={pyqYear}
                    onChange={(e) => setPyqYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Marks</label>
                  <input
                    type="number"
                    required
                    value={pyqMarks}
                    onChange={(e) => setPyqMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Question Text</label>
                <textarea
                  required
                  rows={2}
                  value={pyqText}
                  onChange={(e) => setPyqText(e.target.value)}
                  placeholder="Official university question statement..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white resize-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Model Solution & Derivation Notes</label>
                <textarea
                  required
                  rows={4}
                  value={pyqSolution}
                  onChange={(e) => setPyqSolution(e.target.value)}
                  placeholder="Step-by-step solution, mathematical equations, and marking points..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white resize-none font-mono"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPYQModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Publish PYQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteItem)}
        title={`Delete ${deleteItem?.type}?`}
        message={`Are you sure you want to delete "${deleteItem?.name}"?`}
        confirmLabel="Yes, Delete"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
};
