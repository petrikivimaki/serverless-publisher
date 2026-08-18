---
title: Content Repository and Manifest
status: reference
tags: content, manifest, github-actions, performance
---

# Content Repository and Manifest

Papyrus discovers notes through one versioned `manifest.json`. It never scans a browser-visible directory or calls GitHub's tree API. The same manifest contract drives local development and public GitHub content.

## Loading model

At startup, Papyrus loads only the app config and content manifest. The manifest supplies the file tree, note titles, every frontmatter property, excerpts, document measurements, content hashes, outgoing internal links, and backlinks. Search uses the manifest title, path, excerpt, and complete frontmatter metadata instead of downloading every note body. The home screen likewise selects the first three records whose metadata contains `featured: true`.

Opening a note fetches that Markdown file from its source URL. Papyrus retains the parsed body in a page-lifetime memory cache, so opening the same note again does not create another network request. Concurrent attempts to open the same unloaded note also share one request.

Remote note URLs use the immutable commit in `manifest.revision`. This keeps a loaded manifest and its note bodies on the same content version even when the repository branch changes afterward.

## Remote repository layout

A separate public content repository should use this basic layout:

```text
content-repository/
├── .github/
│   └── workflows/
│       └── update-manifest.yml
├── images/
├── notes/
│   ├── README.md
│   └── topics/
│       └── example.md
├── scripts/
│   └── generate-content-manifest.mjs
└── manifest.json
```

Copy `scripts/generate-content-manifest.mjs` from Papyrus into the content repository. Copy `templates/content-repository/.github/workflows/update-manifest.yml` to `.github/workflows/update-manifest.yml` there. The bundled workflow watches Markdown changes under `notes`, regenerates the root manifest, and commits it with the GitHub Actions bot.

If the content branch, note directory, or filenames differ, update the workflow triggers and generator arguments together.

Configure Papyrus with the matching repository paths:

```json
"github": {
	"enabled": true,
	"owner": "your-user-or-org",
	"repo": "your-content-repository",
	"branch": "main",
	"manifestPath": "manifest.json",
	"rootPath": "notes",
	"assetRootPath": "images"
}
```

Papyrus fetches the remote manifest from `raw.githubusercontent.com`. `github.rootPath` must match `manifest.contentRoot`; this catches a mismatched workflow or app configuration before any article is opened. Markdown bodies and relative article assets use jsDelivr CDN URLs pinned to the manifest revision.

## Manifest records

The generator creates one record per `.md` or `.mdx` file:

```json
{
	"path": "topics/example.md",
	"title": "Example",
	"metadata": {
		"title": "Example",
		"tags": ["reference", "demo"],
		"status": "published",
		"featured": true
	},
	"outgoingLinks": [
		{
			"type": "wiki",
			"target": "README",
			"path": "README.md"
		}
	],
	"backlinks": ["README.md"],
	"excerpt": "A short plain-text preview…",
	"wordCount": 120,
	"characterCount": 734,
	"size": 1024,
	"hash": "a-sha-256-content-hash"
}
```

`metadata` preserves every supported frontmatter property rather than applying the reader-panel allowlist. Wiki links and Markdown links to `.md` or `.mdx` files are scanned outside fenced code blocks. Resolved outgoing links include their manifest path; missing targets keep `path: null`. A second pass writes the reverse source paths to each target's `backlinks` array.

The full contract is documented by `config/content-manifest.schema.json`.

## Local development manifest

The bundled local vault keeps `docs/manifest.json`. It is not updated by a watcher or by the development server. After adding, moving, deleting, or editing a local note, update it explicitly:

```sh
npm run manifest
```

This runs the same generator against `docs`, which keeps local tree, search, frontmatter, outgoing links, and backlinks aligned with the remote model.

Next: [[workflow/publish|Publishing workflow]].
