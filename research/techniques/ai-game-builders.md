---
type: technique
summary: Map of AI game and app builders around Rosebud: hosted prompt-to-playable, asset generators, engine-based and open-source studios, general app builders
status: studied
licence: n/a
themes: [ai-builders, games]
related: [projects/rosebud-ai, projects/ohmygame, projects/makko-ai, projects/google-playground, projects/summer-engine, projects/ludo-ai, projects/playdrop, projects/fifth-door, projects/ai-app-builders, techniques/web-game-frameworks]
captured: 2026-11-22
---
# AI game builders

Prices are entry plans seen in 2026 reviews and vendor blogs; they change quickly and vendor comparisons are marketing.

## Four kinds
| Kind | Examples | Output | Lock-in |
|---|---|---|---|
| Hosted prompt-to-playable | Rosebud, PlayDrop, Fifth Door, Google Playground, Makko | A game on the vendor's platform, shared by link | High: credits, platform terms |
| Asset and design generators | Ludo.ai | Sprites, music, concepts for your own engine | Low |
| Engine-based or open studios | OhMyGame (Apache-2.0), Summer Engine (Godot-compatible), GDevelop | Real project files you keep | Low |
| General app builders and agents | Lovable, Bolt, Replit, v0, Cursor, Cline | Web code, usually with GitHub sync | Medium |

## Take-aways
- Almost every hosted builder is credits-based freemium (free daily or monthly credits, paid from about $20 a month).
- The open route (own agent plus plain Phaser or Three.js files) is what this repo already does; OhMyGame packages the same idea with MCP, playtesting and media generation.
- Check, before using any hosted output here: export, ownership and licence of generated assets.
