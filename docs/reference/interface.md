---
title: Interface and Reading Controls
status: draft
tags: papyrus, interface, appearance
---

# Interface and Reading Controls

Papyrus uses a three-part reading shell: a primary menu for browsing the vault, a central reading workspace, and a secondary menu for the active note's context. Both side menus are optional, so the article can use the entire window when they are closed.

## Floating navigation

The floating navigation stays centered at the bottom of the window. On wide screens it shows icons and labels; on narrower screens it keeps the same actions and collapses to icons.

- **Home** returns to the dedicated front page.
- **Library** opens or closes the primary menu on the file tree.
- **Search** opens or closes the primary menu on full-vault search.
- **Top** appears only after the reader has scrolled at least 800 pixels or one full reading viewport, whichever is greater, then smoothly returns the workspace to its beginning. It never appears on pages that cannot reach that threshold.
- **Details** opens or closes the secondary menu for the current note.
- **Settings** opens the compact appearance popover anchored above the navigation.

The primary menu's tab strip also exposes Calendar, Bookmarks, Graph, and Links without requiring a permanent tool rail. Its shared active indicator slides between view buttons, while reduced-motion preferences keep the state change immediate. The Library view keeps the vault tree focused on browsing: its **Vault** row reports the note count and provides icon controls to open or close every folder, without duplicating the full-vault search field.

The Search view uses a single **Search everything...** field to match titles, paths, tags, and note text. Before a query is entered, the search scope appears in the same soft card treatment used for the selected result. The first result is selected as the query changes; **Up Arrow** and **Down Arrow** move that selection, and **Enter** opens it while keyboard focus remains in the search field.

Library, Search, and Details use active emphasis only while their corresponding side menu is open. Closing a menu from either the floating navigation or the menu's own close button removes that emphasis. Home is a navigation action rather than a toggle, so it uses hover and focus feedback but never keeps an active highlight.

## Quick settings

Quick settings collect every content experience control in one place: theme, sound, typeface, alignment, text size, leading, and reading measure. The icon-only sound control turns all Cuelume interaction cues on or off. The dependency-free typeface choices preserve the intent of Papyrus Pro with common web-safe fonts: **Literary** uses Georgia, **Modern** uses Arial, and **Monospace** uses Courier New. Changes apply immediately and are saved in browser storage. A saved reader preference takes precedence over the configured default on that browser.

Site owners set the defaults under `appearance` in `config/app-config.json`, including `soundEnabled`. See [[workflow/setup]] for the rest of the runtime configuration workflow.

## Interaction sounds

Papyrus uses Cuelume to synthesize lightweight Web Audio cues at runtime, so no audio files are downloaded. The floating navigation and the primary menu tabs use quiet hover and toggle feedback. File-tree folders use a toggle cue, while opening notes from the primary or secondary menu uses a page cue. Browsers may keep audio silent until the reader first interacts with the page.

## Responsive behavior

At narrower window widths, the side menus become temporary overlays so they do not reduce the reading area. Their close buttons and the matching floating navigation actions keep both menus independently toggleable. Closed menus keep their off-screen transform across the responsive breakpoint, preventing resize transitions from briefly revealing them.

Continue with [[reference/markdown]] for supported content syntax or return to [[start/papyrus]] for the project overview.
