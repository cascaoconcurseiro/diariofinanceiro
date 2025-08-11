/**
 * Dashboard de Testes - Visualização dos Resultados
 * Componente React para mostrar resultados dos testes de forma visual
 */

import React, { useState, useEffect } from 'react';
import { TestRunner, TestReport } from '../tests/TestRunner';
import { TestSuite } from '../tests/FinancialLogicTester';

interface TestDashboardProps {
  onClose?: () => void;
}

export const TestDashboard: React.FC<TestDashboardProps> = ({ onClose }) => {
  const [report, setReport] = useState<TestReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [testRunner] = useState(() => new TestRunner());

  useEffect(() => {
    // Carrega último relatório se existir
    const lastReport = testRunner.loadLastReport();
    if (lastReport) {
      setReport(lastReport);
    }
  }, [testRunner]);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const newReport = await testRunner.runAllTests();
      setReport(newReport);
      testRunner.saveReport(newReport);
    } catch (error) {
      console.error('Erro ao executar testes:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runCriticalTests = async () => {
    setIsRunning(true);
    try {
      const success = await testRunner.runCriticalTests();
      if (success) {
        alert('✅ Todos os testes críticos passaram!');
      } else {
        alert('❌ Testes críticos falharam!');
      }
    } catch (error) {
      console.error('Erro ao executar testes críticos:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (passed: boolean) => {
    return passed ? 'text-green-600' : 'text-red-600';
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!report && !isRunning) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">🧪 Dashboard de Testes</h2>
            {onClose && (
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            )}
          </div>
          
          <div className="text-center">
            <p className="mb-4">Nenhum relatório de teste disponível.</p>
            <button
              onClick={runTests}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
            >
              🚀 Executar Todos os Testes
            </button>
            <button
              onClick={runCriticalTests}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              🎯 Apenas Testes Críticos
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isRunning) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">🧪 Executando Testes...</h2>
          <p className="text-gray-600">Isso pode levar alguns segundos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">🧪 Dashboard de Testes Financeiros</h2>
          <div className="flex gap-2">
            <button
              onClick={runTests}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              🔄 Executar Novamente
            </button>
            {onClose && (
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {/* Summary Cards */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Total de Testes</h3>
              <p className="text-2xl font-bold text-blue-600">{report?.summary.totalTests}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Passou</h3>
              <p className="text-2xl font-bold text-green-600">{report?.summary.totalPassed}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800">Falhou</h3>
              <p className="text-2xl font-bold text-red-600">{report?.summary.totalFailed}</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800">Taxa de Sucesso</h3>
              <p className={`text-2xl font-bold ${getSuccessRateColor(report?.summary.successRate || 0)}`}>
                {report?.summary.successRate.toFixed(1)}%
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-800">Correções</h3>
              <p className="text-lg font-bold text-orange-600">
                {report?.summary.fixesPassed || 0}/{report?.summary.fixesValidated || 0}
              </p>
              <p className="text-xs text-orange-600">Bugs Corrigidos</p>
            </div>
          </div>

          {/* Performance Info */}
          <div className="px-6 pb-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">⚡ Performance</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Tempo de Execução:</span>
                  <span className="ml-2 font-mono">{report?.performance.executionTime.toFixed(2)}ms</span>
                </div>
                <div>
                  <span className="text-gray-600">Testes/Segundo:</span>
                  <span className="ml-2 font-mono">{report?.performance.testsPerSecond.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fix Validation Results */}
          {report?.fixValidation && report.fixValidation.length > 0 && (
            <div className="px-6 pb-4">
              <h3 className="text-lg font-semibold mb-4 text-orange-600">🔧 Validação de Correções</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {report.fixValidation.map((fix, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 ${fix.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={fix.passed ? 'text-green-600' : 'text-red-600'}>
                        {fix.passed ? '✅' : '❌'}
                      </span>
                      <span className="font-medium text-sm">{fix.fixName}</span>
                    </div>
                    <p className="text-xs text-gray-600">{fix.details}</p>
                    {!fix.passed && (
                      <div className="mt-2 text-xs">
                        <div className="text-gray-500">Antes: {fix.before}</div>
                        <div className="text-gray-500">Depois: {fix.after}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Suites */}
          <div className="px-6">
            <h3 className="text-lg font-semibold mb-4">📋 Suites de Teste</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Unit Tests */}
              <div>
                <h4 className="font-semibold mb-2 text-blue-600">🔬 Testes Unitários</h4>
                <div className="space-y-2">
                  {report?.unitTests.map((suite, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedSuite(suite)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{suite.suiteName}</span>
                        <div className="flex gap-2 text-sm">
                          <span className="text-green-600">✅ {suite.passed}</span>
                          <span className="text-red-600">❌ {suite.failed}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(suite.passed / suite.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integration Tests */}
              <div>
                <h4 className="font-semibold mb-2 text-purple-600">🔄 Testes de Integração</h4>
                <div className="space-y-2">
                  {report?.integrationTests.map((suite, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedSuite(suite)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{suite.suiteName}</span>
                        <div className="flex gap-2 text-sm">
                          <span className="text-green-600">✅ {suite.passed}</span>
                          <span className="text-red-600">❌ {suite.failed}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${(suite.passed / suite.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Critical Bugs */}
          {report?.summary.criticalBugs.length > 0 && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-red-600">🚨 Bugs Encontrados</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <ul className="space-y-1">
                  {report.summary.criticalBugs.map((bug, index) => (
                    <li key={index} className="text-sm text-red-700">
                      {bug}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report?.summary.recommendations.length > 0 && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-600">💡 Recomendações</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ul className="space-y-1">
                  {report.summary.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-blue-700">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suite Detail Modal */}
      {selectedSuite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">{selectedSuite.suiteName}</h3>
              <button
                onClick={() => setSelectedSuite(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-2">
                {selectedSuite.results.map((result, index) => (
                  <div
                    key={index}
                    className={`border rounded p-3 ${result.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={result.passed ? 'text-green-600' : 'text-red-600'}>
                        {result.passed ? '✅' : '❌'}
                      </span>
                      <span className="font-medium">{result.testName}</span>
                    </div>
                    
                    {!result.passed && (
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-gray-600">Esperado:</span>
                          <span className="ml-2 font-mono bg-white px-2 py-1 rounded">
                            {JSON.stringify(result.expected)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Atual:</span>
                          <span className="ml-2 font-mono bg-white px-2 py-1 rounded">
                            {JSON.stringify(result.actual)}
                          </span>
                        </div>
                        {result.error && (
                          <div>
                            <span className="text-gray-600">Erro:</span>
                            <span className="ml-2 text-red-600">{result.error}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};