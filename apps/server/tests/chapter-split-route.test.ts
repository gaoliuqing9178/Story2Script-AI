import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import type { Chapter } from '@story2script/shared';
import { createApp } from '../src/app.js';

const servers: ReturnType<typeof createServer>[] = [];

interface SplitChaptersBody {
  chapters: Chapter[];
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        })
    )
  );
});

describe('POST /api/chapters/split', () => {
  it.each([
    {
      name: 'Chinese chapter titles',
      text: [
        '第一章 雨夜归来',
        '雨声压住车站的广播，林舟拖着旧箱走出站台。',
        '',
        '第二章 旧信',
        '柜底的旧信重新出现，纸边已经被潮气泡软。',
        '',
        '第三章 巷口的灯',
        '巷口的灯忽明忽暗，沈念停在阴影里。'
      ].join('\n'),
      titles: ['第一章 雨夜归来', '第二章 旧信', '第三章 巷口的灯'],
      firstContent: '林舟拖着旧箱'
    },
    {
      name: 'English Chapter headings',
      text: [
        'Chapter 1 Arrival',
        'The last train slid into the station under heavy rain.',
        '',
        'Chapter 2 The Letter',
        'A damp envelope waited inside the locked drawer.',
        '',
        'Chapter 3 The Lamp',
        'The alley lamp blinked once before going dark.'
      ].join('\n'),
      titles: ['Chapter 1 Arrival', 'Chapter 2 The Letter', 'Chapter 3 The Lamp'],
      firstContent: 'last train'
    },
    {
      name: 'Markdown headings',
      text: [
        '# 第一章 雨夜归来',
        '雨线落在旧站台上，所有声音都低了下去。',
        '',
        '## 第二章 旧信',
        '旧信封被重新拆开，里面的字迹仍然清楚。',
        '',
        '### Chapter 3 The Lamp',
        'The last light in the alley trembled in the wind.'
      ].join('\n'),
      titles: ['第一章 雨夜归来', '第二章 旧信', 'Chapter 3 The Lamp'],
      firstContent: '旧站台'
    },
    {
      name: 'manual chapter separators before chapters',
      text: [
        '---chapter---',
        '雨夜归来',
        '林舟回到旧车站，站台上只剩一盏灯。',
        '',
        '---chapter---',
        '旧信',
        '沈念把信封递给他，提醒他不要再查。',
        '',
        '---chapter---',
        '巷口的灯',
        '两个人走进巷口，身后的脚步声忽然停下。'
      ].join('\n'),
      titles: ['Chapter 1', 'Chapter 2', 'Chapter 3'],
      firstContent: '雨夜归来'
    },
    {
      name: 'manual chapter separators between chapters',
      text: [
        '雨夜归来',
        '林舟回到旧车站，站台上只剩一盏灯。',
        '',
        '---chapter---',
        '旧信',
        '沈念把信封递给他，提醒他不要再查。',
        '',
        '---chapter---',
        '巷口的灯',
        '两个人走进巷口，身后的脚步声忽然停下。'
      ].join('\n'),
      titles: ['Chapter 1', 'Chapter 2', 'Chapter 3'],
      firstContent: '雨夜归来'
    }
  ])('splits $name into ordered chapter payloads', async ({ text, titles, firstContent }) => {
    const { status, body } = await postSplit({ text });
    const splitBody = body as SplitChaptersBody;

    expect(status).toBe(200);
    expect(splitBody.chapters).toHaveLength(3);
    expect(splitBody.chapters.map((chapter) => chapter.id)).toEqual(['chapter_001', 'chapter_002', 'chapter_003']);
    expect(splitBody.chapters.map((chapter) => chapter.order)).toEqual([1, 2, 3]);
    expect(splitBody.chapters.map((chapter) => chapter.title)).toEqual(titles);
    expect(splitBody.chapters[0]?.content).toContain(firstContent);
    expect(splitBody.chapters[0]?.word_count).toBeGreaterThan(0);
    expect(splitBody.chapters.every((chapter) => typeof chapter.content === 'string' && chapter.content.length > 0)).toBe(true);
  });

  it('rejects fewer than three detected chapters', async () => {
    const { status, body } = await postSplit({
      text: ['第一章 雨夜归来', '雨夜正文。', '第二章 旧信', '旧信正文。'].join('\n')
    });

    expect(status).toBe(422);
    expect(body).toEqual({
      error: {
        code: 'TOO_FEW_CHAPTERS',
        message: '至少需要 3 个章节，当前识别到 2 个'
      }
    });
  });

  it('rejects missing text', async () => {
    const { status, body } = await postSplit({});

    expect(status).toBe(400);
    expect(body).toEqual({
      error: {
        code: 'BAD_REQUEST',
        message: 'text must be a non-empty string'
      }
    });
  });
});

async function postSplit(payload: unknown) {
  const server = createServer(createApp());
  servers.push(server);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address() as AddressInfo;
  const response = await fetch(`http://127.0.0.1:${port}/api/chapters/split`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return {
    status: response.status,
    body: (await response.json()) as unknown
  };
}
