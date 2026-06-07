import type { Chapter } from '@story2script/shared';
import { describe, expect, it } from 'vitest';
import { analyzeChapters } from '../src/pipeline/analyze.js';
import type { LLMProvider, ProviderRequest } from '../src/provider/index.js';

describe('chapter analysis normalization', () => {
  it('accepts object-shaped real LLM arrays and normalizes them to strings', async () => {
    const provider: LLMProvider = {
      async complete(_input: ProviderRequest) {
        return JSON.stringify({
          chapter_id: '',
          summary: '林舟回到旧车站，发现沈念留下的线索。',
          characters: [{ name: '林舟', role: 'protagonist' }, { name: '沈念' }],
          locations: [{ name: '旧火车站', type: 'station' }],
          key_events: [{ event: '旧信出现' }],
          conflicts: [{ description: '林舟想追查真相，沈念担心他再次受伤。' }],
          adaptation_notes: [{ note: '把内心独白转成动作和对白。' }]
        });
      },
      async *stream(_input: ProviderRequest) {}
    };

    const [analysis] = await analyzeChapters([makeChapter()], provider);

    expect(analysis).toEqual({
      chapter_id: 'chapter_001',
      summary: '林舟回到旧车站，发现沈念留下的线索。',
      characters: ['林舟', '沈念'],
      locations: ['旧火车站'],
      key_events: ['旧信出现'],
      conflicts: ['林舟想追查真相，沈念担心他再次受伤。'],
      adaptation_notes: ['把内心独白转成动作和对白。']
    });
  });
});

function makeChapter(): Chapter {
  return {
    id: 'chapter_001',
    title: '第一章 雨夜归来',
    order: 1,
    content: '林舟回到旧车站。',
    word_count: 8
  };
}
