(function exposeScrollActions(globalScope) {
  'use strict';

  const PAGE_OVERLAP = 120;
  const MIN_PAGE_STEP = 120;

  function createScrollActions(win) {
    function scrollBehavior() {
      return win.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    }

    function pageStep() {
      return Math.max(MIN_PAGE_STEP, win.innerHeight - PAGE_OVERLAP);
    }

    return {
      top() {
        win.scrollTo({ top: 0, behavior: scrollBehavior() });
      },
      pageUp() {
        win.scrollBy({ top: -pageStep(), behavior: scrollBehavior() });
      },
      pageDown() {
        win.scrollBy({ top: pageStep(), behavior: scrollBehavior() });
      },
      bottom() {
        win.scrollTo({
          top: win.document.documentElement.scrollHeight,
          behavior: scrollBehavior()
        });
      }
    };
  }

  const api = { createScrollActions };
  globalScope.NavbarScrollActions = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
