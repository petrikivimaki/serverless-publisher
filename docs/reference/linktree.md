---
title: Linktree Profile
status: draft
tags: papyrus, interface, configuration, linktree
---

# Linktree Profile

The primary menu's Links view can be a compact profile for a person, team, project, or organization. Its content comes entirely from `linktree` in `config/app-config.json`.

`title` and `subtitle` are optional. When either is present, Papyrus renders a compact, left-aligned introduction: the title uses the same quiet label treatment as group headings, while the subtitle provides room for a short bio or project description. Cards are arranged in order under `groups`. A group `title` is optional; when an untitled group follows another group, a centered `• • •` marker separates the two sections.

```json
{
	"linktree": {
		"title": "Around the web",
		"subtitle": "Profiles, projects, and ways to get in touch.",
		"groups": [
			{
				"title": "Social",
				"cards": [
					{
						"label": "GitHub",
						"description": "Repositories and open-source work",
						"url": "https://github.com/your-profile"
					},
					{
						"label": "Email",
						"url": "hello@example.com"
					}
				]
			},
			{
				"cards": [
					{
						"label": "Helsinki",
						"timeZone": "Europe/Helsinki"
					}
				]
			}
		]
	}
}
```

## Link cards

A link card requires `label` and `url`; `description` adds a smaller supporting line. Papyrus derives the icon from the destination domain. Plain email addresses and `mailto:` URLs receive an email icon, and plain addresses are converted to `mailto:` links.

Recognized services include Amazon, Behance, Bluesky, CodePen, Discord, Dribbble, Facebook, Flickr, GitHub, GitLab, Instagram, LinkedIn, Mastodon, Medium, npm, Patreon, Pinterest, Product Hunt, Reddit, Slack, Snapchat, SoundCloud, Spotify, Substack, Telegram, Threads, TikTok, Tumblr, Twitch, Vimeo, WhatsApp, Wikipedia, WordPress, X/Twitter, and YouTube. Any other destination uses the neutral link icon.

Any link or clock card can override its automatic icon with an `icon` value containing the full Font Awesome class identifier:

```json
{
	"label": "Project handbook",
	"icon": "fa-solid fa-book-open",
	"url": "https://example.com/handbook"
}
```

HTTP and HTTPS destinations also follow the global UTM behavior described in [[workflow/setup]].

## Clock cards

A card with an IANA `timeZone` is automatically treated as a clock, so it does not need an explicit type. It shows a local time with ticking seconds and can include an optional place label. Examples of valid timezone names are `Europe/Helsinki`, `America/New_York`, and `Asia/Tokyo`. An invalid timezone remains visible as a clearly marked configuration error instead of stopping the rest of the Linktree from rendering.

See [[reference/interface]] for how the Links view fits into the primary menu, or return to [[workflow/setup]] for the broader configuration workflow.
