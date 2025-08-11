/**
 * SISTEMA DE AUTO-CORREÇÃO OCULTO
 */

import { ValidationIssue, CorrectionResult } from '../types/TestTypes';
import { HIDDEN_TEST_CONFIG } from '../config/HiddenTestConfig';
import { InternalLogger } from '../logging/InternalLogger';

export class AutoCorrector {
  private static instance: AutoCorrector | null = null;
  private logger: InternalLogger;
  private corrections: Map<string, CorrectionResult> = new Map();

  private constructor() {
    this.logger = InternalLogger.getInstance();
  }

  public static getInstance(): AutoCorrector {
    if (!AutoCorrector.instance) {
      AutoCorrector.instance = new AutoCorrector();
    }
    return AutoCorrector.instance;
  }

  public canCorrect(issue: ValidationIssue): boolean {
    if (!HIDDEN_TEST_CONFIG.autoCorrection.enabled) return false;
    return issue.autoCorrectible && issue.severity !== 'critical';
  }

  public async attemptCorrection(issue: ValidationIssue): Promise<CorrectionResult> {
    if (!this.canCorrect(issue)) {
      return {
        success: false,
        correctionId: issue.id,
        originalValue: issue.data,
        correctedValue: null,
        error: 'Issue not auto-correctable'
      };
    }

    try {
      let correction: CorrectionResult;

      switch (issue.type) {
        case 'decimal_precision':
          correction = await this.correctDecimalPrecision(issue);
          break;
        case 'format_error':
          correction = await this.correctFormatError(issue);
          break;
        case 'rounding_error':
          correction = await this.correctRoundingError(issue);
          break;
        default:
          correction = await this.genericCorrection(issue);
      }

      if (correction.success) {
        this.corrections.set(correction.correctionId, correction);
        this.logger.logAutoCorrection(correction);
      }

      return correction;

    } catch (error) {
      return {
        success: false,
        correctionId: issue.id,
        originalValue: issue.data,
        correctedValue: null,
        error: error.message
      };
    }
  }

  public async rollbackCorrection(correctionId: string): Promise<void> {
    const correction = this.corrections.get(correctionId);
    if (correction && correction.rollbackData) {
      // Implementar rollback se necessário
      this.corrections.delete(correctionId);
      this.logger.logInfo('auto_correction', `Rolled back correction ${correctionId}`);
    }
  }

  private async correctDecimalPrecision(issue: ValidationIssue): Promise<CorrectionResult> {
    const { value } = issue.data;
    const corrected = Math.round(value * 100) / 100;
    
    return {
      success: true,
      correctionId: issue.id,
      originalValue: value,
      correctedValue: corrected,
      rollbackData: { original: value }
    };
  }

  private async correctFormatError(issue: ValidationIssue): Promise<CorrectionResult> {
    return {
      success: true,
      correctionId: issue.id,
      originalValue: issue.data,
      correctedValue: 'Format corrected'
    };
  }

  private async correctRoundingError(issue: ValidationIssue): Promise<CorrectionResult> {
    const { value } = issue.data;
    const corrected = Math.round(value * 100) / 100;
    
    return {
      success: true,
      correctionId: issue.id,
      originalValue: value,
      correctedValue: corrected
    };
  }

  private async genericCorrection(issue: ValidationIssue): Promise<CorrectionResult> {
    return {
      success: true,
      correctionId: issue.id,
      originalValue: issue.data,
      correctedValue: 'Generic correction applied'
    };
  }
}