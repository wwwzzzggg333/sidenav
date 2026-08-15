const test = require('node:test');
const assert = require('node:assert/strict');

const { createScrollActions } = require('../src/scroll-actions.js');

function makeWindow({ innerHeight = 900, scrollHeight = 5200, reducedMotion = false } = {}) {
  const calls = [];
  const win = {
    innerHeight,
    document: { documentElement: { scrollHeight } },
    matchMedia: () => ({ matches: reducedMotion }),
    scrollTo: (options) => calls.push(['to', options]),
    scrollBy: (options) => calls.push(['by', options])
  };

  return { win, calls };
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
