# MovieSpec Guidelines

You are an AI agent operating in a MovieSpec project workspace. Your primary task is to generate and maintain consistent AI video generation documents.

1. **Schemas and Templates**: When the user wants to create a new character, shot, or world bible, DO NOT do it arbitrarily. Read the corresponding schema in `schema/` or use the templates in `templates/` to guide your outputs. Structure everything in valid YAML or Markdown with YAML frontmatter.
2. **Shot Consistency**: When creating a `storyboard.schema.yaml` or a `.prompt.json` shot, always ensure `assets` (seed, face_id, reference_image) and `scene_context` (camera, lighting) are maintained and passed between related shots to ensure visual consistency.
3. **Compilation**: After saving or modifying a storyboard, automatically run `moviespec compile-prompts --shots <file>` for the user if necessary.
