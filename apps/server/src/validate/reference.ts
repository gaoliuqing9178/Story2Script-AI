import type { Screenplay, ValidationError, ValidationResult } from '@story2script/shared';

const speakerRequiredBeatTypes = new Set(['dialogue', 'inner_voice']);

export function validateScreenplayReferences(screenplay: Screenplay): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const chapterIds = new Set(screenplay.source.chapters.map((chapter) => chapter.id));
  const characterIds = new Set(screenplay.characters.map((character) => character.id));
  const locationIds = new Set(screenplay.locations.map((location) => location.id));
  const referencedChapterIds = new Set<string>();

  errors.push(...findDuplicateIds(screenplay.characters, 'characters'));
  errors.push(...findDuplicateIds(screenplay.locations, 'locations'));
  errors.push(...findDuplicateIds(screenplay.scenes, 'scenes'));

  screenplay.characters.forEach((character, characterIndex) => {
    character.relationships?.forEach((relationship, relationshipIndex) => {
      if (!characterIds.has(relationship.target)) {
        errors.push({
          path: `characters[${characterIndex}].relationships[${relationshipIndex}].target`,
          message: `未在 characters 中定义: ${relationship.target}`
        });
      }
    });
  });

  screenplay.scenes.forEach((scene, sceneIndex) => {
    if (!locationIds.has(scene.location_id)) {
      errors.push({
        path: `scenes[${sceneIndex}].location_id`,
        message: `未在 locations 中定义: ${scene.location_id}`
      });
    }

    scene.source_chapters.forEach((chapterId, chapterIndex) => {
      if (chapterIds.has(chapterId)) {
        referencedChapterIds.add(chapterId);
        return;
      }

      errors.push({
        path: `scenes[${sceneIndex}].source_chapters[${chapterIndex}]`,
        message: `未在 source.chapters 中定义: ${chapterId}`
      });
    });

    scene.characters.forEach((characterId, characterIndex) => {
      if (!characterIds.has(characterId)) {
        errors.push({
          path: `scenes[${sceneIndex}].characters[${characterIndex}]`,
          message: `未在 characters 中定义: ${characterId}`
        });
      }
    });

    scene.beats.forEach((beat, beatIndex) => {
      const speakerPath = `scenes[${sceneIndex}].beats[${beatIndex}].speaker`;
      const hasSpeaker = typeof beat.speaker === 'string' && beat.speaker.trim().length > 0;

      if (speakerRequiredBeatTypes.has(beat.type) && !hasSpeaker) {
        errors.push({
          path: speakerPath,
          message: `${beat.type} beat 必须提供 speaker`
        });
        return;
      }

      if (hasSpeaker && !characterIds.has(beat.speaker as string)) {
        errors.push({
          path: speakerPath,
          message: `未在 characters 中定义: ${beat.speaker}`
        });
      }
    });
  });

  screenplay.source.chapters.forEach((chapter, chapterIndex) => {
    if (!referencedChapterIds.has(chapter.id)) {
      warnings.push({
        path: `source.chapters[${chapterIndex}].id`,
        message: `该章节未生成任何场景: ${chapter.id}`
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function findDuplicateIds(items: Array<{ id: string }>, collectionPath: string): ValidationError[] {
  const firstIndexById = new Map<string, number>();
  const errors: ValidationError[] = [];

  items.forEach((item, index) => {
    const firstIndex = firstIndexById.get(item.id);

    if (firstIndex === undefined) {
      firstIndexById.set(item.id, index);
      return;
    }

    errors.push({
      path: `${collectionPath}[${index}].id`,
      message: `ID 重复: ${item.id}，首次出现于 ${collectionPath}[${firstIndex}].id`
    });
  });

  return errors;
}
