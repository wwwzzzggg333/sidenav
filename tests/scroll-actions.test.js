const test = require('node:test');
const assert = require('node:assert/strict');

const { createScrollActions } = require('../src/scroll-actions.js');

function makeWindow({
  innerHeight = 900,
  innerWidth = 1280,
  scrollHeight = 5200,
  clientHeight,
  reducedMotion = false,
  htmlOverflowY = 'visible',
  bodyOverflowY = 'visible',
  bodyScrollHeight,
  bodyClientHeight,
  scrollY = 0,
  innerElement = null
} = {}) {
  const calls = [];
  const documentElement = {
    scrollHeight,
    clientHeight: clientHeight ?? innerHeight
  };
  const body = {
    scrollHeight: bodyScrollHeight ?? scrollHeight,
    clientHeight: bodyClientHeight ?? innerHeight,
    parentElement: documentElement,
    scrollTo: (options) => calls.push(['el-to', options]),
    scrollBy: (options) => calls.push(['el-by', options])
  };

  if (innerElement) {
    innerElement.parentElement = innerElement.parentElement ?? body;
    innerElement.scrollTo = (options) => calls.push(['el-to', options]);
    innerElement.scrollBy = (options) => calls.push(['el-by', options]);
  }

  const win = {
    innerHeight,
    innerWidth,
    scrollY,
    pageYOffset: scrollY,
    document: {
      documentElement,
      body,
      scrollingElement: documentElement,
      elementFromPoint: () => innerElement,
      elementsFromPoint: () => (innerElement ? [innerElement] : [])
    },
    getComputedStyle: (el) => {
      if (el === documentElement) return { overflowY: htmlOverflowY };
      if (el === body) return { overflowY: bodyOverflowY };
      if (el === innerElement) return { overflowY: innerElement.overflowY || 'auto' };
      return { overflowY: 'visible' };
    },
    matchMedia: () => ({ matches: reducedMotion }),
    scrollTo: (options) => calls.push(['to', options]),
    scrollBy: (options) => calls.push(['by', options])
  };

  return { win, calls, innerElement };
}

test('top scrolls to the start of the document', () => {
  const { win, calls } = makeWindow();

  createScrollActions(win).top();

  assert.deepEqual(calls, [['to', { top: 0, behavior: 'smooth' }]]);
});

test('page navigation moves by one viewport with a 120px reading overlap', () => {
  const { win, calls } = makeWindow({ innerHeight: 900 });
  const actions = createScrollActions(win);

  actions.pageUp();
  actions.pageDown();

  assert.deepEqual(calls, [
    ['by', { top: -780, behavior: 'smooth' }],
    ['by', { top: 780, behavior: 'smooth' }]
  ]);
});

test('page navigation keeps a positive step on short viewports', () => {
  const { win, calls } = makeWindow({ innerHeight: 180 });

  createScrollActions(win).pageDown();

  assert.deepEqual(calls, [['by', { top: 120, behavior: 'smooth' }]]);
});

test('bottom scrolls to the full document height', () => {
  const { win, calls } = makeWindow({ scrollHeight: 9876 });

  createScrollActions(win).bottom();

  assert.deepEqual(calls, [['to', { top: 9876, behavior: 'smooth' }]]);
});

test('reduced-motion preference disables smooth scrolling', () => {
  const { win, calls } = makeWindow({ reducedMotion: true });

  createScrollActions(win).top();

  assert.deepEqual(calls, [['to', { top: 0, behavior: 'auto' }]]);
});

test('inner overflow containers are used when the document cannot scroll', () => {
  const innerElement = {
    scrollHeight: 6400,
    clientHeight: 800
  };
  const { win, calls } = makeWindow({
    scrollHeight: 900,
    clientHeight: 900,
    htmlOverflowY: 'hidden',
    bodyOverflowY: 'hidden',
    innerElement
  });
  const actions = createScrollActions(win);

  actions.top();
  actions.pageDown();
  actions.pageUp();
  actions.bottom();

  assert.deepEqual(calls, [
    ['el-to', { top: 0, behavior: 'smooth' }],
    ['el-by', { top: 680, behavior: 'smooth' }],
    ['el-by', { top: -680, behavior: 'smooth' }],
    ['el-to', { top: 6400, behavior: 'smooth' }]
  ]);
});

test('clipped document overflow still uses an inner scroller even if the root is tall', () => {
  const innerElement = {
    scrollHeight: 4000,
    clientHeight: 900
  };
  const { win, calls } = makeWindow({
    scrollHeight: 4000,
    htmlOverflowY: 'hidden',
    bodyOverflowY: 'hidden',
    innerElement
  });

  createScrollActions(win).pageDown();

  assert.deepEqual(calls, [['el-by', { top: 780, behavior: 'smooth' }]]);
});

test('a scrollable body is used when html overflow is clipped', () => {
  const { win, calls } = makeWindow({
    htmlOverflowY: 'hidden',
    bodyOverflowY: 'auto',
    scrollHeight: 900,
    clientHeight: 900,
    bodyScrollHeight: 3600,
    bodyClientHeight: 900
  });

  createScrollActions(win).bottom();

  assert.deepEqual(calls, [['el-to', { top: 3600, behavior: 'smooth' }]]);
});

test('window scrolling is preferred while the document itself still scrolls', () => {
  const innerElement = {
    scrollHeight: 2000,
    clientHeight: 400
  };
  const { win, calls } = makeWindow({ innerElement });

  createScrollActions(win).pageDown();

  assert.deepEqual(calls, [['by', { top: 780, behavior: 'smooth' }]]);
});
