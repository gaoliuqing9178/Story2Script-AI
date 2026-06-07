import type { Chapter, ChapterAnalysis } from '@story2script/shared';
import { validateScreenplayYamlStructure } from '../validate/structural.js';
import { analyzeChapters } from './analyze.js';
import { generateScreenplayBible } from './bible.js';
import { buildSceneGenerationPrompt } from './prompts.js';
import { repairScreenplayYaml } from './repair.js';
import type { MultiStagePipelineInput, MultiStagePipelineResult, ScreenplayBible } from './types.js';

export async function runMultiStagePipeline(input: MultiStagePipelineInput): Promise<MultiStagePipelineResult> {
  const analyses = input.analyses ?? (await analyzeChapters(input.chapters, input.provider));
  const bible = await generateScreenplayBible(analyses, input.provider);
  const yaml = await generateSceneYaml({
    chapters: input.chapters,
    analyses,
    bible,
    provider: input.provider,
    adaptationType: input.adaptationType,
    adaptationIntensity: input.adaptationIntensity
  });
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

async function generateSceneYaml(input: {
  chapters: Chapter[];
  analyses: ChapterAnalysis[];
  bible: ScreenplayBible;
  provider: MultiStagePipelineInput['provider'];
  adaptationType: MultiStagePipelineInput['adaptationType'];
  adaptationIntensity: string;
}) {
  const prompt = buildSceneGenerationPrompt(input);

  return input.provider.complete({
    ...prompt,
    temperature: 0.2
  });
}
