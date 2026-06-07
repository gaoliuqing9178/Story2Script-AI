export const screenplayJsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Story2Script Screenplay YAML Schema',
  type: 'object',
  required: ['schema_version', 'project', 'source', 'characters', 'locations', 'scenes'],
  properties: {
    schema_version: {
      type: 'string',
      const: '1.0'
    },
    project: {
      type: 'object',
      required: ['title', 'source_type', 'adaptation_type', 'language'],
      properties: {
        title: { type: 'string', minLength: 1 },
        source_type: { type: 'string', const: 'novel' },
        adaptation_type: {
          type: 'string',
          enum: ['screenplay', 'stage_play', 'audio_drama', 'short_drama']
        },
        language: { type: 'string', minLength: 1 },
        logline: { type: 'string' },
        theme: { type: 'string' }
      }
    },
    source: {
      type: 'object',
      required: ['chapters'],
      properties: {
        chapters: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['id', 'title', 'order', 'summary'],
            properties: {
              id: { type: 'string', minLength: 1 },
              title: { type: 'string', minLength: 1 },
              order: { type: 'number' },
              summary: { type: 'string', minLength: 1 }
            }
          }
        }
      }
    },
    characters: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['id', 'name', 'role'],
        properties: {
          id: { type: 'string', minLength: 1 },
          name: { type: 'string', minLength: 1 },
          aliases: { type: 'array', items: { type: 'string' } },
          role: {
            type: 'string',
            enum: ['protagonist', 'antagonist', 'supporting', 'minor']
          },
          description: { type: 'string' },
          goals: { type: 'array', items: { type: 'string' } },
          relationships: {
            type: 'array',
            items: {
              type: 'object',
              required: ['target', 'relation'],
              properties: {
                target: { type: 'string', minLength: 1 },
                relation: { type: 'string', minLength: 1 }
              }
            }
          }
        }
      }
    },
    locations: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'string', minLength: 1 },
          name: { type: 'string', minLength: 1 },
          type: { type: 'string' },
          description: { type: 'string' }
        }
      }
    },
    scenes: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: [
          'id',
          'title',
          'order',
          'source_chapters',
          'location_id',
          'characters',
          'purpose',
          'conflict',
          'beats'
        ],
        properties: {
          id: { type: 'string', minLength: 1 },
          title: { type: 'string', minLength: 1 },
          order: { type: 'number' },
          source_chapters: {
            type: 'array',
            minItems: 1,
            items: { type: 'string' }
          },
          location_id: { type: 'string', minLength: 1 },
          time: { type: 'string' },
          mood: { type: 'string' },
          characters: {
            type: 'array',
            minItems: 1,
            items: { type: 'string' }
          },
          purpose: { type: 'string', minLength: 1 },
          conflict: { type: 'string', minLength: 1 },
          beats: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['type', 'content'],
              properties: {
                type: {
                  type: 'string',
                  enum: ['action', 'dialogue', 'narration', 'transition', 'inner_voice']
                },
                speaker: { type: 'string' },
                content: { type: 'string', minLength: 1 }
              }
            }
          },
          notes: {
            type: 'object',
            properties: {
              adaptation_reason: { type: 'string' },
              original_reference: { type: 'string' }
            }
          }
        }
      }
    }
  }
} as const;
