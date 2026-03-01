# Hardened Claude Code

Production-hardened Claude Code configuration built from real enterprise experience.

[한국어](README-KR.md)

---

## Why This Exists

Most Claude Code setups are optimized purely for productivity. This one was forged in **enterprise production environments** - high-traffic systems, large-scale data streaming pipelines, and the kind of infrastructure where a misconfigured agent can cause real damage.

After years of working in these environments as a developer, I needed Claude Code configurations that:

- **Catch mistakes before they happen** - hooks that block dangerous commands, enforce formatting, and verify compilation in real-time
- **Support multiple tech stacks** - Kotlin/Spring Boot, TypeScript/Next.js, and Python/FastAPI in the same workflow
- **Balance AI productivity with human growth** - because outsourcing all thinking to an AI makes you a worse engineer

## Inspiration

This project draws from several sources:

- **[Advent of Claude 2025](https://adocomplete.com/advent-of-claude-2025/)** - Ado Kukic's 31-day Claude Code best practices guide. Practical tips on hooks, subagents, session management, and the philosophy of human-AI collaboration
- **[Everything Claude Code](https://github.com/affaan-m/everything-claude-code)** - The Anthropic hackathon winning configuration. Showed what's possible with agents, skills, and commands at scale
- **Boris Cherny's tips** - Practical Claude Code tips shared by Boris Cherny, a developer on the Claude Code team at Anthropic
- **Senior developer feedback** - Real-world code review feedback that shaped the architecture review and performance review workflows

The result is something opinionated and battle-tested, not a generic starter kit.

---

## What's Inside

```
hardened-claude-code/
├── .claude-plugin/      # Plugin manifest
│   └── plugin.json
├── agents/              # 4 specialized review agents
├── commands/            # 9 slash commands for common workflows
├── skills/              # 8 knowledge-based skill modules
├── hooks/               # Pre/Post tool hooks for safety and quality
├── scripts/             # Hook support scripts (dangerous command blocker)
├── output-styles/       # Learning Plus - educational output style
└── mcp/                 # MCP server configs (Context7, Playwright, Serena, All Agents)
```

### Agents

Autonomous specialists that handle focused analysis tasks.

| Agent | Purpose |
|-------|---------|
| `arch-reviewer` | Architecture conformance, dependency direction, layer violations |
| `perf-reviewer` | Performance anti-patterns across Kotlin, Python, TypeScript |
| `e2e-runner` | Playwright E2E test generation, execution, and artifact capture |
| `tdd-guide` | Test-driven development enforcement (RED-GREEN-REFACTOR) |

### Commands

Slash commands that orchestrate multi-step workflows.

| Command | Purpose |
|---------|---------|
| `/analyze` | Comprehensive code analysis with optional AI collaboration (Gemini/Copilot/Codex) |
| `/arch-review` | Architecture review with health scoring (0-100) |
| `/perf-review` | Performance code review with anti-pattern detection |
| `/tdd` | TDD workflow enforcement with 80%+ coverage target |
| `/e2e` | End-to-end test generation and execution |
| `/create-flow` | Interactive scaffolding for new agents, commands, skills, hooks |
| `/verify-flow` | Validation of components against project conventions |
| `/handoff` | Session context transfer via HANDOFF.md |
| `/obsidian` | Technical learning note generation (7 templates) |

### Skills

Knowledge modules that activate contextually.

| Skill | Purpose |
|-------|---------|
| `arch-review-guide` | Architecture violation detection quick reference |
| `perf-review-guide` | Performance anti-pattern checklist |
| `tdd-workflow` | TDD methodology with Kotlin and TypeScript patterns |
| `flow-scaffolding` | Templates for creating new plugin components |
| `flow-validation` | Validation rules for component quality checks |
| `sync-claude-md` | Auto-detect when CLAUDE.md needs updating after code changes |
| `claude-md-inverted-index` | Inverted index strategy for CLAUDE.md — reduces AI agent tool calls by 42-68% |
| `obsidian-tech-note` | Obsidian note templates (concept, lab, comparison, troubleshoot, pattern, TIL, MOC) |

### Hooks

The hooks system is where the real hardening happens. These run automatically on every tool use.

**PreToolUse:**
- **Dangerous command blocker** - 4-level security system that blocks or prompts for approval on risky Bash commands:

  | Level | Action | Examples |
  |-------|--------|----------|
  | L1 Catastrophic | Block (deny) | `rm -rf /`, fork bomb, `mkfs`, `shutdown` |
  | L2 Critical Path | Block (deny) | `rm .git/`, `rm .env`, modify `package.json` |
  | L3 Dangerous | Ask user | `git push --force`, `git reset --hard`, `sudo`, `curl \| sh` |
  | L4 Suspicious | Ask user | `rm *.log`, `find -delete`, `kill -9` |

- Block dev servers outside tmux (prevents orphaned processes)
- Remind about tmux for long-running commands
- Review reminder before `git push`
- Block creation of unnecessary documentation files

**PostToolUse:**
- Auto-format JS/TS with Prettier after edits
- Auto-format Kotlin with ktlint after edits
- TypeScript type-check after `.ts/.tsx` edits
- Kotlin compile check after `.kt/.kts` edits
- Python syntax check after `.py` edits
- Warn about `console.log` / `println()` / `print()` left in code
- Log PR/MR URLs after creation (GitHub + GitLab)
- Async build analysis hooks

### Output Style: Learning Plus

This is the piece I'm most intentional about.

The problem: **over-relying on AI agents improves short-term productivity but degrades your engineering skills over time.** You stop thinking about design decisions, error handling strategies, and algorithm choices because the AI handles everything.

Learning Plus solves this by classifying every piece of code as either **boilerplate** or **core logic**:

- **Boilerplate** (DTOs, config, CRUD, imports) → auto-completed instantly with a brief insight
- **Core logic** (business rules, algorithms, error strategies, security) → you write it yourself with guided context

The "Build Together" format provides context, points you to the exact location, and explains the trade-offs - but you make the decision and write the code. This keeps you sharp while still moving fast on the mechanical parts.

### MCP Servers

Pre-configured MCP server connections:

| Server | Purpose |
|--------|---------|
| Context7 | Up-to-date library documentation and code examples |
| Playwright | Browser automation for E2E testing |
| Serena | Semantic code analysis with LSP-powered symbol navigation |
| All Agents MCP | Multi AI CLI orchestration — Codex, Gemini CLI, Copilot CLI in one interface |

---

## Installation

### As a Plugin (recommended)

```bash
# 1. Add marketplace (includes all Dokkabei97 plugins)
/plugin marketplace add Dokkabei97/claude-plugins

# 2. Install plugin
/plugin install hardened-claude-code
```

> You can also add the plugin repository directly: `/plugin marketplace add Dokkabei97/hardened-claude-code`

That's it. All agents, commands, skills, hooks, and output styles are automatically available.

### Local Development

To test the plugin locally before installing:
```bash
git clone https://github.com/Dokkabei97/hardened-claude-code.git
claude --plugin-dir ./hardened-claude-code
```

> **Note:** Some hooks reference specific tools (Prettier, ktlint, gradlew) that need to be installed in your project.

---

## Customization

This configuration is opinionated by design. Adapt it to your needs:

- **Remove hooks you don't need** - If you don't use Kotlin, remove the ktlint/gradle hooks
- **Adjust the Learning Plus style** - Move categories between boilerplate and core logic based on your growth areas
- **Add your own commands** - Use `/create-flow` to scaffold new components following the conventions
- **Validate your changes** - Use `/verify-flow` to check components against project standards

---

## Philosophy

Three principles guide this configuration:

1. **Safety by default** - Hooks catch common mistakes automatically. You shouldn't need to remember to format code or avoid pushing debug statements.

2. **Multi-stack support** - Enterprise environments rarely use a single language. Every agent, skill, and hook supports Kotlin, TypeScript, and Python workflows.

3. **Grow while you ship** - The Learning Plus output style exists because the best engineers understand *why* code works, not just *that* it works. AI should amplify your skills, not replace them.

---

## Contributing

Contributions are welcome! Whether it's a new hook, agent, command, or bug fix.

### Getting Started

```bash
# Fork and clone
git clone https://github.com/<your-username>/hardened-claude-code.git
cd hardened-claude-code

# Test locally
claude --plugin-dir .
```

### Adding Components

Use the built-in scaffolding tools to create new components that follow project conventions:

```bash
# Scaffold a new agent, command, skill, or hook
claude /create-flow

# Validate your component
claude /verify-flow
```

### Project Structure

| Directory | What goes here |
|-----------|---------------|
| `agents/` | Autonomous review/analysis agents (`.md`) |
| `commands/` | Slash commands for multi-step workflows (`.md`) |
| `skills/` | Contextual knowledge modules (`SKILL.md` + reference files) |
| `hooks/` | Pre/Post tool use hooks (`hooks.json` - inline only) |
| `output-styles/` | Output style definitions (`.md`) |
| `mcp/` | MCP server configurations (`.json`) |

### Guidelines

- **Hooks should be inline when possible** - Use `node -e "..."` for simple hooks. Complex hooks (like the dangerous command blocker) may use external scripts in `scripts/`.
- **Multi-stack support** - New agents, commands, and hooks should support Kotlin, TypeScript, and Python where applicable.
- **Test before submitting** - Run `claude --plugin-dir .` to verify your changes work correctly.
- **Keep it focused** - Each component should do one thing well. Avoid combining unrelated functionality.

### Pull Request Process

1. Create a feature branch from `main`
2. Add your component using `/create-flow`
3. Validate with `/verify-flow`
4. Test locally with `claude --plugin-dir .`
5. Open a PR with a clear description of what the component does and why it's useful

---

## License

MIT
