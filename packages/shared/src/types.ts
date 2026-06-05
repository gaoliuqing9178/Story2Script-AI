export type AdaptationType = 'screenplay' | 'stage_play' | 'audio_drama' | 'short_drama';
export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'minor';
export type BeatType = 'action' | 'dialogue' | 'narration' | 'transition' | 'inner_voice';

export interface Chapter {
  id: string;
  title: string;
  order: number;
  content: string;
  word_count?: number;
}

export interface ChapterAnalysis {
  chapter_id: string;
  summary: string;
  characters: string[];
  locations: string[];
  key_events: string[];
  conflicts: string[];
  adaptation_notes: string[];
}

export interface Beat {
  type: BeatType;
  speaker?: string;
  content: string;
}

export interface Scene {
  id: string;
  title: string;
  order: number;
  source_chapters: string[];
  location_id: string;
  time?: string;
  mood?: string;
  characters: string[];
  purpose: string;
  conflict: string;
  beats: Beat[];
  notes?: {
    adaptation_reason?: string;
    original_reference?: string;
  };
}

export interface Screenplay {
  schema_version: '1.0';
  project: {
    title: string;
    source_type: 'novel';
    adaptation_type: AdaptationType;
    language: string;
    logline?: string;
    theme?: string;
  };
  source: {
    chapters: Array<{
      id: string;
      title: string;
      order: number;
      summary: string;
    }>;
  };
  characters: Array<{
    id: string;
    name: string;
    aliases?: string[];
    role: CharacterRole;
    description?: string;
    goals?: string[];
    relationships?: Array<{
      target: string;
      relation: string;
    }>;
  }>;
  locations: Array<{
    id: string;
    name: string;
    type?: string;
    description?: string;
  }>;
  scenes: Scene[];
}

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}
