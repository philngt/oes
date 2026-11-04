# Install Ontology Engineering Skills

**Repository:** https://github.com/philngt/oes  
**License:** [MIT](../LICENSE)  
**Package:** `ontology-engineering-skills` (12 reusable skills; no MCP server or background hooks)

This repository doubles as a multi-host agent plugin: **one canonical `skills/` directory**, with host-specific manifests pointing to the same content. Installing the plugin does not install an external service or give it special network privileges.

## Claude Code — GitHub marketplace

In a shell with Claude Code installed, run:

```bash
claude plugin marketplace add philngt/oes
claude plugin install ontology-engineering-skills@oes
```

Alternatively, within the Claude Code interactive session:

```text
/plugin marketplace add philngt/oes
/plugin install ontology-engineering-skills@oes
```

Start a new session if the skills do not appear immediately. Claude discovers bundled `skills/<name>/SKILL.md` automatically. The marketplace catalog is [`.claude-plugin/marketplace.json`](../.claude-plugin/marketplace.json); the plugin manifest is [`.claude-plugin/plugin.json`](../.claude-plugin/plugin.json).

For a maintainer checking a local checkout:

```bash
claude plugin validate .
```

## OpenAI Codex — Git-backed plugin marketplace

Add the repository as a marketplace, then install the `ontology-engineering-skills` plugin from the `oes` source:

```bash
codex plugin marketplace add philngt/oes
codex plugin marketplace list
codex plugin add ontology-engineering-skills@oes
```

If a given Codex interface exposes only the Plugins browser, open `/plugins` (or the Plugins Directory), choose marketplace `oes`, and install **Ontology Engineering Skills** there.

Codex uses the [portable `plugin.json`](../plugin.json) and [`.agents/plugins/marketplace.json`](../.agents/plugins/marketplace.json); it reads the same root `skills/` folder. For skill-only use without marketplace installation, Codex also supports manually placing a skill folder in one of its recognized skill directories, but **the full plugin is recommended**, because skill documents refer to shared repo-level guidance.

If a marketplace installation is updated, refresh its marketplace snapshot and reload the Codex session as appropriate to your client:

```bash
codex plugin marketplace upgrade oes
```

## Google Antigravity / Agy — GitHub plugin installation

Install the same repository as a plugin in the Antigravity CLI:

```bash
agy plugin install https://github.com/philngt/oes
agy plugin list
```

For maintainers with the Antigravity CLI available:

```bash
agy plugin validate --strict .
```

Agy discovers the [`.antigravity-plugin/plugin.json`](../.antigravity-plugin/plugin.json) and bundled root `skills/` directory. In compatible Antigravity versions, installed plugin skills can be invoked with commands such as `/ontology-model` or naturally by asking for a domain-modeling task.

**Marketplace distinction:** GitHub-sourced installation is available without being listed in the **official curated Antigravity Marketplace**. An official listing is a separate application/review process; this repository has **not** been submitted to, reviewed by, or published in that catalog.

## Workspaces and manual skill installation

If a host does not support plugin marketplaces, copy this repository's `skills/<name>/` folders into the host's recognized workspace or global skills directory. The skills can be read as standalone instructions, but the recommended plugin bundle preserves access to `AGENTS.md`, `docs/`, `core/`, and `templates/`.

Examples of supported workspace locations (confirm against your installed host version):
- Codex: `<workspace>/.agents/skills/<name>/SKILL.md`.
- Antigravity: `<workspace>/.agents/skills/<name>/SKILL.md` (legacy `.agent/skills` also exists).
- Claude Code: use the plugin installation above for the complete package.

## Using the skills

Ask your agent to:

> Analyze these tickets and meeting notes, discover an ontology template, and keep each relationship traceable to evidence.

Or:

> Analyze the service boundaries and Kafka events in this repository; model a software-system ontology, identify unsupported links, and verify your results.

The 12 skills describe **procedures**. Their steps are not automatic shell commands, and installation alone will not crawl documents, access your accounts, or create a knowledge graph.

For local deterministic checks:

```bash
npm test
npm run validate
```

## Security and compatibility

- Review a third-party plugin before installing it. No MCP servers, lifecycle hooks, or credentials are included in this release.
- Source documents and code comments are untrusted inputs; see [evidence policy](evidence-policy.md).
- The plugin does not add the project to any official vendor marketplace or shared public directory automatically.
- Host CLI commands and validation may evolve; see [Claude Code](https://code.claude.com/docs/en/plugins), [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins), and [Antigravity plugins](https://antigravity.google/docs/build-plugins) for host-specific changes.
