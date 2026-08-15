const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

test('manifest packages the toolbar as a permission-free Manifest V3 content script', () => {
  const manifestPath = path.join(projectRoot, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.name, '__MSG_extensionName__');
  assert.equal(manifest.description, '__MSG_extensionDescription__');
  assert.equal(manifest.default_locale, 'en');
  assert.deepEqual(manifest.permissions ?? [], []);
  assert.deepEqual(manifest.content_scripts[0].matches, ['http://*/*', 'https://*/*']);
  assert.deepEqual(manifest.content_scripts[0].js, [
    'src/scroll-actions.js',
    'src/toolbar.js',
    'src/content.js'
  ]);
});

test('name and description are localized for zh_CN and en', () => {
  const zh = JSON.parse(fs.readFileSync(path.join(projectRoot, '_locales/zh_CN/messages.json'), 'utf8'));
  const en = JSON.parse(fs.readFileSync(path.join(projectRoot, '_locales/en/messages.json'), 'utf8'));

  assert.equal(zh.extensionName.message, '侧边导航');
  assert.ok(zh.extensionDescription.message.length > 0);
  assert.equal(en.extensionName.message, 'SideNav');
  assert.ok(en.extensionDescription.message.length > 0);
});

test('every manifest icon points to a non-empty PNG file', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'manifest.json'), 'utf8'));

  assert.deepEqual(Object.keys(manifest.icons), ['16', '32', '48', '128']);
  for (const iconPath of Object.values(manifest.icons)) {
    const absolutePath = path.join(projectRoot, iconPath);
    assert.equal(path.extname(iconPath), '.png');
    assert.ok(fs.statSync(absolutePath).size > 0, `${iconPath} should not be empty`);
  }
});
