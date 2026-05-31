---
title: GitHub and GitHub Pages
status: reference
tags: github, git, github-pages
---

# GitHub and GitHub Pages

[Git](https://git-scm.com/) tracks changes to files. [GitHub](https://github.com/) hosts Git repositories. [GitHub Pages](https://pages.github.com/) publishes static websites from a repository.

Publisher fits that model because it is only HTML, CSS, JavaScript, JSON, images, and Markdown. There is no server to run.

## Two common repository setups

| Setup | Best for |
| ----- | -------- |
| One repository | Small personal sites where app and content move together |
| App repository plus content repository | Larger vaults or editorial workflows where content changes more often than the app |

The config file decides where Publisher loads content from. For a remote vault, update `config/app-config.json` with your GitHub owner, repository, branch, and optional root folder.

```json
{
	"github": {
		"enabled": true,
		"owner": "your-user-or-org",
		"repo": "your-markdown-vault",
		"branch": "main",
		"rootPath": "docs"
	}
}
```
