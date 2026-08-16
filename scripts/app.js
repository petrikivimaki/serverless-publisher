import { marked } from "https://cdn.jsdelivr.net/npm/marked@18.0.4/+esm";
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.16.0/+esm";
import Prism from "https://cdn.jsdelivr.net/npm/prismjs@1.30.0/+esm";
import QRCode from "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm";
import {
	bind as bindCuelume,
	play as playCuelume,
	setEnabled as setCuelumeEnabled,
	setVolume as setCuelumeVolume
} from "https://cdn.jsdelivr.net/npm/cuelume@0.2.2/+esm";
import "https://cdn.jsdelivr.net/npm/prismjs@1.30.0/components/prism-json.min.js";
import "https://cdn.jsdelivr.net/npm/prismjs@1.30.0/plugins/autoloader/prism-autoloader.min.js";
import { getPeriodicTableElementUrl, periodicTableElements } from "./periodic-table.js";

Prism.manual = true;
Prism.plugins.autoloader.languages_path = "https://cdn.jsdelivr.net/npm/prismjs@1.30.0/components/";

const state = {
	bookmarks: [],
	config: {},
	files: [],
	folderState: {},
	notes: [],
	activePath: "",
	activePanel: "files",
	activeView: "home",
	calendarDate: new Date(),
	contentWidth: 820,
	fontFamily: "modern",
	fontSize: 18,
	lineHeight: 1.68,
	leftCollapsed: true,
	mathJaxPromise: null,
	mapLibrePromise: null,
	maps: [],
	rightCollapsed: true,
	settingsOpen: false,
	soundEnabled: true,
	qrCodeTimer: 0,
	searchResultIndex: -1,
	selectedText: "",
	scrollTopFrame: 0,
	theme: "light",
	textAlign: "left",
	tocState: {},
	toastTimer: 0
};

const bookmarkStorageKey = "papyrus.bookmarks";
const appearanceStorageKey = "papyrus.appearance";
const codeRunnerChannel = "papyrus-code-runner";
const codeRunnerSessions = new Map();
const githubTreeCache = new Map();
const minimumSelectionCharacters = 5;
const maximumQrCodeCharacters = 100;
const minimumScrollTopOffset = 800;
const qrCodeVisibleMs = 18000;
const soundEffectsVolume = 0.36;
const mapPropertyNames = ["latitude", "longitude", "zoom", "marker", "grayscale", "label"];
const tickerPropertyNames = ["symbol", "label", "quote", "market", "change"];
const swotPropertyNames = ["strengths", "weaknesses", "opportunities", "threats"];
const ptePropertyNames = ["label", "elements"];
const defaultPeriodicTableLinkTemplate = "https://pubchem.ncbi.nlm.nih.gov/element/{Z}";
const defaultPeriodicTableLinkLabel = "PubChem";
const periodicTableElementLookup = createPeriodicTableElementLookup();
let codeRunnerSessionCount = 0;
const themes = [
	{ id: "light", label: "Light" },
	{ id: "sand", label: "Sand" },
	{ id: "ocean", label: "Ocean" },
	{ id: "dark", label: "Dark" }
];

const selectors = {
	appShell: ".app-shell",
	article: "[data-article]",
	backlinkList: "[data-backlink-list]",
	bookmarkButton: "[data-action='toggle-bookmark']",
	bookmarkIcon: "[data-bookmark-icon]",
	bookmarkLabel: "[data-bookmark-label]",
	bookmarksList: "[data-bookmarks-list]",
	calendarDays: "[data-calendar-days]",
	calendarTitle: "[data-calendar-title]",
	calendarWeekdays: "[data-calendar-weekdays]",
	fileTree: "[data-file-tree]",
	fontFamily: "[data-font-family]",
	fontSizeInput: "[data-font-size]",
	fontSizeValue: "[data-font-size-value]",
	graphList: "[data-graph-list]",
	leftPanel: "[data-left-panel]",
	lineHeightInput: "[data-line-height]",
	lineHeightValue: "[data-line-height-value]",
	contentWidthInput: "[data-content-width]",
	contentWidthValue: "[data-content-width-value]",
	linktreeList: "[data-linktree-list]",
	metadataList: "[data-metadata-list]",
	outgoingList: "[data-outgoing-list]",
	pageLoadLogo: "[data-page-load-logo]",
	pageLoadMask: "[data-page-load-mask]",
	qrCodeBlock: "[data-qr-code-block]",
	qrCodeImage: "[data-qr-code-image]",
	qrCodeSummary: "[data-qr-code-summary]",
	qrSelectionButton: "[data-action='qr-selection']",
	quickSettings: "[data-quick-settings]",
	rightPanel: "[data-right-panel]",
	searchInput: "[data-search-input]",
	searchResults: "[data-search-results]",
	scrollTopButton: "[data-action='scroll-top']",
	selectionCount: "[data-selection-count]",
	selectionMenu: "[data-selection-menu]",
	soundChoice: "[data-sound-choice]",
	sourceArticleLink: "[data-source-article-link]",
	sourceDownloadLink: "[data-source-download-link]",
	sourceRepoLink: "[data-source-repo-link]",
	textOrientation: "[data-text-orientation]",
	themeToggle: "[data-theme-toggle]",
	tocList: "[data-toc-list]",
	toast: "[data-toast]",
	vaultNoteCount: "[data-vault-note-count]",
	vaultSource: "[data-vault-source]",
	vaultTitle: "[data-vault-title]"
};

/**
 * Selects a single element.
 * @param {string} selector
 * @returns {Element}
 */
function select(selector) {
	return document.querySelector(selector);
}

/**
 * Selects many elements.
 * @param {string} selector
 * @returns {NodeListOf<Element>}
 */
function selectAll(selector) {
	return document.querySelectorAll(selector);
}

/**
 * Boots the application.
 * @returns {Promise<void>}
 */
async function init() {
	loadBookmarks();
	bindEvents();
	await loadVault();
}

/**
 * Loads config and markdown content.
 * @returns {Promise<void>}
 */
async function loadVault() {
	let loadAnimation = null;

	try {
		state.config = await fetchJson("config/app-config.json");
		loadAnimation = startPageLoadAnimation();
		loadAppearance();
		applySoundSettings();
		bindCuelume();
		applyReaderSettings();
		applyTheme();
		renderReaderControls();
		renderSoundControls();
		renderThemeToggle();
		document.title = state.config.title || "Papyrus";
		select(selectors.vaultTitle).textContent = state.config.title || "Papyrus";
		state.files = await loadFiles({ config: state.config });
		state.notes = indexNotes({ files: state.files });
		select(selectors.vaultSource).textContent = getVaultSourceLabel({ config: state.config });
		renderAll();
		openRouteFromHash();
		showToast({ message: `Loaded ${state.notes.length} notes.` });
		await finishPageLoadAnimation({ loadAnimation });
	} catch (error) {
		await finishPageLoadAnimation({ loadAnimation });
		renderError({ error });
	}
}

/**
 * Fetches JSON from a path.
 * @param {string} path
 * @returns {Promise<object>}
 */
async function fetchJson(path) {
	const response = await fetch(path, { cache: "no-cache" });

	if (!response.ok) {
		throw new Error(`Could not load ${path}`);
	}

	return await response.json();
}

/**
 * Starts the optional page load animation.
 * @returns {object|null}
 */
function startPageLoadAnimation() {
	const config = state.config.pageLoadAnimation || {};
	const mask = select(selectors.pageLoadMask);
	const logo = select(selectors.pageLoadLogo);
	const durationMs = getAnimationNumber({ value: config.durationMs, fallback: 1500 });
	const fadeMs = getAnimationNumber({ value: config.fadeMs, fallback: 420 });

	if (!config.enabled) {
		return null;
	}

	logo.src = config.logo || "images/logo-white-transparent-1000x1000.png";
	mask.style.setProperty("--page-load-fade-ms", `${fadeMs}ms`);
	mask.classList.remove("is-dimming", "is-leaving");
	mask.classList.add("is-visible");

	return {
		startedAt: performance.now(),
		durationMs,
		fadeMs,
		mask
	};
}

/**
 * Finishes the optional page load animation.
 * @param {object} params
 * @param {object|null} params.loadAnimation
 * @returns {Promise<void>}
 */
async function finishPageLoadAnimation({ loadAnimation }) {
	if (!loadAnimation) {
		return;
	}

	const elapsedMs = performance.now() - loadAnimation.startedAt;
	const remainingMs = Math.max(0, loadAnimation.durationMs - elapsedMs);

	if (remainingMs) {
		await delay(remainingMs);
	}

	loadAnimation.mask.classList.add("is-dimming");
	await delay(Math.max(0, loadAnimation.fadeMs - 120));
	loadAnimation.mask.classList.add("is-leaving");
	await delay(160);
	loadAnimation.mask.classList.remove("is-visible", "is-dimming", "is-leaving");
}

/**
 * Gets a valid animation timing value.
 * @param {object} params
 * @param {number|string} params.value
 * @param {number} params.fallback
 * @returns {number}
 */
function getAnimationNumber({ value, fallback }) {
	const number = Number(value);

	if (Number.isFinite(number) && number >= 0) {
		return number;
	}

	return fallback;
}

/**
 * Waits for a number of milliseconds.
 * @param {number} milliseconds
 * @returns {Promise<void>}
 */
function delay(milliseconds) {
	return new Promise((resolve) => {
		window.setTimeout(resolve, milliseconds);
	});
}

/**
 * Loads markdown files from GitHub or local fallback.
 * @param {object} params
 * @param {object} params.config
 * @returns {Promise<Array<object>>}
 */
async function loadFiles({ config }) {
	if (config.github?.enabled) {
		return await loadGithubFiles({ github: config.github });
	}

	if (config.localFallback?.enabled) {
		return await loadLocalFiles({ manifestPath: config.localFallback.manifest });
	}

	return [];
}

/**
 * Loads markdown files listed in a local manifest.
 * @param {object} params
 * @param {string} params.manifestPath
 * @returns {Promise<Array<object>>}
 */
async function loadLocalFiles({ manifestPath }) {
	const manifestResponse = await fetch(manifestPath, { cache: "no-cache" });

	if (!manifestResponse.ok) {
		return [];
	}

	const manifest = await manifestResponse.json();
	const basePath = manifestPath.split("/").slice(0, -1).join("/");
	const files = [];

	for (let index = 0; index < manifest.files.length; index += 1) {
		const path = manifest.files[index];
		const response = await fetch(`${basePath}/${path}`, { cache: "no-cache" });

		if (response.ok) {
			files.push({
				path,
				name: getFileName(path),
				content: await response.text(),
				sourceUrl: `${basePath}/${path}`
			});
		}
	}

	return files;
}

/**
 * Loads markdown files from a public GitHub repository.
 * @param {object} params
 * @param {object} params.github
 * @returns {Promise<Array<object>>}
 */
async function loadGithubFiles({ github }) {
	const treeData = await loadGithubTree({ github });
	const rootPath = normalizePath(github.rootPath || "");
	const markdownItems = filterMarkdownTree({ tree: treeData.tree || [], rootPath });
	const files = [];

	for (let index = 0; index < markdownItems.length; index += 1) {
		const item = markdownItems[index];
		const rawPath = item.path;
		const displayPath = rootPath ? rawPath.replace(`${rootPath}/`, "") : rawPath;
		const cdnUrl = getGithubCdnUrl({ path: displayPath });
		const response = await fetch(cdnUrl);

		if (response.ok) {
			files.push({
				path: displayPath,
				name: getFileName(displayPath),
				content: await response.text(),
				sourceUrl: cdnUrl
			});
		}
	}

	return files;
}

/**
 * Loads a GitHub repository tree with a page-lifetime cache.
 * @param {object} params
 * @param {object} params.github
 * @returns {Promise<object>}
 */
async function loadGithubTree({ github }) {
	const cached = readGithubTreeCache({ github });

	if (cached) {
		return cached;
	}

	const commit = await fetchGithubBranchCommit({ github });
	const tree = await fetchGithubTree({ github, sha: commit.treeSha });

	writeGithubTreeCache({
		github,
		treeData: {
			commitSha: commit.commitSha,
			treeSha: commit.treeSha,
			tree: tree.tree || []
		}
	});

	return {
		commitSha: commit.commitSha,
		treeSha: commit.treeSha,
		tree: tree.tree || []
	};
}

/**
 * Fetches the latest branch commit metadata.
 * @param {object} params
 * @param {object} params.github
 * @returns {Promise<object>}
 */
async function fetchGithubBranchCommit({ github }) {
	const commitUrl = `https://api.github.com/repos/${github.owner}/${github.repo}/commits/${github.branch}`;
	const response = await fetch(commitUrl);

	if (!response.ok) {
		throw new Error("Could not load the GitHub branch commit.");
	}

	const data = await response.json();
	const treeSha = data.commit?.tree?.sha || "";
	const commitSha = data.sha || "";

	if (!treeSha) {
		throw new Error("The GitHub branch commit did not include a tree SHA.");
	}

	return { commitSha, treeSha };
}

/**
 * Fetches a recursive GitHub tree by SHA.
 * @param {object} params
 * @param {object} params.github
 * @param {string} params.sha
 * @returns {Promise<object>}
 */
async function fetchGithubTree({ github, sha }) {
	const treeUrl = `https://api.github.com/repos/${github.owner}/${github.repo}/git/trees/${sha}?recursive=1`;
	const response = await fetch(treeUrl);

	if (!response.ok) {
		throw new Error("Could not load the GitHub repository tree.");
	}

	return await response.json();
}

/**
 * Reads a cached GitHub tree.
 * @param {object} params
 * @param {object} params.github
 * @returns {object|null}
 */
function readGithubTreeCache({ github }) {
	const cached = githubTreeCache.get(getGithubTreeCacheKey({ github }));

	if (cached && Array.isArray(cached.tree)) {
		return cached;
	}

	return null;
}

/**
 * Writes a GitHub tree cache entry.
 * @param {object} params
 * @param {object} params.github
 * @param {object} params.treeData
 * @returns {void}
 */
function writeGithubTreeCache({ github, treeData }) {
	githubTreeCache.set(getGithubTreeCacheKey({ github }), treeData);
}

/**
 * Gets a GitHub tree cache key.
 * @param {object} params
 * @param {object} params.github
 * @returns {string}
 */
function getGithubTreeCacheKey({ github }) {
	return `${github.owner}/${github.repo}@${github.branch}`;
}

/**
 * Filters GitHub tree entries to markdown files.
 * @param {object} params
 * @param {Array<object>} params.tree
 * @param {string} params.rootPath
 * @returns {Array<object>}
 */
function filterMarkdownTree({ tree, rootPath }) {
	const items = [];

	for (let index = 0; index < tree.length; index += 1) {
		const item = tree[index];
		const inRoot = !rootPath || item.path === rootPath || item.path.startsWith(`${rootPath}/`);

		if (item.type === "blob" && inRoot && isMarkdownPath(item.path)) {
			items.push(item);
		}
	}

	return items.sort(sortTreeItemByPath);
}

/**
 * Creates searchable note records.
 * @param {object} params
 * @param {Array<object>} params.files
 * @returns {Array<object>}
 */
function indexNotes({ files }) {
	const notes = [];

	for (let index = 0; index < files.length; index += 1) {
		const file = files[index];
		const parsed = parseFrontmatter(file.content);
		const title = parsed.metadata.title || getTitleFromMarkdown(parsed.body) || removeExtension(file.name);

		notes.push({
			...file,
			title,
			body: parsed.body,
			metadata: parsed.metadata,
			links: extractWikiLinks(parsed.body),
			searchText: `${title} ${file.path} ${parsed.body} ${getSearchMetadataText({ metadata: parsed.metadata })}`.toLowerCase()
		});
	}

	return notes;
}

/**
 * Binds all UI events.
 * @returns {void}
 */
function bindEvents() {
	const panelButtons = selectAll("[data-panel]");

	for (let index = 0; index < panelButtons.length; index += 1) {
		const button = panelButtons[index];
		button.addEventListener("click", handlePanelButtonClick);
	}

	const rightPanelButtons = selectAll("[data-action='toggle-right']");

	for (let index = 0; index < rightPanelButtons.length; index += 1) {
		rightPanelButtons[index].addEventListener("click", toggleRightPanel);
	}

	select("[data-action='open-home']").addEventListener("click", openHome);
	select("[data-action='close-left']").addEventListener("click", closeLeftPanel);
	select("[data-action='scroll-top']").addEventListener("click", scrollArticleToTop);
	select("[data-action='toggle-settings']").addEventListener("click", toggleQuickSettings);
	select("[data-action='refresh']").addEventListener("click", loadVault);
	select("[data-action='open-all-folders']").addEventListener("click", openAllFolders);
	select("[data-action='close-all-folders']").addEventListener("click", closeAllFolders);
	select("[data-action='previous-month']").addEventListener("click", showPreviousMonth);
	select("[data-action='next-month']").addEventListener("click", showNextMonth);
	select("[data-action='current-month']").addEventListener("click", showCurrentMonth);
	select("[data-action='toggle-bookmark']").addEventListener("click", toggleActiveBookmark);
	select("[data-action='clear-bookmarks']").addEventListener("click", clearBookmarks);
	select("[data-action='copy-source-url']").addEventListener("click", copyActiveSourceUrl);
	select("[data-action='copy-published-url']").addEventListener("click", copyActivePublishedUrl);
	select("[data-action='copy-article-content']").addEventListener("click", copyActiveArticleContent);
	select("[data-action='open-obsidian']").addEventListener("click", openActiveArticleInObsidian);
	select("[data-action='copy-selection']").addEventListener("click", copySelectedText);
	select("[data-action='qr-selection']").addEventListener("click", createQrCodeFromSelection);
	select("[data-action='search-selection-google']").addEventListener("click", searchSelectedTextWithGoogle);
	select("[data-action='search-selection-brave']").addEventListener("click", searchSelectedTextWithBrave);
	select(selectors.searchInput).addEventListener("input", handleSearchInput);
	select(selectors.searchInput).addEventListener("keydown", handleSearchKeyDown);
	select(selectors.article).addEventListener("click", handleArticleClick);
	select(selectors.article).addEventListener("scroll", handleArticleScroll, { passive: true });
	select(selectors.fontSizeInput).addEventListener("input", handleFontSizeInput);
	select(selectors.lineHeightInput).addEventListener("input", handleLineHeightInput);
	select(selectors.contentWidthInput).addEventListener("input", handleContentWidthInput);
	select(selectors.tocList).addEventListener("click", handleTocClick);
	window.addEventListener("hashchange", openRouteFromHash);
	window.addEventListener("popstate", openRouteFromHash);
	window.addEventListener("message", handleCodeRunnerMessage);
	document.addEventListener("selectionchange", handleSelectionChange);
	document.addEventListener("pointerdown", handleDocumentPointerDown);
	document.addEventListener("click", handleDocumentClick);
	document.addEventListener("keyup", handleDocumentKeyUp);
	document.addEventListener("keydown", handleDocumentKeyDown);
	window.addEventListener("scroll", hideSelectionMenu, true);
	window.addEventListener("resize", hideSelectionMenu);
	window.addEventListener("resize", renderScrollTopButton);
	bindTextOrientationControls();
	bindFontFamilyControls();
	bindThemeControls();
	bindSoundControls();
}

/**
 * Binds text orientation controls.
 * @returns {void}
 */
function bindTextOrientationControls() {
	const controls = selectAll(selectors.textOrientation);

	for (let index = 0; index < controls.length; index += 1) {
		controls[index].addEventListener("change", handleTextOrientationChange);
	}
}

/**
 * Binds content typeface controls.
 * @returns {void}
 */
function bindFontFamilyControls() {
	const controls = selectAll(selectors.fontFamily);

	for (let index = 0; index < controls.length; index += 1) {
		controls[index].addEventListener("change", handleFontFamilyChange);
	}
}

/**
 * Binds theme choice controls.
 * @returns {void}
 */
function bindThemeControls() {
	const controls = selectAll("[data-theme-choice]");

	for (let index = 0; index < controls.length; index += 1) {
		controls[index].addEventListener("click", handleThemeChoice);
	}
}

/**
 * Binds sound preference controls.
 * @returns {void}
 */
function bindSoundControls() {
	const controls = selectAll(selectors.soundChoice);

	for (let index = 0; index < controls.length; index += 1) {
		controls[index].addEventListener("click", handleSoundChoice);
	}
}

/**
 * Adds Cuelume feedback to a dynamic navigation control.
 * @param {object} params
 * @param {HTMLElement} params.element
 * @param {string} params.cue
 * @returns {void}
 */
function addNavigationSound({ element, cue }) {
	element.dataset.cuelumeHover = "tick";
	element.dataset.cuelumeToggle = cue;
}

/**
 * Sorts GitHub tree items by path.
 * @param {object} first
 * @param {object} second
 * @returns {number}
 */
function sortTreeItemByPath(first, second) {
	return first.path.localeCompare(second.path);
}

/**
 * Handles primary panel button clicks.
 * @param {MouseEvent} event
 * @returns {void}
 */
function handlePanelButtonClick(event) {
	setPanel({ panel: event.currentTarget.dataset.panel });
}

/**
 * Renders all sidebar panels.
 * @returns {void}
 */
function renderAll() {
	renderFileTree();
	renderSearch();
	renderCalendar();
	renderBookmarks();
	renderGraph();
	renderLinktree();
	renderPanels();
	renderShell();
}

/**
 * Renders the active panel state.
 * @returns {void}
 */
function renderPanels() {
	const views = selectAll("[data-view]");
	const buttons = selectAll("[data-panel]");
	const homeButton = select("[data-action='open-home']");

	for (let index = 0; index < views.length; index += 1) {
		views[index].classList.toggle("is-active", views[index].dataset.view === state.activePanel);
	}

	for (let index = 0; index < buttons.length; index += 1) {
		const isActive = !state.leftCollapsed && buttons[index].dataset.panel === state.activePanel;
		buttons[index].classList.toggle("is-active", isActive);
	}

	homeButton.classList.remove("is-active");
}

/**
 * Sets the active utility panel.
 * @param {object} params
 * @param {string} params.panel
 * @returns {void}
 */
function setPanel({ panel }) {
	closeQuickSettings();

	if (!state.leftCollapsed && state.activePanel === panel) {
		state.leftCollapsed = true;
		renderPanels();
		renderShell();
		return;
	}

	state.activePanel = panel;
	state.leftCollapsed = false;
	renderPanels();
	renderShell();

	if (panel === "search") {
		select(selectors.searchInput).focus();
	}
}

/**
 * Closes the primary side menu.
 * @returns {void}
 */
function closeLeftPanel() {
	state.leftCollapsed = true;
	renderPanels();
	renderShell();
}

/**
 * Renders the markdown file tree.
 * @returns {void}
 */
function renderFileTree() {
	const tree = createTree({ notes: state.notes });
	const container = select(selectors.fileTree);
	const count = state.notes.length;

	select(selectors.vaultNoteCount).textContent = `${formatNumber(count)} ${count === 1 ? "note" : "notes"}`;
	container.replaceChildren(renderTreeNode({ node: tree, depth: 0, path: "" }));
}

/**
 * Filters notes using indexed text.
 * @param {object} params
 * @param {Array<object>} params.notes
 * @param {string} params.query
 * @returns {Array<object>}
 */
function filterNotesByText({ notes, query }) {
	const filtered = [];

	for (let index = 0; index < notes.length; index += 1) {
		if (notes[index].searchText.includes(query)) {
			filtered.push(notes[index]);
		}
	}

	return filtered;
}

/**
 * Renders a tree node.
 * @param {object} params
 * @param {object} params.node
 * @param {number} params.depth
 * @param {string} params.path
 * @returns {DocumentFragment|HTMLElement}
 */
function renderTreeNode({ node, depth, path }) {
	const fragment = document.createDocumentFragment();
	const folderNames = Object.keys(node.children).sort();

	for (let index = 0; index < folderNames.length; index += 1) {
		const folderName = folderNames[index];
		const folderPath = path ? `${path}/${folderName}` : folderName;
		const expanded = isFolderExpanded({ path: folderPath });
		const group = document.createElement("div");
		const button = document.createElement("button");
		const children = document.createElement("div");

		group.className = "tree-group";
		group.classList.toggle("is-collapsed", !expanded);
		button.className = "tree-folder";
		button.type = "button";
		button.dataset.path = folderPath;
		addNavigationSound({ element: button, cue: "toggle" });
		button.setAttribute("aria-expanded", String(expanded));
		button.innerHTML = `
			<i class="fa-solid fa-caret-${expanded ? "down" : "right"} tree-caret" aria-hidden="true"></i>
			<i class="fa-${expanded ? "regular fa-folder-open" : "solid fa-folder"} tree-folder-icon" aria-hidden="true"></i>
			<span>${escapeHtml(folderName)}</span>
		`;
		button.addEventListener("click", handleFolderButtonClick);
		children.className = "tree-children";
		children.append(renderTreeNode({
			node: node.children[folderName],
			depth: depth + 1,
			path: folderPath
		}));
		group.append(button, children);
		fragment.append(group);
	}

	for (let index = 0; index < node.notes.length; index += 1) {
		fragment.append(createNoteButton({ note: node.notes[index] }));
	}

	return fragment;
}

/**
 * Handles folder expand and collapse.
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleFolderButtonClick(event) {
	toggleFolder({ path: event.currentTarget.dataset.path });
}

/**
 * Toggles a folder path.
 * @param {object} params
 * @param {string} params.path
 * @returns {void}
 */
function toggleFolder({ path }) {
	state.folderState[path] = !isFolderExpanded({ path });
	renderFileTree();
}

/**
 * Opens every folder in the file tree.
 * @returns {void}
 */
function openAllFolders() {
	const folderButtons = selectAll(".tree-folder");

	for (let index = 0; index < folderButtons.length; index += 1) {
		state.folderState[folderButtons[index].dataset.path] = true;
	}

	renderFileTree();
}

/**
 * Closes every folder in the file tree.
 * @returns {void}
 */
function closeAllFolders() {
	state.folderState = {};
	renderFileTree();
}

/**
 * Checks folder expansion state.
 * @param {object} params
 * @param {string} params.path
 * @returns {boolean}
 */
function isFolderExpanded({ path }) {
	return state.folderState[path] === true;
}

/**
 * Creates a note tree button.
 * @param {object} params
 * @param {object} params.note
 * @returns {HTMLButtonElement}
 */
function createNoteButton({ note }) {
	const button = document.createElement("button");
	button.className = "note-link";
	button.type = "button";
	button.dataset.path = note.path;
	addNavigationSound({ element: button, cue: "page" });
	button.classList.toggle("is-active", note.path === state.activePath);
	button.innerHTML = `
		<span class="note-link-title">${escapeHtml(note.title)}</span>
		<span class="note-link-path">${escapeHtml(note.path)}</span>
	`;
	button.addEventListener("click", handleNoteButtonClick);
	return button;
}

/**
 * Opens a note from a button data path.
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleNoteButtonClick(event) {
	openNote({ path: event.currentTarget.dataset.path });
}

/**
 * Renders bookmarked notes.
 * @returns {void}
 */
function renderBookmarks() {
	const container = select(selectors.bookmarksList);
	const notes = getBookmarkedNotes();

	container.replaceChildren();

	if (!notes.length) {
		container.innerHTML = `<p class="muted">No bookmarked notes yet.</p>`;
		return;
	}

	for (let index = 0; index < notes.length; index += 1) {
		container.append(createNoteButton({ note: notes[index] }));
	}
}

/**
 * Gets bookmarked notes that still exist in the loaded vault.
 * @returns {Array<object>}
 */
function getBookmarkedNotes() {
	const notes = [];

	for (let index = 0; index < state.bookmarks.length; index += 1) {
		const note = findNoteByPath({ path: state.bookmarks[index] });

		if (note) {
			notes.push(note);
		}
	}

	return notes;
}

/**
 * Renders configured Linktree links.
 * @returns {void}
 */
function renderLinktree() {
	const container = select(selectors.linktreeList);
	const links = Array.isArray(state.config.linktree?.links) ? state.config.linktree.links : [];

	container.replaceChildren();

	if (!links.length) {
		container.innerHTML = `<p class="muted">No links configured.</p>`;
		return;
	}

	for (let index = 0; index < links.length; index += 1) {
		container.append(createLinktreeLink({ link: links[index] }));
	}
}

/**
 * Creates a Linktree link.
 * @param {object} params
 * @param {object} params.link
 * @returns {HTMLAnchorElement}
 */
function createLinktreeLink({ link }) {
	const anchor = document.createElement("a");
	const type = normalizeLinkType(String(link.type || ""));
	const icon = getLinktreeIcon({ type });
	const label = String(link.label || "Link");
	const href = String(link.url || "#");

	anchor.className = "linktree-link";
	anchor.href = getExternalLinkHref({ href });
	anchor.target = "_blank";
	anchor.rel = "noreferrer";
	anchor.innerHTML = `
		<i class="${escapeAttribute(icon)}" aria-hidden="true"></i>
		<span>${escapeHtml(label)}</span>
	`;

	return anchor;
}

/**
 * Normalizes a Linktree type.
 * @param {string} type
 * @returns {string}
 */
function normalizeLinkType(type) {
	return type.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
}

/**
 * Gets a Font Awesome icon class for a Linktree type.
 * @param {object} params
 * @param {string} params.type
 * @returns {string}
 */
function getLinktreeIcon({ type }) {
	const icons = {
		bluesky: "fa-brands fa-bluesky",
		discord: "fa-brands fa-discord",
		email: "fa-regular fa-envelope",
		facebook: "fa-brands fa-facebook",
		github: "fa-brands fa-github",
		gitlab: "fa-brands fa-gitlab",
		instagram: "fa-brands fa-instagram",
		linkedin: "fa-brands fa-linkedin",
		mastodon: "fa-brands fa-mastodon",
		medium: "fa-brands fa-medium",
		newsletter: "fa-regular fa-envelope",
		patreon: "fa-brands fa-patreon",
		reddit: "fa-brands fa-reddit",
		rss: "fa-solid fa-rss",
		soundcloud: "fa-brands fa-soundcloud",
		spotify: "fa-brands fa-spotify",
		substack: "fa-regular fa-newspaper",
		telegram: "fa-brands fa-telegram",
		threads: "fa-brands fa-threads",
		tiktok: "fa-brands fa-tiktok",
		twitch: "fa-brands fa-twitch",
		website: "fa-solid fa-globe",
		x: "fa-brands fa-x-twitter",
		twitter: "fa-brands fa-x-twitter",
		youtube: "fa-brands fa-youtube"
	};

	return icons[type] || "fa-solid fa-link";
}

/**
 * Builds a folder tree object.
 * @param {object} params
 * @param {Array<object>} params.notes
 * @returns {object}
 */
function createTree({ notes }) {
	const root = { children: {}, notes: [] };

	for (let index = 0; index < notes.length; index += 1) {
		const note = notes[index];
		const parts = note.path.split("/");
		let node = root;

		for (let partIndex = 0; partIndex < parts.length - 1; partIndex += 1) {
			const part = parts[partIndex];

			if (!node.children[part]) {
				node.children[part] = { children: {}, notes: [] };
			}

			node = node.children[part];
		}

		node.notes.push(note);
	}

	return root;
}

/**
 * Renders search results.
 * @returns {void}
 */
function renderSearch() {
	const input = select(selectors.searchInput);
	const query = input.value.trim().toLowerCase();
	const container = select(selectors.searchResults);
	const results = query ? filterNotesByText({ notes: state.notes, query }).slice(0, 40) : [];
	const hasResults = results.length > 0;

	input.setAttribute("aria-expanded", String(hasResults));

	if (!query) {
		state.searchResultIndex = -1;
		input.removeAttribute("aria-activedescendant");
		container.innerHTML = `<p class="search-message">Search titles, paths, tags, and note text.</p>`;
		return;
	}

	if (!results.length) {
		state.searchResultIndex = -1;
		input.removeAttribute("aria-activedescendant");
		container.innerHTML = `<p class="search-message">No matching notes.</p>`;
		return;
	}

	state.searchResultIndex = Math.min(Math.max(state.searchResultIndex, 0), results.length - 1);
	container.replaceChildren();

	for (let index = 0; index < results.length; index += 1) {
		container.append(createResultButton({ note: results[index], query, index }));
	}

	renderSearchResultSelection();
}

/**
 * Resets selection when the search query changes.
 * @returns {void}
 */
function handleSearchInput() {
	state.searchResultIndex = 0;
	renderSearch();
}

/**
 * Handles search-result navigation without moving focus from the query input.
 * @param {KeyboardEvent} event
 * @returns {void}
 */
function handleSearchKeyDown(event) {
	const buttons = selectAll(".result-button");

	if (!buttons.length) {
		return;
	}

	if (event.key === "ArrowDown" || event.key === "ArrowUp") {
		const direction = event.key === "ArrowDown" ? 1 : -1;
		event.preventDefault();
		state.searchResultIndex = (state.searchResultIndex + direction + buttons.length) % buttons.length;
		renderSearchResultSelection();
		buttons[state.searchResultIndex].scrollIntoView({ block: "nearest" });
		return;
	}

	if (event.key === "Enter" && state.searchResultIndex >= 0) {
		event.preventDefault();
		openNote({ path: buttons[state.searchResultIndex].dataset.path });
	}
}

/**
 * Updates the visible and accessible active search result.
 * @returns {void}
 */
function renderSearchResultSelection() {
	const input = select(selectors.searchInput);
	const buttons = selectAll(".result-button");

	for (let index = 0; index < buttons.length; index += 1) {
		const isSelected = index === state.searchResultIndex;
		buttons[index].classList.toggle("is-selected", isSelected);
		buttons[index].setAttribute("aria-selected", String(isSelected));
	}

	if (buttons[state.searchResultIndex]) {
		input.setAttribute("aria-activedescendant", buttons[state.searchResultIndex].id);
	} else {
		input.removeAttribute("aria-activedescendant");
	}
}

/**
 * Renders the monthly calendar panel.
 * @returns {void}
 */
function renderCalendar() {
	const firstDayOfWeek = getFirstDayOfWeek();
	const monthDate = state.calendarDate;
	const today = new Date();
	const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
	const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
	const leadingDays = getLeadingCalendarDays({ day: monthStart.getDay(), firstDayOfWeek });
	const weekdays = getWeekdayLabels({ firstDayOfWeek });
	const titleFormatter = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
	const title = select(selectors.calendarTitle);
	const weekdayContainer = select(selectors.calendarWeekdays);
	const dayContainer = select(selectors.calendarDays);

	title.textContent = titleFormatter.format(monthStart);
	weekdayContainer.replaceChildren();
	dayContainer.replaceChildren();

	for (let index = 0; index < weekdays.length; index += 1) {
		const weekday = document.createElement("span");
		weekday.textContent = weekdays[index];
		weekdayContainer.append(weekday);
	}

	for (let index = 0; index < leadingDays; index += 1) {
		dayContainer.append(createCalendarSpacer());
	}

	for (let day = 1; day <= daysInMonth; day += 1) {
		dayContainer.append(createCalendarDay({ day, monthDate, today }));
	}
}

/**
 * Creates an empty calendar spacer.
 * @returns {HTMLSpanElement}
 */
function createCalendarSpacer() {
	const spacer = document.createElement("span");
	spacer.className = "calendar-day is-empty";
	spacer.setAttribute("aria-hidden", "true");
	return spacer;
}

/**
 * Creates a calendar day element.
 * @param {object} params
 * @param {number} params.day
 * @param {Date} params.monthDate
 * @param {Date} params.today
 * @returns {HTMLButtonElement}
 */
function createCalendarDay({ day, monthDate, today }) {
	const button = document.createElement("button");
	const isToday = today.getFullYear() === monthDate.getFullYear()
		&& today.getMonth() === monthDate.getMonth()
		&& today.getDate() === day;
	const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
	const labelFormatter = new Intl.DateTimeFormat(undefined, {
		day: "numeric",
		month: "long",
		year: "numeric"
	});

	button.className = "calendar-day";
	button.classList.toggle("is-today", isToday);
	button.type = "button";
	button.textContent = String(day);
	button.setAttribute("aria-label", labelFormatter.format(date));

	if (isToday) {
		button.setAttribute("aria-current", "date");
	}

	return button;
}

/**
 * Gets localized weekday labels for the configured week start.
 * @param {object} params
 * @param {number} params.firstDayOfWeek
 * @returns {Array<string>}
 */
function getWeekdayLabels({ firstDayOfWeek }) {
	const formatter = new Intl.DateTimeFormat(undefined, { weekday: "short" });
	const labels = [];

	for (let index = 0; index < 7; index += 1) {
		const day = (firstDayOfWeek + index) % 7;
		const date = new Date(2024, 0, 7 + day);
		labels.push(formatter.format(date));
	}

	return labels;
}

/**
 * Gets the blank cells before the first day.
 * @param {object} params
 * @param {number} params.day
 * @param {number} params.firstDayOfWeek
 * @returns {number}
 */
function getLeadingCalendarDays({ day, firstDayOfWeek }) {
	return (day - firstDayOfWeek + 7) % 7;
}

/**
 * Gets the configured first day of week.
 * @returns {number}
 */
function getFirstDayOfWeek() {
	const configured = Number(state.config.appearance?.firstDayOfWeek);

	if (Number.isInteger(configured) && configured >= 0 && configured <= 6) {
		return configured;
	}

	return 1;
}

/**
 * Moves the calendar to the previous month.
 * @returns {void}
 */
function showPreviousMonth() {
	state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() - 1, 1);
	renderCalendar();
}

/**
 * Moves the calendar to the next month.
 * @returns {void}
 */
function showNextMonth() {
	state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() + 1, 1);
	renderCalendar();
}

/**
 * Moves the calendar to the current month.
 * @returns {void}
 */
function showCurrentMonth() {
	const today = new Date();
	state.calendarDate = new Date(today.getFullYear(), today.getMonth(), 1);
	renderCalendar();
}

/**
 * Creates a search result button.
 * @param {object} params
 * @param {object} params.note
 * @param {string} params.query
 * @param {number} params.index
 * @returns {HTMLButtonElement}
 */
function createResultButton({ note, query, index }) {
	const button = document.createElement("button");
	button.className = "result-button";
	button.type = "button";
	button.id = `vault-search-result-${index}`;
	button.setAttribute("role", "option");
	button.innerHTML = `
		<span class="result-title">${escapeHtml(note.title)}</span>
		<span class="result-path">${escapeHtml(note.path)}</span>
		<span class="result-excerpt">${escapeHtml(getExcerpt({ text: note.body, query }))}</span>
	`;
	button.dataset.path = note.path;
	addNavigationSound({ element: button, cue: "page" });
	button.addEventListener("click", handleSearchResultButtonClick);
	return button;
}

/**
 * Opens a search result and restores focus to the query input.
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleSearchResultButtonClick(event) {
	openNote({ path: event.currentTarget.dataset.path });
	select(selectors.searchInput).focus();
}

/**
 * Renders a simple linked-note graph list.
 * @returns {void}
 */
function renderGraph() {
	const container = select(selectors.graphList);
	container.replaceChildren();

	if (!state.notes.length) {
		container.innerHTML = `<p class="muted">No notes loaded.</p>`;
		return;
	}

	for (let index = 0; index < state.notes.length; index += 1) {
		const note = state.notes[index];
		const button = document.createElement("button");
		button.className = "graph-button";
		button.type = "button";
		button.dataset.path = note.path;
		addNavigationSound({ element: button, cue: "page" });
		button.innerHTML = `
			<span class="graph-title">${escapeHtml(note.title)}</span>
			<span class="graph-path">${note.links.length} outgoing links</span>
		`;
		button.addEventListener("click", handleNoteButtonClick);
		container.append(button);
	}
}

/**
 * Opens the current hash route, or falls back to home.
 * @returns {void}
 */
function openRouteFromHash() {
	if (!isHashRoutingEnabled()) {
		openHome({ updateHash: false });
		return;
	}

	const path = getPathFromHash();
	const note = path ? findNoteByPath({ path }) : null;

	if (note) {
		openNote({ path: note.path, updateHash: false });
		return;
	}

	openHome({ updateHash: false });
}

/**
 * Reads the active note path from the URL hash.
 * @returns {string}
 */
function getPathFromHash() {
	const hash = window.location.hash || "";

	if (!hash.startsWith("#/")) {
		return "";
	}

	try {
		return decodePath(hash.slice(2));
	} catch (error) {
		return "";
	}
}

/**
 * Checks whether hash-based note routing is enabled.
 * @returns {boolean}
 */
function isHashRoutingEnabled() {
	return state.config.site?.hashRouting !== false;
}

/**
 * Gets the hash route for a note path.
 * @param {object} params
 * @param {string} params.path
 * @returns {string}
 */
function getNoteHash({ path }) {
	if (!isHashRoutingEnabled()) {
		return "";
	}

	const notePath = normalizePath(path);

	if (!notePath) {
		return "";
	}

	return `#/${encodePath(notePath)}`;
}

/**
 * Decodes slash-separated URL paths.
 * @param {string} path
 * @returns {string}
 */
function decodePath(path) {
	const parts = normalizePath(path).split("/");

	for (let index = 0; index < parts.length; index += 1) {
		parts[index] = decodeURIComponent(parts[index]);
	}

	return normalizePath(parts.join("/"));
}

/**
 * Updates the browser URL hash without reloading the page.
 * @param {object} params
 * @param {string} params.hash
 * @param {boolean} params.updateHash
 * @returns {void}
 */
function updateLocationHash({ hash, updateHash }) {
	if (!updateHash || !isHashRoutingEnabled()) {
		return;
	}

	const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
	const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

	if (nextUrl !== currentUrl) {
		window.history.pushState(null, "", nextUrl);
	}
}

/**
 * Opens the configured initial note.
 * @returns {void}
 */
function openInitialNote() {
	const defaultFile = state.config.defaultFile || "";
	const note = findNoteByPath({ path: defaultFile }) || state.notes[0];

	if (note) {
		openNote({ path: note.path });
	} else {
		openHome();
	}
}

/**
 * Opens the standalone home screen.
 * @param {object} [params]
 * @param {boolean} [params.updateHash]
 * @returns {void}
 */
function openHome({ updateHash = true } = {}) {
	state.activePath = "";
	state.activeView = "home";
	state.leftCollapsed = true;
	state.rightCollapsed = true;
	closeQuickSettings();
	clearQrCodeBlock();
	updateLocationHash({ hash: "", updateHash });
	renderHome();
	renderHomeContext();
	renderFileTree();
	renderBookmarks();
	renderPanels();
	renderShell();
}

/**
 * Opens a markdown note.
 * @param {object} params
 * @param {string} params.path
 * @param {boolean} [params.updateHash]
 * @returns {void}
 */
function openNote({ path, updateHash = true }) {
	const note = findNoteByPath({ path });

	if (!note) {
		showToast({ message: `Missing note: ${path}` });
		return;
	}

	state.activePath = note.path;
	state.activeView = "note";
	updateLocationHash({ hash: getNoteHash({ path: note.path }), updateHash });
	renderArticle({ note });
	renderArticleContext({ note });
	renderFileTree();
	renderBookmarks();
	renderPanels();
	renderShell();
}

/**
 * Renders the home screen.
 * @returns {void}
 */
function renderHome() {
	const article = select(selectors.article);
	const title = state.config.home?.title || state.config.title || "Papyrus";
	const subtitle = state.config.home?.subtitle || state.config.description || "A client-side markdown knowledge base.";
	const background = getHomeBackground();
	const backgroundClass = getHomeClassName({ background });
	const backgroundImage = background.image;
	const backgroundStyle = backgroundImage ? ` style="--home-background-image: url('${escapeCssUrl(backgroundImage)}');"` : "";
	const ctas = createHomeCtaMarkup();

	removeArticleMaps();
	removeArticleCodeRunners();
	article.classList.add("is-home");
	article.classList.remove("has-header");
	article.innerHTML = `
		<div class="${backgroundClass}"${backgroundStyle}>
			<div class="home-content">
				<h1>${escapeHtml(title)}</h1>
				<p>${escapeHtml(subtitle)}</p>
				${ctas}
			</div>
		</div>
	`;
	renderScrollTopButton();
}

/**
 * Creates home CTA card markup.
 * @returns {string}
 */
function createHomeCtaMarkup() {
	const ctas = getHomeCtas();

	if (!ctas.length) {
		return "";
	}

	let markup = `<div class="home-ctas" aria-label="Featured notes">`;

	for (let index = 0; index < ctas.length; index += 1) {
		const cta = ctas[index];
		const note = findNoteByPath({ path: cta.path });
		const description = cta.description ? `<span>${escapeHtml(cta.description)}</span>` : "";
		const disabledClass = note ? "" : " is-disabled";
		const noteTarget = note ? ` data-note-target="${escapeAttribute(note.path)}"` : "";

		markup += `
			<a class="home-cta${disabledClass}" href="${note ? getNoteHash({ path: note.path }) || "#" : "#"}"${noteTarget}>
				<strong>${escapeHtml(cta.title)}</strong>
				${description}
			</a>
		`;
	}

	markup += `</div>`;
	return markup;
}

/**
 * Gets configured home CTA cards.
 * @returns {Array<object>}
 */
function getHomeCtas() {
	const configured = Array.isArray(state.config.home?.ctas) ? state.config.home.ctas : [];
	const ctas = [];

	for (let index = 0; index < configured.length && ctas.length < 4; index += 1) {
		const cta = configured[index] || {};
		const title = String(cta.title || "").trim();
		const path = normalizePath(String(cta.path || ""));

		if (title && path) {
			ctas.push({
				title,
				path,
				description: String(cta.description || "").trim()
			});
		}
	}

	return ctas;
}

/**
 * Gets the configured home background.
 * @returns {object}
 */
function getHomeBackground() {
	const background = state.config.home?.background || {};

	if (!background.enabled || !background.image) {
		return { image: "", grayscale: false };
	}

	return {
		image: getCssAssetUrl(String(background.image)),
		grayscale: Boolean(background.grayscale)
	};
}

/**
 * Gets the home view class name.
 * @param {object} params
 * @param {object} params.background
 * @returns {string}
 */
function getHomeClassName({ background }) {
	const classes = ["home-view"];

	if (background.image) {
		classes.push("has-background");
	}

	if (background.grayscale) {
		classes.push("is-grayscale");
	}

	return classes.join(" ");
}

/**
 * Gets a CSS-safe asset URL that resolves from the app root.
 * @param {string} path
 * @returns {string}
 */
function getCssAssetUrl(path) {
	if (/^(https?:|data:|\/)/i.test(path)) {
		return path;
	}

	return `/${normalizePath(path)}`;
}

/**
 * Escapes a URL value for a CSS custom property.
 * @param {string} value
 * @returns {string}
 */
function escapeCssUrl(value) {
	return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/**
 * Clears note-specific context for the home screen.
 * @returns {void}
 */
function renderHomeContext() {
	clearQrCodeBlock();
	const button = select(selectors.bookmarkButton);
	const icon = select(selectors.bookmarkIcon);
	const label = select(selectors.bookmarkLabel);

	button.disabled = true;
	button.classList.remove("is-bookmarked");
	icon.className = "fa-regular fa-bookmark";
	label.textContent = "Bookmark note";
	renderSourceControls({ note: null });
	select(selectors.metadataList).innerHTML = `<div><dt>Status</dt><dd>No article selected.</dd></div>`;
	select(selectors.tocList).innerHTML = `<p class="muted">No article selected.</p>`;
	select(selectors.backlinkList).innerHTML = `<p class="muted">No linked notes.</p>`;
	select(selectors.outgoingList).innerHTML = `<p class="muted">No linked notes.</p>`;
}

/**
 * Renders the active article.
 * @param {object} params
 * @param {object} params.note
 * @returns {void}
 */
function renderArticle({ note }) {
	const article = select(selectors.article);
	const content = renderMarkdown({ markdown: note.body });
	const headerImage = getArticleHeaderImage({ note });
	const header = headerImage ? createArticleHeaderImage({
		src: headerImage,
		grayscale: isArticleHeaderGrayscale({ note })
	}) : "";
	removeArticleMaps();
	removeArticleCodeRunners();
	article.classList.remove("is-home");
	article.classList.toggle("has-header", Boolean(headerImage));
	article.innerHTML = `${header}<div class="article-inner">${content}</div>`;
	initializeArticleMermaidDiagrams();
	initializeArticleCodeBlocks();
	highlightArticleCode();
	initializeArticleMaps();
	typesetArticleMath({ markdown: note.body });
	renderScrollTopButton();
}

/**
 * Creates article header image markup.
 * @param {object} params
 * @param {string} params.src
 * @param {boolean} params.grayscale
 * @returns {string}
 */
function createArticleHeaderImage({ src, grayscale }) {
	const className = grayscale ? "article-header-image is-grayscale" : "article-header-image";

	return `
		<figure class="${className}">
			<img src="${escapeAttribute(src)}" alt="">
		</figure>
	`;
}

/**
 * Highlights code blocks in the active article.
 * @returns {void}
 */
function highlightArticleCode() {
	Prism.highlightAllUnder(select(selectors.article));
}

/**
 * Replaces Obsidian-style Mermaid code fences and starts diagram rendering.
 * @returns {void}
 */
function initializeArticleMermaidDiagrams() {
	const article = select(selectors.article);
	const blocks = article.querySelectorAll("pre > code.language-mermaid");
	const diagrams = [];

	for (let index = 0; index < blocks.length; index += 1) {
		const code = blocks[index];
		const block = code.parentElement;

		if (!block) {
			continue;
		}

		const embed = document.createElement("figure");
		const diagram = document.createElement("div");
		const source = code.textContent.trim();

		embed.className = "mermaid-embed";
		diagram.className = "mermaid";
		diagram.dataset.mermaidSource = source;
		diagram.textContent = source;
		embed.append(diagram);
		block.replaceWith(embed);
		diagrams.push(diagram);
	}

	renderArticleMermaidDiagrams({ diagrams });
}

/**
 * Renders Mermaid diagram elements with the theme that matches Papyrus.
 * @async
 * @param {object} params
 * @param {Array<HTMLElement>|NodeListOf<HTMLElement>} params.diagrams
 * @returns {Promise<void>}
 */
async function renderArticleMermaidDiagrams({ diagrams }) {
	if (!diagrams.length) {
		return;
	}

	mermaid.initialize({
		startOnLoad: false,
		securityLevel: "strict",
		theme: getMermaidTheme()
	});

	for (let index = 0; index < diagrams.length; index += 1) {
		const diagram = diagrams[index];

		try {
			await mermaid.run({ nodes: [diagram] });
			initializeMermaidInternalLinks({ diagram });
		} catch (error) {
			renderMermaidError({ diagram });
		}
	}
}

/**
 * Gets the Mermaid theme for the active Papyrus color scheme.
 * @returns {"default"|"dark"}
 */
function getMermaidTheme() {
	return state.theme === "dark" || state.theme === "ocean" ? "dark" : "default";
}

/**
 * Re-renders active diagrams after a theme change.
 * @returns {void}
 */
function rerenderArticleMermaidDiagrams() {
	const diagrams = select(selectors.article).querySelectorAll(".mermaid-embed .mermaid");

	for (let index = 0; index < diagrams.length; index += 1) {
		const diagram = diagrams[index];

		diagram.classList.remove("is-error");
		diagram.removeAttribute("aria-live");
		diagram.removeAttribute("data-processed");
		diagram.textContent = diagram.dataset.mermaidSource || "";
	}

	renderArticleMermaidDiagrams({ diagrams });
}

/**
 * Makes Mermaid nodes with Obsidian's internal-link class open vault notes.
 * @param {object} params
 * @param {HTMLElement} params.diagram
 * @returns {void}
 */
function initializeMermaidInternalLinks({ diagram }) {
	const links = diagram.querySelectorAll(".internal-link");

	for (let index = 0; index < links.length; index += 1) {
		const link = links[index];
		const label = (link.querySelector(".nodeLabel")?.textContent || link.textContent || "").trim();
		const note = findNoteByWikiTarget({ target: label }) || findNoteByTitle({ title: label });

		if (!note) {
			link.classList.add("is-missing");
			continue;
		}

		link.dataset.noteTarget = note.path;
		link.setAttribute("aria-label", `Open ${note.title}`);
		link.setAttribute("role", "link");
		link.setAttribute("tabindex", "0");
		link.addEventListener("keydown", handleMermaidInternalLinkKeyDown);
	}
}

/**
 * Finds a note whose configured or derived title matches a diagram label.
 * @param {object} params
 * @param {string} params.title
 * @returns {object|undefined}
 */
function findNoteByTitle({ title }) {
	const normalizedTitle = title.trim().toLowerCase();

	for (let index = 0; index < state.notes.length; index += 1) {
		if (state.notes[index].title.trim().toLowerCase() === normalizedTitle) {
			return state.notes[index];
		}
	}

	return undefined;
}

/**
 * Opens a keyboard-activated internal Mermaid node.
 * @param {KeyboardEvent} event
 * @returns {void}
 */
function handleMermaidInternalLinkKeyDown(event) {
	if (event.key !== "Enter" && event.key !== " ") {
		return;
	}

	event.preventDefault();
	openNote({ path: event.currentTarget.dataset.noteTarget });
}

/**
 * Replaces a failed diagram with a readable source fallback.
 * @param {object} params
 * @param {HTMLElement} params.diagram
 * @returns {void}
 */
function renderMermaidError({ diagram }) {
	const message = document.createElement("strong");
	const guidance = document.createElement("span");
	const sourceBlock = document.createElement("pre");
	const code = document.createElement("code");

	message.textContent = "Diagram could not be rendered.";
	guidance.textContent = "Check the Mermaid syntax below.";
	code.textContent = diagram.dataset.mermaidSource || "";
	sourceBlock.className = "mermaid-error-source";
	sourceBlock.append(code);
	diagram.classList.add("is-error");
	diagram.setAttribute("aria-live", "polite");
	diagram.replaceChildren(message, guidance, sourceBlock);
}

/**
 * Adds controls and metadata around rendered article code blocks.
 * @returns {void}
 */
function initializeArticleCodeBlocks() {
	const article = select(selectors.article);
	const blocks = article.querySelectorAll("pre");

	for (let index = 0; index < blocks.length; index += 1) {
		const block = blocks[index];

		if (!block.querySelector("code") || block.closest(".code-embed")) {
			continue;
		}

		const wrapper = createCodeEmbed({ block });

		block.replaceWith(wrapper);
		wrapper.append(block);
	}
}

/**
 * Creates a controlled code block wrapper.
 * @param {object} params
 * @param {HTMLPreElement} params.block
 * @returns {HTMLElement}
 */
function createCodeEmbed({ block }) {
	const code = block.querySelector("code");
	const wrapper = document.createElement("figure");
	const header = document.createElement("figcaption");
	const summary = document.createElement("span");
	const actions = document.createElement("span");
	const language = getCodeBlockLanguage({ code });
	const lineCount = countCodeLines(code.textContent);

	wrapper.className = "code-embed";
	header.className = "code-header";
	summary.className = "code-summary";
	summary.textContent = `${formatCodeLanguage({ language })} - ${formatNumber(lineCount)} LOC`;
	actions.className = "code-header-actions";

	if (isRunnableCodeLanguage({ language })) {
		actions.append(createCodeActionButton({
			action: "run-code-block",
			icon: "fa-solid fa-play",
			label: "Run",
			disabled: false
		}));
	}

	actions.append(createCodeActionButton({
		action: "toggle-code-wrap",
		icon: "fa-solid fa-arrow-turn-down",
		label: "Wrap",
		disabled: false
	}));
	actions.append(createCodeActionButton({
		action: "copy-code-block",
		icon: "fa-regular fa-copy",
		label: "Copy",
		disabled: false
	}));
	actions.append(createCodeActionButton({
		action: "toggle-code-block",
		icon: "fa-solid fa-chevron-up",
		label: "Collapse",
		disabled: false
	}));
	header.append(summary, actions);
	wrapper.append(header);

	return wrapper;
}

/**
 * Creates a code block action button.
 * @param {object} params
 * @param {string} params.action
 * @param {string} params.icon
 * @param {string} params.label
 * @param {boolean} params.disabled
 * @returns {HTMLButtonElement}
 */
function createCodeActionButton({ action, icon, label, disabled }) {
	const button = document.createElement("button");

	button.className = "code-action";
	button.type = "button";
	button.dataset.action = action;
	button.disabled = disabled;
	button.setAttribute("aria-label", label);
	button.title = label;

	if (action === "toggle-code-block") {
		button.setAttribute("aria-expanded", "true");
	}

	if (action === "toggle-code-wrap") {
		button.setAttribute("aria-label", "Wrap lines");
		button.setAttribute("aria-pressed", "false");
		button.title = "Wrap lines";
	}

	button.innerHTML = `<i class="${escapeAttribute(icon)}" aria-hidden="true"></i><span>${escapeHtml(label)}</span>`;

	return button;
}

/**
 * Gets the declared language for a rendered code block.
 * @param {object} params
 * @param {HTMLElement} params.code
 * @returns {string}
 */
function getCodeBlockLanguage({ code }) {
	const classes = Array.from(code.classList);

	for (let index = 0; index < classes.length; index += 1) {
		const match = classes[index].match(/^language-(.+)$/);

		if (match) {
			return match[1].toLowerCase();
		}
	}

	return "";
}

/**
 * Formats a code language for display.
 * @param {object} params
 * @param {string} params.language
 * @returns {string}
 */
function formatCodeLanguage({ language }) {
	const labels = {
		js: "JavaScript",
		javascript: "JavaScript",
		json: "JSON",
		html: "HTML",
		css: "CSS",
		md: "Markdown",
		markdown: "Markdown"
	};

	return labels[language] || language.toUpperCase() || "Plain text";
}

/**
 * Checks whether a code language should show a run action.
 * @param {object} params
 * @param {string} params.language
 * @returns {boolean}
 */
function isRunnableCodeLanguage({ language }) {
	return language === "javascript" || language === "js";
}

/**
 * Counts lines of code from a code block string.
 * @param {string} code
 * @returns {number}
 */
function countCodeLines(code) {
	const normalized = code.replace(/\r\n/g, "\n").replace(/\n$/, "");

	if (!normalized) {
		return 0;
	}

	return normalized.split("\n").length;
}

/**
 * Typesets math syntax in the active article.
 * @param {object} params
 * @param {string} params.markdown
 * @returns {Promise<void>}
 */
async function typesetArticleMath({ markdown }) {
	if (!hasMathSyntax(markdown)) {
		return;
	}

	try {
		const mathJax = await loadMathJax();
		const article = select(selectors.article);

		if (mathJax.typesetPromise) {
			await mathJax.typesetPromise([article]);
		}
	} catch (error) {
		showToast({ message: "Math rendering could not be loaded." });
	}
}

/**
 * Checks whether markdown likely contains MathJax syntax.
 * @param {string} markdown
 * @returns {boolean}
 */
function hasMathSyntax(markdown) {
	return /(^|[^\\])(\$\$[\s\S]+?\$\$|\$[^\n$]+\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\])/m.test(markdown);
}

/**
 * Loads MathJax only when article content is rendered.
 * @returns {Promise<object>}
 */
async function loadMathJax() {
	if (window.MathJax?.typesetPromise) {
		return window.MathJax;
	}

	if (state.mathJaxPromise) {
		return await state.mathJaxPromise;
	}

	window.MathJax = {
		tex: {
			inlineMath: [["$", "$"], ["\\(", "\\)"]],
			displayMath: [["$$", "$$"], ["\\[", "\\]"]],
			processEscapes: true
		},
		options: {
			skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"]
		}
	};

	state.mathJaxPromise = new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js";
		script.async = true;
		script.onload = function handleMathJaxLoad() {
			if (window.MathJax?.typesetPromise) {
				resolve(window.MathJax);
			} else {
				reject(new Error("MathJax did not expose a browser global."));
			}
		};
		script.onerror = function handleMathJaxError() {
			reject(new Error("MathJax failed to load."));
		};
		document.head.append(script);
	});

	return await state.mathJaxPromise;
}

/**
 * Removes active MapLibre instances before replacing article content.
 * @returns {void}
 */
function removeArticleMaps() {
	for (let index = 0; index < state.maps.length; index += 1) {
		state.maps[index].remove();
	}

	state.maps = [];
}

/**
 * Initializes maps in the active article.
 * @returns {void}
 */
function initializeArticleMaps() {
	const maps = select(selectors.article).querySelectorAll("[data-map]");

	for (let index = 0; index < maps.length; index += 1) {
		initializeArticleMap({ element: maps[index] });
	}
}

/**
 * Initializes a MapLibre map element.
 * @param {object} params
 * @param {HTMLElement} params.element
 * @returns {void}
 */
function initializeArticleMap({ element }) {
	const latitude = Number(element.dataset.lat);
	const longitude = Number(element.dataset.lon);
	const zoom = Number(element.dataset.zoom);
	const marker = element.dataset.marker === "true";
	const label = element.dataset.label || "";

	if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(zoom)) {
		element.textContent = "Invalid map coordinates.";
		return;
	}

	loadMapLibre()
		.then((maplibregl) => {
			if (!element.isConnected) {
				return;
			}

			const map = new maplibregl.Map({
				container: element,
				center: [longitude, latitude],
				zoom,
				style: createOpenStreetMapStyle(),
				attributionControl: true
			});

			map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
			addArticleMapMarker({ maplibregl, map, latitude, longitude, marker, label });
			bindArticleMapFooter({ element, map });
			state.maps.push(map);
		})
		.catch(() => {
			element.textContent = "Map could not be loaded.";
		});
}

/**
 * Adds an optional marker at a map's configured coordinates.
 * @param {object} params
 * @param {object} params.maplibregl
 * @param {object} params.map
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {boolean} params.marker
 * @param {string} params.label
 * @returns {void}
 */
function addArticleMapMarker({ maplibregl, map, latitude, longitude, marker, label }) {
	if (!marker) {
		return;
	}

	const mapMarker = new maplibregl.Marker()
		.setLngLat([longitude, latitude])
		.addTo(map);
	const markerElement = mapMarker.getElement();

	if (label) {
		markerElement.setAttribute("aria-label", label);
		markerElement.title = label;
	}
}

/**
 * Binds footer data and controls for a MapLibre map.
 * @param {object} params
 * @param {HTMLElement} params.element
 * @param {object} params.map
 * @returns {void}
 */
function bindArticleMapFooter({ element, map }) {
	const mapEmbed = element.closest(".map-embed");
	const coordinateLabel = mapEmbed?.querySelector("[data-map-coordinates]");
	const zoomLabel = mapEmbed?.querySelector("[data-map-zoom]");
	const googleMapsLink = mapEmbed?.querySelector("[data-map-google]");

	if (!mapEmbed || !coordinateLabel || !zoomLabel || !googleMapsLink) {
		return;
	}

	updateArticleMapFooter({ map, coordinateLabel, zoomLabel, googleMapsLink });
	map.on("move", function handleMapMove() {
		updateArticleMapFooter({ map, coordinateLabel, zoomLabel, googleMapsLink });
	});
}

/**
 * Updates map coordinates, zoom, and external map link.
 * @param {object} params
 * @param {object} params.map
 * @param {Element} params.coordinateLabel
 * @param {Element} params.zoomLabel
 * @param {HTMLAnchorElement} params.googleMapsLink
 * @returns {void}
 */
function updateArticleMapFooter({ map, coordinateLabel, zoomLabel, googleMapsLink }) {
	const center = map.getCenter();
	const latitude = center.lat;
	const longitude = center.lng;

	coordinateLabel.textContent = formatCoordinates({ latitude, longitude });
	zoomLabel.textContent = formatMapZoom(map.getZoom());
	googleMapsLink.href = getGoogleMapsUrl({
		latitude: latitude.toFixed(6),
		longitude: longitude.toFixed(6)
	});
}

/**
 * Gets the active MapLibre instance for an element.
 * @param {object} params
 * @param {HTMLElement} params.element
 * @returns {object|null}
 */
function getArticleMapByElement({ element }) {
	for (let index = 0; index < state.maps.length; index += 1) {
		if (state.maps[index].getContainer() === element) {
			return state.maps[index];
		}
	}

	return null;
}

/**
 * Opens a map canvas in fullscreen mode.
 * @param {object} params
 * @param {HTMLElement} params.mapElement
 * @param {object|null} params.map
 * @returns {void}
 */
function openMapFullscreen({ mapElement, map }) {
	if (!mapElement.requestFullscreen) {
		return;
	}

	mapElement.requestFullscreen()
		.then(function handleMapFullscreenOpen() {
			resizeArticleMap({ map });
		})
		.catch(function handleMapFullscreenError() {
			resizeArticleMap({ map });
		});
}

/**
 * Resizes a MapLibre instance when available.
 * @param {object} params
 * @param {object|null} params.map
 * @returns {void}
 */
function resizeArticleMap({ map }) {
	if (map) {
		map.resize();
	}
}

/**
 * Loads MapLibre only when a map is present.
 * @returns {Promise<object>}
 */
function loadMapLibre() {
	if (window.maplibregl) {
		return Promise.resolve(window.maplibregl);
	}

	if (state.mapLibrePromise) {
		return state.mapLibrePromise;
	}

	state.mapLibrePromise = new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = "https://unpkg.com/maplibre-gl@5.12.0/dist/maplibre-gl.js";
		script.onload = function handleMapLibreLoad() {
			if (window.maplibregl) {
				resolve(window.maplibregl);
			} else {
				reject(new Error("MapLibre did not expose a browser global."));
			}
		};
		script.onerror = function handleMapLibreError() {
			reject(new Error("MapLibre failed to load."));
		};
		document.head.append(script);
	});

	return state.mapLibrePromise;
}

/**
 * Creates a MapLibre style using OpenStreetMap raster tiles.
 * @returns {object}
 */
function createOpenStreetMapStyle() {
	return {
		version: 8,
		sources: {
			openStreetMap: {
				type: "raster",
				tiles: [
					"https://tile.openstreetmap.org/{z}/{x}/{y}.png"
				],
				tileSize: 256,
				attribution: "© OpenStreetMap contributors"
			}
		},
		layers: [
			{
				id: "openStreetMap",
				type: "raster",
				source: "openStreetMap"
			}
		]
	};
}

/**
 * Renders metadata and link context.
 * @param {object} params
 * @param {object} params.note
 * @returns {void}
 */
function renderArticleContext({ note }) {
	renderBookmarkControl({ note });
	renderSourceControls({ note });
	renderMetadata({ note });
	renderTableOfContents({ note });
	renderLinkList({ selector: selectors.backlinkList, notes: getBacklinks({ note }) });
	renderOutgoingLinks({ note });
}

/**
 * Renders the bookmark control state.
 * @param {object} params
 * @param {object} params.note
 * @returns {void}
 */
function renderBookmarkControl({ note }) {
	const button = select(selectors.bookmarkButton);
	const icon = select(selectors.bookmarkIcon);
	const label = select(selectors.bookmarkLabel);
	const bookmarked = isBookmarked({ path: note.path });

	button.disabled = false;
	button.classList.toggle("is-bookmarked", bookmarked);
	icon.className = bookmarked ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark";
	label.textContent = bookmarked ? "Remove bookmark" : "Bookmark note";
}

/**
 * Renders source links and copy controls.
 * @param {object} params
 * @param {object|null} params.note
 * @returns {void}
 */
function renderSourceControls({ note }) {
	const repoLink = select(selectors.sourceRepoLink);
	const articleLink = select(selectors.sourceArticleLink);
	const downloadLink = select(selectors.sourceDownloadLink);
	const copySourceButton = select("[data-action='copy-source-url']");
	const copyPublishedButton = select("[data-action='copy-published-url']");
	const copyContentButton = select("[data-action='copy-article-content']");
	const obsidianButton = select("[data-action='open-obsidian']");
	const repoUrl = getGithubRepoUrl();
	const articleUrl = note ? getGithubArticleUrl({ path: note.path }) : "";
	const publishedUrl = note ? getPublishedArticleUrl({ path: note.path }) : "";
	const downloadUrl = note ? getArticleDownloadUrl({ note }) : "";
	const obsidianUrl = note ? getObsidianArticleUrl({ path: note.path }) : "";

	updateSourceLink({
		link: repoLink,
		href: repoUrl,
		label: repoUrl ? "Repository" : "Repository unavailable"
	});
	updateSourceLink({
		link: articleLink,
		href: articleUrl,
		label: articleUrl ? "Article file" : "Article file unavailable"
	});
	updateSourceLink({
		link: downloadLink,
		href: downloadUrl,
		label: downloadUrl ? "Download article" : "Download unavailable"
	});

	if (downloadUrl && note) {
		downloadLink.download = getFileName(note.path);
	} else {
		downloadLink.removeAttribute("download");
	}

	copySourceButton.disabled = !articleUrl;
	copyPublishedButton.disabled = !publishedUrl;
	copyContentButton.disabled = !note;
	obsidianButton.disabled = !obsidianUrl;
}

/**
 * Updates a source link.
 * @param {object} params
 * @param {HTMLAnchorElement} params.link
 * @param {string} params.href
 * @param {string} params.label
 * @returns {void}
 */
function updateSourceLink({ link, href, label }) {
	const labelElement = link.querySelector("span");

	if (labelElement) {
		labelElement.textContent = label;
	}

	link.classList.toggle("is-disabled", !href);

	if (href) {
		link.href = href;
		link.setAttribute("aria-disabled", "false");
	} else {
		link.href = "#";
		link.setAttribute("aria-disabled", "true");
	}
}

/**
 * Renders metadata list.
 * @param {object} params
 * @param {object} params.note
 * @returns {void}
 */
function renderMetadata({ note }) {
	const list = select(selectors.metadataList);
	const articleText = getArticleText({ markdown: note.body });
	const wordCount = countWords(articleText);
	const entries = [
		["Title", note.title],
		["Path", note.path],
		["Words", formatNumber(wordCount)],
		["Characters", formatNumber(countCharacters(articleText))],
		["Reading time", formatReadingTime({ minutes: estimateReadingMinutes({ wordCount }) })],
		["Copyright", getArticleRightsValue({ note, key: "copyright" })],
		["License", getArticleRightsValue({ note, key: "license" })]
	];
	const metadataKeys = Object.keys(note.metadata);

	for (let index = 0; index < metadataKeys.length; index += 1) {
		const key = metadataKeys[index];

		if (shouldShowMetadataKey(key)) {
			entries.push([formatMetadataKey(key), formatMetadataValue(note.metadata[key])]);
		}
	}

	list.replaceChildren();

	for (let index = 0; index < entries.length; index += 1) {
		const item = document.createElement("div");
		item.innerHTML = `<dt>${escapeHtml(entries[index][0])}</dt><dd>${escapeHtml(entries[index][1])}</dd>`;
		list.append(item);
	}
}

/**
 * Gets readable article text from markdown.
 * @param {object} params
 * @param {string} params.markdown
 * @returns {string}
 */
function getArticleText({ markdown }) {
	return stripMarkdown(markdown).replace(/\s+/g, " ").trim();
}

/**
 * Gets the resolved article header image URL.
 * @param {object} params
 * @param {object} params.note
 * @returns {string}
 */
function getArticleHeaderImage({ note }) {
	const image = getMetadataValue({ metadata: note.metadata, key: "image" });

	if (!image) {
		return "";
	}

	return getArticleAssetUrl({ path: image });
}

/**
 * Checks whether an article header image should render in grayscale.
 * @param {object} params
 * @param {object} params.note
 * @returns {boolean}
 */
function isArticleHeaderGrayscale({ note }) {
	const value = getMetadataValue({ metadata: note.metadata, key: "grayscale" });
	return isTrueMetadataValue(value);
}

/**
 * Gets an article asset URL from a configured path.
 * @param {object} params
 * @param {string} params.path
 * @returns {string}
 */
function getArticleAssetUrl({ path }) {
	const cleanPath = normalizePath(path);

	if (!cleanPath) {
		return "";
	}

	if (/^(https?:|data:|\/)/i.test(path)) {
		return path;
	}

	if (state.config.github?.enabled) {
		return getGithubCdnUrl({
			path: cleanPath,
			rootPath: state.config.github.assetRootPath || "images"
		});
	}

	return `/${cleanPath}`;
}

/**
 * Checks whether a frontmatter key should be displayed.
 * @param {string} key
 * @returns {boolean}
 */
function shouldShowMetadataKey(key) {
	const normalized = key.toLowerCase();
	const allowedKeys = getAllowedMetadataKeys();

	if (normalized === "title" || isContentRightsKey(key)) {
		return false;
	}

	return allowedKeys.includes(normalized);
}

/**
 * Gets configured allowed frontmatter keys.
 * @returns {Array<string>}
 */
function getAllowedMetadataKeys() {
	const configured = Array.isArray(state.config.metadata?.allowedKeys)
		? state.config.metadata.allowedKeys
		: ["title", "tags", "authors", "license", "copyright"];
	const keys = [];

	for (let index = 0; index < configured.length; index += 1) {
		const key = String(configured[index] || "").trim().toLowerCase();

		if (key && !keys.includes(key)) {
			keys.push(key);
		}
	}

	return keys;
}

/**
 * Formats a metadata key for display.
 * @param {string} key
 * @returns {string}
 */
function formatMetadataKey(key) {
	const words = key.replace(/[-_]+/g, " ").split(" ");

	for (let index = 0; index < words.length; index += 1) {
		words[index] = words[index].charAt(0).toUpperCase() + words[index].slice(1);
	}

	return words.join(" ");
}

/**
 * Gets article-level rights metadata with config fallback.
 * @param {object} params
 * @param {object} params.note
 * @param {string} params.key
 * @returns {string}
 */
function getArticleRightsValue({ note, key }) {
	const articleValue = getMetadataValue({ metadata: note.metadata, key });
	const configValue = state.config.contentRights?.[key] || "";

	return articleValue || configValue || "Not specified";
}

/**
 * Gets metadata text for search indexing.
 * @param {object} params
 * @param {object} params.metadata
 * @returns {string}
 */
function getSearchMetadataText({ metadata }) {
	const values = Object.values(metadata);
	const parts = [];

	for (let index = 0; index < values.length; index += 1) {
		parts.push(formatMetadataValue(values[index]));
	}

	return parts.join(" ");
}

/**
 * Gets a metadata value case-insensitively.
 * @param {object} params
 * @param {object} params.metadata
 * @param {string} params.key
 * @returns {string}
 */
function getMetadataValue({ metadata, key }) {
	const keys = Object.keys(metadata);

	for (let index = 0; index < keys.length; index += 1) {
		if (keys[index].toLowerCase() === key.toLowerCase()) {
			return formatMetadataValue(metadata[keys[index]]);
		}
	}

	return "";
}

/**
 * Formats a metadata value for display.
 * @param {*} value
 * @returns {string}
 */
function formatMetadataValue(value) {
	if (Array.isArray(value)) {
		return value.map(formatMetadataValue).filter(Boolean).join(", ");
	}

	if (value === undefined || value === null) {
		return "";
	}

	return String(value);
}

/**
 * Checks whether a frontmatter value is true.
 * @param {string} value
 * @returns {boolean}
 */
function isTrueMetadataValue(value) {
	return String(value).trim().toLowerCase() === "true";
}

/**
 * Checks whether a frontmatter key is handled as rights metadata.
 * @param {string} key
 * @returns {boolean}
 */
function isContentRightsKey(key) {
	const normalized = key.toLowerCase();
	return normalized === "copyright" || normalized === "license";
}

/**
 * Renders the active article table of contents.
 * @param {object} params
 * @param {object} params.note
 * @returns {void}
 */
function renderTableOfContents({ note }) {
	const container = select(selectors.tocList);
	const headings = extractHeadings({ markdown: note.body });
	const tree = createTocTree({ headings });

	container.replaceChildren();

	if (!headings.length) {
		container.innerHTML = `<p class="muted">No headings found.</p>`;
		return;
	}

	for (let index = 0; index < tree.length; index += 1) {
		container.append(createTocItem({ item: tree[index] }));
	}
}

/**
 * Extracts markdown headings.
 * @param {object} params
 * @param {string} params.markdown
 * @returns {Array<object>}
 */
function extractHeadings({ markdown }) {
	const lines = markdown.replace(/\r\n/g, "\n").split("\n");
	const headings = [];
	const slugs = {};
	let inCode = false;

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];

		if (line.startsWith("```")) {
			inCode = !inCode;
			continue;
		}

		if (inCode) {
			continue;
		}

		const match = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);

		if (match) {
			const title = stripMarkdown(match[2]).trim();
			headings.push({
				id: getUniqueSlug({ text: title, slugs }),
				level: match[1].length,
				title
			});
		}
	}

	return headings;
}

/**
 * Creates a nested table of contents tree.
 * @param {object} params
 * @param {Array<object>} params.headings
 * @returns {Array<object>}
 */
function createTocTree({ headings }) {
	const root = [];
	const stack = [];

	for (let index = 0; index < headings.length; index += 1) {
		const item = { ...headings[index], children: [] };

		while (stack.length && stack[stack.length - 1].level >= item.level) {
			stack.pop();
		}

		if (stack.length) {
			stack[stack.length - 1].children.push(item);
		} else {
			root.push(item);
		}

		stack.push(item);
	}

	return root;
}

/**
 * Creates a table of contents item.
 * @param {object} params
 * @param {object} params.item
 * @returns {HTMLElement}
 */
function createTocItem({ item }) {
	const wrapper = document.createElement("div");
	const row = document.createElement("div");
	const toggle = document.createElement("button");
	const link = document.createElement("button");
	const children = document.createElement("div");
	const expanded = isTocExpanded({ id: item.id });

	wrapper.className = "toc-item";
	wrapper.classList.toggle("is-collapsed", !expanded);
	row.className = "toc-row";
	toggle.className = "toc-toggle";
	toggle.type = "button";
	toggle.dataset.tocToggle = item.id;
	toggle.disabled = !item.children.length;
	toggle.setAttribute("aria-label", `${expanded ? "Collapse" : "Expand"} ${item.title}`);
	toggle.setAttribute("aria-expanded", String(expanded));
	toggle.innerHTML = item.children.length
		? `<i class="fa-solid fa-caret-${expanded ? "down" : "right"}" aria-hidden="true"></i>`
		: `<span aria-hidden="true"></span>`;
	link.className = "toc-link";
	link.type = "button";
	link.dataset.tocTarget = item.id;
	link.textContent = item.title;
	children.className = "toc-children";

	for (let index = 0; index < item.children.length; index += 1) {
		children.append(createTocItem({ item: item.children[index] }));
	}

	row.append(toggle, link);
	wrapper.append(row, children);
	return wrapper;
}

/**
 * Handles table of contents clicks.
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleTocClick(event) {
	const toggle = event.target.closest("[data-toc-toggle]");
	const target = event.target.closest("[data-toc-target]");

	if (toggle && !toggle.disabled) {
		state.tocState[toggle.dataset.tocToggle] = !isTocExpanded({ id: toggle.dataset.tocToggle });
		refreshActiveToc();
		return;
	}

	if (target) {
		scrollToHeading({ id: target.dataset.tocTarget });
	}
}

/**
 * Refreshes the active note table of contents.
 * @returns {void}
 */
function refreshActiveToc() {
	const note = findNoteByPath({ path: state.activePath });

	if (note) {
		renderTableOfContents({ note });
	}
}

/**
 * Checks whether a TOC branch is expanded.
 * @param {object} params
 * @param {string} params.id
 * @returns {boolean}
 */
function isTocExpanded({ id }) {
	return state.tocState[id] !== false;
}

/**
 * Scrolls to an article heading.
 * @param {object} params
 * @param {string} params.id
 * @returns {void}
 */
function scrollToHeading({ id }) {
	const heading = document.getElementById(id);

	if (heading) {
		heading.scrollIntoView({ block: "start", behavior: "smooth" });
	}
}

/**
 * Renders backlink buttons.
 * @param {object} params
 * @param {string} params.selector
 * @param {Array<object>} params.notes
 * @returns {void}
 */
function renderLinkList({ selector, notes }) {
	const container = select(selector);
	container.replaceChildren();

	if (!notes.length) {
		container.innerHTML = `<p class="muted">No linked notes.</p>`;
		return;
	}

	for (let index = 0; index < notes.length; index += 1) {
		container.append(createLinkChip({ note: notes[index] }));
	}
}

/**
 * Renders outgoing wiki links.
 * @param {object} params
 * @param {object} params.note
 * @returns {void}
 */
function renderOutgoingLinks({ note }) {
	const notes = [];

	for (let index = 0; index < note.links.length; index += 1) {
		const linkedNote = findNoteByWikiTarget({ target: note.links[index].target });

		if (linkedNote) {
			notes.push(linkedNote);
		}
	}

	renderLinkList({ selector: selectors.outgoingList, notes });
}

/**
 * Creates a context link chip.
 * @param {object} params
 * @param {object} params.note
 * @returns {HTMLButtonElement}
 */
function createLinkChip({ note }) {
	const button = document.createElement("button");
	button.className = "link-chip";
	button.type = "button";
	button.dataset.path = note.path;
	addNavigationSound({ element: button, cue: "page" });
	button.innerHTML = `<i class="fa-regular fa-file-lines" aria-hidden="true"></i><span>${escapeHtml(note.title)}</span>`;
	button.addEventListener("click", handleNoteButtonClick);
	return button;
}

/**
 * Handles internal article link clicks.
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleArticleClick(event) {
	const consoleCloseAction = event.target.closest("[data-action='close-code-console']");

	if (consoleCloseAction) {
		event.preventDefault();
		closeCodeConsole({ button: consoleCloseAction });
		return;
	}

	const consoleCopyAction = event.target.closest("[data-action='copy-code-console']");

	if (consoleCopyAction) {
		event.preventDefault();
		copyCodeConsoleOutput({ button: consoleCopyAction });
		return;
	}

	const codeRunAction = event.target.closest("[data-action='run-code-block']");

	if (codeRunAction) {
		event.preventDefault();
		runArticleCodeBlock({ button: codeRunAction });
		return;
	}

	const codeCopyAction = event.target.closest("[data-action='copy-code-block']");

	if (codeCopyAction) {
		event.preventDefault();
		copyArticleCodeBlock({ button: codeCopyAction });
		return;
	}

	const codeWrapAction = event.target.closest("[data-action='toggle-code-wrap']");

	if (codeWrapAction) {
		event.preventDefault();
		toggleArticleCodeWrap({ button: codeWrapAction });
		return;
	}

	const tableCopyAction = event.target.closest("[data-action='copy-table']");

	if (tableCopyAction) {
		event.preventDefault();
		copyArticleTable({ button: tableCopyAction });
		return;
	}

	const codeToggleAction = event.target.closest("[data-action='toggle-code-block']");

	if (codeToggleAction) {
		event.preventDefault();
		toggleArticleCodeBlock({ button: codeToggleAction });
		return;
	}

	const link = event.target.closest("[data-note-target]");

	if (!link) {
		return;
	}

	event.preventDefault();
	openNote({ path: link.dataset.noteTarget });
}

/**
 * Runs an article JavaScript block in an isolated iframe sandbox.
 * @param {object} params
 * @param {HTMLElement} params.button
 * @returns {void}
 */
function runArticleCodeBlock({ button }) {
	const wrapper = button.closest(".code-embed");
	const code = wrapper?.querySelector("pre code")?.textContent || "";

	if (!wrapper || !code) {
		return;
	}

	removeCodeRunner({ wrapper });

	const sessionId = `code-runner-${Date.now()}-${codeRunnerSessionCount += 1}`;
	const consoleElement = createCodeConsole();
	const iframe = createCodeRunnerFrame();
	const session = {
		button,
		consoleBody: consoleElement.querySelector(".code-console-body"),
		consoleCopyButton: consoleElement.querySelector("[data-action='copy-code-console']"),
		consoleElement,
		consoleStatus: consoleElement.querySelector(".code-console-status"),
		code,
		iframe,
		lineCount: 0,
		readyTimer: 0,
		sessionId,
		wrapper
	};

	iframe.name = JSON.stringify({
		channel: codeRunnerChannel,
		action: "execute",
		code,
		sessionId
	});
	wrapper.dataset.codeRunnerSession = sessionId;
	wrapper.append(consoleElement, iframe);
	codeRunnerSessions.set(sessionId, session);
	setCodeRunButtonState({ button, running: true });
	iframe.src = new URL("code-runner.html", document.baseURI).href;
	session.readyTimer = window.setTimeout(function handleCodeRunnerReadyTimeout() {
		failCodeRunner({ session, message: "The JavaScript sandbox could not be started." });
	}, 5000);
}

/**
 * Creates the visible console for a runnable code block.
 * @returns {HTMLElement}
 */
function createCodeConsole() {
	const consoleElement = document.createElement("section");
	const header = document.createElement("div");
	const title = document.createElement("span");
	const controls = document.createElement("span");
	const status = document.createElement("span");
	const body = document.createElement("div");
	const copyButton = createCodeConsoleActionButton({
		action: "copy-code-console",
		icon: "fa-regular fa-copy",
		label: "Copy console output",
		disabled: true
	});
	const closeButton = createCodeConsoleActionButton({
		action: "close-code-console",
		icon: "fa-solid fa-xmark",
		label: "Close console",
		disabled: false
	});

	consoleElement.className = "code-console";
	consoleElement.setAttribute("aria-label", "JavaScript console");
	header.className = "code-console-header";
	title.className = "code-console-title";
	title.innerHTML = `<i class="fa-solid fa-terminal" aria-hidden="true"></i><span>Console</span>`;
	controls.className = "code-console-controls";
	status.className = "code-console-status";
	status.textContent = "Running…";
	body.className = "code-console-body";
	body.setAttribute("role", "log");
	body.setAttribute("aria-live", "polite");
	controls.append(status, copyButton, closeButton);
	header.append(title, controls);
	consoleElement.append(header, body);

	return consoleElement;
}

/**
 * Creates an icon action for the JavaScript console header.
 * @param {object} params
 * @param {string} params.action
 * @param {string} params.icon
 * @param {string} params.label
 * @param {boolean} params.disabled
 * @returns {HTMLButtonElement}
 */
function createCodeConsoleActionButton({ action, icon, label, disabled }) {
	const button = document.createElement("button");

	button.className = "code-console-action";
	button.type = "button";
	button.dataset.action = action;
	button.disabled = disabled;
	button.setAttribute("aria-label", label);
	button.title = label;
	button.innerHTML = `<i class="${escapeAttribute(icon)}" aria-hidden="true"></i>`;

	return button;
}

/**
 * Creates the hidden sandbox frame that hosts code execution.
 * @returns {HTMLIFrameElement}
 */
function createCodeRunnerFrame() {
	const iframe = document.createElement("iframe");

	iframe.className = "code-runner-frame";
	iframe.title = "JavaScript code execution sandbox";
	iframe.tabIndex = -1;
	iframe.setAttribute("aria-hidden", "true");
	iframe.setAttribute("sandbox", "allow-scripts");

	return iframe;
}

/**
 * Handles messages from isolated code runner frames.
 * @param {MessageEvent} event
 * @returns {void}
 */
function handleCodeRunnerMessage(event) {
	const data = event.data;

	if (!data || data.channel !== codeRunnerChannel) {
		return;
	}

	const session = findCodeRunnerSession({ source: event.source });

	if (!session || (data.sessionId && data.sessionId !== session.sessionId)) {
		return;
	}

	window.clearTimeout(session.readyTimer);

	if (data.action === "ready") {
		session.consoleStatus.textContent = "Running…";
		session.iframe.contentWindow?.postMessage({
			channel: codeRunnerChannel,
			action: "execute",
			code: session.code,
			sessionId: session.sessionId
		}, "*");
		return;
	}

	if (data.action === "output") {
		appendCodeConsoleLine({
			session,
			level: data.level,
			values: Array.isArray(data.values) ? data.values : []
		});
		return;
	}

	if (data.action === "complete") {
		completeCodeRunner({ session });
		return;
	}

	if (data.action === "failed") {
		failCodeRunner({ session, message: data.message || "JavaScript execution failed." });
	}
}

/**
 * Finds a code runner session by its message source.
 * @param {object} params
 * @param {MessageEventSource|null} params.source
 * @returns {object|null}
 */
function findCodeRunnerSession({ source }) {
	const sessions = Array.from(codeRunnerSessions.values());

	for (let index = 0; index < sessions.length; index += 1) {
		if (sessions[index].iframe.contentWindow === source) {
			return sessions[index];
		}
	}

	return null;
}

/**
 * Appends one captured console call to the visible console.
 * @param {object} params
 * @param {object} params.session
 * @param {string} params.level
 * @param {Array<string>} params.values
 * @returns {void}
 */
function appendCodeConsoleLine({ session, level, values }) {
	const allowedLevels = ["debug", "error", "info", "log", "warn"];
	const normalizedLevel = allowedLevels.includes(level) ? level : "log";
	const line = document.createElement("div");
	const label = document.createElement("span");
	const message = document.createElement("span");

	line.className = `code-console-line is-${normalizedLevel}`;
	label.className = "code-console-level";
	label.textContent = normalizedLevel;
	message.className = "code-console-message";
	message.textContent = values.join(" ");
	line.append(label, message);
	session.consoleBody.append(line);
	session.consoleCopyButton.disabled = false;
	session.lineCount += 1;
}

/**
 * Marks a code runner session as complete.
 * @param {object} params
 * @param {object} params.session
 * @returns {void}
 */
function completeCodeRunner({ session }) {
	session.consoleStatus.textContent = "Completed";
	setCodeRunButtonState({ button: session.button, running: false });

	if (!session.lineCount) {
		appendCodeConsoleLine({
			session,
			level: "log",
			values: ["No console output."]
		});
		session.consoleBody.lastElementChild?.classList.add("is-empty");
	}
}

/**
 * Shows a runner failure in its attached console.
 * @param {object} params
 * @param {object} params.session
 * @param {string} params.message
 * @returns {void}
 */
function failCodeRunner({ session, message }) {
	window.clearTimeout(session.readyTimer);
	session.consoleStatus.textContent = "Failed";
	setCodeRunButtonState({ button: session.button, running: false });
	appendCodeConsoleLine({ session, level: "error", values: [message] });
}

/**
 * Updates a code block run button for execution state.
 * @param {object} params
 * @param {HTMLElement} params.button
 * @param {boolean} params.running
 * @returns {void}
 */
function setCodeRunButtonState({ button, running }) {
	const icon = button.querySelector("i");
	const label = button.querySelector("span");
	const buttonLabel = running ? "Restart" : "Run";

	button.classList.toggle("is-running", running);
	button.setAttribute("aria-label", buttonLabel);
	button.title = buttonLabel;

	if (icon) {
		icon.className = running ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-play";
	}

	if (label) {
		label.textContent = buttonLabel;
	}
}

/**
 * Removes a code runner session from one code block.
 * @param {object} params
 * @param {HTMLElement} params.wrapper
 * @returns {void}
 */
function removeCodeRunner({ wrapper }) {
	const sessionId = wrapper.dataset.codeRunnerSession;
	const session = codeRunnerSessions.get(sessionId);

	if (!session) {
		return;
	}

	window.clearTimeout(session.readyTimer);
	session.consoleElement.remove();
	session.iframe.remove();
	codeRunnerSessions.delete(sessionId);
	delete wrapper.dataset.codeRunnerSession;
}

/**
 * Removes every active article code runner.
 * @returns {void}
 */
function removeArticleCodeRunners() {
	const sessions = Array.from(codeRunnerSessions.values());

	for (let index = 0; index < sessions.length; index += 1) {
		removeCodeRunner({ wrapper: sessions[index].wrapper });
	}
}

/**
 * Closes a code block console and stops its sandbox.
 * @param {object} params
 * @param {HTMLElement} params.button
 * @returns {void}
 */
function closeCodeConsole({ button }) {
	const wrapper = button.closest(".code-embed");

	if (!wrapper) {
		return;
	}

	removeCodeRunner({ wrapper });
	const runButton = wrapper.querySelector("[data-action='run-code-block']");

	if (runButton) {
		setCodeRunButtonState({ button: runButton, running: false });
	}
}

/**
 * Copies the captured output from one code block console.
 * @param {object} params
 * @param {HTMLElement} params.button
 * @returns {Promise<void>}
 */
async function copyCodeConsoleOutput({ button }) {
	const consoleElement = button.closest(".code-console");
	const text = consoleElement ? getCodeConsoleText({ consoleElement }) : "";
	const copied = text ? await copyText({
		text,
		successMessage: "Console output copied."
	}) : false;

	if (copied) {
		showCopyButtonCopiedState({ button });
	}
}

/**
 * Gets plain text from a rendered code console.
 * @param {object} params
 * @param {HTMLElement} params.consoleElement
 * @returns {string}
 */
function getCodeConsoleText({ consoleElement }) {
	const lines = consoleElement.querySelectorAll(".code-console-line");
	const output = [];

	for (let index = 0; index < lines.length; index += 1) {
		const level = lines[index].querySelector(".code-console-level")?.textContent || "log";
		const message = lines[index].querySelector(".code-console-message")?.textContent || "";
		output.push(`[${level}] ${message}`);
	}

	return output.join("\n");
}

/**
 * Copies article code block content.
 * @param {object} params
 * @param {HTMLElement} params.button
 * @returns {Promise<void>}
 */
async function copyArticleCodeBlock({ button }) {
	const wrapper = button.closest(".code-embed");
	const code = wrapper?.querySelector("pre code");
	const text = code?.textContent || "";
	const copied = text ? await copyText({
		text,
		successMessage: "Code copied."
	}) : false;

	if (copied) {
		showCopyButtonCopiedState({ button });
	}
}

/**
 * Toggles soft wrapping for one article code block.
 * @param {object} params
 * @param {HTMLElement} params.button
 * @returns {void}
 */
function toggleArticleCodeWrap({ button }) {
	const wrapper = button.closest(".code-embed");
	const label = button.querySelector("span");

	if (!wrapper) {
		return;
	}

	const wrapped = !wrapper.classList.contains("is-wrapped");
	const accessibleLabel = wrapped ? "Disable line wrapping" : "Wrap lines";

	wrapper.classList.toggle("is-wrapped", wrapped);
	button.classList.toggle("is-active", wrapped);
	button.setAttribute("aria-label", accessibleLabel);
	button.setAttribute("aria-pressed", String(wrapped));
	button.title = accessibleLabel;

	if (label) {
		label.textContent = wrapped ? "Unwrap" : "Wrap";
	}
}

/**
 * Copies a rendered table as tab-separated text.
 * @param {object} params
 * @param {HTMLElement} params.button
 * @returns {Promise<void>}
 */
async function copyArticleTable({ button }) {
	const embed = button.closest(".table-embed");
	const table = embed?.querySelector("table");
	const text = table ? getTableClipboardText({ table }) : "";
	const copied = text ? await copyText({
		text,
		successMessage: "Table copied."
	}) : false;

	if (copied) {
		showCopyButtonCopiedState({ button });
	}
}

/**
 * Gets tab-separated text from a rendered table.
 * @param {object} params
 * @param {HTMLTableElement} params.table
 * @returns {string}
 */
function getTableClipboardText({ table }) {
	const rows = table.querySelectorAll("tr");
	const lines = [];

	for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
		const cells = rows[rowIndex].querySelectorAll("th, td");
		const values = [];

		for (let cellIndex = 0; cellIndex < cells.length; cellIndex += 1) {
			values.push(normalizeTableCellText(cells[cellIndex].textContent || ""));
		}

		lines.push(values.join("\t"));
	}

	return lines.join("\n");
}

/**
 * Normalizes table cell text for clipboard output.
 * @param {string} text
 * @returns {string}
 */
function normalizeTableCellText(text) {
	return text.replace(/\s+/g, " ").trim();
}

/**
 * Shows temporary copied state on a copy button.
 * @param {object} params
 * @param {HTMLElement} params.button
 * @returns {void}
 */
function showCopyButtonCopiedState({ button }) {
	const icon = button.querySelector("i");
	const label = button.querySelector("span");
	const activeTimer = Number(button.dataset.copyResetTimer);

	if (!button.dataset.copyOriginalLabel) {
		button.dataset.copyOriginalLabel = label?.textContent || "Copy";
		button.dataset.copyOriginalIcon = icon?.className || "fa-regular fa-copy";
		button.dataset.copyOriginalAriaLabel = button.getAttribute("aria-label") || "";
		button.dataset.copyOriginalTitle = button.title;
	}

	if (Number.isFinite(activeTimer)) {
		window.clearTimeout(activeTimer);
	}

	button.classList.add("is-copied");
	button.setAttribute("aria-label", "Copied");
	button.title = "Copied";

	if (icon) {
		icon.className = "fa-solid fa-check";
	}

	if (label) {
		label.textContent = "Copied";
	}

	const resetTimer = window.setTimeout(function resetCopyButtonState() {
		button.classList.remove("is-copied");
		button.setAttribute("aria-label", button.dataset.copyOriginalAriaLabel);
		button.title = button.dataset.copyOriginalTitle;

		if (icon) {
			icon.className = button.dataset.copyOriginalIcon;
		}

		if (label) {
			label.textContent = button.dataset.copyOriginalLabel;
		}

		delete button.dataset.copyOriginalAriaLabel;
		delete button.dataset.copyOriginalIcon;
		delete button.dataset.copyOriginalLabel;
		delete button.dataset.copyOriginalTitle;
		delete button.dataset.copyResetTimer;
	}, 1800);

	button.dataset.copyResetTimer = String(resetTimer);
}

/**
 * Toggles an article code block body.
 * @param {object} params
 * @param {HTMLElement} params.button
 * @returns {void}
 */
function toggleArticleCodeBlock({ button }) {
	const wrapper = button.closest(".code-embed");
	const icon = button.querySelector("i");
	const label = button.querySelector("span");

	if (!wrapper) {
		return;
	}

	const collapsed = !wrapper.classList.contains("is-collapsed");

	wrapper.classList.toggle("is-collapsed", collapsed);
	button.setAttribute("aria-expanded", String(!collapsed));
	button.setAttribute("aria-label", collapsed ? "Expand" : "Collapse");
	button.title = collapsed ? "Expand" : "Collapse";

	if (icon) {
		icon.className = collapsed ? "fa-solid fa-chevron-down" : "fa-solid fa-chevron-up";
	}

	if (label) {
		label.textContent = collapsed ? "Expand" : "Collapse";
	}
}

/**
 * Scrolls the article viewport to the top.
 * @returns {void}
 */
function scrollArticleToTop() {
	select(selectors.article).scrollTo({
		top: 0,
		behavior: "smooth"
	});
}

/**
 * Schedules the contextual scroll-top button update.
 * @returns {void}
 */
function handleArticleScroll() {
	if (state.scrollTopFrame) {
		return;
	}

	state.scrollTopFrame = window.requestAnimationFrame(() => {
		state.scrollTopFrame = 0;
		renderScrollTopButton();
	});
}

/**
 * Shows the scroll-top button after a substantial reading distance.
 * @returns {void}
 */
function renderScrollTopButton() {
	const article = select(selectors.article);
	const button = select(selectors.scrollTopButton);
	const threshold = Math.max(minimumScrollTopOffset, article.clientHeight);
	button.hidden = article.scrollTop < threshold;
}

/**
 * Handles article text selections.
 * @returns {void}
 */
function handleSelectionChange() {
	window.requestAnimationFrame(renderSelectionMenu);
}

/**
 * Renders the selection tools menu near selected article text.
 * @returns {void}
 */
function renderSelectionMenu() {
	const menu = select(selectors.selectionMenu);
	const selection = window.getSelection();

	if (!selection || selection.isCollapsed || !state.activePath) {
		hideSelectionMenu();
		return;
	}

	if (menu.contains(document.activeElement)) {
		return;
	}

	const range = selection.rangeCount ? selection.getRangeAt(0) : null;
	const article = select(selectors.article);
	const selectedText = selection.toString().trim();

	if (
		!range ||
		countCharacters(selectedText) < minimumSelectionCharacters ||
		!isSelectionInsideArticle({ range, article })
	) {
		hideSelectionMenu();
		return;
	}

	const rect = getSelectionRect({ range });

	if (!rect) {
		hideSelectionMenu();
		return;
	}

	state.selectedText = selectedText;
	select(selectors.selectionCount).textContent = getSelectionCountLabel({ text: selectedText });
	select(selectors.qrSelectionButton).hidden = countCharacters(selectedText) > maximumQrCodeCharacters;
	menu.hidden = false;
	menu.style.visibility = "hidden";
	positionSelectionMenu({ menu, rect });
	menu.style.visibility = "";
}

/**
 * Gets the selection count label.
 * @param {object} params
 * @param {string} params.text
 * @returns {string}
 */
function getSelectionCountLabel({ text }) {
	return `${formatNumber(countWords(text))} words, ${formatNumber(countCharacters(text))} characters`;
}

/**
 * Checks whether a selection range is inside the article.
 * @param {object} params
 * @param {Range} params.range
 * @param {Element} params.article
 * @returns {boolean}
 */
function isSelectionInsideArticle({ range, article }) {
	const container = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
		? range.commonAncestorContainer
		: range.commonAncestorContainer.parentElement;

	return Boolean(container && article.contains(container) && container.closest(".article-inner"));
}

/**
 * Gets a usable selection rectangle.
 * @param {object} params
 * @param {Range} params.range
 * @returns {DOMRect|null}
 */
function getSelectionRect({ range }) {
	const rect = range.getBoundingClientRect();

	if (rect.width || rect.height) {
		return rect;
	}

	const rects = range.getClientRects();

	if (rects.length) {
		return rects[0];
	}

	return null;
}

/**
 * Positions the selection menu within the viewport.
 * @param {object} params
 * @param {HTMLElement} params.menu
 * @param {DOMRect} params.rect
 * @returns {void}
 */
function positionSelectionMenu({ menu, rect }) {
	const gap = 18;
	const width = menu.offsetWidth || 260;
	const height = menu.offsetHeight || 74;
	const topAbove = rect.top - height - gap;
	const topBelow = rect.bottom + gap;
	const left = Math.min(
		window.innerWidth - width - gap,
		Math.max(gap, rect.left + rect.width / 2 - width / 2)
	);
	const top = topAbove >= gap
		? topAbove
		: Math.min(window.innerHeight - height - gap, topBelow);

	menu.style.left = `${left}px`;
	menu.style.top = `${Math.max(gap, top)}px`;
}

/**
 * Handles pointer presses outside the selection menu.
 * @param {PointerEvent} event
 * @returns {void}
 */
function handleDocumentPointerDown(event) {
	const menu = select(selectors.selectionMenu);
	const settingsWrap = event.target.closest(".floating-navigation-wrap");

	if (!menu.hidden && !menu.contains(event.target)) {
		hideSelectionMenu();
	}

	if (state.settingsOpen && !settingsWrap) {
		closeQuickSettings();
	}
}

/**
 * Handles document-level clicks for dynamic article controls.
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleDocumentClick(event) {
	const mapFullscreenLink = event.target.closest("[data-map-fullscreen]");

	if (mapFullscreenLink) {
		const mapEmbed = mapFullscreenLink.closest(".map-embed");
		const mapElement = mapEmbed?.querySelector("[data-map]");
		const map = mapElement ? getArticleMapByElement({ element: mapElement }) : null;

		event.preventDefault();

		if (mapElement) {
			openMapFullscreen({ mapElement, map });
		}
	}
}

/**
 * Handles keyboard selection changes.
 * @returns {void}
 */
function handleDocumentKeyUp() {
	window.requestAnimationFrame(renderSelectionMenu);
}

/**
 * Handles global keyboard shortcuts.
 * @param {KeyboardEvent} event
 * @returns {void}
 */
function handleDocumentKeyDown(event) {
	if (event.key === "Escape" && state.settingsOpen) {
		closeQuickSettings();
		select("[data-action='toggle-settings']").focus();
	}
}

/**
 * Hides the selection menu.
 * @returns {void}
 */
function hideSelectionMenu() {
	select(selectors.selectionMenu).hidden = true;
}

/**
 * Renders markdown to HTML.
 * @param {object} params
 * @param {string} params.markdown
 * @returns {string}
 */
function renderMarkdown({ markdown }) {
	const html = marked.parse(replaceWikiLinks({ markdown: replaceComponentSyntax({ markdown }) }));
	return resolveRenderedLinks({ html });
}

/**
 * Replaces supported fenced components before Markdown parsing.
 * @param {object} params
 * @param {string} params.markdown
 * @returns {string}
 */
function replaceComponentSyntax({ markdown }) {
	const lines = markdown.replace(/\r\n/g, "\n").split("\n");
	const output = [];

	for (let index = 0; index < lines.length; index += 1) {
		const opening = getFenceOpening(lines[index]);

		if (!opening) {
			output.push(lines[index]);
			continue;
		}

		const closingIndex = findClosingFenceIndex({
			lines,
			startIndex: index + 1,
			marker: opening.marker,
			minimumLength: opening.length
		});

		if (closingIndex < 0) {
			output.push(lines.slice(index).join("\n"));
			break;
		}

		const source = lines.slice(index + 1, closingIndex).join("\n");
		const placeholder = createComponentPlaceholder({ type: opening.info, source });

		if (placeholder) {
			output.push(placeholder);
		} else {
			output.push(lines.slice(index, closingIndex + 1).join("\n"));
		}

		index = closingIndex;
	}

	return output.join("\n");
}

/**
 * Creates markup for one supported fenced component.
 * @param {object} params
 * @param {string} params.type
 * @param {string} params.source
 * @returns {string}
 */
function createComponentPlaceholder({ type, source }) {
	if (type === "map" && state.config.maps?.enabled) {
		return createMapPlaceholder({ source });
	}

	if (type === "ticker") {
		return createTickerPlaceholder({ source });
	}

	if (type === "swot") {
		return createSwotPlaceholder({ source });
	}

	if (type === "pte") {
		return createPtePlaceholder({ source });
	}

	return "";
}

/**
 * Gets opening-fence metadata from a Markdown line.
 * @param {string} line
 * @returns {object|null}
 */
function getFenceOpening(line) {
	const match = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);

	if (!match) {
		return null;
	}

	return {
		marker: match[1][0],
		length: match[1].length,
		info: match[2].trim()
	};
}

/**
 * Finds a matching closing Markdown fence.
 * @param {object} params
 * @param {Array<string>} params.lines
 * @param {number} params.startIndex
 * @param {string} params.marker
 * @param {number} params.minimumLength
 * @returns {number}
 */
function findClosingFenceIndex({ lines, startIndex, marker, minimumLength }) {
	for (let index = startIndex; index < lines.length; index += 1) {
		const match = lines[index].match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);

		if (match && match[1][0] === marker && match[1].length >= minimumLength) {
			return index;
		}
	}

	return -1;
}

/**
 * Creates map placeholder markup.
 * @param {object} params
 * @param {string} params.source
 * @returns {string}
 */
function createMapPlaceholder({ source }) {
	const properties = parseComponentProperties({ source, allowedKeys: mapPropertyNames });
	const map = getMapValues(properties);
	const className = map.grayscale === "true" ? "map-canvas is-grayscale" : "map-canvas";
	const googleMapsUrl = getGoogleMapsUrl({ latitude: map.latitude, longitude: map.longitude });
	const coordinateLabel = formatCoordinates({ latitude: map.latitude, longitude: map.longitude });
	const labelMarkup = map.label
		? `<strong class="map-label">${escapeHtml(map.label)}</strong>`
		: "";
	const accessibleLabel = map.label || `Map at ${coordinateLabel}`;

	return `<figure class="map-embed"><div class="${className}" data-map data-lat="${escapeAttribute(map.latitude)}" data-lon="${escapeAttribute(map.longitude)}" data-zoom="${escapeAttribute(map.zoom)}" data-marker="${escapeAttribute(map.marker)}" data-grayscale="${escapeAttribute(map.grayscale)}" data-label="${escapeAttribute(map.label)}" aria-label="${escapeAttribute(accessibleLabel)}"></div><figcaption class="map-footer"><span class="map-details">${labelMarkup}<span class="map-data"><span class="map-coordinate-label" data-map-coordinates>${escapeHtml(coordinateLabel)}</span><span class="map-data-separator" aria-hidden="true">&middot;</span><span data-map-zoom>${escapeHtml(formatMapZoom(map.zoom))}</span></span></span><span class="map-footer-actions"><a href="${escapeAttribute(googleMapsUrl)}" target="_blank" rel="noreferrer" data-map-google><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i><span>Google Maps</span></a><button type="button" data-map-fullscreen><i class="fa-solid fa-expand" aria-hidden="true"></i><span data-map-fullscreen-label>Fullscreen</span></button></span></figcaption></figure>`;
}

/**
 * Parses allowed one-property-per-line component source values.
 * @param {object} params
 * @param {string} params.source
 * @param {Array<string>} params.allowedKeys
 * @returns {object}
 */
function parseComponentProperties({ source, allowedKeys }) {
	const properties = {};
	const lines = source.replace(/\r\n/g, "\n").split("\n");

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index].trim();
		const separatorIndex = line.indexOf(":");

		if (separatorIndex <= 0) {
			continue;
		}

		const key = line.slice(0, separatorIndex).trim().toLowerCase();
		const value = line.slice(separatorIndex + 1).trim();

		if (allowedKeys.includes(key)) {
			properties[key] = value;
		}
	}

	return properties;
}

/**
 * Creates a linked market ticker card.
 * @param {object} params
 * @param {string} params.source
 * @returns {string}
 */
function createTickerPlaceholder({ source }) {
	const properties = parseComponentProperties({ source, allowedKeys: tickerPropertyNames });
	const ticker = getTickerValues(properties);
	const marketMarkup = `<span class="ticker-market">${escapeHtml(ticker.market || "Market")}</span>`;
	const changeMarkup = ticker.change
		? `<span class="ticker-change ${getTickerChangeClass(ticker.change)}">${escapeHtml(ticker.change)}</span>`
		: "";
	const searchUrl = getTickerSearchUrl({ symbol: ticker.symbol, label: ticker.label });
	const searchTerm = ticker.symbol || ticker.label || "market instrument";
	const accessibleLabel = `${ticker.label}, ${ticker.market || "market"}, ticker ${ticker.symbol || "unavailable"}, quote ${ticker.quote}${ticker.change ? `, change ${ticker.change}` : ""}. Search Google for stock ticker ${searchTerm}`;

	return `<figure class="ticker-embed"><a class="ticker-link" href="${escapeAttribute(searchUrl)}" target="_blank" rel="noreferrer" aria-label="${escapeAttribute(accessibleLabel)}" title="Search Google for stock ticker ${escapeAttribute(searchTerm)}"><span class="ticker-identity">${marketMarkup}<strong class="ticker-label">${escapeHtml(ticker.label)}</strong><span class="ticker-symbol">${escapeHtml(ticker.symbol || "Symbol unavailable")}</span></span><span class="ticker-pricing"><span class="ticker-quote-row"><strong class="ticker-quote">${escapeHtml(ticker.quote)}</strong><i class="fa-solid fa-arrow-up-right-from-square ticker-search-icon" aria-hidden="true"></i></span>${changeMarkup}</span></a></figure>`;
}

/**
 * Creates a four-quadrant SWOT analysis card.
 * @param {object} params
 * @param {string} params.source
 * @returns {string}
 */
function createSwotPlaceholder({ source }) {
	const properties = parseComponentProperties({ source, allowedKeys: swotPropertyNames });
	const factors = getSwotFactors(properties);
	let quadrantMarkup = "";

	for (let index = 0; index < factors.length; index += 1) {
		quadrantMarkup += createSwotQuadrantMarkup(factors[index]);
	}

	return `<figure class="swot-embed" aria-label="SWOT analysis"><dl class="swot-grid">${quadrantMarkup}</dl></figure>`;
}

/**
 * Gets normalized labels and values for the four SWOT factors.
 * @param {object} params
 * @param {string} params.strengths
 * @param {string} params.weaknesses
 * @param {string} params.opportunities
 * @param {string} params.threats
 * @returns {Array<object>}
 */
function getSwotFactors({ strengths, weaknesses, opportunities, threats }) {
	return [
		{ key: "strengths", initial: "S", label: "Strengths", value: String(strengths || "").trim() || "—" },
		{ key: "weaknesses", initial: "W", label: "Weaknesses", value: String(weaknesses || "").trim() || "—" },
		{ key: "opportunities", initial: "O", label: "Opportunities", value: String(opportunities || "").trim() || "—" },
		{ key: "threats", initial: "T", label: "Threats", value: String(threats || "").trim() || "—" }
	];
}

/**
 * Creates one SWOT factor quadrant.
 * @param {object} params
 * @param {string} params.key
 * @param {string} params.initial
 * @param {string} params.label
 * @param {string} params.value
 * @returns {string}
 */
function createSwotQuadrantMarkup({ key, initial, label, value }) {
	return `<div class="swot-quadrant swot-${escapeAttribute(key)}"><dt class="swot-factor"><span class="swot-initial" aria-hidden="true">${escapeHtml(initial)}</span><span>${escapeHtml(label)}</span></dt><dd class="swot-value">${escapeHtml(value)}</dd></div>`;
}

/**
 * Creates a linked periodic table of elements.
 * @param {object} params
 * @param {string} params.source
 * @returns {string}
 */
function createPtePlaceholder({ source }) {
	const properties = parseComponentProperties({ source, allowedKeys: ptePropertyNames });
	const pte = getPteValues(properties);
	const linkConfig = getPeriodicTableLinkConfig();
	const highlightedSymbols = new Set(pte.elements);
	const hasHighlights = highlightedSymbols.size > 0;
	const className = hasHighlights ? "pte-embed has-highlights" : "pte-embed";
	const summary = hasHighlights
		? `${formatNumber(highlightedSymbols.size)} highlighted ${highlightedSymbols.size === 1 ? "element" : "elements"}`
		: `${formatNumber(periodicTableElements.length)} elements`;
	const elementMarkup = [];

	for (let index = 0; index < periodicTableElements.length; index += 1) {
		elementMarkup.push(createPteElementMarkup({
			element: periodicTableElements[index],
			highlightedSymbols,
			linkConfig
		}));
	}

	return `<figure class="${className}"><figcaption class="pte-header"><span class="pte-heading"><strong class="pte-label">${escapeHtml(pte.label)}</strong><span class="pte-summary">${escapeHtml(summary)}</span></span><span class="pte-service"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i><span>${escapeHtml(linkConfig.label)} links</span></span></figcaption><div class="pte-scroll"><div class="pte-grid" aria-label="${escapeAttribute(pte.label)}">${elementMarkup.join("")}</div></div></figure>`;
}

/**
 * Creates one linked element tile.
 * @param {object} params
 * @param {object} params.element
 * @param {Set<string>} params.highlightedSymbols
 * @param {object} params.linkConfig
 * @returns {string}
 */
function createPteElementMarkup({ element, highlightedSymbols, linkConfig }) {
	const isHighlighted = highlightedSymbols.has(element.symbol);
	const className = isHighlighted ? "pte-element is-highlighted" : "pte-element";
	const url = getPeriodicTableElementUrl({ element, template: linkConfig.template });
	const accessibleLabel = `${element.name}, ${element.symbol}, atomic number ${element.atomicNumber}${isHighlighted ? ", highlighted" : ""}. Open in ${linkConfig.label}`;

	return `<a class="${className}" href="${escapeAttribute(url)}" target="_blank" rel="noreferrer" data-column="${element.column}" data-row="${element.row}" aria-label="${escapeAttribute(accessibleLabel)}" title="${escapeAttribute(accessibleLabel)}"><span class="pte-number">${element.atomicNumber}</span><strong class="pte-symbol">${escapeHtml(element.symbol)}</strong><span class="pte-name">${escapeHtml(element.name)}</span></a>`;
}

/**
 * Normalizes periodic-table component values for display.
 * @param {object} params
 * @param {string} params.label
 * @param {string} params.elements
 * @returns {{ label: string, elements: Array<string> }}
 */
function getPteValues({ label, elements }) {
	const tokens = String(elements || "").split(/[\s,;|]+/);
	const symbols = [];

	for (let index = 0; index < tokens.length; index += 1) {
		const element = periodicTableElementLookup.get(tokens[index].trim().toLowerCase());

		if (element && !symbols.includes(element.symbol)) {
			symbols.push(element.symbol);
		}
	}

	return {
		label: String(label || "").trim() || "Periodic table of elements",
		elements: symbols
	};
}

/**
 * Gets the configured periodic-table link service.
 * @returns {{ label: string, template: string }}
 */
function getPeriodicTableLinkConfig() {
	return {
		label: String(state.config.periodicTable?.linkLabel || "").trim() || defaultPeriodicTableLinkLabel,
		template: String(state.config.periodicTable?.linkTemplate || "").trim() || defaultPeriodicTableLinkTemplate
	};
}

/**
 * Creates a case-insensitive element-symbol lookup.
 * @returns {Map<string, object>}
 */
function createPeriodicTableElementLookup() {
	const lookup = new Map();

	for (let index = 0; index < periodicTableElements.length; index += 1) {
		const element = periodicTableElements[index];
		lookup.set(element.symbol.toLowerCase(), element);
	}

	return lookup;
}

/**
 * Normalizes ticker component values for display.
 * @param {object} params
 * @param {string} params.symbol
 * @param {string} params.label
 * @param {string} params.quote
 * @param {string} params.market
 * @param {string} params.change
 * @returns {object}
 */
function getTickerValues({ symbol, label, quote, market, change }) {
	const normalizedSymbol = String(symbol || "").trim();
	const normalizedLabel = String(label || "").trim();

	return {
		symbol: normalizedSymbol,
		label: normalizedLabel || normalizedSymbol || "Market instrument",
		quote: String(quote || "").trim() || "—",
		market: String(market || "").trim(),
		change: String(change || "").trim()
	};
}

/**
 * Gets the visual state for a signed ticker change.
 * @param {string} change
 * @returns {string}
 */
function getTickerChangeClass(change) {
	const normalized = String(change || "").trim();

	if (/^(\+|↑)/.test(normalized)) {
		return "is-positive";
	}

	if (/^(-|−|↓)/.test(normalized)) {
		return "is-negative";
	}

	return "is-neutral";
}

/**
 * Gets a Google search URL for a ticker symbol.
 * @param {object} params
 * @param {string} params.symbol
 * @param {string} params.label
 * @returns {string}
 */
function getTickerSearchUrl({ symbol, label }) {
	const searchTerm = String(symbol || label || "").trim();
	const query = searchTerm ? `stock ticker ${searchTerm}` : "stock ticker";

	return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Formats coordinates for display.
 * @param {object} params
 * @param {string|number} params.latitude
 * @param {string|number} params.longitude
 * @returns {string}
 */
function formatCoordinates({ latitude, longitude }) {
	const lat = Number(latitude);
	const lon = Number(longitude);

	if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
		return "0.000°, 0.000°";
	}

	return `${lat.toFixed(3)}°, ${lon.toFixed(3)}°`;
}

/**
 * Formats a MapLibre zoom value for display.
 * @param {number|string} zoom
 * @returns {string}
 */
function formatMapZoom(zoom) {
	const value = Number(zoom);

	if (!Number.isFinite(value)) {
		return "Zoom 0";
	}

	return `Zoom ${Number(value.toFixed(1))}`;
}

/**
 * Gets a Google Maps URL for explicit map coordinates.
 * @param {object} params
 * @param {string} params.latitude
 * @param {string} params.longitude
 * @returns {string}
 */
function getGoogleMapsUrl({ latitude, longitude }) {
	const hasLatitude = String(latitude || "").trim();
	const hasLongitude = String(longitude || "").trim();
	const lat = Number(latitude);
	const lon = Number(longitude);

	if (hasLatitude && hasLongitude && Number.isFinite(lat) && Number.isFinite(lon)) {
		return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lon}`)}`;
	}

	return "https://www.google.com/maps";
}

/**
 * Gets map values with config fallback.
 * @param {object} params
 * @param {string} params.latitude
 * @param {string} params.longitude
 * @param {string} params.zoom
 * @param {string} params.marker
 * @param {string} params.grayscale
 * @param {string} params.label
 * @returns {object}
 */
function getMapValues({ latitude, longitude, zoom, marker, grayscale, label }) {
	const fallback = getMapFallback();

	return {
		latitude: String(getNumberInRange({ value: latitude, fallback: fallback.latitude, minimum: -90, maximum: 90 })),
		longitude: String(getNumberInRange({ value: longitude, fallback: fallback.longitude, minimum: -180, maximum: 180 })),
		zoom: String(getNumberInRange({ value: zoom, fallback: fallback.zoom, minimum: 0, maximum: 22 })),
		marker: String(getBoolean({ value: marker, fallback: false })),
		grayscale: String(getBoolean({ value: grayscale, fallback: Boolean(state.config.maps?.grayscale) })),
		label: String(label || "").trim()
	};
}

/**
 * Gets an in-range number or fallback.
 * @param {object} params
 * @param {number|string} params.value
 * @param {number} params.fallback
 * @param {number} params.minimum
 * @param {number} params.maximum
 * @returns {number}
 */
function getNumberInRange({ value, fallback, minimum, maximum }) {
	const number = getFiniteNumber({ value, fallback });

	return number >= minimum && number <= maximum ? number : fallback;
}

/**
 * Gets a boolean from a boolean-like value or fallback.
 * @param {object} params
 * @param {boolean|string} params.value
 * @param {boolean} params.fallback
 * @returns {boolean}
 */
function getBoolean({ value, fallback }) {
	if (typeof value === "boolean") {
		return value;
	}

	const normalized = String(value || "").trim().toLowerCase();

	if (normalized === "true") {
		return true;
	}

	if (normalized === "false") {
		return false;
	}

	return fallback;
}

/**
 * Gets map fallback settings.
 * @returns {object}
 */
function getMapFallback() {
	const fallback = state.config.maps?.fallback || {};

	return {
		latitude: getFiniteNumber({ value: fallback.latitude, fallback: 0 }),
		longitude: getFiniteNumber({ value: fallback.longitude, fallback: 0 }),
		zoom: getFiniteNumber({ value: fallback.zoom, fallback: 2 })
	};
}

/**
 * Gets a finite number or fallback.
 * @param {object} params
 * @param {number|string} params.value
 * @param {number} params.fallback
 * @returns {number}
 */
function getFiniteNumber({ value, fallback }) {
	if (typeof value === "string" && !value.trim()) {
		return fallback;
	}

	const number = Number(value);

	return Number.isFinite(number) ? number : fallback;
}

/**
 * Replaces Obsidian-style wiki links before Markdown parsing.
 * @param {object} params
 * @param {string} params.markdown
 * @returns {string}
 */
function replaceWikiLinks({ markdown }) {
	const lines = markdown.replace(/\r\n/g, "\n").split("\n");
	const output = [];

	for (let index = 0; index < lines.length; index += 1) {
		const opening = getFenceOpening(lines[index]);

		if (!opening) {
			output.push(replaceWikiLinksInText(lines[index]));
			continue;
		}

		const closingIndex = findClosingFenceIndex({
			lines,
			startIndex: index + 1,
			marker: opening.marker,
			minimumLength: opening.length
		});

		if (closingIndex < 0) {
			output.push(lines.slice(index).join("\n"));
			break;
		}

		output.push(lines.slice(index, closingIndex + 1).join("\n"));
		index = closingIndex;
	}

	return output.join("\n");
}

/**
 * Replaces wiki links in Markdown text outside fenced code blocks.
 * @param {string} text
 * @returns {string}
 */
function replaceWikiLinksInText(text) {
	return text
		.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, createWikiLinkWithLabel)
		.replace(/\[\[([^\]]+)\]\]/g, createWikiLink);
}

/**
 * Resolves rendered Markdown links that point to notes.
 * @param {object} params
 * @param {string} params.html
 * @returns {string}
 */
function resolveRenderedLinks({ html }) {
	const template = document.createElement("template");
	template.innerHTML = html;
	const links = template.content.querySelectorAll("a[href]");

	addRenderedHeadingIds({ template });
	wrapRenderedTables({ template });

	for (let index = 0; index < links.length; index += 1) {
		resolveRenderedLink({ link: links[index] });
	}

	return template.innerHTML;
}

/**
 * Wraps rendered Markdown tables with generated headers and scroll containers.
 * @param {object} params
 * @param {HTMLTemplateElement} params.template
 * @returns {void}
 */
function wrapRenderedTables({ template }) {
	const tables = template.content.querySelectorAll("table");

	for (let index = 0; index < tables.length; index += 1) {
		const table = tables[index];
		const embed = document.createElement("figure");
		const header = createTableHeader({ table });
		const scrollContainer = document.createElement("div");

		embed.className = "table-embed";
		scrollContainer.className = "table-scroll";
		table.before(embed);
		embed.append(header, scrollContainer);
		scrollContainer.append(table);
	}
}

/**
 * Creates a generated header for a rendered Markdown table.
 * @param {object} params
 * @param {HTMLTableElement} params.table
 * @returns {HTMLElement}
 */
function createTableHeader({ table }) {
	const header = document.createElement("figcaption");
	const summary = document.createElement("span");
	const button = document.createElement("button");
	const dimensions = getTableDimensions({ table });

	header.className = "table-header";
	summary.className = "table-summary";
	summary.textContent = `${formatNumber(dimensions.rows)} ${dimensions.rows === 1 ? "row" : "rows"} × ${formatNumber(dimensions.columns)} ${dimensions.columns === 1 ? "column" : "columns"}`;
	button.className = "table-action";
	button.type = "button";
	button.dataset.action = "copy-table";
	button.setAttribute("aria-label", "Copy table");
	button.title = "Copy table";
	button.innerHTML = `<i class="fa-regular fa-copy" aria-hidden="true"></i><span>Copy</span>`;
	header.append(summary, button);

	return header;
}

/**
 * Counts the body rows and maximum columns in a rendered table.
 * @param {object} params
 * @param {HTMLTableElement} params.table
 * @returns {{ rows: number, columns: number }}
 */
function getTableDimensions({ table }) {
	const body = table.querySelector("tbody");
	const rows = table.querySelectorAll("tr");
	let columns = 0;

	for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
		const cells = rows[rowIndex].querySelectorAll("th, td");
		let rowColumns = 0;

		for (let cellIndex = 0; cellIndex < cells.length; cellIndex += 1) {
			rowColumns += cells[cellIndex].colSpan;
		}

		columns = Math.max(columns, rowColumns);
	}

	return {
		rows: body ? body.querySelectorAll("tr").length : rows.length,
		columns
	};
}

/**
 * Adds stable IDs to rendered headings.
 * @param {object} params
 * @param {HTMLTemplateElement} params.template
 * @returns {void}
 */
function addRenderedHeadingIds({ template }) {
	const headings = template.content.querySelectorAll("h1, h2, h3, h4, h5, h6");
	const slugs = {};

	for (let index = 0; index < headings.length; index += 1) {
		const heading = headings[index];
		const slug = getUniqueSlug({ text: heading.textContent || "section", slugs });
		heading.id = slug;
	}
}

/**
 * Resolves a rendered link.
 * @param {object} params
 * @param {HTMLAnchorElement} params.link
 * @returns {void}
 */
function resolveRenderedLink({ link }) {
	const href = link.getAttribute("href") || "";

	if (href === "#" || href.startsWith("#")) {
		return;
	}

	if (isMarkdownPath(href)) {
		const note = findNoteByWikiTarget({ target: href });

		if (note) {
			link.setAttribute("href", "#");
			link.dataset.noteTarget = note.path;
			link.removeAttribute("target");
			link.removeAttribute("rel");
			return;
		}
	}

	link.href = getExternalLinkHref({ href });
	link.setAttribute("target", "_blank");
	link.setAttribute("rel", "noreferrer");
}

/**
 * Gets the final external link URL.
 * @param {object} params
 * @param {string} params.href
 * @returns {string}
 */
function getExternalLinkHref({ href }) {
	if (!isUtmEnabled() || !isHttpUrl({ href })) {
		return href;
	}

	try {
		const url = new URL(href, window.location.href);
		const params = state.config.externalLinks?.utm?.params || {};
		const keys = Object.keys(params);

		for (let index = 0; index < keys.length; index += 1) {
			const key = keys[index];

			if (params[key] && !url.searchParams.has(key)) {
				url.searchParams.set(key, params[key]);
			}
		}

		return url.toString();
	} catch (error) {
		return href;
	}
}

/**
 * Checks whether UTM rewriting is enabled.
 * @returns {boolean}
 */
function isUtmEnabled() {
	return Boolean(state.config.externalLinks?.utm?.enabled);
}

/**
 * Gets the configured GitHub repository URL.
 * @returns {string}
 */
function getGithubRepoUrl() {
	const owner = String(state.config.github?.owner || "").trim();
	const repo = String(state.config.github?.repo || "").trim();

	if (!owner || !repo) {
		return "";
	}

	return `https://github.com/${encodePathPart(owner)}/${encodePathPart(repo)}`;
}

/**
 * Gets the GitHub URL for a markdown article.
 * @param {object} params
 * @param {string} params.path
 * @returns {string}
 */
function getGithubArticleUrl({ path }) {
	const repoUrl = getGithubRepoUrl();
	const branch = String(state.config.github?.branch || "main").trim();
	const rootPath = normalizePath(state.config.github?.rootPath || "");
	const notePath = normalizePath(path);
	const fullPath = rootPath ? `${rootPath}/${notePath}` : notePath;

	if (!repoUrl || !branch || !notePath) {
		return "";
	}

	return `${repoUrl}/blob/${encodePathPart(branch)}/${encodePath(fullPath)}`;
}

/**
 * Gets the public site URL for a markdown article.
 * @param {object} params
 * @param {string} params.path
 * @returns {string}
 */
function getPublishedArticleUrl({ path }) {
	const siteUrl = getPublishedSiteUrl();
	const hash = getNoteHash({ path });

	if (!siteUrl) {
		return "";
	}

	return `${siteUrl}${hash}`;
}

/**
 * Gets the configured public site URL.
 * @returns {string}
 */
function getPublishedSiteUrl() {
	const customDomain = String(state.config.site?.customDomain || "").trim();
	const configuredUrl = String(state.config.site?.url || "").trim();
	const fallbackUrl = `${window.location.origin}${window.location.pathname}`;
	const siteUrl = customDomain || configuredUrl || fallbackUrl;
	const cleanUrl = siteUrl.split("#")[0].split("?")[0];

	if (!cleanUrl) {
		return "";
	}

	return cleanUrl.endsWith("/") ? cleanUrl : `${cleanUrl}/`;
}

/**
 * Gets the active article download URL.
 * @param {object} params
 * @param {object} params.note
 * @returns {string}
 */
function getArticleDownloadUrl({ note }) {
	if (state.config.github?.enabled) {
		return getGithubCdnUrl({ path: note.path });
	}

	return note.sourceUrl || "";
}

/**
 * Gets a jsDelivr URL for a repository path.
 * @param {object} params
 * @param {string} params.path
 * @param {string} [params.rootPath]
 * @returns {string}
 */
function getGithubCdnUrl({ path, rootPath }) {
	const github = state.config.github || {};
	const owner = String(github.owner || "").trim();
	const repo = String(github.repo || "").trim();
	const branch = String(github.branch || "main").trim();
	const resolvedRootPath = normalizePath(rootPath === undefined ? github.rootPath || "" : rootPath);
	const articlePath = normalizePath(path);
	const fullPath = joinRepoPath({ rootPath: resolvedRootPath, path: articlePath });

	if (!owner || !repo || !branch || !articlePath) {
		return "";
	}

	return `https://cdn.jsdelivr.net/gh/${encodePathPart(owner)}/${encodePathPart(repo)}@${encodePathPart(branch)}/${encodePath(fullPath)}`;
}

/**
 * Joins a repository root path and item path without duplicating roots.
 * @param {object} params
 * @param {string} params.rootPath
 * @param {string} params.path
 * @returns {string}
 */
function joinRepoPath({ rootPath, path }) {
	if (!rootPath || path === rootPath || path.startsWith(`${rootPath}/`)) {
		return path;
	}

	return `${rootPath}/${path}`;
}

/**
 * Gets a raw GitHub URL for a repository path.
 * @param {object} params
 * @param {string} params.path
 * @returns {string}
 */
function getGithubRawUrl({ path }) {
	const github = state.config.github || {};
	const owner = String(github.owner || "").trim();
	const repo = String(github.repo || "").trim();
	const branch = String(github.branch || "main").trim();
	const rootPath = normalizePath(github.rootPath || "");
	const assetPath = normalizePath(path);
	const fullPath = rootPath ? `${rootPath}/${assetPath}` : assetPath;

	if (!owner || !repo || !branch || !assetPath) {
		return "";
	}

	return `https://raw.githubusercontent.com/${encodePathPart(owner)}/${encodePathPart(repo)}/${encodePathPart(branch)}/${encodePath(fullPath)}`;
}

/**
 * Gets the Obsidian URL for a markdown article.
 * @param {object} params
 * @param {string} params.path
 * @returns {string}
 */
function getObsidianArticleUrl({ path }) {
	const vault = String(state.config.obsidian?.vault || state.config.title || "").trim();
	const rootPath = normalizePath(state.config.obsidian?.rootPath || "");
	const notePath = normalizePath(path);
	const filePath = rootPath ? `${rootPath}/${notePath}` : notePath;

	if (!vault || !notePath) {
		return "";
	}

	return `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(filePath)}`;
}

/**
 * Encodes slash-separated URL paths.
 * @param {string} path
 * @returns {string}
 */
function encodePath(path) {
	const parts = normalizePath(path).split("/");

	for (let index = 0; index < parts.length; index += 1) {
		parts[index] = encodePathPart(parts[index]);
	}

	return parts.join("/");
}

/**
 * Encodes one URL path part.
 * @param {string} value
 * @returns {string}
 */
function encodePathPart(value) {
	return encodeURIComponent(value);
}

/**
 * Checks whether a URL is HTTP(S).
 * @param {object} params
 * @param {string} params.href
 * @returns {boolean}
 */
function isHttpUrl({ href }) {
	return /^https?:\/\//i.test(href);
}

/**
 * Creates wiki link markup.
 * @param {string} match
 * @param {string} target
 * @returns {string}
 */
function createWikiLink(match, target) {
	return createWikiLinkMarkup({ target, label: target });
}

/**
 * Creates labeled wiki link markup.
 * @param {string} match
 * @param {string} target
 * @param {string} label
 * @returns {string}
 */
function createWikiLinkWithLabel(match, target, label) {
	return createWikiLinkMarkup({ target, label });
}

/**
 * Creates wiki link HTML.
 * @param {object} params
 * @param {string} params.target
 * @param {string} params.label
 * @returns {string}
 */
function createWikiLinkMarkup({ target, label }) {
	const note = findNoteByWikiTarget({ target });
	const safeLabel = escapeHtml(label);

	if (!note) {
		return `<a class="wiki-link is-missing" href="#" aria-label="Missing note">${safeLabel}</a>`;
	}

	return `<a class="wiki-link" href="#" data-note-target="${escapeAttribute(note.path)}">${safeLabel}</a>`;
}

/**
 * Parses simple YAML-style frontmatter.
 * @param {string} content
 * @returns {object}
 */
function parseFrontmatter(content) {
	if (!content.startsWith("---")) {
		return { metadata: {}, body: content };
	}

	const lines = content.replace(/\r\n/g, "\n").split("\n");
	const metadata = {};
	let endIndex = -1;
	let activeListKey = "";

	for (let index = 1; index < lines.length; index += 1) {
		const line = lines[index];
		const trimmed = line.trim();

		if (trimmed === "---") {
			endIndex = index;
			break;
		}

		if (activeListKey && trimmed.startsWith("- ")) {
			metadata[activeListKey].push(trimmed.slice(2).trim());
			continue;
		}

		const separatorIndex = line.indexOf(":");

		if (separatorIndex > -1) {
			const key = line.slice(0, separatorIndex).trim();
			const value = line.slice(separatorIndex + 1).trim();

			if (!key) {
				activeListKey = "";
				continue;
			}

			metadata[key] = value ? parseFrontmatterValue(value) : [];
			activeListKey = value ? "" : key;
		} else if (trimmed) {
			activeListKey = "";
		}
	}

	if (endIndex === -1) {
		return { metadata: {}, body: content };
	}

	return {
		metadata,
		body: lines.slice(endIndex + 1).join("\n").trim()
	};
}

/**
 * Parses an Obsidian frontmatter value.
 * @param {string} value
 * @returns {string|Array<string>}
 */
function parseFrontmatterValue(value) {
	if (value.startsWith("[") && value.endsWith("]")) {
		return value
			.slice(1, -1)
			.split(",")
			.map((item) => item.trim())
			.filter(Boolean);
	}

	return value;
}

/**
 * Extracts wiki links.
 * @param {string} markdown
 * @returns {Array<object>}
 */
function extractWikiLinks(markdown) {
	const links = [];
	const pattern = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
	let match = pattern.exec(markdown);

	while (match) {
		links.push({ target: match[1].trim() });
		match = pattern.exec(markdown);
	}

	return links;
}

/**
 * Finds backlinks for a note.
 * @param {object} params
 * @param {object} params.note
 * @returns {Array<object>}
 */
function getBacklinks({ note }) {
	const backlinks = [];

	for (let index = 0; index < state.notes.length; index += 1) {
		const candidate = state.notes[index];

		if (candidate.path === note.path) {
			continue;
		}

		for (let linkIndex = 0; linkIndex < candidate.links.length; linkIndex += 1) {
			const linkedNote = findNoteByWikiTarget({ target: candidate.links[linkIndex].target });

			if (linkedNote?.path === note.path) {
				backlinks.push(candidate);
				break;
			}
		}
	}

	return backlinks;
}

/**
 * Finds a note by exact path.
 * @param {object} params
 * @param {string} params.path
 * @returns {object|undefined}
 */
function findNoteByPath({ path }) {
	const normalized = normalizePath(path);

	for (let index = 0; index < state.notes.length; index += 1) {
		if (normalizePath(state.notes[index].path) === normalized) {
			return state.notes[index];
		}
	}

	return undefined;
}

/**
 * Finds a note from a wiki target.
 * @param {object} params
 * @param {string} params.target
 * @returns {object|undefined}
 */
function findNoteByWikiTarget({ target }) {
	const normalizedTarget = normalizePath(target);
	const withExtension = isMarkdownPath(normalizedTarget) ? normalizedTarget : `${normalizedTarget}.md`;
	const targetBase = removeExtension(getFileName(normalizedTarget)).toLowerCase();

	for (let index = 0; index < state.notes.length; index += 1) {
		const note = state.notes[index];
		const path = normalizePath(note.path);
		const noteBase = removeExtension(note.name).toLowerCase();

		if (path === normalizedTarget || path === withExtension || noteBase === targetBase) {
			return note;
		}
	}

	return undefined;
}

/**
 * Gets title from markdown.
 * @param {string} markdown
 * @returns {string}
 */
function getTitleFromMarkdown(markdown) {
	const lines = markdown.split("\n");

	for (let index = 0; index < lines.length; index += 1) {
		const match = lines[index].match(/^#\s+(.+)$/);

		if (match) {
			return match[1].trim();
		}
	}

	return "";
}

/**
 * Gets a file name from a path.
 * @param {string} path
 * @returns {string}
 */
function getFileName(path) {
	const parts = path.split("/");
	return parts[parts.length - 1];
}

/**
 * Removes the final extension from a file name.
 * @param {string} fileName
 * @returns {string}
 */
function removeExtension(fileName) {
	return fileName.replace(/\.[^/.]+$/, "");
}

/**
 * Normalizes slash paths.
 * @param {string} path
 * @returns {string}
 */
function normalizePath(path) {
	return path.replace(/^\/+|\/+$/g, "");
}

/**
 * Gets a unique slug for heading text.
 * @param {object} params
 * @param {string} params.text
 * @param {object} params.slugs
 * @returns {string}
 */
function getUniqueSlug({ text, slugs }) {
	const base = stripMarkdown(text)
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "") || "section";
	const count = slugs[base] || 0;
	slugs[base] = count + 1;

	return count ? `${base}-${count + 1}` : base;
}

/**
 * Checks whether a path is markdown.
 * @param {string} path
 * @returns {boolean}
 */
function isMarkdownPath(path) {
	return /\.mdx?$/i.test(path);
}

/**
 * Gets a search excerpt.
 * @param {object} params
 * @param {string} params.text
 * @param {string} params.query
 * @returns {string}
 */
function getExcerpt({ text, query }) {
	const normalizedText = stripMarkdown(text).replace(/\s+/g, " ").trim();
	const index = normalizedText.toLowerCase().indexOf(query);
	const roughStart = Math.max(0, index - 36);
	const nextSpace = normalizedText.indexOf(" ", roughStart);
	const start = roughStart === 0 || nextSpace === -1 ? roughStart : nextSpace + 1;
	const excerpt = index === -1 ? normalizedText.slice(0, 110) : normalizedText.slice(start, start + 120);
	const prefix = start > 0 ? "... " : "";
	const suffix = start + 120 < normalizedText.length ? " ..." : "";

	return excerpt ? `${prefix}${excerpt}${suffix}` : "No preview available.";
}

/**
 * Removes common markdown syntax from preview text.
 * @param {string} text
 * @returns {string}
 */
function stripMarkdown(text) {
	return text
		.replace(/^---[\s\S]*?---/, "")
		.replace(/```[\s\S]*?```/g, "")
		.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
		.replace(/\[\[([^\]]+)\]\]/g, "$1")
		.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
		.replace(/[#>*_`-]/g, " ");
}

/**
 * Counts words in text.
 * @param {string} text
 * @returns {number}
 */
function countWords(text) {
	return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Counts characters in text.
 * @param {string} text
 * @returns {number}
 */
function countCharacters(text) {
	return text.length;
}

/**
 * Estimates reading time from a word count.
 * @param {object} params
 * @param {number} params.wordCount
 * @returns {number}
 */
function estimateReadingMinutes({ wordCount }) {
	const wordsPerMinute = getReadingWordsPerMinute();

	if (!wordCount) {
		return 0;
	}

	return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/**
 * Gets configured reading speed.
 * @returns {number}
 */
function getReadingWordsPerMinute() {
	const wordsPerMinute = Number(state.config.reading?.wordsPerMinute);

	if (Number.isFinite(wordsPerMinute) && wordsPerMinute > 0) {
		return wordsPerMinute;
	}

	return 225;
}

/**
 * Formats reading time for metadata.
 * @param {object} params
 * @param {number} params.minutes
 * @returns {string}
 */
function formatReadingTime({ minutes }) {
	if (!minutes) {
		return "Less than 1 min";
	}

	return `${minutes} min`;
}

/**
 * Formats a number for display.
 * @param {number} value
 * @returns {string}
 */
function formatNumber(value) {
	return new Intl.NumberFormat().format(value);
}

/**
 * Escapes HTML text.
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

/**
 * Escapes an HTML attribute.
 * @param {string} value
 * @returns {string}
 */
function escapeAttribute(value) {
	return escapeHtml(value).replace(/`/g, "&#096;");
}

/**
 * Toggles the right panel.
 * @returns {void}
 */
function toggleRightPanel() {
	if (!state.activePath) {
		return;
	}

	state.rightCollapsed = !state.rightCollapsed;
	renderShell();
}

/**
 * Toggles the anchored content appearance popover.
 * @returns {void}
 */
function toggleQuickSettings() {
	state.settingsOpen = !state.settingsOpen;
	renderQuickSettings();
}

/**
 * Closes the content appearance popover.
 * @returns {void}
 */
function closeQuickSettings() {
	if (!state.settingsOpen) {
		return;
	}

	state.settingsOpen = false;
	renderQuickSettings();
}

/**
 * Renders the quick settings popover state.
 * @returns {void}
 */
function renderQuickSettings() {
	const popover = select(selectors.quickSettings);
	const toggle = select("[data-action='toggle-settings']");
	popover.hidden = !state.settingsOpen;
	toggle.setAttribute("aria-expanded", String(state.settingsOpen));
}

/**
 * Renders shell layout state.
 * @returns {void}
 */
function renderShell() {
	const shell = select(selectors.appShell);
	const rightToggles = selectAll("[data-action='toggle-right']");
	shell.classList.toggle("is-left-collapsed", state.leftCollapsed);
	shell.classList.toggle("is-right-collapsed", state.rightCollapsed);

	for (let index = 0; index < rightToggles.length; index += 1) {
		rightToggles[index].hidden = !state.activePath;
		rightToggles[index].classList.toggle("is-active", !state.rightCollapsed);
	}
}

/**
 * Loads content appearance from local storage and app config.
 * @returns {void}
 */
function loadAppearance() {
	const config = state.config.appearance || {};
	let stored = {};

	try {
		const parsed = JSON.parse(window.localStorage.getItem(appearanceStorageKey) || "{}");
		stored = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
	} catch (error) {
		showStorageWarning();
	}

	state.theme = getValidTheme(stored.theme || config.theme || "light") || "light";
	state.soundEnabled = getBooleanPreference({
		storedValue: stored.soundEnabled,
		configuredValue: config.soundEnabled,
		fallback: true
	});
	state.fontFamily = getValidFontFamily(stored.fontFamily || config.fontFamily || "modern");
	state.textAlign = getValidTextAlign(stored.textAlign || config.textAlign || "left");
	state.fontSize = clampNumber({
		value: Number(stored.fontSize ?? config.fontSize ?? 18),
		minimum: 14,
		maximum: 24
	});
	state.lineHeight = clampNumber({
		value: Number(stored.lineHeight ?? config.lineHeight ?? 1.68),
		minimum: 1.2,
		maximum: 2.2
	});
	state.contentWidth = clampNumber({
		value: Number(stored.contentWidth ?? config.contentWidth ?? 820),
		minimum: 560,
		maximum: 960
	});
}

/**
 * Resolves a stored boolean before a configured default.
 * @param {object} params
 * @param {*} params.storedValue
 * @param {*} params.configuredValue
 * @param {boolean} params.fallback
 * @returns {boolean}
 */
function getBooleanPreference({ storedValue, configuredValue, fallback }) {
	if (typeof storedValue === "boolean") {
		return storedValue;
	}

	if (typeof configuredValue === "boolean") {
		return configuredValue;
	}

	return fallback;
}

/**
 * Saves the current content appearance.
 * @returns {void}
 */
function saveAppearance() {
	try {
		window.localStorage.setItem(appearanceStorageKey, JSON.stringify({
			contentWidth: state.contentWidth,
			fontFamily: state.fontFamily,
			fontSize: state.fontSize,
			lineHeight: state.lineHeight,
			soundEnabled: state.soundEnabled,
			textAlign: state.textAlign,
			theme: state.theme
		}));
	} catch (error) {
		showStorageWarning();
	}
}

/**
 * Applies the active theme to the document.
 * @returns {void}
 */
function applyTheme() {
	document.documentElement.dataset.theme = state.theme;
}

/**
 * Renders the theme toggle label.
 * @returns {void}
 */
function renderThemeToggle() {
	const controls = selectAll("[data-theme-choice]");

	for (let index = 0; index < controls.length; index += 1) {
		controls[index].setAttribute("aria-pressed", String(controls[index].dataset.themeChoice === state.theme));
	}
}

/**
 * Applies the sound preference and shared interaction volume.
 * @returns {void}
 */
function applySoundSettings() {
	setCuelumeVolume(soundEffectsVolume);
	setCuelumeEnabled(state.soundEnabled);
}

/**
 * Renders the active sound preference.
 * @returns {void}
 */
function renderSoundControls() {
	const controls = selectAll(selectors.soundChoice);

	for (let index = 0; index < controls.length; index += 1) {
		const isEnabledChoice = controls[index].dataset.soundChoice === "on";
		controls[index].setAttribute("aria-pressed", String(isEnabledChoice === state.soundEnabled));
	}
}

/**
 * Applies a selected sound preference.
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleSoundChoice(event) {
	const soundEnabled = event.currentTarget.dataset.soundChoice === "on";

	if (soundEnabled === state.soundEnabled) {
		return;
	}

	if (!soundEnabled) {
		playCuelume("droplet");
	}

	state.soundEnabled = soundEnabled;
	applySoundSettings();
	renderSoundControls();
	saveAppearance();

	if (soundEnabled) {
		playCuelume("ready");
	}
}

/**
 * Applies a selected theme.
 * @param {MouseEvent} event
 * @returns {void}
 */
function handleThemeChoice(event) {
	state.theme = getValidTheme(event.currentTarget.dataset.themeChoice) || "light";
	applyTheme();
	renderThemeToggle();
	saveAppearance();
	rerenderArticleMermaidDiagrams();
}

/**
 * Gets a supported theme value.
 * @param {string} value
 * @returns {string}
 */
function getValidTheme(value) {
	const theme = getThemeById({ id: String(value || "") });
	return theme ? theme.id : "";
}

/**
 * Gets a theme by id.
 * @param {object} params
 * @param {string} params.id
 * @returns {object|null}
 */
function getThemeById({ id }) {
	for (let index = 0; index < themes.length; index += 1) {
		if (themes[index].id === id) {
			return themes[index];
		}
	}

	return null;
}


/**
 * Applies reader settings to CSS variables.
 * @returns {void}
 */
function applyReaderSettings() {
	const fontFamilies = {
		literary: 'Georgia, "Times New Roman", serif',
		modern: 'Arial, Helvetica, sans-serif',
		monospace: '"Courier New", Courier, monospace'
	};
	document.documentElement.style.setProperty("--article-font-size", `${state.fontSize}px`);
	document.documentElement.style.setProperty("--article-line-height", String(state.lineHeight));
	document.documentElement.style.setProperty("--article-text-align", state.textAlign);
	document.documentElement.style.setProperty("--article-font-family", fontFamilies[state.fontFamily]);
	document.documentElement.style.setProperty("--article-measure", `${state.contentWidth}px`);
}

/**
 * Renders reader control values.
 * @returns {void}
 */
function renderReaderControls() {
	const orientations = selectAll(selectors.textOrientation);
	const fontFamilies = selectAll(selectors.fontFamily);
	const fontSizeInput = select(selectors.fontSizeInput);
	const fontSizeValue = select(selectors.fontSizeValue);
	const lineHeightInput = select(selectors.lineHeightInput);
	const lineHeightValue = select(selectors.lineHeightValue);
	const contentWidthInput = select(selectors.contentWidthInput);
	const contentWidthValue = select(selectors.contentWidthValue);

	for (let index = 0; index < orientations.length; index += 1) {
		orientations[index].checked = orientations[index].value === state.textAlign;
	}

	for (let index = 0; index < fontFamilies.length; index += 1) {
		fontFamilies[index].checked = fontFamilies[index].value === state.fontFamily;
	}

	fontSizeInput.value = String(state.fontSize);
	fontSizeValue.textContent = `${state.fontSize}px`;
	lineHeightInput.value = String(state.lineHeight);
	lineHeightValue.textContent = state.lineHeight.toFixed(2);
	contentWidthInput.value = String(state.contentWidth);
	contentWidthValue.textContent = `${state.contentWidth}px`;
}

/**
 * Handles font size input.
 * @param {InputEvent} event
 * @returns {void}
 */
function handleFontSizeInput(event) {
	state.fontSize = clampNumber({
		value: Number(event.currentTarget.value),
		minimum: 14,
		maximum: 24
	});
	applyReaderSettings();
	renderReaderControls();
	saveAppearance();
}

/**
 * Handles line height input.
 * @param {InputEvent} event
 * @returns {void}
 */
function handleLineHeightInput(event) {
	state.lineHeight = clampNumber({
		value: Number(event.currentTarget.value),
		minimum: 1.2,
		maximum: 2.2
	});
	applyReaderSettings();
	renderReaderControls();
	saveAppearance();
}

/**
 * Handles content measure input.
 * @param {InputEvent} event
 * @returns {void}
 */
function handleContentWidthInput(event) {
	state.contentWidth = clampNumber({
		value: Number(event.currentTarget.value),
		minimum: 560,
		maximum: 960
	});
	applyReaderSettings();
	renderReaderControls();
	saveAppearance();
}

/**
 * Handles text orientation radio changes.
 * @param {Event} event
 * @returns {void}
 */
function handleTextOrientationChange(event) {
	state.textAlign = getValidTextAlign(event.currentTarget.value);
	applyReaderSettings();
	renderReaderControls();
	saveAppearance();
}

/**
 * Handles content typeface changes.
 * @param {Event} event
 * @returns {void}
 */
function handleFontFamilyChange(event) {
	state.fontFamily = getValidFontFamily(event.currentTarget.value);
	applyReaderSettings();
	renderReaderControls();
	saveAppearance();
}

/**
 * Gets a supported content typeface value.
 * @param {string} value
 * @returns {string}
 */
function getValidFontFamily(value) {
	const validValues = ["literary", "modern", "monospace"];

	for (let index = 0; index < validValues.length; index += 1) {
		if (validValues[index] === value) {
			return value;
		}
	}

	return "modern";
}

/**
 * Gets a supported text alignment value.
 * @param {string} value
 * @returns {string}
 */
function getValidTextAlign(value) {
	const validValues = ["left", "center", "justify", "right"];

	for (let index = 0; index < validValues.length; index += 1) {
		if (validValues[index] === value) {
			return value;
		}
	}

	return "left";
}

/**
 * Clamps a numeric value.
 * @param {object} params
 * @param {number} params.value
 * @param {number} params.minimum
 * @param {number} params.maximum
 * @returns {number}
 */
function clampNumber({ value, minimum, maximum }) {
	if (!Number.isFinite(value)) {
		return minimum;
	}

	return Math.min(maximum, Math.max(minimum, value));
}

/**
 * Loads bookmarks from localStorage.
 * @returns {void}
 */
function loadBookmarks() {
	try {
		const stored = window.localStorage.getItem(bookmarkStorageKey);
		const parsed = stored ? JSON.parse(stored) : [];
		state.bookmarks = Array.isArray(parsed) ? normalizeBookmarkPaths({ paths: parsed }) : [];
	} catch (error) {
		state.bookmarks = [];
		showStorageWarning();
	}
}

/**
 * Saves bookmarks to localStorage.
 * @returns {void}
 */
function saveBookmarks() {
	try {
		window.localStorage.setItem(bookmarkStorageKey, JSON.stringify(state.bookmarks));
	} catch (error) {
		showStorageWarning();
	}
}

/**
 * Normalizes and deduplicates bookmark paths.
 * @param {object} params
 * @param {Array<string>} params.paths
 * @returns {Array<string>}
 */
function normalizeBookmarkPaths({ paths }) {
	const normalized = [];

	for (let index = 0; index < paths.length; index += 1) {
		const path = normalizePath(String(paths[index] || ""));

		if (path && !normalized.includes(path)) {
			normalized.push(path);
		}
	}

	return normalized;
}

/**
 * Toggles the current note bookmark.
 * @returns {void}
 */
function toggleActiveBookmark() {
	if (!state.activePath) {
		return;
	}

	if (isBookmarked({ path: state.activePath })) {
		removeBookmark({ path: state.activePath });
		showToast({ message: "Bookmark removed." });
	} else {
		addBookmark({ path: state.activePath });
		showToast({ message: "Bookmark added." });
	}

	refreshBookmarkUi();
}

/**
 * Adds a bookmark.
 * @param {object} params
 * @param {string} params.path
 * @returns {void}
 */
function addBookmark({ path }) {
	const normalized = normalizePath(path);

	if (!isBookmarked({ path: normalized })) {
		state.bookmarks.push(normalized);
		saveBookmarks();
	}
}

/**
 * Removes a bookmark.
 * @param {object} params
 * @param {string} params.path
 * @returns {void}
 */
function removeBookmark({ path }) {
	const normalized = normalizePath(path);
	const bookmarks = [];

	for (let index = 0; index < state.bookmarks.length; index += 1) {
		if (normalizePath(state.bookmarks[index]) !== normalized) {
			bookmarks.push(state.bookmarks[index]);
		}
	}

	state.bookmarks = bookmarks;
	saveBookmarks();
}

/**
 * Clears all bookmarks.
 * @returns {void}
 */
function clearBookmarks() {
	if (!state.bookmarks.length) {
		showToast({ message: "No bookmarks to remove." });
		return;
	}

	state.bookmarks = [];
	saveBookmarks();
	refreshBookmarkUi();
	showToast({ message: "All bookmarks removed." });
}

/**
 * Checks whether a note is bookmarked.
 * @param {object} params
 * @param {string} params.path
 * @returns {boolean}
 */
function isBookmarked({ path }) {
	const normalized = normalizePath(path);

	for (let index = 0; index < state.bookmarks.length; index += 1) {
		if (normalizePath(state.bookmarks[index]) === normalized) {
			return true;
		}
	}

	return false;
}

/**
 * Refreshes bookmark-dependent UI.
 * @returns {void}
 */
function refreshBookmarkUi() {
	const note = findNoteByPath({ path: state.activePath });

	if (note) {
		renderBookmarkControl({ note });
	}

	renderBookmarks();
}

/**
 * Copies the active article GitHub URL.
 * @returns {Promise<void>}
 */
async function copyActiveSourceUrl() {
	const url = getGithubArticleUrl({ path: state.activePath });

	if (!url) {
		showToast({ message: "Article source URL is unavailable." });
		return;
	}

	await copyText({
		text: url,
		successMessage: "Article URL copied."
	});
}

/**
 * Copies the active article public site URL.
 * @returns {Promise<void>}
 */
async function copyActivePublishedUrl() {
	const url = getPublishedArticleUrl({ path: state.activePath });

	if (!url) {
		showToast({ message: "Article site URL is unavailable." });
		return;
	}

	await copyText({
		text: url,
		successMessage: "Article site URL copied."
	});
}

/**
 * Copies the active article markdown content.
 * @returns {Promise<void>}
 */
async function copyActiveArticleContent() {
	const note = findNoteByPath({ path: state.activePath });

	if (!note) {
		showToast({ message: "No article selected." });
		return;
	}

	await copyText({
		text: note.body,
		successMessage: "Article content copied."
	});
}

/**
 * Copies the selected article text.
 * @returns {Promise<void>}
 */
async function copySelectedText() {
	const text = state.selectedText;

	if (!text) {
		showToast({ message: "No text selected." });
		return;
	}

	await copyText({
		text,
		successMessage: "Selected text copied."
	});
	hideSelectionMenu();
}

/**
 * Creates a QR code from the selected article text.
 * @returns {Promise<void>}
 */
async function createQrCodeFromSelection() {
	const text = state.selectedText;

	if (!text) {
		showToast({ message: "No text selected." });
		return;
	}

	if (countCharacters(text) > maximumQrCodeCharacters) {
		showToast({ message: "Selection is too long for a QR code." });
		return;
	}

	try {
		const dataUrl = await QRCode.toDataURL(text, {
			errorCorrectionLevel: "M",
			margin: 1,
			width: 240
		});

		showQrCodeBlock({ dataUrl, text });
		hideSelectionMenu();
	} catch (error) {
		showToast({ message: "Could not create QR code." });
	}
}

/**
 * Shows a temporary QR code block in the right panel.
 * @param {object} params
 * @param {string} params.dataUrl
 * @param {string} params.text
 * @returns {void}
 */
function showQrCodeBlock({ dataUrl, text }) {
	const block = select(selectors.qrCodeBlock);
	const image = select(selectors.qrCodeImage);
	const summary = select(selectors.qrCodeSummary);

	image.src = dataUrl;
	summary.textContent = `${formatNumber(countCharacters(text))} selected characters`;
	block.hidden = false;
	state.rightCollapsed = false;
	renderShell();
	window.clearTimeout(state.qrCodeTimer);
	state.qrCodeTimer = window.setTimeout(clearQrCodeBlock, qrCodeVisibleMs);
}

/**
 * Clears the temporary QR code block.
 * @returns {void}
 */
function clearQrCodeBlock() {
	const block = select(selectors.qrCodeBlock);
	const image = select(selectors.qrCodeImage);
	const summary = select(selectors.qrCodeSummary);

	if (!block || !image || !summary) {
		return;
	}

	window.clearTimeout(state.qrCodeTimer);
	state.qrCodeTimer = 0;
	block.hidden = true;
	image.removeAttribute("src");
	summary.textContent = "";
}

/**
 * Opens a Google search for the selected article text.
 * @returns {void}
 */
function searchSelectedTextWithGoogle() {
	searchSelectedText({ baseUrl: "https://www.google.com/search?q=" });
}

/**
 * Opens a Brave search for the selected article text.
 * @returns {void}
 */
function searchSelectedTextWithBrave() {
	searchSelectedText({ baseUrl: "https://search.brave.com/search?q=" });
}

/**
 * Opens a search engine query for the selected article text.
 * @param {object} params
 * @param {string} params.baseUrl
 * @returns {void}
 */
function searchSelectedText({ baseUrl }) {
	const text = state.selectedText;

	if (!text) {
		showToast({ message: "No text selected." });
		return;
	}

	window.open(`${baseUrl}${encodeURIComponent(text)}`, "_blank", "noreferrer");
	hideSelectionMenu();
}

/**
 * Opens the active article in Obsidian.
 * @returns {void}
 */
function openActiveArticleInObsidian() {
	const url = getObsidianArticleUrl({ path: state.activePath });

	if (!url) {
		showToast({ message: "Obsidian link is unavailable." });
		return;
	}

	window.location.href = url;
}

/**
 * Copies text to the clipboard.
 * @param {object} params
 * @param {string} params.text
 * @param {string} params.successMessage
 * @returns {Promise<boolean>}
 */
async function copyText({ text, successMessage }) {
	try {
		if (typeof navigator !== "undefined" && navigator.clipboard) {
			await navigator.clipboard.writeText(text);
		} else if (!copyTextWithBuffer(text)) {
			throw new Error("Clipboard unavailable.");
		}

		showToast({ message: successMessage });
		return true;
	} catch (error) {
		if (copyTextWithBuffer(text)) {
			showToast({ message: successMessage });
			return true;
		} else {
			showToast({ message: "Could not copy to clipboard." });
			return false;
		}
	}
}

/**
 * Copies text through a temporary text area fallback.
 * @param {string} text
 * @returns {boolean}
 */
function copyTextWithBuffer(text) {
	const buffer = document.createElement("textarea");
	let copied = false;

	buffer.className = "clipboard-buffer";
	buffer.value = text;
	buffer.setAttribute("readonly", "readonly");
	document.body.append(buffer);
	buffer.focus();
	buffer.select();
	copied = document.execCommand("copy");
	buffer.remove();

	return copied;
}

/**
 * Shows a storage warning.
 * @returns {void}
 */
function showStorageWarning() {
	showToast({ message: "Browser settings could not be saved." });
}

/**
 * Gets a human source label.
 * @param {object} params
 * @param {object} params.config
 * @returns {string}
 */
function getVaultSourceLabel({ config }) {
	if (config.github?.enabled) {
		return `${config.github.owner}/${config.github.repo}`;
	}

	return "Local sample vault";
}

/**
 * Shows a toast message.
 * @param {object} params
 * @param {string} params.message
 * @returns {void}
 */
function showToast({ message }) {
	const toast = select(selectors.toast);
	toast.textContent = message;
	toast.classList.add("is-visible");
	window.clearTimeout(state.toastTimer);
	state.toastTimer = window.setTimeout(hideToast, 2600);
}

/**
 * Hides the toast message.
 * @returns {void}
 */
function hideToast() {
	select(selectors.toast).classList.remove("is-visible");
}

/**
 * Renders a fatal load error.
 * @param {object} params
 * @param {Error} params.error
 * @returns {void}
 */
function renderError({ error }) {
	removeArticleCodeRunners();
	select(selectors.article).innerHTML = `
		<div class="empty-state">
			<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
			<h2>Could not load vault</h2>
			<p>${escapeHtml(error.message)}</p>
		</div>
	`;
	showToast({ message: error.message });
}

await init();
