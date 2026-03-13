# MovieSpec Guidelines

You are assisting with a MovieSpec project. MovieSpec enforces consistency in AI image and video generation through predictable YAML schemas.

1. **Schemas and Templates**: When the user wants to create a new character, shot, or world bible, DO NOT do it arbitrarily. Read the corresponding schema in `schema/` or use the templates in `templates/` to guide your outputs. Structure everything in valid YAML or Markdown with YAML frontmatter.
2. **Shot Consistency**: When creating a `storyboard.schema.yaml` or a `.prompt.json` shot, always ensure `assets` (seed, face_id, reference_image) and `scene_context` (camera, lighting) are maintained and passed between related shots to ensure visual consistency.
3. **Compilation**: After saving or modifying a storyboard, remind the user to run `moviespec compile-prompts --shots <file>` to regenerate prompt outputs.
