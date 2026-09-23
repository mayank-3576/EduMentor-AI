import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Play, Send, CheckCircle2, XCircle, 
  Terminal, Code2, BookOpen, Clock, AlertTriangle, Layers 
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useNotification } from '../../context/NotificationContext.js';

export const CodingProblemPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [language, setLanguage] = useState<'javascript' | 'python' | 'cpp' | 'java' | 'c'>('javascript');
  const [code, setCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'problem' | 'solution'>('problem');

  // Execution state
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'testcases' | 'output'>('testcases');
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0);

  const { notify } = useNotification();

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        if (id) {
          const res = await api.dsa.getProblemById(id);
          if (res.success) {
            setProblem(res.problem);
            const starter = res.problem.starterCode || {};
            setCode(starter[language] || starter['javascript'] || '// Write your solution here\n');
          }
        }
      } catch (err: any) {
        notify('error', 'Problem Load Failed', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  // When language changes, update starter code if available
  const handleLanguageChange = (newLang: 'javascript' | 'python' | 'cpp' | 'java' | 'c') => {
    setLanguage(newLang);
    if (problem?.starterCode && problem.starterCode[newLang]) {
      setCode(problem.starterCode[newLang]);
    }
  };

  const handleRunCode = async () => {
    if (!id || !code.trim() || running) return;
    setRunning(true);
    setActiveConsoleTab('output');
    try {
      const res = await api.dsa.runCode({
        problemId: Number(id),
        language,
        code,
      });
      if (res.success) {
        setExecutionResult(res.result);
        if (res.result.status === 'Accepted') {
          notify('success', 'Test Cases Passed', res.result.message);
        } else {
          notify('warning', res.result.status, res.result.message);
        }
      }
    } catch (err: any) {
      notify('error', 'Execution Error', err.message);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!id || !code.trim() || submitting) return;
    setSubmitting(true);
    setActiveConsoleTab('output');
    try {
      const res = await api.dsa.submitCode({
        problemId: Number(id),
        language,
        code,
      });
      if (res.success) {
        setExecutionResult(res.result);
        if (res.status === 'Accepted') {
          notify('success', 'Accepted!', 'All test cases passed! +20 Study Minutes awarded.');
        } else {
          notify('error', res.status, res.result.message);
        }
      }
    } catch (err: any) {
      notify('error', 'Submission Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs">Loading coding environment...</p>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p className="text-sm font-semibold">Problem not found.</p>
        <Link to="/dsa" className="text-xs text-indigo-400 mt-2 inline-block">
          ← Back to DSA Roadmap
        </Link>
      </div>
    );
  }

  const sampleCases = problem.sampleCases || [];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-950 overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/dsa"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
              {problem.title}
            </h1>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
              problem.difficulty === 'Easy' ? 'bg-emerald-500/15 text-emerald-300' :
              problem.difficulty === 'Medium' ? 'bg-amber-500/15 text-amber-300' :
              'bg-rose-500/15 text-rose-300'
            }`}>
              {problem.difficulty}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="javascript">JavaScript (ES6)</option>
            <option value="python">Python 3</option>
            <option value="cpp">C++20 (GCC)</option>
            <option value="java">Java 17</option>
            <option value="c">C (C11)</option>
          </select>

          <button
            onClick={handleRunCode}
            disabled={running || submitting}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span>{running ? 'Running...' : 'Run Test Cases'}</span>
          </button>

          <button
            onClick={handleSubmitSolution}
            disabled={running || submitting}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Evaluating...' : 'Submit'}</span>
          </button>
        </div>
      </header>

      {/* Two Pane Split: Left Problem Pane, Right Code & Console Pane */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* LEFT PANE: Description / Solution */}
        <div className="border-r border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="h-10 border-b border-slate-800 px-4 flex items-center gap-4 text-xs font-semibold shrink-0 bg-slate-900">
            <button
              onClick={() => setActiveTab('problem')}
              className={`h-full border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'problem' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> Problem Statement
            </button>
            <button
              onClick={() => setActiveTab('solution')}
              className={`h-full border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'solution' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Solution & Complexity
            </button>
          </div>

          {/* Pane Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300 leading-relaxed">
            {activeTab === 'problem' ? (
              <>
                {/* Statement */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white">Description</h3>
                  <div className="whitespace-pre-line text-slate-300">
                    {problem.problem_statement}
                  </div>
                </div>

                {/* Sample Cases */}
                {sampleCases.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-white">Examples</h3>
                    {sampleCases.map((sc: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-400">Example {idx + 1}:</p>
                        <p><strong className="text-indigo-400">Input:</strong> {sc.input}</p>
                        <p><strong className="text-emerald-400">Output:</strong> {sc.output}</p>
                        {sc.explanation && (
                          <p className="text-slate-400 text-[11px] font-sans pt-1 border-t border-slate-900">
                            <strong>Explanation:</strong> {sc.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-white">Constraints</h3>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-slate-400 whitespace-pre-line">
                      {problem.constraints}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
                  <h3 className="text-sm font-bold text-indigo-300">Complexity Analysis</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Time Complexity: <strong className="font-mono text-white">{problem.time_complexity}</strong></div>
                    <div>Space Complexity: <strong className="font-mono text-white">{problem.space_complexity}</strong></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white">Algorithmic Approach</h3>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 leading-relaxed whitespace-pre-line">
                    {problem.solution_explanation}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: Code Editor & Execution Console */}
        <div className="flex flex-col overflow-hidden bg-slate-950">
          {/* Code Editor Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-8 border-b border-slate-800/80 bg-slate-900/60 px-4 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
              <span>Solution.{language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : language === 'c' ? 'c' : 'js'}</span>
              <span>UTF-8 • {language.toUpperCase()}</span>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full p-4 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-indigo-500/30"
              placeholder="// Type your algorithmic solution..."
            />
          </div>

          {/* Bottom Execution Console */}
          <div className="h-64 border-t border-slate-800 bg-slate-900/80 flex flex-col shrink-0">
            {/* Console Tabs */}
            <div className="h-9 border-b border-slate-800 px-4 flex items-center justify-between text-xs font-semibold bg-slate-900">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveConsoleTab('testcases')}
                  className={`h-full border-b-2 transition-colors ${
                    activeConsoleTab === 'testcases' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  Sample Cases
                </button>
                <button
                  onClick={() => setActiveConsoleTab('output')}
                  className={`h-full border-b-2 flex items-center gap-1.5 transition-colors ${
                    activeConsoleTab === 'output' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" /> Execution Console
                </button>
              </div>

              {executionResult && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  executionResult.status === 'Accepted'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {executionResult.status} ({executionResult.runtimeMs}ms)
                </span>
              )}
            </div>

            {/* Console Body */}
            <div className="flex-1 overflow-y-auto p-4 text-xs font-mono">
              {activeConsoleTab === 'testcases' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    {sampleCases.map((_: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTestCaseIdx(idx)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          selectedTestCaseIdx === idx ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                  </div>
                  {sampleCases[selectedTestCaseIdx] && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <p className="text-slate-400">Input:</p>
                      <pre className="text-indigo-300">{sampleCases[selectedTestCaseIdx].input}</pre>
                      <p className="text-slate-400 pt-1">Expected Output:</p>
                      <pre className="text-emerald-300">{sampleCases[selectedTestCaseIdx].output}</pre>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {!executionResult ? (
                    <p className="text-slate-500 italic">Click "Run Test Cases" or "Submit" to see execution results.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Engine: <strong className="text-white">{executionResult.executionEngine}</strong></span>
                        <span>Cases Passed: <strong className="text-white">{executionResult.testCasesPassed} / {executionResult.totalTestCases}</strong></span>
                      </div>

                      {executionResult.details?.map((tc: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border space-y-1 ${
                            tc.passed
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                              : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>Case {idx + 1}</span>
                            <span>{tc.passed ? '✓ Passed' : '✗ Failed'}</span>
                          </div>
                          <p className="text-slate-400">Input: <span className="text-slate-200">{tc.input}</span></p>
                          <p className="text-slate-400">Expected: <span className="text-emerald-300">{tc.expectedOutput}</span></p>
                          <p className="text-slate-400">Actual: <span className={tc.passed ? 'text-emerald-300' : 'text-rose-300'}>{tc.actualOutput}</span></p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
