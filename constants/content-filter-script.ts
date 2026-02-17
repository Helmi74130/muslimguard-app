/**
 * Content Filter Script for MuslimGuard
 * Generates JavaScript to inject into WebView for page content scanning.
 * Two modes:
 *   - 'block': blocks the entire page if a keyword is found in content
 *   - 'blur': blurs text passages containing blocked keywords
 *
 * Uses word-boundary regex (\b) at the start of each keyword to avoid
 * false positives (e.g. "sex" won't match "essex").
 */

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate the content filter injection script
 * @param keywords - Array of blocked keywords
 * @param mode - 'block' to block entire page, 'blur' to blur matching content
 * @returns JavaScript string to inject into WebView
 */
export function generateContentFilterScript(
  keywords: string[],
  mode: 'block' | 'blur'
): string {
  if (keywords.length === 0) return 'true;';

  // Escape special regex characters in each keyword
  const escaped = keywords.map(escapeRegex);

  // Build regex pattern: word boundary at start to avoid false positives
  // \bsex matches "sex", "sexual" but NOT "essex"
  // \bbet matches "bet", "betting" but NOT "alphabet"
  const patternSource = '\\b(?:' + escaped.join('|') + ')';
  const patternJson = JSON.stringify(patternSource);
  const modeJson = JSON.stringify(mode);

  return `
(function() {
  'use strict';

  // Avoid running multiple times on same page
  if (window.__muslimGuardContentFilter) return;
  window.__muslimGuardContentFilter = true;

  // Only skip Google utility apps where content filtering is not useful
  var skipDomains = [
    'maps.google', 'mail.google', 'drive.google', 'docs.google',
    'translate.google', 'accounts.google', 'play.google',
    'whatsapp.com', 'whatsapp.net'
  ];
  var host = (window.location.hostname || '').toLowerCase();
  if (skipDomains.some(function(d) { return host.indexOf(d) !== -1; })) return;

  var PATTERN = new RegExp(${patternJson}, 'gi');
  var MODE = ${modeJson};
  var rn = window.ReactNativeWebView;
  var processedNodes = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
  var scanTimer = null;
  var alreadyBlocked = false;

  // ==================== BLOCK MODE ====================

  function scanForBlock() {
    if (alreadyBlocked) return;
    var bodyText = (document.body && document.body.innerText) || '';
    PATTERN.lastIndex = 0;
    var match = PATTERN.exec(bodyText);
    if (match && rn) {
      alreadyBlocked = true;
      rn.postMessage(JSON.stringify({
        type: 'content-blocked',
        keyword: match[0]
      }));
    }
  }

  // ==================== BLUR MODE ====================

  function scanForBlur() {
    if (!document.body) return;

    var walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    var node;
    while (node = walker.nextNode()) {
      var parent = node.parentElement;
      if (!parent) continue;

      // Skip already processed
      if (processedNodes && processedNodes.has(parent)) continue;
      if (parent.getAttribute('data-mg-filtered')) continue;

      // Skip script/style/invisible elements
      var tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' ||
          tag === 'INPUT' || tag === 'TEXTAREA') continue;

      var text = node.textContent || '';
      if (text.trim().length < 3) continue;

      PATTERN.lastIndex = 0;
      if (PATTERN.test(text)) {
        if (processedNodes) processedNodes.add(parent);
        parent.setAttribute('data-mg-filtered', 'true');
        parent.style.setProperty('filter', 'blur(8px)', 'important');
        parent.style.setProperty('user-select', 'none', 'important');
        parent.style.setProperty('-webkit-user-select', 'none', 'important');
        parent.style.setProperty('pointer-events', 'none', 'important');
      }
    }
  }

  // ==================== SCAN CONTROLLER ====================

  function scan() {
    if (MODE === 'block') {
      scanForBlock();
    } else {
      scanForBlur();
    }
  }

  // Debounced scan for MutationObserver
  function debouncedScan() {
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 300);
  }

  // Initial scan after page settles
  setTimeout(scan, 800);

  // Watch for dynamic content changes (SPAs, lazy loading)
  if (document.body) {
    var observer = new MutationObserver(debouncedScan);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    // Stop observing after 30s to save battery
    setTimeout(function() { observer.disconnect(); }, 30000);
  }
})();
true;
`;
}
