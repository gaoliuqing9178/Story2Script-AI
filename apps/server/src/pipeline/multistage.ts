import type { Chapter, ChapterAnalysis } from '@story2script/shared';
import { validateScreenplayYamlStructure } from '../validate/structural.js';
import { completeWithOptionalStream } from '../provider/index.js';
import { analyzeChapters } from './analyze.js';
import { generateScreenplayBible } from './bible.js';
import { normalizeGeneratedScreenplayYaml } from './normalize-yaml.js';
import { buildSceneGenerationPrompt } from './prompts.js';
import { repairScreenplayYaml, repairScreenplayYamlStream } from './repair.js';
import type { MultiStagePipelineInput, MultiStagePipelineResult, ScreenplayBible } from './types.js';

export async function runMultiStagePipeline(input: MultiStagePipelineInput): Promise<MultiStagePipelineResult> {
  const analyses = input.analyses ?? (await analyzeChapters(input.chapters, input.provider));
  const bible = await generateScreenplayBible(analyses, input.provider);
  const yaml = normalizeGeneratedScreenplayYaml(await generateSceneYaml({
    chapters: input.chapters,
    analyses,
    bible,
    provider: input.provider,
    adaptationType: input.adaptationType,
    adaptationIntensity: input.adaptationIntensity
  }), { adaptationType: input.adaptationType });
  const validation = validateScreenplayYamlStructure(yaml);
  const repair = await repairScreenplayYaml({
    yaml,
    validation,
    provider: input.provider,
    maxAttempts: input.repairMaxAttempts
  });

  return {
    yaml: repair.yaml,
    validation: repair.validation,
    analyses,
    bible,
    repair
  };
}

export async function runMultiStagePipelineStream(
  input: MultiStagePipelineInput,
  observer: MultiStagePipelineStreamObserver
): Promise<MultiStagePipelineResult> {
  observer.onStage?.('analysis');
  const analyses = input.analyses ?? (await analyzeChapters(input.chapters, input.provider));
  observer.onStage?.('bible');
  const bible = await generateScreenplayBible(analyses, input.provider);
  observer.onStage?.('scene-generation');
  observer.onYamlReset?.('scene-generation');
  const yaml = normalizeGeneratedScreenplayYaml(await generateSceneYaml({
    chapters: input.chapters,
    analyses,
    bible,
    provider: input.provider,
    adaptationType: input.adaptationType,
    adaptationIntensity: input.adaptationIntensity,
    onDelta: (delta) => observer.onYamlDelta?.(delta, 'scene-generation')
  }), { adaptationType: input.adaptationType });
  observer.onYamlSnapshot?.(yaml, 'scene-generation');

  const validation = validateScreenplayYamlStructure(yaml);
  const repair = await repairScreenplayYamlStream(
    {
      yaml,
      validation,
      provider: input.provider,
      maxAttempts: input.repairMaxAttempts
    },
    {
      onAttemptStart: (attempt) => {
        observer.onStage?.('repair');
        observer.onYamlReset?.('repair', attempt);
      },
      onDelta: (delta, attempt) => observer.onYamlDelta?.(delta, 'repair', attempt),
      onSnapshot: (nextYaml, attempt) => observer.onYamlSnapshot?.(nextYaml, 'repair', attempt)
    }
  );

  return {
    yaml: repair.yaml,
    validation: repair.validation,
    analyses,
    bible,
    repair
  };
}

async function generateSceneYaml(input: {
  chapters: Chapter[];
  analyses: ChapterAnalysis[];
  bible: ScreenplayBible;
  provider: MultiStagePipelineInput['provider'];
  adaptationType: MultiStagePipelineInput['adaptationType'];
  adaptationIntensity: string;
  onDelta?: (delta: string) => void;
}) {
  const prompt = buildSceneGenerationPrompt(input);

  return completeWithOptionalStream(input.provider, { ...prompt, temperature: 0.2 }, input.onDelta);
}

export interface MultiStagePipelineStreamObserver {
  onStage?: (stage: 'analysis' | 'bible' | 'scene-generation' | 'repair') => void;
  onYamlReset?: (source: 'scene-generation' | 'repair', attempt?: number) => void;
  onYamlDelta?: (delta: string, source: 'scene-generation' | 'repair', attempt?: number) => void;
  onYamlSnapshot?: (yaml: string, source: 'scene-generation' | 'repair', attempt?: number) => void;
}
