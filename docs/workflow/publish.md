---
title: Publishing Workflow
status: draft
tags: publish, git, markdown
---

# Publishing Workflow

After setup, publishing is mostly a writing loop.

1. Edit Markdown files locally.
2. Preview the vault in Obsidian.
3. Run Papyrus locally and check navigation.
4. Commit the changes with Git.
5. Push to GitHub.
6. Let GitHub Pages serve the updated site.

```sh
git status
git add docs
git commit -m "Update docs"
git push
```

If your content lives in a separate repository, run the Git commands there instead of in the Papyrus app repository.

The content repository's GitHub Actions workflow regenerates and commits its root `manifest.json` after Markdown changes are pushed. The manifest records the pushed content revision, so Papyrus can fetch each note from that immutable version. See [[workflow/content-repository|Content repository and manifest]] for setup.

For the local `docs` vault, regenerate the development manifest before previewing changes:

```sh
npm run manifest
```

## Practical checks

- Does the home note open?
- Do wiki links resolve?
- Are image paths correct?
- Does search find the new content?
- Do source, download, and share links point where you expect?
- Does `manifest.json` contain the new frontmatter and link relationships?

For syntax examples, see [[reference/markdown]].
