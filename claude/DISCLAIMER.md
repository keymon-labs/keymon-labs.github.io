# keymon-labs for Claude: security notes and disclaimer

Read this before running a keymon-labs app inside Claude. Short version: it's a free hobby project, written with AI help, not audited. It runs inside Claude's artifact sandbox, which limits what it can do, but you use it entirely at your own risk.

## Why this page exists

keymon-labs is a personal hobby: small apps made quickly, mostly by asking Claude to write them. Nobody is paid, nothing is sold, and no one reviews the code the way a company would. We publish it because it might be useful or inspiring to someone.

We can't promise the code is correct or safe, and we can't guarantee our accounts (GitHub, npm) will never be compromised. So the decision to run it has to be yours, made with the facts below. If a security problem ever happens, we'll fix it when we can, but we take no responsibility for it.

## How it works

1. **The loader** is a Claude artifact (a web page hosted by claude.ai). It lists the apps and asks before running each one.
2. **Each app** is one JavaScript file published to npm as `@keymon-labs/claude-apps` and served by jsDelivr, a public code CDN. The code comes from this repository.
3. **Pinned and fingerprinted.** The loader names the exact package version and a SHA-384 fingerprint ([Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)) for every app. Your browser refuses to run a file that doesn't match. A changed npm package or a compromised CDN can't swap the code; only a new loader version can, and its new fingerprint makes it ask you again.
4. **Your Claude account does the work.** Apps ask Claude through the artifact's `sample` capability, which runs on *your* Claude account and plan.

## What Claude's artifact sandbox allows

This is our understanding of Anthropic's artifact runtime (documented for runtime contract 0.2.96, November 2026). Anthropic can change it at any time; check their documentation, not just this page.

A Claude artifact can only use the capabilities it declares when published. The keymon-labs loader declares one: **`sample` with images** (ask Claude, optionally with pictures).

**An app run by the loader can:**
- Ask Claude questions on your account. Claude asks you to allow this the first time. Each request counts towards your plan's usage limits.
- See whatever you give the page: photos you pick, text you type.
- Send those photos and text to Claude as part of a request.
- Show anything on the page, including content that looks like part of Claude. **No keymon-labs app will ever ask for a password, payment details or personal data.** If one does, stop and report it.
- Store small things in your browser for that page (for example, which apps you allowed).

**An app run by the loader can't:**
- Read your Claude chats, memory, projects, other artifacts or files.
- Use your connected apps (Gmail, Drive, Calendar…). The loader doesn't declare that capability.
- See your Claude login, cookies or tokens. The artifact runs on its own isolated web address.
- Send data to its own servers. Claude blocks the page's network access, except loading scripts from a few public CDNs (cdnjs, jsDelivr's npm path, unpkg and similar).

**Things to know:**
- Requests to Claude made by an app are made by **your account**. If a compromised app sent abusive requests, they would count against your account and could be attributed to it.
- Photos and text you send are handled by Anthropic under **your** Claude account's terms and privacy settings, like any other chat.
- AI output can be wrong. Homework Reader, for example, can misread handwriting or miss mistakes. Check before relying on it.

## What we do to reduce risk

- Each app gets only the capabilities it needs; the loader declares `sample` only.
- Exact versions and SRI fingerprints are baked into the loader at publish time.
- A new fingerprint asks you again, with links to the exact source and file.
- npm releases are published from GitHub Actions with [trusted publishing](https://docs.npmjs.com/trusted-publishers), which attaches provenance linking each version to the commit it was built from.
- All source is public in this repository.

None of this makes the apps safe. It makes the risks smaller and visible.

## No warranty, no liability

The apps, the loader and everything in this repository are provided **"as is", without warranty of any kind**, express or implied, including fitness for a particular purpose, accuracy or security. To the maximum extent the law allows, keymon-labs and its contributors are **not liable** for any loss, damage, cost, usage charge, data exposure or other harm arising from using or being unable to use them, however caused. If you don't accept this, don't run the apps.

This notice doesn't limit any rights you have that can't be excluded by law.

## Prefer not to trust us? Alternatives

- **Read the code.** The trust screen links to the exact source commit and the exact file that will run.
- **Check the fingerprint yourself.** It should match the one shown on the trust screen (hover it for the full value):
  ```sh
  curl -s https://cdn.jsdelivr.net/npm/@keymon-labs/claude-apps@VERSION/dist/APP.js | openssl dgst -sha384 -binary | openssl base64 -A
  ```
- **Check provenance.** The npm page for each version shows which GitHub commit and workflow built it.
- **Make your own copy.** Clone the repository, review it, and ask Claude to publish the loader (or a single app) as your own artifact. Then only code you've read runs.
- **Use the web version** at keymon-labs.github.io with your own Anthropic API key, outside Claude.
- **Don't use it.** That's fine too.

## Reporting a problem

Open an issue at https://github.com/keymon-labs/keymon-labs.github.io/issues. For a security problem, say so in the title and don't include exploit details or personal data.
