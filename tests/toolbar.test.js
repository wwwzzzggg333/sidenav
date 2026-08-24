const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { HOST_ID, mountToolbar, observeToolbar } = require('../src/toolbar.js');

function setup() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  const calls = [];
  const actions = Object.fromEntries(
    ['top', 'pageUp', 'pageDown', 'bottom'].map((name) => [name, () => calls.push(name)])
  );
  const host = mountToolbar(dom.window.document, actions);
  return { dom, host, calls };
}

test('mounts one isolated toolbar with four navigation actions', () => {
  const { dom, host } = setup();

  assert.equal(host.id, HOST_ID);
  assert.equal(dom.window.document.querySelectorAll(`#${HOST_ID}`).length, 1);
  assert.ok(host.shadowRoot);
  assert.equal(host.shadowRoot.querySelectorAll('[data-action]').length, 4);
  assert.equal(host.shadowRoot.querySelector('[role="toolbar"]').getAttribute('aria-label'), '侧边导航');
});

test('navigation buttons invoke their matching actions', () => {
  const { host, calls } = setup();

  for (const name of ['top', 'pageUp', 'pageDown', 'bottom']) {
    host.shadowRoot.querySelector(`[data-action="${name}"]`).click();
  }

  assert.deepEqual(calls, ['top', 'pageUp', 'pageDown', 'bottom']);
});

test('toolbar starts collapsed with only the restore tab visible', () => {
  const { host } = setup();
  const root = host.shadowRoot;

  assert.equal(root.querySelector('[data-panel]').hidden, true);
  assert.equal(root.querySelector('[data-restore]').hidden, false);
});

test('collapse hides the action panel and restore shows it again', () => {
  const { host } = setup();
  const root = host.shadowRoot;
  const panel = root.querySelector('[data-panel]');
  const restore = root.querySelector('[data-restore]');

  root.querySelector('[data-collapse]').click();
  assert.equal(panel.hidden, true);
  assert.equal(restore.hidden, false);

  restore.click();
  assert.equal(panel.hidden, false);
  assert.equal(restore.hidden, true);
});

test('mounting twice reuses the existing toolbar', () => {
  const { dom, host } = setup();

  const second = mountToolbar(dom.window.document, {});

  assert.equal(second, host);
  assert.equal(dom.window.document.querySelectorAll(`#${HOST_ID}`).length, 1);
});

test('observeToolbar remounts after the host is removed from the document', async () => {
  const { dom, host } = setup();
  observeToolbar(dom.window.document, Object.fromEntries(
    ['top', 'pageUp', 'pageDown', 'bottom'].map((name) => [name, () => {}])
  ));

  host.remove();
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

  const remounted = [...dom.window.document.body.children].find((node) => node.shadowRoot);
  assert.ok(remounted);
  assert.notEqual(remounted, host);
  assert.ok(remounted.shadowRoot.querySelector('[data-action="top"]'));
});

test('a page-owned element with the host id cannot block the toolbar', () => {
  const dom = new JSDOM(`<!doctype html><html><body><div id="${HOST_ID}"></div></body></html>`);
  const pageElement = dom.window.document.getElementById(HOST_ID);
  const actions = Object.fromEntries(
    ['top', 'pageUp', 'pageDown', 'bottom'].map((name) => [name, () => {}])
  );

  const host = mountToolbar(dom.window.document, actions);

  assert.notEqual(host, pageElement);
  assert.ok(host.shadowRoot);
  assert.notEqual(host.id, HOST_ID);
  assert.equal(mountToolbar(dom.window.document, actions), host);
});
