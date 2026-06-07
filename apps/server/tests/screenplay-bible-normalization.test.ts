import type { ChapterAnalysis } from '@story2script/shared';
import { describe, expect, it } from 'vitest';
import { generateScreenplayBible } from '../src/pipeline/bible.js';
import type { LLMProvider, ProviderRequest } from '../src/provider/index.js';

describe('screenplay bible normalization', () => {
  it('fills missing bible fields from chapter analyses instead of failing the stream', async () => {
    const provider: LLMProvider = {
      async complete(_input: ProviderRequest) {
        return JSON.stringify({
          logline: '林舟回到旧车站，追查一封迟到多年的信。',
          characters: ['林舟', { name: '沈念', role: '' }],
          locations: [],
          timeline: '归来；旧信出现',
          main_conflict: '',
          adaptation_principles: []
        });
      },
      async *stream(_input: ProviderRequest) {}
    };

    const bible = await generateScreenplayBible(makeAnalyses(), provider);

    expect(bible.theme).toBe('真相、记忆与选择');
    expect(bible.main_conflict).toBe('林舟想追查真相，沈念担心他再次受伤。');
    expect(bible.timeline).toEqual(['归来', '旧信出现']);
    expect(bible.adaptation_principles).toEqual(['保留章节来源', '每场有明确冲突']);
    expect(bible.characters).toEqual([
      { id: 'char_林舟', name: '林舟', role: 'protagonist' },
      { id: 'char_沈念', name: '沈念', role: 'supporting' }
    ]);
    expect(bible.locations).toEqual([{ id: 'loc_旧火车站', name: '旧火车站' }]);
  });
});

function makeAnalyses(): ChapterAnalysis[] {
  return [
    {
      chapter_id: 'chapter_001',
      summary: '林舟回到旧车站。',
      characters: ['林舟', '沈念'],
      locations: ['旧火车站'],
      key_events: ['旧信出现'],
      conflicts: ['林舟想追查真相，沈念担心他再次受伤。'],
      adaptation_notes: ['把内心独白转为动作和对白。']
    }
  ];
}
