/**
 * DWAO Accessibility Widget v1.0.0
 *
 * Integration:
 *   1. Add <div class="accessibility-div"><button id="accessibilityToggleBtn"></button></div>
 *   2. Add <script src="dwao-a11y-widget.js" data-position="bottom-left"></script>
 *   The button content (icon + label) is auto-populated by the widget.
 */
/**
 * DWAO Accessibility Widget v2.0.0
 *
 * Integration:
 *   1. Add <div class="accessibility-div"><button id="accessibilityToggleBtn"></button></div>
 *   2. Add <script src="acc.js" data-position="bottom-left"></script>
 *   The button content (icon + label) is auto-populated by the widget.
 */
(function () {
  "use strict";

  // ── Version ────────────────────────────────────────────
  var VERSION = "2.0.0";

  // ── Config from data-* attributes on our script tag ────
  var _scriptTag =
    document.currentScript ||
    (function () {
      var s = document.getElementsByTagName("script");
      return s[s.length - 1];
    })();
  var CONFIG = {
    position: _scriptTag.getAttribute("data-position") || "bottom-left",
    theme: _scriptTag.getAttribute("data-theme") || "pnb",
    brandColor: _scriptTag.getAttribute("data-brand-color") || "",
    lang: _scriptTag.getAttribute("data-lang") || "en",
  };
  var THEME_COLORS = {
    purple: "#663db3",
    blue: "#0073BB",
    green: "#00875A",
    pnb: "#007abc",
  };
  var BRAND = CONFIG.brandColor || THEME_COLORS[CONFIG.theme] || "#007abc";

  // ── Inline SVG Icons (24x24, no external dependencies) ─
  var ICONS = {
    blindness:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    visuallyImpaired:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
    cognitive:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/></svg>',
    epilepsy:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    dyslexia:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>',
    adhd: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    textSize:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
    hideShowImg:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    lineSpacing:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="11" y1="6" x2="21" y2="6"/><line x1="11" y1="12" x2="21" y2="12"/><line x1="11" y1="18" x2="21" y2="18"/><polyline points="4 9 7 6 4 3"/><polyline points="4 15 7 18 4 21"/></svg>',
    letterSpacing:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M7 20l5-16 5 16M8.5 14h7"/><line x1="2" y1="22" x2="2" y2="2"/><line x1="22" y1="22" x2="22" y2="2"/></svg>',
    textZoom:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/></svg>',
    imageDesc:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="18" x2="13" y2="18"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 9 17"/></svg>',
    skipLink:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="17 11 12 6 7 11"/><line x1="12" y1="6" x2="12" y2="18"/></svg>',
    pauseMedia:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
    textAlign:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>',
    highContrast:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor"/></svg>',
    invertColors:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
    grayscale:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>',
    lowSaturation:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    readingLine:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" viewBox="0 0 24 24"><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="12" x2="21" y2="12" stroke-width="2.5"/><line x1="3" y1="16" x2="21" y2="16"/></svg>',
    highlightLinks:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    bigCursor:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 4l7 18 2.5-7.5L21 12z" fill="currentColor" stroke="currentColor"/></svg>',
    enlargeButtons:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>',
    readPage:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
    pageStructure:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    virtualKeyboard:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="8" x2="6.01" y2="8"/><line x1="10" y1="8" x2="10.01" y2="8"/><line x1="14" y1="8" x2="14.01" y2="8"/><line x1="18" y1="8" x2="18.01" y2="8"/><line x1="6" y1="12" x2="6.01" y2="12"/><line x1="10" y1="12" x2="10.01" y2="12"/><line x1="14" y1="12" x2="14.01" y2="12"/><line x1="18" y1="12" x2="18.01" y2="12"/><line x1="8" y1="16" x2="16" y2="16"/></svg>',
    chevronDown:
      '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>',
    close:
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    reset:
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
  };

  // Helper: create inline SVG element from string
  function svgIcon(key) {
    var div = document.createElement("div");
    div.innerHTML = ICONS[key] || "";
    div.style.display = "inline-flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.width = "24px";
    div.style.height = "24px";
    div.style.color = BRAND;
    div.className = "dwao-icon";
    return div;
  }

  // ── Utility: Create element ────────────────────────────
  function createEl(tag, attrs, children) {
    attrs = attrs || {};
    children = children || [];
    var el = document.createElement(tag);
    Object.keys(attrs).forEach(function (key) {
      if (key === "class") el.className = attrs[key];
      else if (key === "innerHTML") el.innerHTML = attrs[key];
      else el.setAttribute(key, attrs[key]);
    });
    children.forEach(function (child) {
      if (child) el.appendChild(child);
    });
    return el;
  }

  // ── State Variables ────────────────────────────────────
  var pageStructureBuilt = false;
  var linkLoaded = false;
  var imagesHidden = false;
  var speech,
    readingLineOn = false;
  var skipLinkEnabled = false;
  var mediaPaused = false;
  var fontSizeLevel = 0;
  var altShownInner = false;
  var altSpansCreated = false;
  var visuallyImpairedOn = false;
  var singleLetterSpacingToggled = false;
  var singleLineSpacingToggled = false;
  var fontSizeInitialized = false;
  var typoInitialized = false;
  var textAlignInitialized = false;

  var fontSizeClasses = [
    "dwas-fs-level-1",
    "dwas-fs-level-2",
    "dwas-fs-level-3",
  ];
  var letterSpacingClasses = [
    "dwas-ls-level-1",
    "dwas-ls-level-2",
    "dwas-ls-level-3",
  ];
  var lineHeightClasses = [
    "dwas-lh-level-1",
    "dwas-lh-level-2",
    "dwas-lh-level-3",
  ];
  var textAlignClasses = [
    "dwas-ta-level-1",
    "dwas-ta-level-2",
    "dwas-ta-level-3",
  ];
  var typographyElements = "h1, h2, h3, h4, h5, h6, p, span, sup";
  var synth = window.speechSynthesis;

  // ── CSS Styles ─────────────────────────────────────────
  var css =
    "\n" +
    "/* ── DWAO Accessibility Widget v" +
    VERSION +
    " ── */\n" +
    ".accessibility-div { position: fixed !important; z-index: 9999; pointer-events: none; }\n" +
    ".accessibility-div * { pointer-events: auto; }\n" +
    "#accessibilityToggleBtn {\n" +
    "  position: fixed !important; z-index: 9999;\n" +
    "  background: " +
    BRAND +
    "; color: #fff;\n" +
    "  padding: 10px 16px; border: none; border-radius: 5px;\n" +
    "  cursor: pointer; font-family: inherit; font-size: 14px;\n" +
    "  display: flex; align-items: center; gap: 6px;\n" +
    "}\n" +
    "#accessibilityToggleBtn .dwao-icon { color: #fff; }\n" +
    ".accessibility-panel, #pageList {\n" +
    "  display: none; flex-direction: column; align-items: flex-start;\n" +
    "  gap: 32px; padding: 24px 20px; background: #f9f9f9;\n" +
    '  border-radius: 12px; font-family: "Inter", Helvetica, Arial, sans-serif;\n' +
    "  font-size: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.3);\n" +
    "  z-index: 9998; position: fixed !important;\n" +
    "  width: 400px; max-height: 90vh; overflow-y: auto;\n" +
    "  width: 430px !important; max-width: calc(100vw - 24px) !important; box-sizing: border-box !important;\n" +
    "}\n" +
    "#pageList {\n" +
    "  align-items: flex-start; right: 0; top: 0; height: 82vh;\n" +
    "  overflow-y: auto; width: 400px; position: absolute; bottom: 50px;\n" +
    "  background: #f9f9f9; border-radius: 12px; padding-right: 8px;\n" +
    '  font-family: "Inter", sans-serif; font-size: 12px;\n' +
    "  box-shadow: 0 4px 16px rgba(0,0,0,0.3); z-index: 9998; display: none;\n" +
    "  scrollbar-width: thin; scrollbar-color: #0073BB #f1f1f1; overscroll-behavior: contain;\n" +
    "}\n" +
    "#pageList::-webkit-scrollbar { width: 3px; }\n" +
    "#pageList::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }\n" +
    "#pageList::-webkit-scrollbar-thumb { background: #0073BB; border-radius: 3px; }\n" +
    "#pageList::-webkit-scrollbar-thumb:hover { background: #005999; }\n" +
    "@media (max-width: 768px) {\n" +
    "  .accessibility-panel, #pageList {\n" +
    "    width: auto; left: 12px; right: 12px;\n" +
    "    padding: 16px; font-size: 11px; gap: 20px;\n" +
    "    max-height: 82vh; border-radius: 10px;\n" +
    "  }\n" +
    "}\n" +
    ".accessibility-panel button {\n" +
    "  background: none !important; border: none; box-shadow: none;\n" +
    "  padding: 0; margin: 0; cursor: pointer;\n" +
    "}\n" +
    ".panel-header { display: flex; align-items: center; justify-content: space-between; width: 100%; }\n" +
    ".panel-header h1 { font-size: 24px; font-weight: 500; color: #111; line-height: 28.8px; }\n" +
    ".close-btn-acc {\n" +
    "  background: none; border: none; cursor: pointer;\n" +
    "  padding: 0; width: 24px; height: 24px;\n" +
    "  color: #111; transition: color 0.2s ease;\n" +
    "}\n" +
    ".close-btn-acc:hover { color: " +
    BRAND +
    "; }\n" +
    ".panel-content { display: flex; flex-direction: column; align-items: flex-start; gap: 24px; width: 100%; }\n" +
    ".reset-all-acc {\n" +
    "  align-self: flex-end; font-weight: 500;\n" +
    "  color: " +
    BRAND +
    "; font-size: 16px;\n" +
    "  cursor: pointer; transition: color 0.2s ease;\n" +
    "  display: flex; align-items: center; gap: 4px;\n" +
    "}\n" +
    ".reset-all-acc .dwao-icon { color: " +
    BRAND +
    "; width: 20px; height: 20px; }\n" +
    ".scroll-area { position: relative; width: 100%; max-height: calc(100vh - 200px); overflow-y: auto; padding-right: 8px; }\n" +
    ".scroll-area::-webkit-scrollbar { width: 3px; }\n" +
    ".scroll-area::-webkit-scrollbar-track { background: #e9e6e6; }\n" +
    ".scroll-area::-webkit-scrollbar-thumb { background: " +
    BRAND +
    "; border-radius: 2px; }\n" +
    ".accordion-container-acces { display: flex; flex-direction: column; gap: 20px; width: 100%; }\n" +
    "@media (max-width: 768px) { .accordion-container-acces { width: 100%; } }\n" +
    ".accordion-item-acces {\n" +
    "  width: 100%; border: 1px solid rgba(17,17,17,0.2);\n" +
    "  border-radius: 10px; padding: 20px 16px; background: white;\n" +
    "  box-sizing: border-box !important;\n" +
    "}\n" +
    "@media (max-width: 768px) { .accordion-item-acces { width: 100%; padding: 14px 12px; } }\n" +
    ".accordion-trigger {\n" +
    "  display: flex; align-items: center; justify-content: space-between;\n" +
    "  width: 100%; background: none; border: none;\n" +
    "  cursor: pointer; font-size: 18px; font-weight: 400;\n" +
    "  color: " +
    BRAND +
    "; padding: 0; transition: color 0.2s ease;\n" +
    "}\n" +
    ".accordion-trigger:hover { color: " +
    BRAND +
    "; }\n" +
    ".accordion-icon { transition: transform 0.2s ease; color: #111; }\n" +
    ".accordion-item-acces.active .accordion-icon { transform: rotate(180deg); }\n" +
    ".accordion-content {\n" +
    "  max-height: 0; overflow: hidden;\n" +
    "  transition: max-height 0.3s cubic-bezier(0.4,0,0.2,1), padding-top 0.3s cubic-bezier(0.4,0,0.2,1);\n" +
    "  padding-top: 0;\n" +
    "}\n" +
    ".accordion-item-acces.active .accordion-content { max-height: 500px; padding-top: 24px; }\n" +
    ".options-grid { display: grid ; grid-template-columns: repeat(3, 1fr) ; gap: 12px ; width: 100% ; }\n" +
    ".options-row { display: contents  }\n" +
    ".option-card {\n" +
    "  display: flex; flex-direction: column; align-items: center;\n" +
    "  justify-content: center; gap: 8px; padding: 12px 8px;\n" +
    "  flex: 1; height: 98px; background: white;\n" +
    "  border: 1px solid rgba(17,17,17,0.2); border-radius: 12px;\n" +
    "  cursor: pointer; transition: all 0.2s cubic-bezier(0.4,0,0.2,1);\n" +
    "  position: relative; width: 100%; min-width: 0; box-sizing: border-box;\n" +
    "}\n" +
    "@media (max-width: 768px) {\n" +
    "  .option-card { height: 88px; padding: 10px 6px; }\n" +
    "  .option-card.virtual-keyboard { display: none; }\n" +
    '  .option-card[datakey="bigCursor"] { pointer-events: none; }\n' +
    "  .option-label { font-size: 12px; max-width: 100%; line-height: 14px; }\n" +
    "  .accordion-content .options-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }\n" +
    "}\n" +
    ".option-card:hover {\n" +
    "  border-color: " +
    BRAND +
    ";\n" +
    "  box-shadow: 0 2px 8px rgba(102,61,179,0.1);\n" +
    "  transform: translateY(-1px);\n" +
    "}\n" +
    ".option-card.active {\n" +
    "  border-color: " +
    BRAND +
    "; background-color: " +
    BRAND +
    ";\n" +
    "  box-shadow: 0 2px 8px rgba(102,61,179,0.1); transform: translateY(-1px);\n" +
    "}\n" +
    ".option-card.active .option-label { color: #fff; }\n" +
    ".option-card.active .dwao-icon { color: #fff; }\n" +
    ".option-card.active svg { color: #fff; stroke: #fff; fill: none; }\n" +
    ".option-card.empty { display: none; }\n" +
    ".option-card.empty:hover { border-color: rgba(17,17,17,0.2); box-shadow: none; transform: none; }\n" +
    ".option-card::before { background: linear-gradient(135deg, #00b29b, #0069f5); }\n" +
    ".option-label {\n" +
    "  font-size: 14px; font-weight: 400; color: #111;\n" +
    "  text-align: center; line-height: 16.8px; max-width: 80px;\n" +
    "}\n" +
    ".option-label.multiline { line-height: 16.8px; }\n" +
    ".option-steps {\n" +
    "  list-style: none; padding: 0; margin: 0;\n" +
    "  display: flex; gap: 6px; justify-content: flex-start;\n" +
    "}\n" +
    ".option-steps li {\n" +
    "  width: 8px; height: 8px; border-radius: 50%;\n" +
    "  background-color: #ccc; transition: background-color 0.3s ease;\n" +
    "}\n" +
    ".option-steps li.active { background-color: #000; }\n" +
    ".option-card.active .option-steps li.active { background-color: #fff; }\n" +
    ".option-card:focus, .close-btn-acc:focus { outline: 2px solid " +
    BRAND +
    "; outline-offset: 2px; }\n" +
    ".card-content { padding: 24px 20px 20px; display: flex; flex-direction: column; gap: 16px; }\n" +
    ".as-card-content { padding: 0; margin: 0; list-style: none; }\n" +
    ".as-card-content li {\n" +
    "  border-bottom: 1px solid " +
    BRAND +
    ";\n" +
    "  padding: 10px; list-style: none; cursor: pointer;\n" +
    "}\n" +
    ".as-card-content li:hover { background: rgba(0,0,0,0.05); }\n" +
    ".as-card-content li.h1 { padding-left: 10px; }\n" +
    ".as-card-content li.h2 { padding-left: 10px; }\n" +
    ".as-card-content li.h3 { padding-left: 10px; }\n" +
    ".as-card-content li.h4 { padding-left: 10px; }\n" +
    ".as-card-content li.h5 { padding-left: 10px; }\n" +
    ".as-card-content li.h6 { padding-left: 10px; }\n" +
    "#pageList .page-structure-header {\n" +
    "  font-size: 18px; margin: 0; padding: 16px;\n" +
    "  color: #fff; background: " +
    BRAND +
    ";\n" +
    "}\n" +
    "/* Color/contrast filters applied to <html> */\n" +
    ".high-contrast-vi { filter: saturate(3); }\n" +
    ".low-saturation-epilepsy { filter: saturate(0.5); }\n" +
    ".grayscale-new { filter: saturate(0); }\n" +
    "/* Keep the widget readable when filters are on */\n" +
    ".grayscale-new .accessibility-panel, .grayscale-new .accessibility-panel *,\n" +
    ".grayscale-new #pageList, .grayscale-new #pageList *,\n" +
    ".low-saturation-epilepsy .accessibility-panel, .low-saturation-epilepsy .accessibility-panel *,\n" +
    ".low-saturation-epilepsy #pageList, .low-saturation-epilepsy #pageList * {\n" +
    "  filter: none !important;\n" +
    "}\n" +
    ".big-cursor, .big-cursor * {\n" +
    '  cursor: url("data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path d="M4 4l7 18 2.5-7.5L21 12z" fill="black" stroke="white" stroke-width="1"/></svg>',
    ) +
    '"), auto !important;\n' +
    "}\n" +
    ".highlight-links a { outline: 2px dashed #f00 !important; background: #ffff99 !important; }\n" +
    ".skip-link { position: fixed; top: 0; left: 0; background: #000; color: #fff; padding: 8px; z-index: 10001; }\n" +
    '.big-buttons button, .big-buttons input[type="submit"], .big-buttons a { transform: scale(1.06); }\n' +
    ".disable-animation, .disable-animation * { animation: none !important; transition: none !important; }\n" +
    "#ariaAlertRegion { position: absolute; left: -9999px; top: auto; width: 1px; height: 1px; overflow: hidden; }\n" +
    "/* Class-based typography — single body class toggles all elements */\n" +
    "body.dwas-fs-level-1 .dwas-fs-init { font-size: calc(var(--dwas-orig-fs) * 1.10) !important; }\n" +
    "body.dwas-fs-level-2 .dwas-fs-init { font-size: calc(var(--dwas-orig-fs) * 1.20) !important; }\n" +
    "body.dwas-fs-level-3 .dwas-fs-init { font-size: calc(var(--dwas-orig-fs) * 1.30) !important; }\n" +
    "body.dwas-ls-level-1 .dwas-typo-init { letter-spacing: normal !important; }\n" +
    "body.dwas-ls-level-2 .dwas-typo-init { letter-spacing: 0.05em !important; }\n" +
    "body.dwas-ls-level-3 .dwas-typo-init { letter-spacing: 0.1em !important; }\n" +
    "body.dwas-lh-level-1 .dwas-typo-init { line-height: 1.4 !important; }\n" +
    "body.dwas-lh-level-2 .dwas-typo-init { line-height: 1.8 !important; }\n" +
    "body.dwas-lh-level-3 .dwas-typo-init { line-height: 2.2 !important; }\n" +
    "body.dwas-ta-level-1 .dwas-ta-init { text-align: left !important; }\n" +
    "body.dwas-ta-level-2 .dwas-ta-init { text-align: center !important; }\n" +
    "body.dwas-ta-level-3 .dwas-ta-init { text-align: right !important; }\n" +
    "body.dwas-cognitive-ls .dwas-typo-init { letter-spacing: 0.05em !important; }\n" +
    "body.dwas-cognitive-lh .dwas-typo-init { line-height: 1.8 !important; }\n" +
    ".dyslexia-font, .dyslexia-font h1, .dyslexia-font h2, .dyslexia-font h3,\n" +
    ".dyslexia-font h4, .dyslexia-font h5, .dyslexia-font h6, .dyslexia-font p,\n" +
    ".dyslexia-font li, .dyslexia-font span {\n" +
    "  font-family: 'Comic Sans MS', 'Trebuchet MS', sans-serif !important;\n" +
    "  letter-spacing: 0.5px !important; word-spacing: 0.5px !important;\n" +
    "}\n" +
    "/* Image description tooltip */\n" +
    ".img-alt-tooltip {\n" +
    "  position: fixed !important;\n" +
    "  background: rgba(15,23,42,0.98) !important;\n" +
    "  color: white !important; padding: 14px 18px !important;\n" +
    "  border-radius: 12px !important; font-size: 15px !important;\n" +
    "  max-width: 400px !important; min-width: 200px !important;\n" +
    "  word-wrap: break-word !important;\n" +
    "  box-shadow: 0 12px 40px rgba(0,0,0,0.5) !important;\n" +
    "  z-index: 10001 !important; opacity: 0 !important;\n" +
    "  transform: translateY(4px) !important;\n" +
    "  transition: opacity 0.2s ease-out, transform 0.2s ease-out !important;\n" +
    "  pointer-events: none !important;\n" +
    "  line-height: 1.5 !important; display: none;\n" +
    "}\n" +
    ".img-alt-tooltip.show { opacity: 1 !important; transform: translateY(0) !important; display: block !important; }\n" +
    "/* Screen reader popup */\n" +
    ".screen-reader-popup {\n" +
    "  position: fixed; bottom: 20px; right: 20px; max-width: 360px; width: 90%;\n" +
    "  background: #fff; border-radius: 12px; padding: 20px 24px;\n" +
    "  box-shadow: 0 5px 20px rgba(0,0,0,0.2); z-index: 9999;\n" +
    "  font-family: inherit; display: none;\n" +
    "}\n" +
    ".screen-reader-popup h4 { font-size: 18px; margin: 0 0 8px; color: " +
    BRAND +
    "; font-weight: 600; }\n" +
    ".screen-reader-popup p { font-size: 13px; margin: 0 0 12px; color: #444; }\n" +
    ".screen-reader-popup .close-popup {\n" +
    "  position: absolute; top: 6px; right: 14px;\n" +
    "  background: none; border: none; font-size: 20px;\n" +
    "  cursor: pointer; color: #666;\n" +
    "}\n" +
    ".screen-reader-popup label { display: block; margin-top: 10px; font-weight: 600; font-size: 13px; color: #222; }\n" +
    ".screen-reader-popup .voice-select {\n" +
    "  width: 100%; padding: 6px 8px; margin-top: 4px;\n" +
    "  border: 1px solid #ccd6e8; border-radius: 6px; font-size: 13px;\n" +
    "}\n" +
    '.screen-reader-popup input[type="range"] {\n' +
    "  width: 100%; margin-top: 4px; appearance: auto;\n" +
    "  cursor: default;\n" +
    "  color: light-dark(rgb(16, 16, 16), rgb(255, 255, 255));\n" +
    "  padding: initial;\n" +
    "  border: initial;\n" +
    "  margin: 2px; accent-color: " +
    BRAND +
    ";\n" +
    "}\n" +
    ".screen-reader-popup .reader-controls {\n" +
    "  margin-top: 16px; display: flex; gap: 8px;\n" +
    "}\n" +
    ".screen-reader-popup .reader-controls button {\n" +
    "  flex: 1; padding: 8px; font-size: 13px; border-radius: 6px;\n" +
    "  cursor: pointer; background: transparent; color: #333;\n" +
    "  font-weight: 500; border: 1px solid " +
    BRAND +
    ";\n" +
    "}\n" +
    ".screen-reader-popup .reader-controls button.primary {\n" +
    "  background: " +
    BRAND +
    "; color: #fff;\n" +
    "}\n" +
    ".speak-highlight {\n" +
    "  outline: 2px solid " +
    BRAND +
    " !important;\n" +
    "  background-color: rgba(102,61,179,0.1) !important;\n" +
    "}\n" +
    "/* ADHD reading line overlay */\n" +
    "#adhd-line-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; display: none; z-index: 9997; pointer-events: none; }\n" +
    "/* Magnifier lens */\n" +
    "#text-magnifier-lens {\n" +
    "  position: fixed; pointer-events: auto; z-index: 99999;\n" +
    "  min-width: 80px; max-width: 320px;\n" +
    "  background: rgba(255,255,255,0.98);\n" +
    "  box-shadow: 0 8px 32px rgba(0,0,0,0.22);\n" +
    "  border: 2.5px solid " +
    BRAND +
    ";\n" +
    "  display: none; font-size: 1.4em;\n" +
    "  padding: 15px 40px 15px 15px; color: #222;\n" +
    "  border-radius: 6px; line-height: 1.2;\n" +
    "}\n" +
    "/* Virtual keyboard */\n" +
    "#keyboardWrapper {\n" +
    "  position: fixed; bottom: 20px; left: 50%;\n" +
    "  transform: translateX(-50%); background: #f9f9f9;\n" +
    "  border: 2px solid #ccc; border-radius: 10px;\n" +
    "  box-shadow: 0 4px 12px rgba(0,0,0,0.2);\n" +
    "  padding: 20px; z-index: 1111111; max-width: 600px;\n" +
    "  width: 95%; display: none; cursor: move;\n" +
    "}\n" +
    ".virtual-key {\n" +
    "  margin: 4px; padding: 10px 14px; font-size: 14px;\n" +
    "  cursor: pointer; border: 1px solid #aaa;\n" +
    "  border-radius: 4px; background: #fff;\n" +
    "}\n" +
    "@media (max-width: 400px) {\n" +
    "  .accessibility-panel { left: 8px; right: 8px; padding: 12px; }\n" +
    "  .accordion-content .options-grid { gap: 8px; }\n" +
    "  .option-card { height: 80px; padding: 8px 4px; }\n" +
    "  .panel-header h1 { font-size: 18px; }\n" +
    "}\n" +
    "";

  var styleEl = createEl("style", { innerHTML: css });
  document.head.appendChild(styleEl);

  // ── Apply position from config ─────────────────────────
  var posCSS;
  switch (CONFIG.position) {
    case "bottom-right":
      posCSS =
        ".accessibility-div{bottom:0;right:0;} #accessibilityToggleBtn{bottom:10px;right:20px;} .accessibility-panel{bottom:50px;right:20px;}";
      break;
    case "top-left":
      posCSS =
        ".accessibility-div{top:0;left:0;} #accessibilityToggleBtn{top:10px;left:20px;} .accessibility-panel{top:50px;left:20px;}";
      break;
    case "top-right":
      posCSS =
        ".accessibility-div{top:0;right:0;} #accessibilityToggleBtn{top:10px;right:20px;} .accessibility-panel{top:50px;right:20px;}";
      break;
    case "bottom-left":
    default:
      posCSS =
        ".accessibility-div{bottom:0;left:0;} #accessibilityToggleBtn{bottom:10px;left:20px;} .accessibility-panel{bottom:50px;left:20px;}";
  }
  document.head.appendChild(createEl("style", { innerHTML: posCSS }));

  // ── Feature Action Map ─────────────────────────────────
  var optionActions = {
    Blindness: function () {
      toggleReadPage();
    },
    "Visually Impaired": function () {
      toggleHighContrast();
      // Find Text Size card + steps for visual sync
      var cards = document.querySelectorAll(".option-card");
      var textSizeCard = null;
      cards.forEach(function (c) {
        var lbl = c.querySelector(".option-label");
        if (lbl && lbl.textContent.trim() === "Text Size") textSizeCard = c;
      });
      var stepUl = document.querySelector(".font-size-steps");
      var lastStep = stepUl ? stepUl.querySelector("li:last-child") : null;

      if (visuallyImpairedOn) {
        resetFontSize();
        if (textSizeCard) textSizeCard.classList.remove("active");
        if (stepUl)
          stepUl.querySelectorAll("li").forEach(function (li) {
            li.classList.remove("active");
          });
      } else {
        applyVisuallyImpairedFont();
        if (textSizeCard) textSizeCard.classList.add("active");
        if (lastStep) {
          stepUl.querySelectorAll("li").forEach(function (li) {
            li.classList.remove("active");
          });
          lastStep.classList.add("active");
        }
      }
      visuallyImpairedOn = !visuallyImpairedOn;
    },
    Cognitive: function () {
      toggleSingleLineSpacing();
      toggleSingleLetterSpacing();
    },
    Epilepsy: function () {
      var html = document.documentElement;
      html.classList.toggle("disable-animation");
      if (html.style.filter === "saturate(0.5)") html.style.filter = "";
      else html.style.filter = "saturate(0.5)";
    },
    Dyslexia: function () {
      getDyslexiaFont();
    },
    ADHD: function () {
      toggleReadingLine();
      toggleImages();
    },
    "Text Size": function () {
      increaseFont();
    },
    "Hide/Show Img": function () {
      toggleImages();
    },
    "Line Spacing": function () {
      toggleLineHeight();
    },
    "Letter Spacing": function () {
      toggleLetterSpacing();
    },
    "Text Zoom": function () {
      toggleMagnifier();
    },
    "Enable Skip Link": function () {
      insertSkipLink();
    },
    "Pause Media": function () {
      pauseStopHideMedia();
    },
    "Text Alignment": function () {
      toggleTextAlign();
    },
    "High Contrast": function () {
      toggleHighContrast();
    },
    "Invert Colors": function () {
      toggleInvert();
    },
    Grayscale: function () {
      toggleGrayscale();
    },
    "Low Saturation": function () {
      toggleSaturation();
    },
    "Reading Line": function () {
      toggleReadingLine();
    },
    "Highlight Links": function () {
      toggleHighlightLinks();
    },
    "Big Cursor": function () {
      toggleBigCursor();
    },
    "Enlarge Buttons": function () {
      toggleEnlargeButtons();
    },
    "Read Page": function () {
      toggleReadPage();
    },
    "Virtual Keyboard": function () {
      toggleVirtualKeyboard();
    },
    "Page Structure": function () {
      getPageStructure();
    },
    "Image Description": function () {
      toggleAltText();
    },
  };

  // ── Section config ─────────────────────────────────────
  var accessibilitySections = [
    {
      id: "profile",
      title: "Profile",
      options: [
        {
          iconKey: "blindness",
          label: "Blindness",
          dataUniqueKey: "blindness",
        },
        {
          iconKey: "visuallyImpaired",
          label: "Visually Impaired",
          dataUniqueKey: "visually",
        },
        {
          iconKey: "cognitive",
          label: "Cognitive",
          dataUniqueKey: "cognitive",
        },
        { iconKey: "epilepsy", label: "Epilepsy", dataUniqueKey: "epilepsy" },
        { iconKey: "dyslexia", label: "Dyslexia", dataUniqueKey: "dyslexia" },
        { iconKey: "adhd", label: "ADHD", dataUniqueKey: "ADHD" },
      ],
    },
    {
      id: "content",
      title: "Content",
      options: [
        {
          iconKey: "textSize",
          label: "Text Size",
          dataUniqueKey: "textSize",
          variation: true,
          steps: 3,
          stepClass: "font-size-steps",
        },
        {
          iconKey: "hideShowImg",
          label: "Hide/Show Img",
          dataUniqueKey: "hideShow",
        },
        {
          iconKey: "lineSpacing",
          label: "Line Spacing",
          dataUniqueKey: "lineSpacing",
          variation: true,
          steps: 3,
          stepClass: "line-spacing-steps",
        },
        {
          iconKey: "letterSpacing",
          label: "Letter Spacing",
          dataUniqueKey: "letterSpacing",
          variation: true,
          steps: 3,
          stepClass: "letter-spacing-steps",
        },
        { iconKey: "textZoom", label: "Text Zoom", dataUniqueKey: "textZoom" },
        {
          iconKey: "imageDesc",
          label: "Image Description",
          dataUniqueKey: "imageDescription",
        },
        {
          iconKey: "skipLink",
          label: "Enable Skip Link",
          dataUniqueKey: "enableSkipLink",
        },
        {
          iconKey: "pauseMedia",
          label: "Pause Media",
          dataUniqueKey: "pauseMedia",
        },
        {
          iconKey: "textAlign",
          label: "Text Alignment",
          dataUniqueKey: "textAlignment",
          variation: true,
          steps: 3,
          stepClass: "text-toggle-steps",
        },
      ],
    },
    {
      id: "color",
      title: "Color & Contrast",
      options: [
        {
          iconKey: "highContrast",
          label: "High Contrast",
          dataUniqueKey: "highContrast",
          multiline: true,
        },
        {
          iconKey: "invertColors",
          label: "Invert Colors",
          dataUniqueKey: "invertColors",
          multiline: true,
        },
        {
          iconKey: "grayscale",
          label: "Grayscale",
          dataUniqueKey: "Grayscale",
        },
        {
          iconKey: "lowSaturation",
          label: "Low Saturation",
          dataUniqueKey: "lowSaturation",
          multiline: true,
        },
      ],
    },
    {
      id: "navigation",
      title: "Navigation",
      options: [
        {
          iconKey: "readingLine",
          label: "Reading Line",
          dataUniqueKey: "readingLine",
          multiline: true,
        },
        {
          iconKey: "highlightLinks",
          label: "Highlight Links",
          dataUniqueKey: "highlightLinks",
          multiline: true,
        },
        {
          iconKey: "bigCursor",
          label: "Big Cursor",
          dataUniqueKey: "bigCursor",
          multiline: true,
        },
        {
          iconKey: "enlargeButtons",
          label: "Enlarge Buttons",
          dataUniqueKey: "enlargeButtons",
        },
        { iconKey: "readPage", label: "Read Page", dataUniqueKey: "readPage" },
        {
          iconKey: "pageStructure",
          label: "Page Structure",
          dataUniqueKey: "pageStructure",
          cardClass: "page-structure",
        },
        {
          iconKey: "virtualKeyboard",
          label: "Virtual Keyboard",
          dataUniqueKey: "virtualKeyboard",
          cardClass: "virtual-keyboard",
        },
      ],
    },
  ];

  // ── Build UI Components ────────────────────────────────
  function createOptionCard(option) {
    var label = option.label || "";
    var labelHtml = option.multiline ? label.replace(/ /g, "<br>") : label;
    var card = createEl("div", {
      class: "option-card " + (option.cardClass || ""),
      datakey: option.dataUniqueKey || "",
    });

    card.appendChild(svgIcon(option.iconKey));
    card.appendChild(
      createEl("div", {
        class: option.multiline ? "option-label multiline" : "option-label",
        innerHTML: labelHtml,
      }),
    );

    if (option.variation && typeof option.steps === "number") {
      var ul = createEl("ul", {
        class: ("option-steps " + (option.stepClass || "")).trim(),
      });
      for (var i = 0; i < option.steps; i++) ul.appendChild(createEl("li"));
      card.appendChild(ul);
    }

    var action = optionActions[label] || function () {};
    card.onclick = function () {
      requestAnimationFrame(function () {
        action();
        if (option.dataUniqueKey === "blindness") {
          var p = document.querySelector(".accessibility-panel");
          var sr = document.querySelector(".screen-reader-popup");
          if (p) p.style.display = "none";
          if (sr) sr.style.display = "block";
        }
      });
    };
    return card;
  }

  function chunkArray(arr, size) {
    var result = [];
    for (var i = 0; i < arr.length; i += size)
      result.push(arr.slice(i, i + size));
    return result;
  }

  function createAccordionSection(section) {
    var chevron = svgIcon("chevronDown");
    chevron.className = "accordion-icon";
    chevron.style.width = "15px";
    chevron.style.height = "15px";
    chevron.style.color = "#111";

    var trigger = createEl(
      "button",
      { class: "accordion-trigger", "data-target": section.id },
      [createEl("span", { innerHTML: section.title }), chevron],
    );

    var content = createEl("div", {
      class: "accordion-content",
      id: section.id,
    });
    var grid = createEl("div", { class: "options-grid" });

    chunkArray(section.options, 3).forEach(function (row) {
      var rowEl = createEl("div", { class: "options-row" });
      row.forEach(function (opt) {
        rowEl.appendChild(createOptionCard(opt));
      });
      while (rowEl.children.length < 3)
        rowEl.appendChild(createEl("div", { class: "option-card empty" }));
      grid.appendChild(rowEl);
    });
    content.appendChild(grid);

    return createEl("div", { class: "accordion-item-acces" }, [
      trigger,
      content,
    ]);
  }

  // ── Build Panel ────────────────────────────────────────
  var panel = createEl("div", { class: "accessibility-panel" });
  var pageList = createEl("div", { id: "pageList" });
  pageList.style.display = "none";
  document.body.appendChild(pageList);

  var closeIcon = svgIcon("close");
  closeIcon.style.width = "20px";
  closeIcon.style.height = "20px";
  closeIcon.style.color = "#111";

  var header = createEl("div", { class: "panel-header" }, [
    createEl("h1", { innerHTML: "Accessibility" }),
    createEl(
      "button",
      { class: "close-btn-acc", "aria-label": "Close accessibility panel" },
      [closeIcon],
    ),
  ]);

  function buildAccessibilityPanel() {
    try {
      var resetIcon = svgIcon("reset");
      var reset = createEl("div", { class: "reset-all-acc" });
      reset.appendChild(resetIcon);
      reset.appendChild(createEl("span", { innerHTML: "Reset All" }));

      var scrollArea = createEl("div", { class: "scroll-area" });
      var container = createEl("div", { class: "accordion-container-acces" });
      accessibilitySections.forEach(function (section) {
        container.appendChild(createAccordionSection(section));
      });
      scrollArea.appendChild(container);

      var content = createEl("div", { class: "panel-content" }, [
        reset,
        scrollArea,
      ]);
      panel.appendChild(header);
      panel.appendChild(content);
      document.body.appendChild(panel);
    } catch (e) {}
  }

  // ── Build Screen Reader Popup ──────────────────────────
  function buildScreenReaderPanel() {
    var srPanel = createEl("div", {
      class: "screen-reader-popup",
      innerHTML:
        '<button class="close-popup">&times;</button>' +
        "<h4>Settings for the Screen Reader</h4>" +
        "<p>Hover over content to begin reading.</p>" +
        '<label>Voice:<select class="voice-select"></select></label>' +
        '<label>Volume:<input type="range" class="volume-slider" min="0" max="1" step="0.1" value="1"></label>' +
        '<label>Rate:<input type="range" class="rate-slider" min="0.5" max="2" step="0.1" value="1"></label>' +
        '<label>Pitch:<input type="range" class="pitch-slider" min="0" max="2" step="0.1" value="1"></label>' +
        '<div class="reader-controls">' +
        '<button class="btn-start primary">Start</button>' +
        '<button class="btn-pause">Pause</button>' +
        '<button class="btn-resume">Resume</button>' +
        '<button class="btn-stop">Stop</button>' +
        "</div>",
    });
    document.body.appendChild(srPanel);

    var voiceSelect = srPanel.querySelector(".voice-select");
    function populateVoices() {
      if (!synth) return;
      var voices = synth.getVoices();
      voiceSelect.innerHTML = "";
      var allowedLangs = ["en-US", "en-IN", "en-GB"];
      var filtered = voices.filter(function (v) {
        return allowedLangs.indexOf(v.lang) !== -1;
      });
      (filtered.length ? filtered : voices).forEach(function (v, i) {
        var opt = document.createElement("option");
        opt.value = i;
        opt.textContent = v.name + " (" + v.lang + ")";
        voiceSelect.appendChild(opt);
      });
      var idx = filtered.findIndex(function (v) {
        return v.lang === "en-IN";
      });
      voiceSelect.value = idx !== -1 ? idx : 0;
    }
    populateVoices();
    if (synth && synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = populateVoices;
    }
  }

  buildAccessibilityPanel();
  buildScreenReaderPanel();

  // ── Pre-init typography in idle time ───────────────────
  function preInitTypography() {
    initFontSizeElements();
    initTypoElements();
    initTextAlignElements();
  }
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(preInitTypography);
  } else {
    setTimeout(preInitTypography, 200);
  }

  // ── Toggle Button ──────────────────────────────────────
  var toggleBtn = document.getElementById("accessibilityToggleBtn");
  if (toggleBtn) {
    if (
      !toggleBtn.querySelector("svg") &&
      !toggleBtn.querySelector(".dwao-icon")
    ) {
      toggleBtn.innerHTML = "";
      var btnIcon = svgIcon("blindness");
      btnIcon.style.color = "#fff";
      btnIcon.style.width = "18px";
      btnIcon.style.height = "18px";
      toggleBtn.appendChild(btnIcon);
      var btnLabel = document.createElement("strong");
      btnLabel.textContent = "Accessibility";
      toggleBtn.appendChild(btnLabel);
    }
    toggleBtn.onclick = function () {
      var visible = panel.style.display === "block";
      panel.style.display = visible ? "none" : "block";
      if (!visible) {
        var sr = document.querySelector(".screen-reader-popup");
        if (sr) sr.style.display = "none";
      }
    };
  }

  // ── Click outside closes the panel ─────────────────────
  document.addEventListener("click", function (event) {
    if (!toggleBtn) return;
    var inside = panel.contains(event.target);
    var onBtn = toggleBtn.contains(event.target);
    if (panel.style.display === "block" && !inside && !onBtn) {
      panel.style.display = "none";
    }
  });

  // ── Automated WCAG remediations ────────────────────────
  // Each fix is idempotent and safe to re-run (used both on initial load
  // and via the MutationObserver below for content added after load).
  function autoLabelFields(root) {
    try {
      var scope = root || document;
      var nodes = [];
      if (scope.matches && scope.matches("input, textarea, select"))
        nodes.push(scope);
      if (scope.querySelectorAll)
        nodes = nodes.concat(
          Array.prototype.slice.call(
            scope.querySelectorAll("input, textarea, select"),
          ),
        );
      nodes.forEach(function (el) {
        if (!el.hasAttribute("aria-label") && el.name) {
          el.setAttribute("aria-label", el.name);
        }
      });
    } catch (e) {}
  }

  function fixIframeTitles(root) {
    try {
      var scope = root || document;
      var frames = [];
      if (scope.matches && scope.matches("iframe:not([title])"))
        frames.push(scope);
      if (scope.querySelectorAll)
        frames = frames.concat(
          Array.prototype.slice.call(
            scope.querySelectorAll("iframe:not([title])"),
          ),
        );
      frames.forEach(function (f) {
        var host = "";
        try {
          host = new URL(f.getAttribute("src") || "", location.href).hostname;
        } catch (e) {}
        f.setAttribute(
          "title",
          host ? "Embedded content from " + host : "Embedded content",
        );
      });
    } catch (e) {}
  }

  function unblockPasswordPaste(root) {
    try {
      var scope = root || document;
      var fields = [];
      if (scope.matches && scope.matches('input[type="password"]'))
        fields.push(scope);
      if (scope.querySelectorAll)
        fields = fields.concat(
          Array.prototype.slice.call(
            scope.querySelectorAll('input[type="password"]'),
          ),
        );
      fields.forEach(function (p) {
        var onpaste = p.getAttribute("onpaste");
        if (onpaste && /return\s*false/i.test(onpaste))
          p.removeAttribute("onpaste");
      });
    } catch (e) {}
  }

  function ensureSkipLink() {
    try {
      // Don't duplicate if a valid skip link (matching text + real target) already exists
      var already = false;
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        var href = a.getAttribute("href");
        if (!href || href === "#") return;
        var txt = (a.textContent || "").toLowerCase();
        if (
          /skip|jump|main content|to content/.test(txt) &&
          document.querySelector(href)
        ) {
          already = true;
        }
      });
      if (already) return;

      var target =
        document.querySelector("main, [role='main']") ||
        document.querySelector("h1") ||
        document.body;
      if (!target.id) target.id = "dwao-main-content";

      if (!document.getElementById("dwao-skip-link-style")) {
        document.head.appendChild(
          createEl("style", {
            id: "dwao-skip-link-style",
            innerHTML:
              ".dwao-skip-link{position:absolute;left:-9999px;top:0;background:#000;color:#fff;" +
              "padding:10px 16px;z-index:2147483647;border-radius:0 0 6px 0;font:14px/1.4 system-ui,sans-serif;" +
              "text-decoration:none}" +
              ".dwao-skip-link:focus{left:8px;top:8px;border-radius:6px}",
          }),
        );
      }

      var link = document.createElement("a");
      link.href = "#" + target.id;
      link.className = "dwao-skip-link";
      link.textContent = "Skip to main content";
      link.addEventListener("click", function (e) {
        e.preventDefault();
        target.setAttribute("tabindex", "-1");
        target.focus();
        target.scrollIntoView();
      });
      document.body.insertBefore(link, document.body.firstChild);
    } catch (e) {}
  }

  function ensurePageLanguage() {
    try {
      if (!document.documentElement.getAttribute("lang")) {
        var guess = (navigator.language || "en").split("-")[0];
        document.documentElement.setAttribute("lang", guess);
      }
    } catch (e) {}
  }

  function fixViewportZoom() {
    try {
      var vp = document.querySelector('meta[name="viewport"]');
      if (!vp) return;
      var content = vp.getAttribute("content") || "";
      content = content.replace(
        /user-scalable\s*=\s*(no|0)/i,
        "user-scalable=yes",
      );
      content = content.replace(
        /maximum-scale\s*=\s*([\d.]+)/i,
        function (m, v) {
          return parseFloat(v) < 2 ? "maximum-scale=2" : m;
        },
      );
      vp.setAttribute("content", content);
    } catch (e) {}
  }

  // Run all fixes once on initial load
  autoLabelFields();
  fixIframeTitles();
  unblockPasswordPaste();
  ensureSkipLink();
  ensurePageLanguage();
  fixViewportZoom();

  // ── ARIA live region ───────────────────────────────────
  if (!document.getElementById("ariaAlertRegion")) {
    document.body.appendChild(
      createEl("div", { id: "ariaAlertRegion", "aria-live": "polite" }),
    );
  }

  // Re-apply the DOM-dependent fixes to content added after initial load
  // (SPA route changes, modals, AJAX) so they don't regress on re-audit.
  try {
    var dwaoRemediationObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          autoLabelFields(node);
          fixIframeTitles(node);
          unblockPasswordPaste(node);
        });
      });
    });
    dwaoRemediationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  } catch (e) {}

  // ── Three-Step Toggle Utility ──────────────────────────
  function createThreeStepToggle(options) {
    var step = options.initialStep || 0;
    return function () {
      step = (step + 1) % 3;
      try {
        options.applyStep(step);
      } catch (e) {}
      var ul = document.querySelector("." + options.stepClassName);
      if (ul) updateStepIndicator(ul, step);
    };
  }
  function updateStepIndicator(ul, activeIdx) {
    if (!ul) return;
    ul.querySelectorAll("li").forEach(function (li, i) {
      li.classList.toggle("active", i === activeIdx);
    });
  }

  // ── Class-based typography init ────────────────────────
  function initFontSizeElements() {
    if (fontSizeInitialized) return;
    var ap = document.querySelector(".accessibility-panel");
    document.querySelectorAll(typographyElements).forEach(function (el) {
      if (ap && ap.contains(el)) return;
      if (el.tagName === "IMG") return;
      var text = el.innerText || el.textContent;
      if (!text || !text.trim().length) return;
      el.style.setProperty(
        "--dwas-orig-fs",
        window.getComputedStyle(el).fontSize,
      );
      el.classList.add("dwas-fs-init");
    });
    fontSizeInitialized = true;
  }

  function initTypoElements() {
    if (typoInitialized) return;
    var ap = document.querySelector(".accessibility-panel");
    document.querySelectorAll(typographyElements).forEach(function (el) {
      if (ap && ap.contains(el)) return;
      var text = el.innerText || el.textContent;
      if (!text || !text.trim().length) return;
      el.classList.add("dwas-typo-init");
    });
    typoInitialized = true;
  }

  function initTextAlignElements() {
    if (textAlignInitialized) return;
    var ap = document.querySelector(".accessibility-panel");
    var pl = document.querySelector("#pageList");
    var safe =
      "h1, h2, h3, h4, h5, h6, p, li, blockquote, article, section, main";
    document.querySelectorAll(safe).forEach(function (el) {
      if (ap && ap.contains(el)) return;
      if (pl && pl.contains(el)) return;
      if (
        el.closest(
          'button, input, select, textarea, .button, .btn, [role="button"]',
        )
      )
        return;
      el.classList.add("dwas-ta-init");
    });
    textAlignInitialized = true;
  }

  // ── Feature Functions ──────────────────────────────────
  function updateFontSizes() {
    fontSizeLevel = (fontSizeLevel + 1) % fontSizeClasses.length;
    var stepUl = document.querySelector(".font-size-steps");
    if (stepUl) updateStepIndicator(stepUl, fontSizeLevel);
    fontSizeClasses.forEach(function (c) {
      document.body.classList.remove(c);
    });
    document.body.classList.add(fontSizeClasses[fontSizeLevel]);
    if (!fontSizeInitialized) {
      requestAnimationFrame(initFontSizeElements);
    }
  }

  function increaseFont() {
    updateFontSizes();
  }

  function applyVisuallyImpairedFont() {
    if (!fontSizeInitialized) initFontSizeElements();
    fontSizeClasses.forEach(function (c) {
      document.body.classList.remove(c);
    });
    document.body.classList.add("dwas-fs-level-3");
    fontSizeLevel = 2;
  }

  function resetFontSize() {
    fontSizeClasses.forEach(function (c) {
      document.body.classList.remove(c);
    });
    letterSpacingClasses.forEach(function (c) {
      document.body.classList.remove(c);
    });
    lineHeightClasses.forEach(function (c) {
      document.body.classList.remove(c);
    });
    textAlignClasses.forEach(function (c) {
      document.body.classList.remove(c);
    });
    document.body.classList.remove("dwas-cognitive-ls", "dwas-cognitive-lh");
    document.querySelectorAll(".dwas-fs-init").forEach(function (el) {
      el.style.removeProperty("--dwas-orig-fs");
      el.classList.remove("dwas-fs-init");
    });
    document.querySelectorAll(".dwas-typo-init").forEach(function (el) {
      el.classList.remove("dwas-typo-init");
    });
    document.querySelectorAll(".dwas-ta-init").forEach(function (el) {
      el.classList.remove("dwas-ta-init");
    });
    fontSizeLevel = 0;
    fontSizeInitialized = false;
    typoInitialized = false;
    textAlignInitialized = false;
    singleLetterSpacingToggled = false;
    singleLineSpacingToggled = false;
    document.querySelectorAll(".option-steps li").forEach(function (li) {
      li.classList.remove("active");
    });
  }

  function toggleImages() {
    var ap = document.querySelector(".accessibility-panel");
    var tb = document.getElementById("accessibilityToggleBtn");
    document.querySelectorAll("img, svg").forEach(function (img) {
      if ((ap && ap.contains(img)) || (tb && tb.contains(img))) return;
      img.style.visibility = imagesHidden ? "visible" : "hidden";
    });
    document.querySelectorAll("*").forEach(function (el) {
      if ((ap && ap.contains(el)) || (tb && tb.contains(el))) return;
      var cs = window.getComputedStyle(el);
      var bg = cs.backgroundImage;
      var hasBg = bg && bg !== "none" && bg !== "initial";
      if (!imagesHidden) {
        if (hasBg && bg.indexOf("url(") !== -1) {
          if (!el.dataset.originalBackgroundImage) {
            el.dataset.originalBackgroundImage = bg;
          }
          el.style.backgroundImage = "none";
        }
      } else if (el.dataset.originalBackgroundImage) {
        el.style.backgroundImage = el.dataset.originalBackgroundImage;
        delete el.dataset.originalBackgroundImage;
      }
    });
    imagesHidden = !imagesHidden;
  }

  // ── Image description tooltip ──────────────────────────
  function toggleAltText() {
    var images = document.querySelectorAll("img");
    var ap = document.querySelector(".accessibility-panel");

    if (!altSpansCreated) {
      var tooltip = createEl("div", {
        id: "img-alt-tooltip",
        class: "img-alt-tooltip",
      });
      document.body.appendChild(tooltip);

      images.forEach(function (img) {
        if (ap && ap.contains(img)) return;
        if (img.alt && img.alt.trim()) {
          img._showTooltip = function () {
            if (!altShownInner) return;
            tooltip.innerHTML = img.alt;
            tooltip.classList.add("show");
            var tr = tooltip.getBoundingClientRect();
            var r = img.getBoundingClientRect();
            var left = r.left + r.width / 2 - tr.width / 2;
            var top = r.top - tr.height - 12;
            if (top < 20) top = r.bottom + 12;
            left = Math.max(
              20,
              Math.min(left, window.innerWidth - tr.width - 20),
            );
            tooltip.style.left = left + "px";
            tooltip.style.top = top + "px";
          };
          img._hideTooltip = function () {
            tooltip.classList.remove("show");
          };
          img.addEventListener("mouseenter", img._showTooltip);
          img.addEventListener("mouseleave", img._hideTooltip);
        }
      });
      altSpansCreated = true;
      altShownInner = true;
      return;
    }

    altShownInner = !altShownInner;
    if (!altShownInner) {
      var t = document.getElementById("img-alt-tooltip");
      if (t) t.classList.remove("show");
    }
  }

  // ── Class-based letter spacing & line height ───────────
  var toggleLetterSpacing = createThreeStepToggle({
    applyStep: function (step) {
      letterSpacingClasses.forEach(function (c) {
        document.body.classList.remove(c);
      });
      document.body.classList.add(letterSpacingClasses[step]);
      if (!typoInitialized) requestAnimationFrame(initTypoElements);
    },
    stepClassName: "letter-spacing-steps",
  });

  var toggleLineHeight = createThreeStepToggle({
    applyStep: function (step) {
      lineHeightClasses.forEach(function (c) {
        document.body.classList.remove(c);
      });
      document.body.classList.add(lineHeightClasses[step]);
      if (!typoInitialized) requestAnimationFrame(initTypoElements);
    },
    stepClassName: "line-spacing-steps",
  });

  var toggleTextAlign = createThreeStepToggle({
    applyStep: function (step) {
      textAlignClasses.forEach(function (c) {
        document.body.classList.remove(c);
      });
      document.body.classList.add(textAlignClasses[step]);
      if (!textAlignInitialized) requestAnimationFrame(initTextAlignElements);
    },
    stepClassName: "text-toggle-steps",
  });

  function toggleSingleLetterSpacing() {
    if (!typoInitialized) initTypoElements();
    singleLetterSpacingToggled = !singleLetterSpacingToggled;
    document.body.classList.toggle(
      "dwas-cognitive-ls",
      singleLetterSpacingToggled,
    );
  }
  function toggleSingleLineSpacing() {
    if (!typoInitialized) initTypoElements();
    singleLineSpacingToggled = !singleLineSpacingToggled;
    document.body.classList.toggle(
      "dwas-cognitive-lh",
      singleLineSpacingToggled,
    );
  }

  // ── Skip Link = smooth scroll to top ──────────────────
  function insertSkipLink() {
    var card = document.querySelector('.option-card[datakey="enableSkipLink"]');
    if (card) card.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
    var main = document.querySelector("main, [role='main'], body");
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus();
    }
    var alert = document.getElementById("ariaAlertRegion");
    if (alert) alert.textContent = "Page scrolled to top.";
    setTimeout(function () {
      if (card) card.classList.remove("active");
    }, 600);
  }

  function getDyslexiaFont() {
    document.body.classList.toggle("dyslexia-font");
  }

  // ── Pause/Hide Media (audio, video, YouTube iframe, GIFs) ─
  function pauseStopHideMedia() {
    var pauseId = "dwao-pause-css";
    if (!mediaPaused) {
      document.querySelectorAll("audio, video").forEach(function (m) {
        if (!m.dataset.originalPlaybackState)
          m.dataset.originalPlaybackState = m.paused ? "paused" : "playing";
        m.pause();
      });
      document
        .querySelectorAll('iframe[src*="youtube.com/embed"]')
        .forEach(function (iframe) {
          if (!iframe.dataset.originalPlaybackState)
            iframe.dataset.originalPlaybackState = "playing";
          if (!iframe.dataset.originalSrc)
            iframe.dataset.originalSrc = iframe.src;
          iframe.src = "";
        });
      document.querySelectorAll('img[src$=".gif"]').forEach(function (gif) {
        gif.dataset.originalSrc = gif.src;
        gif.src = "";
        gif.src = gif.dataset.originalSrc;
      });
      if (!document.getElementById(pauseId)) {
        document.head.appendChild(
          createEl("style", {
            id: pauseId,
            innerHTML:
              "* { animation: none !important; transition: none !important; }",
          }),
        );
      }
      document.body.classList.add("pause-stop-media");
      mediaPaused = true;
    } else {
      document.querySelectorAll("audio, video").forEach(function (m) {
        if (m.dataset.originalPlaybackState === "playing") m.play();
      });
      document
        .querySelectorAll("iframe[data-original-src]")
        .forEach(function (iframe) {
          if (
            iframe.dataset.originalPlaybackState === "playing" &&
            iframe.dataset.originalSrc
          ) {
            var src = iframe.dataset.originalSrc;
            src += src.indexOf("?") !== -1 ? "&autoplay=1" : "?autoplay=1";
            iframe.src = src;
          }
        });
      var tag = document.getElementById(pauseId);
      if (tag) tag.remove();
      document.body.classList.remove("pause-stop-media");
      mediaPaused = false;
    }
  }

  // ── Color filters on <html> ────────────────────────────
  function toggleHighContrast() {
    document.documentElement.classList.toggle("high-contrast-vi");
  }
  function toggleInvert() {
    var root = document.documentElement;
    if (root.style.filter === "invert(100%)") {
      root.style.filter = "";
      root.style.backgroundColor = "";
    } else {
      root.style.filter = "invert(100%)";
      root.style.backgroundColor = "rgb(245,245,245)";
    }
  }
  function toggleGrayscale() {
    document.documentElement.classList.toggle("grayscale-new");
  }
  function toggleSaturation() {
    document.documentElement.classList.toggle("low-saturation-epilepsy");
  }

  // ── ADHD-style Reading Line ────────────────────────────
  function toggleReadingLine() {
    if (!document.getElementById("adhd-line-overlay")) createADHDLine();
    var overlay = document.getElementById("adhd-line-overlay");
    if (readingLineOn) {
      overlay.style.display = "none";
      readingLineOn = false;
    } else {
      overlay.style.display = "block";
      readingLineOn = true;
    }
  }

  function createADHDLine() {
    var overlay = document.createElement("div");
    overlay.id = "adhd-line-overlay";

    var topOv = document.createElement("div");
    topOv.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:0;background:rgba(0,0,0,0.7);z-index:1001;";

    var line = document.createElement("div");
    line.style.cssText =
      "position:fixed;width:100vw;height:3px;background:#000;z-index:1002;";

    var botOv = document.createElement("div");
    botOv.style.cssText =
      "position:fixed;top:0;left:0;width:100%;height:0;background:rgba(0,0,0,0.7);z-index:1001;";

    overlay.appendChild(topOv);
    overlay.appendChild(line);
    overlay.appendChild(botOv);
    document.body.appendChild(overlay);

    document.addEventListener("mousemove", function (e) {
      if (!readingLineOn) return;
      var y = e.clientY;
      var h = window.innerHeight;
      var gap = 70;
      line.style.top = y + "px";
      line.style.left = "0";
      topOv.style.height = Math.max(0, y - gap) + "px";
      var bh = Math.max(0, h - y - gap);
      botOv.style.height = bh + "px";
      botOv.style.top = y + gap + "px";
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && readingLineOn) toggleReadingLine();
    });
  }

  function toggleHighlightLinks() {
    document.body.classList.toggle("highlight-links");
  }
  function toggleBigCursor() {
    document.body.classList.toggle("big-cursor");
  }
  function toggleEnlargeButtons() {
    document.body.classList.toggle("big-buttons");
  }

  // ── Read Page via screen reader popup ──────────────────
  function toggleReadPage() {
    if (!window.speechSynthesis) return;
    var panelEl = document.querySelector(".accessibility-panel");
    if (panelEl) panelEl.style.display = "none";

    var srUI = document.querySelector(".screen-reader-popup");
    if (!srUI) return;
    srUI.style.display = "block";

    var voiceSelect = srUI.querySelector(".voice-select");
    var volumeInput = srUI.querySelector(".volume-slider");
    var rateInput = srUI.querySelector(".rate-slider");
    var pitchInput = srUI.querySelector(".pitch-slider");

    var utterance;
    var lastSpokenText = "";
    var currentCharIndex = 0;
    var voices = synth.getVoices();
    if (!voices.length) {
      synth.onvoiceschanged = function () {
        voices = synth.getVoices();
      };
    }

    function speakText(text, startIndex) {
      startIndex = startIndex || 0;
      stopReading();
      lastSpokenText = text;
      utterance = new SpeechSynthesisUtterance(text.substring(startIndex));
      utterance.voice = voices[voiceSelect.value] || voices[0];
      utterance.volume = parseFloat(volumeInput.value);
      utterance.rate = parseFloat(rateInput.value);
      utterance.pitch = parseFloat(pitchInput.value);
      utterance.onboundary = function (e) {
        if (e.name === "word" || e.name === "sentence") {
          currentCharIndex = startIndex + e.charIndex;
        }
      };
      synth.speak(utterance);
    }

    function startReading() {
      speakText(document.body.innerText);
    }
    function pauseReading() {
      if (synth.speaking && !synth.paused) synth.pause();
    }
    function resumeReading() {
      if (synth.paused) synth.resume();
    }
    function stopReading() {
      synth.cancel();
      currentCharIndex = 0;
    }
    function applyUpdatedSettings() {
      if (synth.speaking || synth.paused) {
        speakText(lastSpokenText, currentCharIndex);
      }
    }

    [volumeInput, rateInput, pitchInput].forEach(function (input) {
      input.addEventListener("input", applyUpdatedSettings);
    });

    function isSpeakable(el) {
      var style = window.getComputedStyle(el);
      var text = (el.innerText || "").trim();
      return (
        text.length > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        el.offsetParent !== null &&
        ["SCRIPT", "STYLE", "NOSCRIPT"].indexOf(el.tagName) === -1 &&
        !srUI.contains(el)
      );
    }

    document.removeEventListener("mouseover", window._dwaoMouseOver);
    document.removeEventListener("mouseout", window._dwaoMouseOut);

    window._dwaoMouseOver = function (e) {
      var el = e.target;
      if (!isSpeakable(el)) return;
      speakText(el.innerText.trim());
      el.classList.add("speak-highlight");
    };
    window._dwaoMouseOut = function (e) {
      var el = e.target;
      if (!isSpeakable(el)) return;
      el.classList.remove("speak-highlight");
      stopReading();
    };
    document.addEventListener("mouseover", window._dwaoMouseOver);
    document.addEventListener("mouseout", window._dwaoMouseOut);

    var closePopup = srUI.querySelector(".close-popup");
    if (closePopup && !closePopup._bound) {
      closePopup._bound = true;
      closePopup.addEventListener("click", function () {
        srUI.style.display = "none";
        synth.cancel();
        document.removeEventListener("mouseover", window._dwaoMouseOver);
        document.removeEventListener("mouseout", window._dwaoMouseOut);
        document
          .querySelectorAll(
            ".option-card[datakey='blindness'], .option-card[datakey='readPage']",
          )
          .forEach(function (c) {
            c.classList.remove("active");
          });
        try {
          var keys = Array.from(
            document.querySelectorAll(".option-card.active"),
          ).map(function (c) {
            return c.getAttribute("datakey");
          });
          localStorage.setItem(
            "accessibility_local_settings",
            JSON.stringify(keys),
          );
        } catch (e) {}
      });
    }

    var ctrls = srUI.querySelectorAll(".reader-controls button");
    function setActive(btn) {
      ctrls.forEach(function (b) {
        b.classList.remove("primary");
      });
      btn.classList.add("primary");
    }
    var start = srUI.querySelector(".btn-start");
    var pause = srUI.querySelector(".btn-pause");
    var resume = srUI.querySelector(".btn-resume");
    var stop = srUI.querySelector(".btn-stop");
    if (start && !start._bound) {
      start._bound = true;
      start.addEventListener("click", function () {
        startReading();
        setActive(this);
      });
      pause.addEventListener("click", function () {
        pauseReading();
        setActive(this);
      });
      resume.addEventListener("click", function () {
        resumeReading();
        setActive(this);
      });
      stop.addEventListener("click", function () {
        stopReading();
        setActive(this);
      });
    }
  }

  // ── Magnifier lens (hover to zoom text) ────────────────
  function toggleMagnifier() {
    var lensId = "text-magnifier-lens";
    var lens = document.getElementById(lensId);

    if (window._magnifierListeners && window._magnifierListeners.elements) {
      window._magnifierListeners.elements.forEach(function (el) {
        el.removeEventListener(
          "mouseenter",
          window._magnifierListeners.showLens,
        );
        el.removeEventListener(
          "mousemove",
          window._magnifierListeners.moveLens,
        );
        el.removeEventListener(
          "mouseleave",
          window._magnifierListeners.hideLens,
        );
      });
    }

    if (!window.magnifierEnabled) {
      if (!lens) {
        lens = document.createElement("div");
        lens.id = lensId;

        var closeBtn = document.createElement("div");
        closeBtn.innerHTML = "✖";
        closeBtn.style.cssText =
          "position:absolute;top:6px;right:10px;cursor:pointer;font-size:18px;font-weight:bold;color:#555;user-select:none;";
        closeBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          lens.style.display = "none";
          toggleMagnifier();
          var c = document.querySelector('.option-card[datakey="textZoom"]');
          if (c) c.classList.remove("active");
        });
        lens.appendChild(closeBtn);
        document.body.appendChild(lens);
      }

      var ignored = {
        SCRIPT: 1,
        STYLE: 1,
        NOSCRIPT: 1,
        LINK: 1,
        META: 1,
        BR: 1,
        HR: 1,
        HEAD: 1,
      };

      function getDirectText(el) {
        var t = "";
        for (var i = 0; i < el.childNodes.length; i++) {
          var node = el.childNodes[i];
          if (node.nodeType === Node.TEXT_NODE) t += node.textContent;
        }
        return t.trim();
      }
      function clearText() {
        Array.from(lens.childNodes).forEach(function (n) {
          if (n.nodeType === Node.TEXT_NODE) lens.removeChild(n);
        });
      }

      function showLens(e) {
        var t = e.currentTarget;
        if (ignored[t.tagName]) {
          lens.style.display = "none";
          return;
        }
        var content = "";
        if (t.tagName === "IMG") {
          content = t.getAttribute("alt") || t.getAttribute("aria-label") || "";
        } else if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") {
          content = t.value || t.placeholder || "";
        } else {
          content = getDirectText(t);
        }
        if (!content.trim()) {
          lens.style.display = "none";
          return;
        }
        clearText();
        lens.appendChild(document.createTextNode(content.trim()));
        lens.style.display = "block";
      }

      function moveLens(e) {
        if (lens.style.display === "none") return;
        var r = lens.getBoundingClientRect();
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var m = 20;
        var left = e.clientX + 32;
        var top = e.clientY - 24;
        if (left + r.width > vw - m) left = e.clientX - r.width - 32;
        left = Math.max(m, Math.min(left, vw - r.width - m));
        if (top + r.height > vh - m) top = e.clientY - r.height - 24;
        top = Math.max(m, Math.min(top, vh - r.height - m));
        lens.style.left = left + "px";
        lens.style.top = top + "px";
      }

      function hideLens() {
        lens.style.display = "none";
      }

      var elements = document.querySelectorAll(
        "body *:not(script):not(style):not(noscript):not(link):not(meta):not(br):not(hr)",
      );
      elements.forEach(function (el) {
        el.addEventListener("mouseenter", showLens);
        el.addEventListener("mousemove", moveLens);
        el.addEventListener("mouseleave", hideLens);
      });
      window._magnifierListeners = {
        showLens: showLens,
        moveLens: moveLens,
        hideLens: hideLens,
        elements: elements,
      };
      window.magnifierEnabled = true;
    } else {
      if (lens) lens.remove();
      window.magnifierEnabled = false;
    }
  }

  // ── Page Structure: heading list + scroll-to ───────────
  function getPageStructure() {
    debugger;
    var pl = document.getElementById("pageList");
    if (!pageStructureBuilt) {
      var header = createEl("p", {
        class: "page-structure-header",
        innerHTML: "Page Structure",
      });

      var closeBtn = svgIcon("close");
      closeBtn.style.cursor = "pointer";
      closeBtn.style.position = "absolute";
      closeBtn.style.top = "14px";
      closeBtn.style.right = "14px";
      closeBtn.style.color = "#fff";
      closeBtn.onclick = function () {
        pl.style.display = "none";
        var card = document.querySelector(".option-card.page-structure");
        if (card) card.classList.remove("active");
      };

      var wrapper = createEl("div");
      wrapper.style.position = "relative";
      wrapper.appendChild(header);
      wrapper.appendChild(closeBtn);
      pl.appendChild(wrapper);

      var headings = Array.from(
        document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
      ).filter(function (h) {
        if (!h.innerText.trim()) return false;
        if (h.closest(".accessibility-panel")) return false;
        if (h.closest("#pageList")) return false;
        return true;
      });

      if (headings.length === 0) {
        var emptyState = createEl("div");
        emptyState.style.cssText =
          "display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px;gap:14px;text-align:center;";
        emptyState.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" fill="none" stroke="#aaa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">' +
          '<circle cx="12" cy="12" r="10"/>' +
          '<path d="M8 15s1.5-2 4-2 4 2 4 2"/>' +
          '<line x1="9" y1="9" x2="9.01" y2="9"/>' +
          '<line x1="15" y1="9" x2="15.01" y2="9"/>' +
          "</svg>" +
          '<p style="font-size:13px;color:#888;margin:0;line-height:1.6;">Sorry, this page does not have any page structure.</p>';
        pl.appendChild(emptyState);
      } else {
        var list = createEl("ul", { class: "as-card-content" });
        headings.forEach(function (heading, idx) {
          if (!heading.id) heading.id = "heading-" + idx;
          var li = createEl("li", {
            class: heading.tagName.toLowerCase(),
            innerHTML: heading.innerText.trim(),
          });
          li.onclick = function () {
            var yOffset = -130;
            var el = document.getElementById(heading.id);
            var y =
              el.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: "smooth" });
          };
          list.appendChild(li);
        });
        pl.appendChild(list);
      }

      pl.style.zIndex = "9999";
      pageStructureBuilt = true;
    }
    var opening = pl.style.display === "none";
    pl.style.display = opening ? "block" : "none";
    if (panel) panel.style.display = "none";
  }

  // ── Draggable Virtual Keyboard ─────────────────────────
  function toggleVirtualKeyboard() {
    var kb = document.getElementById("keyboardWrapper");
    if (kb) {
      kb.style.display = kb.style.display === "none" ? "block" : "none";
      return;
    }
    buildVirtualKeyboard();
    kb = document.getElementById("keyboardWrapper");
    if (kb) kb.style.display = "block";
  }

  function buildVirtualKeyboard() {
    var kbWrap = document.createElement("div");
    kbWrap.id = "keyboardWrapper";

    var closeBtn = document.createElement("button");
    closeBtn.textContent = "✖";
    closeBtn.style.cssText =
      "position:absolute;top:2px;right:10px;font-size:18px;cursor:pointer;border:none;background:transparent;color:#888;";
    closeBtn.onclick = function () {
      kbWrap.style.display = "none";
      var c = document.querySelector('.option-card[datakey="virtualKeyboard"]');
      if (c) c.classList.remove("active");
    };
    kbWrap.appendChild(closeBtn);

    var kbContainer = document.createElement("div");
    kbContainer.id = "virtualKeyboard";
    kbContainer.style.cssText =
      "background:#eee;padding:10px;display:inline-block;width:100%;";
    kbWrap.appendChild(kbContainer);

    var layout = [
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "@"],
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Delete"],
      ["Shift", "Z", "X", "C", "V", "B", "N", "M", "."],
      ["Space"],
    ];

    layout.forEach(function (rowKeys) {
      var row = document.createElement("div");
      row.style.cssText =
        "display:flex;justify-content:center;margin-bottom:5px;";
      rowKeys.forEach(function (key) {
        var btn = document.createElement("button");
        btn.textContent = key === "Space" ? "␣" : key;
        btn.className = "virtual-key";
        btn.style.minWidth =
          key === "Space" ? "300px" : key.length > 1 ? "70px" : "40px";
        btn.dataset.keyValue = key;
        row.appendChild(btn);
      });
      kbContainer.appendChild(row);
    });

    document.body.appendChild(kbWrap);
    makeDraggable(kbWrap);
    bindVirtualKeys();
  }

  function makeDraggable(el) {
    var ox = 0,
      oy = 0,
      dragging = false;
    el.addEventListener("mousedown", function (e) {
      if (e.target.tagName.toLowerCase() === "button") return;
      dragging = true;
      ox = e.clientX - el.offsetLeft;
      oy = e.clientY - el.offsetTop;
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", stop);
      e.preventDefault();
    });
    function move(e) {
      if (!dragging) return;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var r = el.getBoundingClientRect();
      var x = e.clientX - ox;
      var y = e.clientY - oy;
      if (x < 0) x = 0;
      if (x + r.width > vw) x = vw - r.width;
      if (y < 0) y = 0;
      if (y + r.height > vh) y = vh - r.height;
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.style.bottom = "auto";
      el.style.transform = "none";
    }
    function stop() {
      dragging = false;
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", stop);
    }
  }

  var _vkLastFocus = null;
  var _vkShift = false;
  document.addEventListener("focusin", function (e) {
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.isContentEditable
    ) {
      _vkLastFocus = e.target;
    }
  });

  function bindVirtualKeys() {
    document.querySelectorAll(".virtual-key").forEach(function (key) {
      if (key._bound) return;
      key._bound = true;
      key.addEventListener("click", function () {
        insertToActiveInput(key.dataset.keyValue);
      });
    });
  }

  function insertToActiveInput(char) {
    var el = _vkLastFocus;
    if (!el || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) return;

    if (char === "Shift") {
      _vkShift = !_vkShift;
      return;
    }
    var start = el.selectionStart;
    var end = el.selectionEnd;
    var value = el.value;
    var newValue = value;
    var newCaret = start;

    if (char === "Delete") {
      if (start > 0) {
        newValue = value.slice(0, start - 1) + value.slice(end);
        newCaret = start - 1;
      }
    } else if (char === "Space") {
      newValue = value.slice(0, start) + " " + value.slice(end);
      newCaret = start + 1;
    } else {
      var c = _vkShift ? char.toUpperCase() : char.toLowerCase();
      newValue = value.slice(0, start) + c + value.slice(end);
      newCaret = start + 1;
    }

    el.value = newValue;
    el.focus();
    el.selectionStart = el.selectionEnd = newCaret;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // ── Reset All ──────────────────────────────────────────
  function resetAllAccessibility() {
    resetFontSize();

    if (window._magnifierListeners && window._magnifierListeners.elements) {
      window._magnifierListeners.elements.forEach(function (el) {
        el.removeEventListener(
          "mouseenter",
          window._magnifierListeners.showLens,
        );
        el.removeEventListener(
          "mousemove",
          window._magnifierListeners.moveLens,
        );
        el.removeEventListener(
          "mouseleave",
          window._magnifierListeners.hideLens,
        );
      });
      window._magnifierListeners = null;
    }
    var lens = document.getElementById("text-magnifier-lens");
    if (lens) lens.remove();
    window.magnifierEnabled = false;

    imagesHidden = false;
    altShownInner = false;
    altSpansCreated = false;
    readingLineOn = false;
    skipLinkEnabled = false;
    mediaPaused = false;
    pageStructureBuilt = false;
    visuallyImpairedOn = false;

    try {
      var pl = document.getElementById("pageList");
      if (pl) {
        pl.style.display = "none";
        pl.innerHTML = "";
      }
    } catch (e) {}

    var ap = document.querySelector(".accessibility-panel");
    var tb = document.getElementById("accessibilityToggleBtn");

    document.querySelectorAll("img, svg").forEach(function (img) {
      if ((ap && ap.contains(img)) || (tb && tb.contains(img))) return;
      img.style.visibility = "visible";
    });
    document
      .querySelectorAll("[data-original-background-image]")
      .forEach(function (el) {
        if ((ap && ap.contains(el)) || (tb && tb.contains(el))) return;
        el.style.backgroundImage = el.dataset.originalBackgroundImage;
        delete el.dataset.originalBackgroundImage;
      });

    var tip = document.getElementById("img-alt-tooltip");
    if (tip) tip.remove();
    document.querySelectorAll("img").forEach(function (img) {
      if (img._showTooltip) {
        img.removeEventListener("mouseenter", img._showTooltip);
        img.removeEventListener("mouseleave", img._hideTooltip);
        delete img._showTooltip;
        delete img._hideTooltip;
      }
    });

    var root = document.documentElement;
    root.style.filter = "";
    root.style.backgroundColor = "";
    root.classList.remove(
      "high-contrast-vi",
      "low-saturation-epilepsy",
      "grayscale-new",
      "disable-animation",
    );

    document.body.classList.remove(
      "big-cursor",
      "highlight-links",
      "big-buttons",
      "dyslexia-font",
      "pause-stop-media",
    );

    var rl = document.getElementById("adhd-line-overlay");
    if (rl) rl.remove();

    if (window.speechSynthesis) window.speechSynthesis.cancel();

    var sl = document.querySelector(".skip-link");
    if (sl) sl.remove();

    var pauseCSS = document.getElementById("dwao-pause-css");
    if (pauseCSS) pauseCSS.remove();

    document.querySelectorAll(".option-steps li").forEach(function (li) {
      li.classList.remove("active");
    });

    var kb = document.getElementById("keyboardWrapper");
    if (kb) kb.style.display = "none";

    var sr = document.querySelector(".screen-reader-popup");
    if (sr) sr.style.display = "none";

    if (window._dwaoMouseOver) {
      document.removeEventListener("mouseover", window._dwaoMouseOver);
    }
    if (window._dwaoMouseOut) {
      document.removeEventListener("mouseout", window._dwaoMouseOut);
    }
    document.querySelectorAll(".speak-highlight").forEach(function (el) {
      el.classList.remove("speak-highlight");
    });
  }

  // ── Init accordion + interactions ──────────────────────
  function initAccessibilityHandlers() {
    var triggers = document.querySelectorAll(".accordion-trigger");
    var cards = document.querySelectorAll(".option-card:not(.empty)");
    var resetBtn = document.querySelector(".reset-all-acc");
    var closeBtn = document.querySelector(".close-btn-acc");

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var item = this.closest(".accordion-item-acces");
        item.classList.toggle("active");
        triggers.forEach(function (other) {
          if (other !== trigger)
            other.closest(".accordion-item-acces").classList.remove("active");
        });
      });
    });

    cards.forEach(function (card) {
      card.addEventListener("click", function () {
        var label = this.querySelector(".option-label");
        var name = label ? label.textContent.trim() : "";

        // Step-based cards always add active (step list drives UI)
        if (
          name === "Line Spacing" ||
          name === "Letter Spacing" ||
          name === "Text Size" ||
          name === "Text Alignment"
        ) {
          this.classList.add("active");
        } else {
          this.classList.toggle("active");
        }

        this.style.transform = "scale(0.95)";
        var self = this;
        setTimeout(function () {
          self.style.transform = "";
        }, 150);

        // persist active options
        var persist = function () {
          try {
            var keys = Array.from(
              document.querySelectorAll(".option-card.active"),
            ).map(function (c) {
              return c.getAttribute("datakey");
            });
            localStorage.setItem(
              "accessibility_local_settings",
              JSON.stringify(keys),
            );
          } catch (e) {}
        };
        if (typeof requestIdleCallback === "function") {
          requestIdleCallback(persist);
        } else {
          setTimeout(persist, 0);
        }
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        this.style.transform = "scale(0.95)";
        var self = this;
        setTimeout(function () {
          self.style.transform = "";
        }, 150);
        cards.forEach(function (c) {
          c.classList.remove("active");
        });
        requestAnimationFrame(function () {
          resetAllAccessibility();
          try {
            localStorage.removeItem("accessibility_local_settings");
          } catch (e) {}
        });
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        panel.style.display = "none";
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") panel.style.display = "none";
      if (
        (e.key === "ArrowDown" || e.key === "ArrowUp") &&
        document.activeElement.classList.contains("option-card")
      ) {
        e.preventDefault();
        var arr = Array.from(cards);
        var idx = arr.indexOf(document.activeElement);
        var next =
          e.key === "ArrowDown"
            ? (idx + 1) % arr.length
            : (idx - 1 + arr.length) % arr.length;
        arr[next].focus();
      }
      if (
        (e.key === "Enter" || e.key === " ") &&
        document.activeElement.classList.contains("option-card")
      ) {
        e.preventDefault();
        document.activeElement.click();
      }
    });

    var first = document.querySelector(".accordion-item-acces");
    if (first) first.classList.add("active");

    // Restore persisted selections
    try {
      var raw = localStorage.getItem("accessibility_local_settings");
      if (raw) {
        var keys = JSON.parse(raw);
        if (Array.isArray(keys)) {
          keys.forEach(function (k) {
            var card = document.querySelector(
              '.option-card[datakey="' + k + '"]',
            );
            if (card && !card.classList.contains("active")) card.click();
          });
        }
      }
    } catch (e) {}
  }

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(initAccessibilityHandlers);
  } else {
    setTimeout(initAccessibilityHandlers, 0);
  }

  // ── Public API ─────────────────────────────────────────
  window.DWAOAccessibility = {
    version: VERSION,
    reset: resetAllAccessibility,
  };
})();
