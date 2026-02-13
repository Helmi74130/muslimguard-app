/**
 * Reading Mode Scripts for MuslimGuard
 *
 * Phase 1 (BEFORE content loads): Inject CSS that immediately hides all media.
 *   The child never sees any image, video or ad - they are blocked before rendering.
 *
 * Phase 2 (AFTER content loads): Extract article text with Readability-inspired
 *   logic, then replace the DOM with a clean readable template.
 */

/**
 * Phase 1: Pre-load CSS blocker
 * Injected via injectedJavaScriptBeforeContentLoaded
 * Runs before any content renders - zero flash of images
 */
export const READING_MODE_PRELOAD_SCRIPT = `
(function() {
  // Phase 1: Block ALL media on EVERY site — no exceptions
  var style = document.createElement('style');
  style.id = 'muslimguard-preload-block';
  style.textContent = [
    'img, video, iframe, picture, figure, canvas, audio,',
    'object, embed, source {',
    '  display: none !important; visibility: hidden !important;',
    '  width: 0 !important; height: 0 !important;',
    '  overflow: hidden !important;',
    '}',
    '/* Hide Google search tabs (Images, Videos, News, Books, Tools, etc.) */',
    'div[role="navigation"] { display: none !important; }',
    'a[href*="tbm="], a[href*="udm="] { display: none !important; }',
    '#hdtb, #hdtbMenus, .hdtb-mitem, .MUFPAc, .T47uwc, .IUOThf {',
    '  display: none !important;',
    '}',
    '[jscontroller] > div > div > div > a[href*="/search"] {',
    '  display: none !important;',
    '}',
  ].join('\\n');
  (document.head || document.documentElement).appendChild(style);

  // Post-load: hide remaining Google filter elements by text/structure
  if (window.location.hostname.indexOf('google.') !== -1) {
    function hideGoogleFilters() {
      // Hide the entire search filter/tabs bar
      var selectors = [
        '#hdtb', '#hdtbMenus', '#hdtb-msb', '#hdtb-tls',
        '.nfdoRb', '.crJ18e', '.sBbkle',
      ];
      selectors.forEach(function(sel) {
        var els = document.querySelectorAll(sel);
        for (var i = 0; i < els.length; i++) {
          els[i].style.setProperty('display', 'none', 'important');
        }
      });

      // Hide any remaining links that look like search filter tabs
      var allLinks = document.querySelectorAll('a[href*="/search"]');
      for (var i = 0; i < allLinks.length; i++) {
        var link = allLinks[i];
        var text = (link.textContent || '').trim().toLowerCase();
        var filterTexts = ['images', 'vidéos', 'videos', 'actualités', 'news',
          'livres', 'books', 'shopping', 'maps', 'outils', 'tools', 'flights', 'finance'];
        for (var j = 0; j < filterTexts.length; j++) {
          if (text === filterTexts[j]) {
            // Hide the link and its parent container
            link.style.setProperty('display', 'none', 'important');
            if (link.parentElement && link.parentElement.tagName !== 'BODY') {
              link.parentElement.style.setProperty('display', 'none', 'important');
            }
            break;
          }
        }
      }

      // Hide "Outils de recherche" / "Search tools" button
      var allButtons = document.querySelectorAll('div, span, button, g-header-menu, g-scrolling-carousel');
      for (var i = 0; i < allButtons.length; i++) {
        var el = allButtons[i];
        var txt = (el.textContent || '').trim().toLowerCase();
        if (txt === 'outils de recherche' || txt === 'search tools' || txt === 'outils') {
          el.style.setProperty('display', 'none', 'important');
        }
      }
    }

    // Run immediately, then observe for dynamic changes
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', hideGoogleFilters);
    } else {
      hideGoogleFilters();
    }
    // Also run after short delay for dynamic content
    setTimeout(hideGoogleFilters, 500);
    setTimeout(hideGoogleFilters, 1500);

    // MutationObserver to catch late-loaded elements
    var obs = new MutationObserver(function() { hideGoogleFilters(); });
    var tryObserve = function() {
      if (document.body) {
        obs.observe(document.body, { childList: true, subtree: true });
      } else {
        setTimeout(tryObserve, 100);
      }
    };
    tryObserve();
    // Stop observing after 10s to save resources
    setTimeout(function() { obs.disconnect(); }, 10000);
  }
})();
true;
`;

/**
 * Phase 2: Full reading mode extraction & rendering
 * Injected via injectedJavaScript (runs after page load)
 */
export const READING_MODE_SCRIPT = `
(function() {
  'use strict';

  // Avoid running multiple times on the same URL
  var currentUrl = window.location.href;
  if (window.__muslimGuardReadingMode === currentUrl) return;
  window.__muslimGuardReadingMode = currentUrl;

  // Skip search engines and web apps
  var skipDomains = [
    'google.', 'bing.com', 'duckduckgo.com', 'yahoo.com', 'qwant.com',
    'youtube.com', 'youtu.be', 'twitter.com', 'x.com', 'facebook.com',
    'instagram.com', 'tiktok.com', 'reddit.com', 'whatsapp.com',
    'maps.google', 'mail.google', 'drive.google', 'docs.google',
    'translate.google', 'accounts.google',
  ];
  var host = (window.location.hostname || '').toLowerCase();
  var isSkipped = skipDomains.some(function(d) { return host.indexOf(d) !== -1; });
  if (isSkipped) return;

  // Wait a bit for dynamic content to render, then apply
  setTimeout(function() {
    try {
      applyReadingMode();
    } catch(e) {
      applyFallbackCSS();
    }
  }, 800);

  function applyReadingMode() {
    // Skip non-HTML pages
    if (!document.body) {
      return;
    }

    // Try to extract article content
    var title = getArticleTitle();
    var contentNode = findMainContent();

    if (contentNode) {
      var cleanContent = extractCleanContent(contentNode);
      var textOnly = cleanContent.replace(/<[^>]*>/g, '').trim();

      if (textOnly.length > 50) {
        renderCleanPage(title, cleanContent);
        return;
      }
    }

    // Fallback: just apply CSS to hide media
    applyFallbackCSS();
  }

  // ===================== TITLE =====================

  function getArticleTitle() {
    var selectors = [
      'h1.entry-title', 'h1.post-title', 'h1.article-title',
      'h1[itemprop="headline"]', 'article h1', 'main h1',
      '.post h1', '.article h1', '.content h1', 'h1'
    ];

    for (var i = 0; i < selectors.length; i++) {
      try {
        var el = document.querySelector(selectors[i]);
        if (el && el.textContent && el.textContent.trim().length > 3) {
          return el.textContent.trim();
        }
      } catch(e) {}
    }

    return document.title || '';
  }

  // ===================== FIND CONTENT =====================

  function findMainContent() {
    var selectors = [
      'article[role="main"]', '[role="main"] article', 'main article',
      'article', '[role="main"]', 'main',
      '.post-content', '.entry-content', '.article-content',
      '.article-body', '.post-body', '.story-body',
      '#article-body', '#post-content', '#content',
      '.content', '.post', '.article', '.story',
    ];

    for (var i = 0; i < selectors.length; i++) {
      try {
        var elements = document.querySelectorAll(selectors[i]);
        for (var j = 0; j < elements.length; j++) {
          var el = elements[j];
          var text = (el.textContent || '').trim();
          if (text.length > 100) {
            return el;
          }
        }
      } catch(e) {}
    }

    // Last resort: find the div with the most <p> text
    return findBestTextContainer();
  }

  function findBestTextContainer() {
    var candidates = document.querySelectorAll('div, section');
    var best = null;
    var bestScore = 0;

    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      var paragraphs = el.querySelectorAll('p');
      if (paragraphs.length < 2) continue;

      var textLen = 0;
      for (var j = 0; j < paragraphs.length; j++) {
        textLen += (paragraphs[j].textContent || '').trim().length;
      }

      var score = textLen + (paragraphs.length * 50);
      // Penalize huge containers (body-level wrappers)
      var divCount = el.querySelectorAll('div').length;
      if (divCount > 30) score *= 0.2;
      else if (divCount > 15) score *= 0.5;

      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    }

    // Also try body directly if nothing else works
    if (!best) {
      var bodyPs = document.querySelectorAll('body > p, body > div > p');
      if (bodyPs.length >= 2) {
        best = document.body;
      }
    }

    return best;
  }

  // ===================== EXTRACT & CLEAN =====================

  function extractCleanContent(node) {
    // Clone so we don't modify the original DOM (yet)
    var clone = node.cloneNode(true);

    // Remove unwanted elements
    var removeSelectors = [
      'script', 'style', 'link', 'meta', 'noscript',
      'nav', 'header', 'footer', 'aside',
      'iframe', 'video', 'audio', 'object', 'embed', 'applet',
      'img', 'picture', 'figure', 'figcaption', 'svg', 'canvas', 'source',
      'form', 'button', 'input', 'select', 'textarea',
      '[class*="comment"]', '[class*="sidebar"]', '[class*="widget"]',
      '[class*="social"]', '[class*="share"]', '[class*="related"]',
      '[class*="newsletter"]', '[class*="subscribe"]',
      '[class*="popup"]', '[class*="modal"]', '[class*="overlay"]',
      '[class*="cookie"]', '[class*="banner"]', '[class*="promo"]',
      '[class*="sponsor"]', '[class*="menu"]', '[class*="breadcrumb"]',
      '[id*="comment"]', '[id*="sidebar"]', '[id*="widget"]',
      '[id*="social"]', '[id*="share"]', '[id*="related"]',
      '[id*="ad-"]', '[id*="ad_"]', '[class*="ad-"]', '[class*="ad_"]',
      '[role="complementary"]', '[role="navigation"]', '[role="banner"]',
      '[aria-hidden="true"]'
    ];

    try {
      var unwanted = clone.querySelectorAll(removeSelectors.join(', '));
      for (var i = unwanted.length - 1; i >= 0; i--) {
        unwanted[i].parentNode && unwanted[i].parentNode.removeChild(unwanted[i]);
      }
    } catch(e) {}

    // Process remaining nodes: strip attributes, keep only text formatting
    var all = clone.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];

      // Strip all attributes except href on links
      var attrs = [];
      for (var j = 0; j < el.attributes.length; j++) {
        attrs.push(el.attributes[j].name);
      }
      for (var j = 0; j < attrs.length; j++) {
        if (!(el.tagName === 'A' && attrs[j] === 'href')) {
          el.removeAttribute(attrs[j]);
        }
      }
    }

    // Get the cleaned HTML
    var html = clone.innerHTML || '';

    // If the result has very little content, try getting textContent wrapped in <p> tags
    var textCheck = html.replace(/<[^>]*>/g, '').trim();
    if (textCheck.length < 50) {
      // Try just getting all <p> text from the original clone
      var paragraphs = clone.querySelectorAll('p');
      var pHtml = '';
      for (var i = 0; i < paragraphs.length; i++) {
        var pText = (paragraphs[i].textContent || '').trim();
        if (pText.length > 10) {
          pHtml += '<p>' + escapeHTML(pText) + '</p>';
        }
      }
      if (pHtml) return pHtml;
    }

    return html;
  }

  // ===================== RENDER =====================

  function renderCleanPage(title, content) {
    var css = getReaderCSS();

    // Replace body content (safer than document.open/write in WebView)
    // First, remove all stylesheets and styles
    var oldStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
    for (var i = 0; i < oldStyles.length; i++) {
      oldStyles[i].parentNode && oldStyles[i].parentNode.removeChild(oldStyles[i]);
    }

    // Add our clean stylesheet
    var styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // Set viewport
    var viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');

    // TTS controls HTML (always rendered, uses unicode icons instead of SVG)
    var ttsHtml =
      '<div class="tts-bar">' +
        '<button class="tts-btn tts-play" id="tts-play" aria-label="Lire">' +
          '<span class="tts-icon-play">&#9654;</span>' +
          '<span class="tts-icon-pause" style="display:none;">&#10074;&#10074;</span>' +
        '</button>' +
        '<button class="tts-btn tts-stop" id="tts-stop" aria-label="Stop">&#9632;</button>' +
        '<div class="tts-progress" id="tts-progress">' +
          '<div class="tts-progress-bar" id="tts-progress-bar"></div>' +
        '</div>' +
        '<button class="tts-btn tts-speed" id="tts-speed">1x</button>' +
      '</div>';

    // Replace body
    document.body.innerHTML =
      '<div class="reader-container">' +
        '<div class="reader-badge">Mode Lecture</div>' +
        '<h1 class="reader-title">' + escapeHTML(title) + '</h1>' +
        ttsHtml +
        '<hr class="reader-divider">' +
        '<div class="reader-content">' + content + '</div>' +
      '</div>';

    // Reset body attributes
    document.body.className = '';
    document.body.setAttribute('style', '');

    // Scroll to top
    window.scrollTo(0, 0);

    // Initialize TTS
    initTTS(content);
  }

  function getReaderCSS() {
    return [
      '*, *::before, *::after { box-sizing: border-box; }',
      'html { font-size: 18px; -webkit-text-size-adjust: 100%; }',
      'body {',
      '  margin: 0; padding: 20px 16px 60px;',
      '  background-color: #FFF8F0 !important;',
      '  color: #2c2c2c !important;',
      '  font-family: Georgia, "Times New Roman", serif !important;',
      '  line-height: 1.8 !important;',
      '  -webkit-font-smoothing: antialiased;',
      '}',
      '.reader-container { max-width: 680px; margin: 0 auto; }',
      '.reader-badge {',
      '  display: inline-block; background: #003463; color: #fff;',
      '  font-family: -apple-system, sans-serif; font-size: 11px;',
      '  font-weight: 600; padding: 4px 12px; border-radius: 20px;',
      '  margin-bottom: 16px; letter-spacing: 0.5px; text-transform: uppercase;',
      '}',
      '.reader-title {',
      '  font-size: 1.6rem !important; font-weight: 700 !important;',
      '  color: #1a1a1a !important; line-height: 1.3 !important;',
      '  margin: 0 0 12px 0 !important; padding: 0 !important;',
      '  font-family: Georgia, "Times New Roman", serif !important;',
      '}',
      '.reader-divider {',
      '  border: none; border-top: 2px solid #003463;',
      '  width: 60px; margin: 16px 0 24px; padding: 0;',
      '}',
      '.reader-content p {',
      '  margin: 0 0 1.2em 0 !important; padding: 0 !important;',
      '  text-align: justify; color: #2c2c2c !important;',
      '  font-size: 1rem !important; line-height: 1.8 !important;',
      '  font-family: Georgia, "Times New Roman", serif !important;',
      '}',
      '.reader-content h2, .reader-content h3, .reader-content h4, .reader-content h5, .reader-content h6 {',
      '  font-weight: 700 !important; color: #1a1a1a !important;',
      '  margin: 1.5em 0 0.5em 0 !important; padding: 0 !important;',
      '  font-family: Georgia, "Times New Roman", serif !important;',
      '}',
      '.reader-content h2 { font-size: 1.35rem !important; }',
      '.reader-content h3 { font-size: 1.2rem !important; }',
      '.reader-content h4, .reader-content h5, .reader-content h6 { font-size: 1.1rem !important; }',
      '.reader-content a { color: #003463; text-decoration: none; border-bottom: 1px solid #003463; }',
      '.reader-content blockquote {',
      '  border-left: 3px solid #003463; padding: 0 0 0 16px !important;',
      '  margin: 1.2em 0 !important; color: #555; font-style: italic;',
      '}',
      '.reader-content ul, .reader-content ol { margin: 1em 0; padding-left: 1.5em; }',
      '.reader-content li { margin-bottom: 0.4em; }',
      '.reader-content pre, .reader-content code {',
      '  font-family: "Courier New", monospace; background: #f5f0e8;',
      '  padding: 2px 6px; border-radius: 3px; font-size: 0.9rem;',
      '}',
      '.reader-content pre { padding: 12px; overflow-x: auto; margin: 1em 0; }',
      '.reader-content table { width: 100%; border-collapse: collapse; margin: 1em 0; }',
      '.reader-content th, .reader-content td { border: 1px solid #ddd; padding: 8px; text-align: left; }',
      '.reader-content th { background: #f5f0e8; font-weight: 600; }',
      '.reader-content hr { border: none; border-top: 1px solid #e0d8cc; margin: 2em 0; }',
      '/* TTS controls */',
      '.tts-bar {',
      '  display: flex; align-items: center; gap: 10px;',
      '  background: #003463; border-radius: 12px;',
      '  padding: 8px 14px; margin: 12px 0 8px;',
      '}',
      '.tts-btn {',
      '  background: none; border: none; color: #fff;',
      '  cursor: pointer; padding: 4px; display: flex;',
      '  align-items: center; justify-content: center;',
      '  border-radius: 50%; width: 32px; height: 32px;',
      '  font-family: -apple-system, sans-serif;',
      '  font-size: 13px; font-weight: 600;',
      '  -webkit-tap-highlight-color: transparent;',
      '}',
      '.tts-btn:active { opacity: 0.7; }',
      '.tts-play { background: rgba(255,255,255,0.2); }',
      '.tts-stop { opacity: 0.7; }',
      '.tts-progress {',
      '  flex: 1; height: 4px; background: rgba(255,255,255,0.2);',
      '  border-radius: 2px; overflow: hidden;',
      '}',
      '.tts-progress-bar {',
      '  height: 100%; width: 0%; background: #fff;',
      '  border-radius: 2px; transition: width 0.3s ease;',
      '}',
      '.tts-speed {',
      '  min-width: 36px; font-size: 12px;',
      '  opacity: 0.85; letter-spacing: 0;',
      '}',
      '/* Safety net: block ALL media */',
      'img, video, iframe, picture, figure, svg, canvas, audio,',
      'object, embed, source {',
      '  display: none !important; width: 0 !important; height: 0 !important;',
      '  visibility: hidden !important; overflow: hidden !important;',
      '}',
    ].join('\\n');
  }

  // ===================== FALLBACK =====================

  function applyFallbackCSS() {
    // When extraction fails, just hide media and improve typography
    var existing = document.getElementById('muslimguard-reading-mode');
    if (existing) return;

    var style = document.createElement('style');
    style.id = 'muslimguard-reading-mode';
    style.textContent = [
      'img, video, iframe, picture, figure, svg:not([class*="icon"]),',
      'canvas, audio, object, embed, source,',
      '[class*="ad-"], [class*="ad_"], [id*="ad-"], [id*="ad_"],',
      '[class*="banner"], [class*="promo"], [class*="sponsor"],',
      '[class*="popup"], [class*="modal"], [class*="overlay"] {',
      '  display: none !important; visibility: hidden !important;',
      '  width: 0 !important; height: 0 !important; overflow: hidden !important;',
      '}',
      'body {',
      '  background-color: #FFF8F0 !important;',
      '  font-family: Georgia, "Times New Roman", serif !important;',
      '  line-height: 1.8 !important;',
      '}',
      'p, li, td, th, dd, dt {',
      '  font-family: Georgia, "Times New Roman", serif !important;',
      '  line-height: 1.8 !important;',
      '}',
    ].join('\\n');
    document.head.appendChild(style);
  }

  // ===================== TTS =====================

  function initTTS(htmlContent) {
    var plainText = decodeEntities(htmlContent.replace(/<[^>]*>/g, ' ')).replace(/\\s+/g, ' ').trim();
    if (!plainText || plainText.length < 10) return;

    var speeds = [0.8, 1, 1.2];
    var speedIndex = 1;
    var isPlaying = false;

    var playBtn = document.getElementById('tts-play');
    var stopBtn = document.getElementById('tts-stop');
    var speedBtn = document.getElementById('tts-speed');
    var progressBar = document.getElementById('tts-progress-bar');
    var iconPlay = playBtn ? playBtn.querySelector('.tts-icon-play') : null;
    var iconPause = playBtn ? playBtn.querySelector('.tts-icon-pause') : null;
    if (!playBtn || !stopBtn || !speedBtn || !progressBar) return;

    var rn = window.ReactNativeWebView;
    if (!rn) return;

    // Send text to React Native on init
    rn.postMessage(JSON.stringify({ type: 'tts-init', text: plainText }));

    function showPlayIcon() {
      if (iconPlay) iconPlay.style.display = '';
      if (iconPause) iconPause.style.display = 'none';
    }

    function showPauseIcon() {
      if (iconPlay) iconPlay.style.display = 'none';
      if (iconPause) iconPause.style.display = '';
    }

    // Listen for progress updates from React Native
    window.__ttsUpdateProgress = function(pct) {
      progressBar.style.width = Math.min(pct, 100) + '%';
    };
    window.__ttsOnDone = function() {
      isPlaying = false;
      showPlayIcon();
      progressBar.style.width = '100%';
    };
    window.__ttsOnStop = function() {
      isPlaying = false;
      showPlayIcon();
      progressBar.style.width = '0%';
    };

    playBtn.addEventListener('click', function() {
      if (isPlaying) {
        isPlaying = false;
        showPlayIcon();
        rn.postMessage(JSON.stringify({ type: 'tts-stop' }));
      } else {
        isPlaying = true;
        showPauseIcon();
        rn.postMessage(JSON.stringify({ type: 'tts-play', rate: speeds[speedIndex] }));
      }
    });

    stopBtn.addEventListener('click', function() {
      isPlaying = false;
      showPlayIcon();
      progressBar.style.width = '0%';
      rn.postMessage(JSON.stringify({ type: 'tts-stop' }));
    });

    speedBtn.addEventListener('click', function() {
      speedIndex = (speedIndex + 1) % speeds.length;
      speedBtn.textContent = speeds[speedIndex] + 'x';
      if (isPlaying) {
        rn.postMessage(JSON.stringify({ type: 'tts-play', rate: speeds[speedIndex] }));
      }
    });
  }

  // ===================== UTILS =====================

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function decodeEntities(str) {
    if (!str) return '';
    // Use a temporary element to decode all HTML entities
    var tmp = document.createElement('textarea');
    tmp.innerHTML = str;
    return tmp.value;
  }
})();
true;
`;
