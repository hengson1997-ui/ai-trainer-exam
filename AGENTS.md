# AGENTS.md

## What this repo is

Chinese AI Trainer Level 3 (人工智能训练师三级) certification exam study materials. Not a software project.

## Files

| File | Format | Content |
|------|--------|---------|
| `人工智能训练师三级题库汇总.md` | Markdown | Primary data: 900+ exam questions with answers/explanations, organized by 16 topic categories (~4700 lines) |
| `人工智能训练师三级题库 70分.pdf` | PDF | Source question bank (70-point pass threshold) |
| `理论题模拟题.doc` | DOC | Mock exam paper |
| `理论题试题.doc` | DOC | Theory exam questions |
| `知识图谱.html` | HTML | Interactive knowledge graph visualization (vis-network, standalone single file) |

## Tool requirements

Reading `.doc` files requires `antiword`. Reading `.pdf` requires `pdftotext` (poppler). Encoding conversion may need `iconv -f GBK -t UTF-8`. Python available for ad-hoc parsing.

```bash
antiword "理论题模拟题.doc"
pdftotext -layout "人工智能训练师三级题库 70分.pdf" output.txt
```

## Conventions

- All content is in Chinese (Simplified). Respond in Chinese unless asked otherwise.
- The `.md` file is the authoritative structured source — prefer it over re-parsing `.doc`/`.pdf`.
- The knowledge graph HTML is self-contained; no build step needed, just open in a browser.

## Coding Rules (synced from ~/.claude/rules)

### Agent Orchestration

- Complex feature requests → use **planner** agent
- Code just written/modified → use **code-reviewer** agent
- Bug fix or new feature → use **tdd-guide** agent
- Architectural decision → use **architect** agent
- ALWAYS use parallel execution for independent operations

### Coding Style

- **Immutability**: ALWAYS create new objects, NEVER mutate
- **File organization**: MANY SMALL FILES > FEW LARGE FILES; 200-400 lines typical, 800 max
- **Functions**: small (<50 lines), no deep nesting (>4 levels)
- **Error handling**: ALWAYS handle errors comprehensively
- **Input validation**: use Zod for user input validation
- No console.log statements, no hardcoded values

### Git Workflow

- Commit format: `<type>: <description>` (types: feat, fix, refactor, docs, test, chore, perf, ci)
- PR workflow: analyze full commit history, draft comprehensive summary, include test plan
- Feature implementation: Plan → TDD → Code Review → Commit & Push

### Security (Mandatory Before ANY Commit)

- No hardcoded secrets (API keys, passwords, tokens)
- All user inputs validated
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitized HTML)
- CSRF protection enabled
- Rate limiting on all endpoints
- Error messages don't leak sensitive data
- If security issue found: STOP → use security-reviewer agent → fix CRITICAL → rotate exposed secrets

### Testing

- Minimum test coverage: **80%**
- Required: Unit Tests + Integration Tests + E2E Tests (Playwright)
- MANDATORY TDD: Write test (RED) → Run test FAIL → Implement (GREEN) → Run test PASS → Refactor (IMPROVE)

### Performance

- **Haiku 4.5**: lightweight agents, pair programming, worker agents
- **Sonnet 4.5**: main development, orchestrating multi-agent, complex coding
- **Opus 4.5**: complex architectural decisions, deep reasoning, research
- Avoid last 20% of context window for large-scale refactoring or multi-file features
