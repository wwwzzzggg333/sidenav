(function exposeToolbar(globalScope) {
  'use strict';

  const HOST_ID = 'page-navigation-toolbar-extension';
  const mountedHosts = new WeakMap();

  const buttons = [
    {
      action: 'top',
      label: '回到顶部',
      icon: '<path d="M6 7h12M8.5 13.5 12 10l3.5 3.5M12 10v8"/>'
    },
    {
      action: 'pageUp',
      label: '向上翻一页',
      icon: '<path d="m7 14 5-5 5 5"/>'
    },
    {
      action: 'pageDown',
      label: '向下翻一页',
      icon: '<path d="m7 10 5 5 5-5"/>'
    },
    {
      action: 'bottom',
      label: '直达底部',
      icon: '<path d="M6 17h12M8.5 10.5 12 14l3.5-3.5M12 14V6"/>'
    }
  ];

  const styles = `
    :host {
      all: initial;
      color-scheme: light dark;
      position: fixed;
      z-index: 2147483647;
      top: 50%;
      right: 18px;
      transform: translateY(-50%);
      font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      line-height: 1;
    }

    *, *::before, *::after { box-sizing: border-box; }
    [hidden] { display: none !important; }

    .panel {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 8px;
      border: 1px solid rgba(255, 255, 255, 0.7);
      border-radius: 16px;
      background: rgba(250, 252, 255, 0.88);
      box-shadow: 0 14px 38px rgba(15, 23, 42, 0.18), 0 3px 10px rgba(15, 23, 42, 0.1);
      backdrop-filter: blur(18px) saturate(145%);
      -webkit-backdrop-filter: blur(18px) saturate(145%);
    }

    .action,
    .collapse,
    .restore {
      appearance: none;
      border: 0;
      margin: 0;
      padding: 0;
      color: #334155;
      background: transparent;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }

    .action {
      position: relative;
      display: grid;
      width: 42px;
      height: 42px;
      place-items: center;
      border-radius: 11px;
      transition: color 150ms ease, background 150ms ease, transform 150ms ease;
    }

    .action:hover {
      color: #2563eb;
      background: rgba(37, 99, 235, 0.1);
      transform: translateX(-1px);
    }

    .action:active { transform: scale(0.94); }

    .action::before {
      content: attr(data-label);
      position: absolute;
      top: 50%;
      right: calc(100% + 12px);
      padding: 7px 9px;
      border-radius: 7px;
      color: #f8fafc;
      background: rgba(15, 23, 42, 0.92);
      box-shadow: 0 5px 18px rgba(15, 23, 42, 0.2);
      font-size: 12px;
      font-weight: 600;
      line-height: 1;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transform: translate(5px, -50%);
      transition: opacity 120ms ease, transform 120ms ease;
    }

    .action:hover::before,
    .action:focus-visible::before {
      opacity: 1;
      transform: translate(0, -50%);
    }

    .action svg,
    .restore svg {
      width: 22px;
      height: 22px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .divider {
      height: 1px;
      margin: 2px 5px;
      background: rgba(100, 116, 139, 0.18);
    }

    .collapse {
      display: grid;
      width: 42px;
      height: 24px;
      place-items: center;
      border-radius: 8px;
      color: #64748b;
      transition: color 150ms ease, background 150ms ease;
    }

    .collapse:hover { color: #0f172a; background: rgba(100, 116, 139, 0.1); }
    .collapse svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
    }

    .restore {
      display: grid;
      width: 30px;
      height: 52px;
      margin-right: -18px;
      place-items: center;
      border: 1px solid rgba(255, 255, 255, 0.72);
      border-right: 0;
      border-radius: 12px 0 0 12px;
      color: #2563eb;
      background: rgba(250, 252, 255, 0.9);
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
      backdrop-filter: blur(14px);
      transition: width 150ms ease, background 150ms ease;
    }

    .restore:hover { width: 36px; background: #fff; }

    button:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    @media (prefers-color-scheme: dark) {
      .panel, .restore {
        border-color: rgba(148, 163, 184, 0.2);
        background: rgba(15, 23, 42, 0.9);
        box-shadow: 0 14px 38px rgba(0, 0, 0, 0.38);
      }
      .action { color: #cbd5e1; }
      .action:hover { color: #93c5fd; background: rgba(59, 130, 246, 0.16); }
      .collapse { color: #94a3b8; }
      .collapse:hover { color: #f8fafc; background: rgba(148, 163, 184, 0.12); }
      .restore { color: #93c5fd; }
      .restore:hover { background: #111c30; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { transition: none !important; }
    }
  `;

  function icon(path) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
  }

  function mountToolbar(doc, actions) {
    const mounted = mountedHosts.get(doc);
    if (mounted?.isConnected) return mounted;

    const host = doc.createElement('div');
    let hostId = HOST_ID;
    let suffix = 1;
    while (doc.getElementById(hostId)) {
      hostId = `${HOST_ID}-${suffix}`;
      suffix += 1;
    }
    host.id = hostId;
    const root = host.attachShadow({ mode: 'open' });

    const actionMarkup = buttons.map(({ action, label, icon: iconPath }) => `
      <button class="action" type="button" data-action="${action}" data-label="${label}" aria-label="${label}">
        ${icon(iconPath)}
      </button>
    `).join('');

    root.innerHTML = `
      <style>${styles}</style>
      <nav class="panel" data-panel role="toolbar" aria-label="页面导航">
        ${actionMarkup}
        <div class="divider" aria-hidden="true"></div>
        <button class="collapse" type="button" data-collapse aria-label="隐藏工具栏" title="隐藏工具栏">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7.5 7.5 9 9M16.5 7.5l-9 9"/></svg>
        </button>
      </nav>
      <button class="restore" type="button" data-restore aria-label="显示页面导航工具栏" title="显示工具栏" hidden>
        ${icon('<path d="m9 7 5 5-5 5"/>')}
      </button>
    `;

    for (const button of root.querySelectorAll('[data-action]')) {
      button.addEventListener('click', () => actions[button.dataset.action]());
    }

    const panel = root.querySelector('[data-panel]');
    const collapse = root.querySelector('[data-collapse]');
    const restore = root.querySelector('[data-restore]');

    collapse.addEventListener('click', () => {
      panel.hidden = true;
      restore.hidden = false;
      restore.focus();
    });

    restore.addEventListener('click', () => {
      restore.hidden = true;
      panel.hidden = false;
      collapse.focus();
    });

    (doc.body || doc.documentElement).append(host);
    mountedHosts.set(doc, host);
    return host;
  }

  const api = { HOST_ID, mountToolbar };
  globalScope.NavbarToolbar = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(globalThis);
