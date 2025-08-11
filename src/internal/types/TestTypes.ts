/**
 * TIPOS INTERNOS PARA SISTEMA DE TESTES OCULTO
 * Completamente invisível ao usuário final
 */

export interface HiddenTestConfig {
  enabled: boolean;
  environment: 'development' | 'production';
  testFrequency: {
    startup: boolean;
    onTransaction: boolean;
    periodic: number; // minutes
    onNavigation: boolean;
  };
  logging: {
    level: 'minimal' | 'detailed';
    encryption: boolean;
    retention: number; // days
  };
  autoCorrection: {
    enabled: boolean;
    maxAttempts: number;
    rollbackOnFailure: boolean;
  };
  performance: {
    maxCpuUsage: number; // percentage
    maxMemoryUsage: number; // MB
    throttleThreshold: number;
  };
}

export interface TestTrigger {
  type: 'startup' | 'transaction' | 'navigation' | 'periodic';
  context?: any;
  priority: 'low' | 'medium' | 'high';
}

export interface ValidationContext {
  type: string;
  data: any;
  timestamp: number;
  source: string;
}

export interface ValidationResult {
  passed: boolean;
  issues: ValidationIssue[];
  executionTime: number;
  memoryUsage: number;
}

export interface ValidationIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  data: any;
  autoCorrectible: boolean;
}

export interface CorrectionResult {
  success: boolean;
  correctionId: string;
  originalValue: any;
  correctedValue: any;
  rollbackData?: any;
  error?: string;
}

export interface HiddenTestResult {
  id: string;
  timestamp: number;
  suite: string;
  validator: string;
  status: 'pass' | 'fail' | 'corrected' | 'critical';
  executionTime: number;
  memoryUsage: number;
  details?: EncryptedDetails;
  autoCorrection?: CorrectionResult;
}

export interface EncryptedDetails {
  encrypted: string;
  iv: string;
  timestamp: number;
}

export interface PerformanceMetric {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  testDuration: number;
  impactScore: number;
}

export interface SystemLoad {
  cpu: number;
  memory: number;
  activeTests: number;
  userActivity: boolean;
}

export interface BackgroundValidator {
  name: string;
  priority: number;
  validate(context: ValidationContext): Promise<ValidationResult>;
  canAutoCorrect(): boolean;
  autoCorrect(issue: ValidationIssue): Promise<CorrectionResult>;
}

export interface TestSuite {
  name: string;
  validators: BackgroundValidator[];
  priority: number;
  frequency: number;
  conditions?: string[];
}

export interface SilentTestEngine {
  initialize(): Promise<void>;
  scheduleTests(trigger: TestTrigger): void;
  executeTestSuite(suite: TestSuite): Promise<TestResult>;
  isEngineRunning(): boolean;
  shutdown(): void;
}

export interface TestResult {
  suiteId: string;
  results: ValidationResult[];
  overallStatus: 'pass' | 'fail' | 'partial';
  totalTime: number;
  corrections: CorrectionResult[];
}

export interface InternalLogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'critical';
  category: string;
  message: string;
  data?: any;
  encrypted?: boolean;
}

export interface PerformanceImpact {
  cpuImpact: number;
  memoryImpact: number;
  shouldThrottle: boolean;
  shouldPause: boolean;
}

export type IssueType = 'calculation' | 'formatting' | 'data-integrity' | 'performance' | 'memory-leak';

export interface RecoveryResult {
  success: boolean;
  action: string;
  details: string;
}

export interface CriticalIssue {
  id: string;
  timestamp: number;
  type: IssueType;
  severity: 'critical';
  description: string;
  stackTrace?: string;
  context: any;
}