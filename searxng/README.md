# SearXNG audit, 19 September 2026

The home server now runs SearXNG 2026.9.18-c0042add3. General searches use Google, Brave, DuckDuckGo, and Google CSE, with Wikipedia and the inherited conditional answer providers still available. The deployed application and Valkey containers pass their health checks.

The biggest problem was the set of engines contributing to results. The server had enough capacity. Adding more engines had introduced irrelevant results while several strong engines failed or remained inactive.

## What was wrong

| Finding | Effect |
| --- | --- |
| Image dated 28 July, despite the `latest` tag | Recreating the container had not upgraded the image. Upstream adapter fixes were missing. |
| Google had `disabled: false` but inherited `inactive: true` | The configured Google weight did nothing because Google was not loaded. |
| Brave returned HTTP 429; DuckDuckGo and Startpage returned CAPTCHAs | Three intended general providers contributed no results in baseline tests. |
| Wiby participated in general search | An unrelated Chinese-history page ranked second for `India passport renewal documents`. Wiby blog results also interrupted the pathlib results. |
| Bing returned broad results for specific queries | The passport query included the generic India Wikipedia page and an India encyclopedia entry. |
| Yep had historical HTTP 403 failures and mixed relevance | It sometimes added coverage, but also pushed broad results into the top ranks. |
| Mojeek and Marginalia had inherited inactive settings | Their apparent enabled settings did not make them functioning providers. Current upstream disables Mojeek over its proof-of-work challenge; Marginalia requires API configuration. |
| Wikidata initialization failed with HTTP 403 | The old instance could not use that provider. |
| Google CSE had unused `api_key` and lowercase `cx` fields | This adapter uses its own CSE implementation and uppercase `CX` configuration. The environment variables were empty and did not supply an official paid API. |
| Metrics disabled; no Docker health checks | Diagnosing provider failures and detecting an unresponsive application was harder. |

SearXNG used about 127 MiB of RAM before the changes. The host had about 5.6 GiB available, no SearXNG OOM event, and no recorded container restarts. Valkey answered PING. These observations do not support adding workers, RAM, or a larger connection pool as the first fix.

## Why metasearch does not guarantee better results

SearXNG merges the lists it receives. Its ranking code combines upstream positions, engine weights, and agreement between providers. It does not read every page and independently judge relevance. A niche engine's first result can therefore outrank a mainstream engine's much more useful second or third result.

Agreement also isn't the same as independent evidence. Google and Google CSE share an underlying source. Giving both large weights can overvalue overlap. The deployed weights are Google 2, Brave 1.5, DuckDuckGo 1, and Google CSE 1. CSE remains useful because it returned results even when direct Google sometimes returned none during exploratory checks.

Search through SearXNG can differ from the provider's own website. Adapters use different interfaces, requests come from the server's IP, and browser personalization and location context are absent. The current Google adapter uses an XML layout rather than Google's JavaScript website. Metasearch offers broader coverage and a single interface, but cannot guarantee better ranking or lower latency for every query.

References: [engine settings](https://docs.searxng.org/admin/settings/settings_engines.html), [Google adapter](https://docs.searxng.org/dev/engines/online/google.html), [ranking implementation at the deployed revision](https://github.com/searxng/searxng/blob/c0042add3/searx/results.py).

## Changes deployed

- Upgraded the July image to the tested September image and pinned its digest in Compose.
- Explicitly enabled direct Google. Kept Brave, DuckDuckGo, and CSE active after successful HTTP tests.
- Disabled Startpage, Bing web search, Yep, and Wiby by default. They remain selectable when needed. Marked the already inactive Mojeek and Marginalia entries disabled for clarity.
- Removed the contradictory CSE removal configuration and the unused API variables. The inherited CSE image provider is available and passed testing.
- Removed unavailable Tor engines Ahmia and Torch. Disabled Wikidata initialization. Disabled Vimeo after its video search returned an HTTP error.
- Reduced the default outgoing timeout from 8 to 4 seconds and the maximum request timeout from 15 to 6 seconds. These are upstream budgets, not a guarantee of total page latency. Engine-specific settings and request processing can affect elapsed time.
- Raised generic failure backoff from 5/15 seconds to 30/300 seconds. Engine-specific CAPTCHA suspension rules still apply.
- Enabled aggregate engine metrics, added application and Valkey health checks, made application startup wait for healthy Valkey, and limited Docker logs to three 10 MiB files per container.

The public limiter, image proxy, access model, search language, and safe-search preference remain configured as before. Public access still needs bot protection because abuse can get the home server's upstream requests blocked.

## Measurements and limits

| Query | Old application, server-side | Deployed site, public HTTPS | Engine errors before / after |
| --- | ---: | ---: | ---: |
| python pathlib documentation | 1.73 s | 2.44 s | 3 / 0 |
| India passport renewal documents | 1.36 s | 1.88 s | 3 / 0 |
| best way to remove limescale | 1.92 s | 2.09 s | 3 / 0 |

The timing columns use different paths and must not be read as a before/after speed comparison. The baseline used an isolated application process inside the old container with only that process's request limiter removed. Final validation used real HTTP requests through `https://search.taf.sh`, including the public proxy and network transit. No production limiter was disabled.

An unpublished candidate container returned the same queries in 1.34, 0.67, and 0.91 seconds over container-local HTTP. Its CSE weight was still 2, and it had a separate cache. Those values are diagnostic observations, not a controlled performance claim.

All three final searches returned results from all four intended providers, with no reported engine errors. The passport query now places the official document checklist and application page first and second. Pathlib still puts the current official documentation first. Limescale results remain subjective, including a Reddit discussion at the top; this audit does not establish universal relevance superiority.

Category smoke tests on the candidate returned 380 image results, 105 news results, 144 video results, 80 IT results, and 90 science results. Vimeo was the only reported category error and is disabled in the final configuration. Counts include merged results and do not measure quality. These are small samples taken during one session; upstream blocks can recur.

Final public HTML checks also passed: `!go` returned 10 result articles, `!g` returned 20, images returned 332, and videos returned 144. All responded with HTTP 200 and no detected engine-error notice. The image page took 5.62 seconds and video page 4.15 seconds, so media searches still take longer than general searches.

Synthetic-query evidence is in `audit-2026-09-19/`. Production startup no longer reports the Tor engine loading failures or Wikidata initialization failure. A missing forwarded-IP warning from the local health probe is harmless; public browser-style requests and CSS token handling succeeded.

## Using the improved instance

Existing browser preferences can override server engine defaults. Reset the engine selections in Preferences, or clear only the `search.taf.sh` site cookies, if the old engines still appear. A private browser window is a quick check of the server defaults.

Use `!go query` for direct Google, `!br query` for Brave, `!ddg query` for DuckDuckGo, and `!g query` for Google CSE. These shortcuts preserve the existing configuration. For India-specific intent, select English India in Preferences or try `:en-IN query`. Use the IT or science tab for repository and paper searches. Disabled engines can still be selected explicitly, but inactive engines need working server configuration first.

See [search syntax](https://docs.searxng.org/user/search-syntax.html).

## Remaining constraints and maintenance

The shipped limiter allows only four non-HTML API requests per hour per client IP. Enabling JSON in settings does not exempt it from this limit. A browser must load the generated `/client...css` resource to avoid the stricter suspicious-client rules. The public checks loaded that resource successfully.

If an AI application needs sustained JSON searches, give it an authenticated private route or a narrowly scoped trusted-client configuration. Disabling protection on the public site would expose the server's search quota to everyone. No access-policy change was made during this audit. See [limiter documentation](https://docs.searxng.org/admin/searx.limiter.html).

Pinned images require deliberate updates. Check upstream releases regularly, stage the new digest, test a few representative queries and categories, then deploy. Scraping adapters need maintenance as providers change. Check `/stats` and container logs when quality falls. Paid provider APIs are a possible reliability improvement if scraping blocks recur, but require a separate account and cost decision.

Valkey logs a host `vm.overcommit_memory` warning. Its health check passes and the database is small. Changing host-wide memory policy was not necessary to resolve search quality; revisit it if snapshot failures appear or host memory pressure increases.

## Deployment and rollback

Live settings: `/home/taf/searxng/settings.yml`.

Server Compose checkout: `/home/taf/home-lab-yaml/searxng/`.

Pre-change files: `/home/taf/searxng/backups/20260919-audit/`.

The old image is retained locally as `searxng/searxng:rollback-20260919`. To roll back, restore the backed-up settings and Compose file, change the restored Compose image to that rollback tag, and run `docker compose up -d` from the server's Compose directory with `-f docker-compose.searxng.yaml`. Restoring the old `latest` reference alone will not restore the old image, because `latest` now points at the September build.

The temporary audit container and its anonymous volumes were removed after testing. No other application stack was redeployed.

## Independent and specialist discovery sources

A follow-up change adds a **Discovery** tab with six sources. Select that tab or search `!discovery your topic`. These engines do not participate in general searches. Odysee and Sepia Search also appear in Videos, Hacker News in IT, and Lemmy posts in Social media.

| Source | What it adds | Direct shortcut |
| --- | --- | --- |
| Wiby | Small, often older hobbyist and personal websites | `!wib` |
| Mwmbl | A smaller open-source, independent search index | `!mwm` |
| Hacker News | Discussion threads, submissions, and links selected by its community | `!hn` |
| Lemmy posts | Federated community posts visible to the queried Lemmy instance | `!lepo` |
| Odysee | Videos published on an alternative video platform | `!od` |
| Sepia Search | Videos across indexed PeerTube instances | `!sep` |

Safe Search remains off. This requests unfiltered results where a provider supports that setting. It does not remove provider moderation, indexing exclusions, or instance-specific restrictions. These sources are not guaranteed to be uncensored, accurate, or absent from the major engines. The goal is broader coverage and different selection of material.

Final staged tests returned all six sources without engine errors. For `permaculture`, Discovery returned 128 results, 124 of which had URLs absent from the general first-page response. For `amateur radio`, it returned 109 results, with 108 URLs absent from that response. URL comparison normalizes scheme, the `www.` prefix, and trailing slashes. This demonstrates additional returned material, not absence from Google's or Bing's entire indexes. Some additional URLs are community discussions or videos about similar subjects.

Examples include veganicpermaculture.com, wildflowers-and-weeds.com, the Murgas Amateur Radio Club, HFLINK propagation information, and videos on independently hosted PeerTube sites. Discovery took 2.66 and 1.58 seconds in the final container-local tests. Mwmbl, Lemmy, and Odysee had intermittent timeouts during exploration; their engine budgets are now six seconds. This does not guarantee that they will always respond.

Search My Site returned HTTP 403. Marginalia's shared public API key returned HTTP 429 and its initialization check rejected that key. Both remain inactive by default. A dedicated Marginalia API key would be a useful future addition. The provider offers a free non-commercial key by email, but no email or account request was made. CrowdView and Yep produced no results in these test searches and were not added to Discovery. Mojeek remains inactive for the previously documented upstream challenge.

References: [Wiby's purpose](https://wiby.me/about/), [Mwmbl](https://mwmbl.org/), [Marginalia API and key access](https://about.marginalia-search.com/article/api/), [SearXNG category configuration](https://docs.searxng.org/admin/settings/settings_categories_as_tabs.html).

Discovery test evidence is in `audit-2026-09-19/discovery-comparison.jsonl`. The pre-discovery settings are backed up on the server at `/home/taf/searxng/backups/20260919-audit/settings.pre-discovery.yml`.

Post-deployment public HTML checks passed with HTTP 200 and no detected engine-error notices: the Discovery tab returned 128 articles for permaculture, `!discovery amateur radio` returned 109, and a normal pathlib search returned 33. Both production containers remained healthy. The temporary discovery test container and its anonymous volumes were removed.
