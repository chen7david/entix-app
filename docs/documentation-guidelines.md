# Documentation Guidelines

This document outlines the standards and best practices for writing and maintaining documentation in the Entix-App project.

## Philosophy
Documentation is a feature. It should be treated with the same care and quality as the code itself. Good documentation is:
- **Concise**: Get to the point.
- **Up-to-date**: Incorrect documentation is worse than no documentation.
- **Discoverable**: Easy to navigate and find.

## Structure
We follow a modular documentation structure compatible with static site generators like **VitePress**.

- **`README.md`**: The entry point. Contains high-level overview, quick links, and the table of contents.
- **`docs/`**: The directory containing all detailed documentation files.
  - Use kebab-case for filenames (e.g., `setup.md`, `api-reference.md`).
  - Keep files focused on a single topic.

## Writing Style
- **Voice**: Use active voice and second person ("You run the command" vs "The command is run").
- **Formatting**:
  - Use **bold** for UI elements or key terms.
  - Use `code blocks` for commands, file paths, and code snippets.
  - Use standard Markdown headers (`#`, `##`, `###`).
- **Code Snippets**: Always specify the language for syntax highlighting (e.g., \`\`\`typescript).

## How to Add New Documentation
1. **Identify the Topic**: Does it fit into an existing file? If not, create a new one in `docs/`.
2. **Create the File**: Use a descriptive kebab-case filename.
3. **Add Navigation**:
   - Add a "Back to Table of Contents" link at the top of the file.
   - Add a link to your new file in the main `README.md`.
4. **Verify**: Preview the Markdown to ensure rendering is correct.

## VitePress Compatibility
Our `docs/` structure is designed to be easily consumed by VitePress.
- **Images**: Store images in `docs/public/` (create if needed) and reference them as `/image.png`.
- **Links**: Use relative links to other markdown files (e.g., `[Link](./other-file.md)`).

## Maintenance
- **Review**: When changing code, ask yourself: "Does this change the documentation?"
- **Tech Debt**: If you find outdated docs but can't fix them immediately, add an item to the "Tech Debt / TODO" section in `README.md`.
