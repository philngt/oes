import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(join(root, path), 'utf8');
const json = path => JSON.parse(read(path));
const pluginName = 'ontology-engineering-skills';
const version = '0.2.0';
const repo = 'https://github.com/philngt/oes';
const skillDirs = readdirSync(join(root, 'skills'), { withFileTypes: true })
  .filter(dir => dir.isDirectory() && existsSync(join(root, 'skills', dir.name, 'SKILL.md')))
  .map(dir => dir.name).sort();

test('MIT license is present and package declares it', () => {
  const license = read('LICENSE');
  assert.match(license, /^MIT License/);
  assert.match(license, /Copyright \(c\) 2026/);
  assert.match(license, /Permission is hereby granted, free of charge/);
  assert.match(license, /THE SOFTWARE IS PROVIDED "AS IS"/);
  assert.equal(json('package.json').license, 'MIT');
});

test('three host manifests preserve one canonical skill tree', () => {
  const codex = json('plugin.json');
  const claude = json('.claude-plugin/plugin.json');
  const antigravity = json('.antigravity-plugin/plugin.json');
  assert.equal(codex.$schema, 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json');
  assert.equal(antigravity.$schema, 'https://antigravity.google/schemas/v1/plugin.json');
  for (const manifest of [codex, claude, antigravity]) {
    assert.equal(manifest.name, pluginName);
    assert.equal(manifest.version, version);
    assert.equal(manifest.license, 'MIT');
    assert.equal(manifest.repository, repo);
    assert.ok(manifest.description.length >= 40);
  }
  assert.equal(skillDirs.length, 12);
  assert.ok(existsSync(join(root, antigravity.logo)));
  assert.match(read(antigravity.logo), /<svg\b/);
  assert.equal(json('package.json').version, version);
});

test('Claude and Codex marketplaces register the same plugin at the correct root', () => {
  const c = json('.claude-plugin/marketplace.json');
  const x = json('.agents/plugins/marketplace.json');
  assert.equal(c.name, 'oes');
  assert.equal(x.name, 'oes');
  assert.equal(c.plugins.length, 1);
  assert.equal(x.plugins.length, 1);
  assert.equal(c.plugins[0].name, pluginName);
  assert.equal(x.plugins[0].name, pluginName);
  assert.deepEqual(c.plugins[0].source, { source: 'github', repo: 'philngt/oes' });
  assert.equal(x.plugins[0].source.source, 'local');
  assert.equal(resolve(root, x.plugins[0].source.path), root);
  assert.equal(x.plugins[0].policy.installation, 'AVAILABLE');
});

test('all twelve agent skills expose valid matching frontmatter and local references', () => {
  for (const id of skillDirs) {
    const location = join(root, 'skills', id, 'SKILL.md');
    const body = readFileSync(location, 'utf8');
    assert.ok(body.startsWith('---\n'), id + ': missing frontmatter');
    const fm = body.slice(4, body.indexOf('\n---\n', 4));
    const name = fm.match(/^name:\s*(.+)$/m);
    const desc = fm.match(/^description:\s*(.+)$/m);
    assert.equal(name?.[1], id);
    assert.ok(desc?.[1]?.length > 20, id + ': missing description');
    for (const [,relative] of body.matchAll(/\]\((\.\.\/[^)]+)\)/g)) {
      assert.ok(existsSync(resolve(dirname(location), relative)), id + ': broken ' + relative);
    }
  }
});

test('README describes supported GitHub installation, not official marketplace listing', () => {
  const readme = read('README.md');
  const doc = read('docs/installation.md');
  assert.match(readme, /claude plugin marketplace add philngt\/oes/);
  assert.match(readme, /codex plugin marketplace add philngt\/oes/);
  assert.match(readme, /agy plugin install https:\/\/github.com\/philngt\/oes/);
  assert.match(readme, /\[MIT\]\(LICENSE\)/);
  assert.match(doc, /not.*official.*Marketplace/i);
  assert.ok(!readme.includes('Not yet selected by the repository owner'));
  assert.ok(!readme.includes('philngt/ontology-engineering-skills.git'));
});
