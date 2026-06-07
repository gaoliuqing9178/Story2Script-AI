import type { AdaptationType, Chapter, ChapterAnalysis, Screenplay, ValidationResult } from '@story2script/shared';
import type { LLMProvider } from '../provider/index.js';

export interface ScreenplayBible {
  logline: string;
  theme: string;
  characters: Screenplay['characters'];
  locations: Screenplay['locations'];
  timeline: string[];
  main_conflict: string;
  adaptation_principles: string[];
}

export interface RepairResult {
  yaml: string;
  validation: ValidationResult;
  initialValidation: ValidationResult;
  attempts: number;
  maxAttempts: number;
}

export interface MultiStagePipelineInput {
  chapters: Chapter[];
  analyses?: ChapterAnalysis[];
  provider: LLMProvider;
  adaptationType: AdaptationType;
  adaptationIntensity: string;
  repairMaxAttempts: number;
}

export interface MultiStagePipelineResult {
  yaml: string;
  validation: ValidationResult;
  analyses: ChapterAnalysis[];
  bible: ScreenplayBible;
  repair: RepairResult;
}
