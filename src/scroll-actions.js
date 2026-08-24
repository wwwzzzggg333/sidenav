(function exposeScrollActions(globalScope) {
  'use strict';

  const PAGE_OVERLAP = 120;
  const MIN_PAGE_STEP = 120;
  const TOOLBAR_ID_PREFIX = 'page-navigation-toolbar-extension';

  function createScrollActions(win) {
    function scrollBehavior() {
      return win.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    }

    function overflowY(el) {
      if (!el || typeof win.getComputedStyle !== 'function') return 'visible';
      try {
        return win.getComputedStyle(el).overflowY || 'visible';
      } catch {
        return 'visible';
      }
    }

    function isScrollableOverflow(value) {
      return value === 'auto' || value === 'scroll' || value === 'overlay';
    }

    function isClippedOverflow(value) {
      return value === 'hidden' || value === 'clip';
    }

    function canElementScroll(el) {
      if (!el) return false;
      if ((el.scrollHeight || 0) - (el.clientHeight || 0) < 2) return false;
      return isScrollableOverflow(overflowY(el));
    }

    function isToolbarHost(el) {
      return typeof el?.id === 'string' && el.id.startsWith(TOOLBAR_ID_PREFIX);
    }

    function documentTarget() {
      const doc = win.document;
      const html = doc.documentElement;
      const body = doc.body;
      const scrollingElement = doc.scrollingElement || html;
      const scrollY = win.scrollY || win.pageYOffset || 0;

      if (scrollY > 0) {
        return { type: 'window', el: scrollingElement };
      }

      const delta = (scrollingElement.scrollHeight || 0)
        - (scrollingElement.clientHeight || win.innerHeight || 0);
      const htmlOverflow = overflowY(html);
      const bodyOverflow = overflowY(body);

      if (delta >= 2 && !(isClippedOverflow(htmlOverflow) && isClippedOverflow(bodyOverflow))) {
        return { type: 'window', el: scrollingElement };
      }

      if (canElementScroll(body)) {
        return { type: 'element', el: body };
      }

      return null;
    }

    function nodesFromPoint(x, y) {
      const doc = win.document;
      if (typeof doc.elementsFromPoint === 'function') {
        return doc.elementsFromPoint(x, y) || [];
      }
      if (typeof doc.elementFromPoint === 'function') {
        const node = doc.elementFromPoint(x, y);
        return node ? [node] : [];
      }
      return [];
    }

    function collectInnerCandidates() {
      const doc = win.document;
      const width = win.innerWidth || 0;
      const height = win.innerHeight || 0;
      const samples = [
        [0.5, 0.5],
        [0.4, 0.5],
        [0.6, 0.48],
        [0.32, 0.55]
      ];
      const found = [];
      const seen = new Set();

      for (const [px, py] of samples) {
        const stack = nodesFromPoint(Math.floor(width * px), Math.floor(height * py));
        for (const start of stack) {
          let node = start;
          while (node && node !== doc.documentElement && node !== doc) {
            if (!seen.has(node)) {
              seen.add(node);
              if (!isToolbarHost(node) && canElementScroll(node)) {
                found.push(node);
              }
            }
            node = node.parentElement;
          }
        }
      }

      return found;
    }

    function scoreCandidate(el) {
      const overflow = (el.scrollHeight || 0) - (el.clientHeight || 0);
      const height = el.clientHeight || 0;
      const viewport = win.innerHeight || height || 1;
      const coverage = Math.min(height / viewport, 1);
      const mainPaneBonus = height >= viewport * 0.4 ? 2 : 1;
      return overflow * coverage * mainPaneBonus;
    }

    function innerTarget() {
      const candidates = collectInnerCandidates();
      if (!candidates.length) return null;
      candidates.sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
      return { type: 'element', el: candidates[0] };
    }

    function resolveTarget() {
      return documentTarget() || innerTarget() || {
        type: 'window',
        el: win.document.scrollingElement || win.document.documentElement
      };
    }

    function pageStep(target) {
      const viewport = target.type === 'window'
        ? win.innerHeight
        : (target.el.clientHeight || win.innerHeight);
      return Math.max(MIN_PAGE_STEP, viewport - PAGE_OVERLAP);
    }

    function scrollToTop(target, top, behavior) {
      const options = { top, behavior };
      if (target.type === 'window') {
        win.scrollTo(options);
        return;
      }
      if (typeof target.el.scrollTo === 'function') {
        target.el.scrollTo(options);
        return;
      }
      target.el.scrollTop = top;
    }

    function scrollByDelta(target, top, behavior) {
      const options = { top, behavior };
      if (target.type === 'window') {
        win.scrollBy(options);
        return;
      }
      if (typeof target.el.scrollBy === 'function') {
        target.el.scrollBy(options);
        return;
      }
      target.el.scrollTop = (target.el.scrollTop || 0) + top;
    }

    return {
      top() {
        const target = resolveTarget();
        scrollToTop(target, 0, scrollBehavior());
      },
      pageUp() {
        const target = resolveTarget();
        scrollByDelta(target, -pageStep(target), scrollBehavior());
      },
      pageDown() {
        const target = resolveTarget();
        scrollByDelta(target, pageStep(target), scrollBehavior());
      },
      bottom() {
        const target = resolveTarget();
        scrollToTop(target, target.el.scrollHeight || 0, scrollBehavior());
      }
    };
  }

  const api = { createScrollActions };
  globalScope.NavbarScrollActions = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
