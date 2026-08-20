---
title: Interface and Reading Controls
status: draft
tags: papyrus, interface, appearance
---

# Interface and Reading Controls

Papyrus uses a three-part reading shell: a primary menu for browsing the vault, a central reading workspace, and a secondary menu for the active note's context. Both side menus are optional, so the article can use the entire window when they are closed. The primary menu occupies the left side by default; site owners can set `appearance.primaryMenuSide` to `right` to exchange the menus' physical sides without changing their content or controls. Readers cannot override this layout choice. The primary menu header presents the sample monochrome, calligraphic Papyrus mark first, followed by the configured site title and the menu close action. The black master mark remains black in Light and Sand, then inverts to white in Dark and Ocean.

The shell always matches the visible browser viewport and does not scroll as a single page. The article and each side-menu content region scroll independently only when their own content exceeds the available height. Reaching an internal scroll boundary does not pass wheel movement to the shell or create a viewport bounce. The initial HTML uses the same collapsed menu state as the runtime, so config and vault loading cannot briefly reveal either side menu during the first paint or a page refresh. Menu transitions remain disabled until the configured side has been applied, preventing a swapped responsive menu from crossing the viewport during startup. A small render-blocking startup module reads the central config before that first paint. When the optional page-load animation is enabled, it prepares the configured theme-independent mask color before allowing the browser to render; when disabled, it leaves the initial render uncovered. An unavailable startup logo degrades to the color-only mask, while an independent recovery timer releases the mask if later application code cannot complete its normal cleanup.

Open articles show a thin reading-progress line along the top of the central workspace. The line begins at the workspace's left edge and grows toward the right as the article scrolls, reaching the full workspace width at the bottom. It is scoped to the reading area, so neither side menu is covered, and it stays hidden on the standalone home screen.

## Home screen

The standalone home screen centers the configured title and subtitle plus up to three featured-note calls to action over an optional background image. A note becomes eligible when its frontmatter contains `featured: true`; Papyrus selects the first three matching records in manifest order and uses their generated titles and excerpts for card content. This selection does not fetch the featured note bodies. Each CTA uses a compact liquid-glass card that remains legible against varied photography. The card derives a section label from the note's first path segment and keeps a circular arrow visible as the action affordance. Hover and keyboard focus lift the complete card without underlining its text, while narrow screens stack the cards and reduce their vertical padding.

Configure the title, subtitle, and background under `home` in `config/app-config.json`. Configure card selection with article frontmatter and regenerate the manifest; see [[reference/extensions/frontmatter|Frontmatter properties]] and [[workflow/setup]] for the broader workflow.

## Floating navigation

The floating navigation stays centered at the bottom of the window. On wide screens it shows icons and labels; on narrower screens it keeps the same actions and collapses to icons.

Temporary event feedback, including vault load counts, copy confirmations, bookmark changes, and errors, appears in a full-length status row attached to the top of the floating navigation. After a vault loads, the message identifies its source as either the local vault or the configured `owner/repository` on GitHub. The row is consistently narrower than the navigation regardless of message length. It slides out from behind the navigation, remains visible briefly, and then retracts into it; readers who prefer reduced motion receive the same updates without the transition. A running focus timer uses this same row persistently. Temporary feedback can replace the countdown briefly, then the timer returns without losing time.

- **Home** returns to the dedicated front page.
- **Library** opens or closes the primary menu on the file tree.
- **Search** opens or closes the primary menu on manifest-backed vault search.
- **Top** appears only after the reader has scrolled at least 800 pixels or one full reading viewport, whichever is greater, then smoothly returns the workspace to its beginning. It never appears on pages that cannot reach that threshold.
- **Details** opens or closes the secondary menu for the current note.
- **Settings** opens the compact appearance popover anchored above the navigation.

The Details menu presents source actions and metadata first, followed by the table of contents, backlinks, and outgoing links. Backlink and outgoing-link entries use compact 13px rows with small file icons so relationship lists stay visually subordinate to the article context around them.

The primary menu's tab strip also exposes Calendar, Bookmarks, Graph, and Links without requiring a permanent tool rail. Its shared active indicator slides between view buttons, while reduced-motion preferences keep the state change immediate. The Links view is a configurable compact profile with grouped links and local clocks; see [[reference/linktree]] for its card model and automatic service icons. The Library view keeps the vault tree focused on browsing: its **Vault** row reports the note count and provides icon controls to open or close every folder, without duplicating the manifest-backed search field. A subtle, Linktree-style card anchored below the tree identifies the **Local vault** or configured GitHub repository and keeps the content refresh action close to that source context. The card uses the same background as the primary menu and appears only in the Library view, leaving the primary header dedicated to the configured site title and menu close action. The Bookmarks view aligns its empty-state card and bookmarked-note cards to the inset width of the **Remove all bookmarks** button; the empty state uses the same soft card treatment as an active bookmark.

The Search view uses a single **Search notes...** field to match manifest titles, paths, excerpts, and every frontmatter value. It does not download unopened note bodies to search them. Before a query is entered, the search scope appears in the same soft card treatment used for the selected result. The first result is selected as the query changes; **Up Arrow** and **Down Arrow** move that selection, and **Enter** opens it while keyboard focus remains in the search field.

Library, Search, and Details use active emphasis only while their corresponding side menu is open. Closing a menu from either the floating navigation or the menu's own close button removes that emphasis. Home is a navigation action rather than a toggle, so it uses hover and focus feedback but never keeps an active highlight.

## Quick settings

Quick settings collect every content experience control in one place: focus timer, theme, sound, typeface, alignment, text size, leading, and reading measure. The timer begins at 5 minutes; its duration button cycles through 5, 10, 15, and 20 minutes, while the adjacent start control begins or restarts the countdown. The countdown remains active while navigating between the home screen and articles. It clears after completion, reports that it finished, and includes a close control for ending it early.

The four palettes are Light, Sand, Ocean, and Dark. Ocean is the cooler dark alternative: it uses subtly blue-black backgrounds, otherwise neutral slate surfaces and borders, soft gray text, and a restrained periwinkle-blue accent. Dark remains the more neutral charcoal palette with a violet accent. Both dark palettes use the same inverted treatment for diagrams, callouts, and the primary-menu brand mark.

The icon-only sound control turns all Cuelume interaction cues on or off. The dependency-free typeface choices preserve the intent of Papyrus Pro with common web-safe fonts: **Literary** uses Georgia, **Modern** uses Arial, and **Monospace** uses Courier New. Appearance changes apply immediately and are saved in browser storage. A saved reader preference takes precedence over the configured default on that browser; the focus timer is session-only.

Site owners set the defaults under `appearance` in `config/app-config.json`, including `soundEnabled`. The same section contains the owner-only `primaryMenuSide` layout setting, which is intentionally absent from quick settings and browser storage. See [[workflow/setup]] for the rest of the runtime configuration workflow.

## Interaction sounds

Papyrus uses Cuelume to synthesize lightweight Web Audio cues at runtime, so no audio files are downloaded. The floating navigation and the primary menu tabs use quiet hover and toggle feedback. File-tree folders use a toggle cue, while opening notes from the primary or secondary menu uses a page cue. Browsers may keep audio silent until the reader first interacts with the page.

## Responsive behavior

At narrower window widths, the side menus become temporary overlays so they do not reduce the reading area. Each menu opens from its configured physical side, and the primary and secondary close buttons plus their matching floating navigation actions keep both menus independently toggleable. Closed menus keep their side-aware off-screen transform across the responsive breakpoint, preventing resize transitions from briefly revealing them.

Continue with [[reference/markdown]] for supported content syntax or return to [[start/papyrus]] for the project overview.
