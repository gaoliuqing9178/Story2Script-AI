import type { Screenplay } from '@story2script/shared';
import { describe, expect, it } from 'vitest';
import { buildScreenplayPreview, parseScreenplayYaml } from './screenplay';

const screenplay: Screenplay = {
  schema_version: '1.0',
  project: {
    title: '预览测试',
    source_type: 'novel',
    adaptation_type: 'screenplay',
    language: 'zh-CN'
  },
  source: {
    chapters: [
      { id: 'chapter_001', title: '第一章', order: 1, summary: '开端' },
      { id: 'chapter_002', title: '第二章', order: 2, summary: '发展' },
      { id: 'chapter_003', title: '第三章', order: 3, summary: '推进' }
    ]
  },
  characters: [
    { id: 'char_a', name: '林舟', role: 'protagonist' },
    { id: 'char_b', name: '沈念', role: 'supporting' }
  ],
  locations: [{ id: 'loc_station', name: '旧火车站' }],
  scenes: [
    {
      id: 'scene_001',
      title: '雨夜归来',
      order: 1,
      source_chapters: ['chapter_001'],
      location_id: 'loc_station',
      time: '夜晚',
      characters: ['char_a', 'char_b'],
      purpose: '建立重逢。',
      conflict: '隐瞒与追问。',
      beats: [
        { type: 'action', content: '雨水落在站台上。' },
        { type: 'dialogue', speaker: 'char_b', content: '你还是回来了。' },
        { type: 'narration', content: '这一刻，旧事重新翻涌。' },
        { type: 'transition', content: '切至老街。' },
        { type: 'inner_voice', speaker: 'char_a', content: '我不能再逃了。' }
      ]
    }
  ]
};

describe('screenplay preview rendering', () => {
  it('maps scene metadata and all five beat types into readable preview data', () => {
    const [scene] = buildScreenplayPreview(screenplay);

    expect(scene).toMatchObject({
      number: 1,
      title: '雨夜归来',
      locationName: '旧火车站',
      time: '夜晚',
      characterNames: ['林舟', '沈念']
    });
    expect(scene?.beats.map((beat) => beat.type)).toEqual([
      'action',
      'dialogue',
      'narration',
      'transition',
      'inner_voice'
    ]);
    expect(scene?.beats[1]).toMatchObject({ label: '对白', speakerName: '沈念' });
    expect(scene?.beats[4]).toMatchObject({ label: '内心', speakerName: '林舟' });
  });

  it('parses YAML into a screenplay object for preview consumption', () => {
    const parsed = parseScreenplayYaml([
      'schema_version: "1.0"',
      'project:',
      '  title: "预览测试"',
      'scenes:',
      '  - id: "scene_001"',
      '    title: "雨夜归来"',
      '    order: 1',
      '    beats: []'
    ].join('\n'));

    expect(parsed?.project.title).toBe('预览测试');
    expect(parsed?.scenes[0]?.id).toBe('scene_001');
  });
});
