---
title: Setup Workflow
status: draft
tags: setup, workflow, github-pages
---

# Setup Workflow

This is the short path from a local vault to a public site.

## 1. Clone Publisher

Create your own copy of the Publisher repository on GitHub, then clone it:

```sh
git clone https://github.com/your-user-or-org/publisher.git
cd publisher
```

Serve it locally with any static file server:

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173/`.

## 2. Configure GitHub Pages

In the repository settings, enable GitHub Pages. GitHub's guide is the canonical reference: [Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## 3. Choose a content repository

You can keep Markdown files in the Publisher repository, or in a separate public repository. Separate content is usually cleaner once the vault grows.

Update `config/app-config.json`, then test the site locally.

## 4. Write your vault

Use Obsidian or another Markdown editor to create notes. Link notes with wiki links, add frontmatter when useful, and keep media paths predictable.

Next: [[workflow/publish]].
