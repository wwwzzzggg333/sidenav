# Page Navigation Toolbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a load-unpacked Chrome extension that places a hideable page-navigation toolbar at the middle-right of ordinary web pages.

**Architecture:** A Manifest V3 content script loads a small, testable scroll-action module and mounts an isolated Shadow DOM toolbar. Four buttons call top, previous-page, next-page, and bottom actions; a collapse control reduces the toolbar to a small restore tab without removing keyboard or screen-reader semantics.

**Tech Stack:** Chrome Extensions Manifest V3, vanilla JavaScript, Shadow DOM/CSS, Node.js built-in test runner, Playwright CLI for browser smoke testing.

## Global Constraints

- The toolbar is positioned at the vertical center of the page's right edge.
- The toolbar exposes exactly four navigation actions: top, one page up, one page down, and bottom.
- “One page” means the current viewport height minus a small overlap, with a positive minimum step.
- All scrolling is smooth unless reduced motion is requested.
- The toolbar can be hidden and restored without reloading the page.
- The extension must not request unnecessary permissions or access browser-internal pages.

---

### Task 1: Scroll action module

**Files:**
- Create: `package.json`
- Create: `tests/scroll-actions.test.js`
- Create: `src/scroll-actions.js`

**Interfaces:**
- Consumes: a window-like object exposing `innerHeight`, `scrollTo()`, `scrollBy()`, `document.documentElement.scrollHeight`, and `matchMedia()`.
- Produces: `createScrollActions(win)` returning `{ top(), pageUp(), pageDown(), bottom() }`.

- [ ] **Step 1: Write the failing tests**

```js
test('top scrolls to document start', () => {
  const { win, calls } = makeWindow();
  createScrollActions(win).top();
  assert.deepEqual(calls[0], ['to', { top: 0, behavior: 'smooth' }]);
});

test('page navigation leaves viewport overlap', () => {
  const { win, calls } = makeWindow({ innerHeight: 900 });
  const actions = createScrollActions(win);
  actions.pageUp();
  actions.pageDown();
  assert.deepEqual(calls, [
    ['by', { top: -780, behavior: 'smooth' }],
    ['by', { top: 780, behavior: 'smooth' }]
  ]);
});
```

- [ ] **Step 2: Run `npm test` and confirm failure because `src/scroll-actions.js` does not exist**

- [ ] **Step 3: Implement the minimal module**

```js
function createScrollActions(win) {
  const behavior = () => win.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const pageStep = () => Math.max(120, win.innerHeight - 120);
  return {
    top: () => win.scrollTo({ top: 0, behavior: behavior() }),
    pageUp: () => win.scrollBy({ top: -pageStep(), behavior: behavior() }),
    pageDown: () => win.scrollBy({ top: pageStep(), behavior: behavior() }),
    bottom: () => win.scrollTo({ top: win.document.documentElement.scrollHeight, behavior: behavior() })
  };
}
```

- [ ] **Step 4: Run `npm test` and confirm all scroll tests pass**

### Task 2: Toolbar UI

**Files:**
- Create: `tests/toolbar.test.js`
- Create: `src/toolbar.js`

**Interfaces:**
- Consumes: `createToolbar(doc, actions)` where `actions` is Task 1's return value.
- Produces: a host element with an open shadow root, four action buttons, one collapse button, and one restore button.

- [ ] **Step 1: Write failing DOM behavior tests using a minimal document fixture**
- [ ] **Step 2: Run `npm test` and verify the UI tests fail because the toolbar module is absent**
- [ ] **Step 3: Implement semantic buttons, isolated styles, event wiring, collapse/restore state, and duplicate-mount protection**
- [ ] **Step 4: Run `npm test` and confirm all tests pass**

### Task 3: Chrome packaging and integration

**Files:**
- Create: `manifest.json`
- Create: `src/content.js`
- Create: `icons/icon16.png`
- Create: `icons/icon32.png`
- Create: `icons/icon48.png`
- Create: `icons/icon128.png`
- Create: `README.md`

**Interfaces:**
- Consumes: global `NavbarScrollActions.createScrollActions` and `NavbarToolbar.mountToolbar` exposed by Tasks 1 and 2.
- Produces: a Manifest V3 extension loadable through `chrome://extensions`.

- [ ] **Step 1: Add a package validation test that parses `manifest.json`, checks Manifest V3, content-script order, and icon paths**
- [ ] **Step 2: Run `npm test` and verify it fails because packaging files are absent**
- [ ] **Step 3: Add the manifest, integration entry point, generated local icons, and installation/usage documentation**
- [ ] **Step 4: Run `npm test` and confirm unit/package tests pass**

### Task 4: Browser verification

**Files:**
- Create: `test-fixtures/long-page.html`
- Create: `output/playwright/toolbar.png`

**Interfaces:**
- Consumes: the packaged extension and a deterministic long local page.
- Produces: visual and interaction evidence for all five UI states/actions.

- [ ] **Step 1: Load the unpacked extension in Chromium and open the long-page fixture**
- [ ] **Step 2: Verify the toolbar is centered on the right and does not inherit page styles**
- [ ] **Step 3: Exercise top, page-up, page-down, bottom, collapse, and restore; assert scroll/state changes**
- [ ] **Step 4: Capture `output/playwright/toolbar.png` and rerun `npm test` as the final verification gate**

## Self-review

- Spec coverage: all four navigation operations and hide/restore behavior are assigned to Tasks 1–4.
- Placeholder scan: no deferred product behavior remains; Task 2's exact semantics are defined in its interfaces and acceptance steps.
- Type consistency: `createScrollActions(win)` feeds `createToolbar(doc, actions)` and both globals are consumed by `src/content.js`.
