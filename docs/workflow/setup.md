---
title: Setup Workflow
status: draft
featured: true
tags: setup, workflow, github-pages
---

# Setup Workflow

This is the short path from a local vault to a public site.

## 1. Clone Papyrus

Create your own copy of the Papyrus repository on GitHub, then clone it:

```sh
git clone https://github.com/your-user-or-org/papyrus.git
cd papyrus
```

Serve it locally with any static file server:

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173/`.

## 2. Configure GitHub Pages

In the repository settings, enable GitHub Pages. GitHub's guide is the canonical reference: [Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## 3. Choose a content repository

You can keep Markdown files in the Papyrus repository, or in a separate public repository. Separate content is usually cleaner once the vault grows.

Update `config/app-config.json`, then test the site locally.

Both sources use the same generated manifest contract. A remote repository keeps `manifest.json` at its root and updates it on every content push; the local `docs/manifest.json` is updated explicitly during development. See [[workflow/content-repository|Content repository and manifest]] for the repository layout, bundled generator, GitHub Actions workflow, link metadata, lazy note loading, and cache behavior.

The `home` section controls the standalone front page title, subtitle, and background. Home cards come from article frontmatter instead of app config: set `featured: true` on a note and regenerate the manifest. Papyrus displays the first three featured records in manifest order, using each note's manifest title and excerpt. See [[reference/interface#home-screen|Home screen]] for the resulting interaction and responsive behavior.

The sample brand mark lives at `images/papyrus-mark.png`. The same transparent, monochrome PNG supplies the browser favicon, Apple touch icon, primary menu logo, and default page-load mark. The primary menu inverts the black linework to white for Dark and Ocean, while the page-load mask always uses the white treatment. When forking Papyrus, replace that file to update every sample-brand surface at once, or update the corresponding paths in `index.html`, `404.html`, and `pageLoadAnimation.logo` if you prefer a different filename. Set the theme-independent mask color with `pageLoadAnimation.backgroundColor`, using any valid CSS color, or set `pageLoadAnimation.enabled` to `false` to remove the startup mask entirely. These settings remain in the central config, but a small render-blocking module reads them before the first paint so an enabled mask cannot lose a race with the underlying interface. If the configured logo cannot load, Papyrus keeps the color-only mask and continues startup; an unrelated failed favicon request does not control the mask lifecycle.

The shared Open Graph and Twitter/X preview image lives at `images/papyrus-social-card.png`. It is a text-free 1200 × 630 placeholder so it can suit many writing-focused forks without retaining the Papyrus name inside the artwork. `index.html` declares its dimensions, accessible description, and `summary_large_image` treatment. Its checked-in canonical, `og:url`, `og:image`, and `twitter:image` values use `https://username.github.io/` as an intentional fork-time placeholder. Replace that origin—and add the repository path when publishing as a project site—alongside the other social metadata during setup.

The `appearance` section defines the side-menu layout plus the initial theme, sound state, typeface, text alignment, font size, leading, and reading measure. Set `primaryMenuSide` to `left` or `right`; `left` is the shipped default. This layout choice belongs to the site owner, is not shown in quick settings, and is never replaced by browser-stored reader preferences. Set `soundEnabled` to control whether Cuelume interaction cues start on. Readers can override the remaining content-experience defaults from the floating quick-settings popover, and Papyrus saves their choices in that browser. The `selectionMenu.searchProviders` array defines ordered external actions for selected article text with author-facing labels, optional Font Awesome icons, and HTTP(S) URL templates containing `{selection}`; see [[reference/interface#selected-text-tools|Selected text tools]] for the full contract and adaptive menu behavior. The `linktree` section builds the primary menu's compact profile from optional introduction text, grouped cards, inferred service icons, and timezone clocks; see [[reference/linktree]] for its complete shape. See [[reference/interface]] for the rest of the shell and navigation behavior.

## 4. Write your vault

Use Obsidian or another Markdown editor to create notes. Link notes with wiki links, add [[reference/extensions/frontmatter|frontmatter]] when useful, and keep media paths predictable.

Next: [[workflow/content-repository|Content repository and manifest]], then [[workflow/publish]].
