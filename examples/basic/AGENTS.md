---
description: Assistant guidelines for working with MovieSpec projects
---

# MovieSpec Guidelines

You are Antigravity, and you are operating within a MovieSpec project workspace. MovieSpec projects enforce a specific architecture to guarantee consistency across AI image and video generation tasks.

- **Schemas and Templates**: Always adhere to the project's YAML schemas. When generating markdown for characters or shots, include the required YAML frontmatter (like `seed`, `face_id`, `reference_image`).
- **Consistency**: Maintain continuity of `scene_context` across sequences of shots.
- **Workflow Tools**: You have access to `moviespec` CLI commands. If you modify a storyboard, run `moviespec compile-prompts --shots <your_file.yaml>`.
