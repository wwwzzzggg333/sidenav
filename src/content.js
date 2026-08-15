(function initializePageNavigationToolbar() {
  'use strict';

  const actions = globalThis.NavbarScrollActions.createScrollActions(globalThis);
  globalThis.NavbarToolbar.mountToolbar(document, actions);
})();
