# Papyrus

Papyrus turns a directory of Markdown files into a public, Obsidian-style knowledge base. It is a client-side static app with no backend or build step, designed for hosting on services such as GitHub Pages.

See an example deployment at [pmk.dev](https://pmk.dev).

## Features

- Local vaults and content hosted in public GitHub repositories
- Manifest-backed file browsing and full-metadata search
- Wiki links, backlinks, bookmarks, a calendar, and vault insights
- Obsidian-compatible callouts, comments, footnotes, and Mermaid diagrams
- Syntax highlighting, maps, market tickers, periodic tables, and SWOT cards
- Configurable light and dark themes, home screen, metadata, navigation, and interaction sounds
- Lazy, revision-pinned content loading for static hosting

## Get started

Clone the repository, enter its directory, and start the development server:

```sh
git clone https://github.com/petrikivimaki/papyrus.git
cd papyrus
npm run dev
```

Open [http://localhost:4242](http://localhost:4242) in a browser. No package installation is needed; the development command uses Python's built-in HTTP server. Opening `index.html` directly is not supported because the app loads configuration and content with `fetch()`.

The bundled `docs` directory is both the local demo vault and the full project guide. After changing its Markdown files, regenerate its content manifest:

```sh
npm run manifest
```

## Configure content

Runtime settings live in [`config/app-config.json`](config/app-config.json). Use [`config/app-config.example.json`](config/app-config.example.json) as the complete configuration reference and [`config/app-config.schema.json`](config/app-config.schema.json) for validation.

Papyrus can read the bundled local vault or load a Markdown vault from a public GitHub repository. Both sources use the same generated manifest format. Follow the [setup guide](docs/workflow/setup.md) to choose a source, then see [Content repository and manifest](docs/workflow/content-repository.md) for the remote repository layout and update workflow.

## Documentation

- [Introduction](docs/start/papyrus.md)
- [Setup](docs/workflow/setup.md)
- [Publishing](docs/workflow/publish.md)
- [Markdown and Obsidian features](docs/reference/extensions/obsidian-and-papyrus.md)
- [Papyrus components](docs/reference/extensions/papyrus-components.md)
- [Interface](docs/reference/interface.md)

## Deployment

Papyrus is made of static HTML, CSS, JavaScript, configuration, and content files. Configure the app, commit the files to a public repository, and serve it with GitHub Pages or another static host. See the [publishing guide](docs/workflow/publish.md) for the deployment checklist.

Browser dependencies are imported directly from version-pinned CDN URLs, so there is no package installation or production build step.

## License

[MIT](LICENSE)
