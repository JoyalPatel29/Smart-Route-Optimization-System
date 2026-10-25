import React, { useState } from 'react';
import { runAllTests } from '../utils/testing';
import { TestCaseResult } from '../types/graph';
import { CheckCircle2, XCircle, Play, X, ShieldCheck, FileCheck2 } from 'lucide-react';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ isOpen, onClose }) => {
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [hasRun, setHasRun] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRunTests = () => {
    const results = runAllTests();
    setTestResults(results);
    setHasRun(true);
  };

  const allPassed = testResults.length > 0 && testResults.every((t) => t.passed);
  const passedCount = testResults.filter((t) => t.passed).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Automated Correctness & Edge-Case Test Suite
              </h2>
              <p className="text-[11px] text-slate-400">
                Verifies Dijkstra, Floyd-Warshall, and A* distance equality and edge cases
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Top Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-lg border border-slate-700/60">
            <div>
              <span className="text-xs font-semibold text-slate-200">
                Specification Test Suite (7 Core DAA Tests)
              </span>
              <p className="text-[11px] text-slate-400">
                Tests single source, multiple paths, disconnected islands, self-loops, and path continuity.
              </p>
            </div>

            <button
              onClick={handleRunTests}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-2 shadow transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Run All 7 Correctness Tests
            </button>
          </div>

          {/* Test Status Banner */}
          {hasRun && (
            <div
              className={`p-3.5 rounded-lg border flex items-center justify-between text-xs font-medium ${
                allPassed
                  ? 'bg-emerald-950/40 border-emerald-700 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-700 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {allPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>
                  {allPassed
                    ? `All 7 Verification Tests Passed Successfully (${passedCount}/${testResults.length})`
                    : `Some tests failed (${passedCount}/${testResults.length} passed)`}
                </span>
              </div>
              <span className="font-mono text-[11px]">Dijkstra == A* == Floyd-Warshall</span>
            </div>
          )}

          {/* Test Cards List */}
          <div className="space-y-2.5">
            {testResults.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                <FileCheck2 className="w-10 h-10 mx-auto mb-2 text-slate-500 opacity-50" />
                Click "Run All 7 Correctness Tests" to execute the test suite in real time.
              </div>
            ) : (
              testResults.map((test) => (
                <div
                  key={test.id}
                  className={`p-3.5 rounded-lg border text-xs transition-colors ${
                    test.passed
                      ? 'bg-slate-900/50 border-slate-700/80'
                      : 'bg-rose-950/30 border-rose-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="font-semibold text-slate-100 flex items-center gap-2">
                      {test.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span>{test.name}</span>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        test.passed
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {test.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>

                  <p className="text-slate-400 text-[11px] mb-2">{test.description}</p>

                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80 font-mono text-[11px] text-slate-300 space-y-1">
                    <div>{test.details}</div>
                    {test.dijkstraDistance !== null && (
                      <div className="text-slate-400 text-[10px] flex flex-wrap gap-4 pt-1 border-t border-slate-800">
                        <span>
                          Dijkstra Dist: <strong className="text-sky-300">{test.dijkstraDistance}</strong>
                        </span>
                        <span>
                          Floyd-Warshall Dist: <strong className="text-amber-300">{test.floydWarshallDistance}</strong>
                        </span>
                        <span>
                          A* Dist: <strong className="text-emerald-300">{test.astarDistance}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
