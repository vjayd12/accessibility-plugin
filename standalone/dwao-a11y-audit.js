/**
 * DWAO AI — Accessibility Audit (standalone build)
 *
 * Full WCAG 2.2 audit engine (56+ automated checkpoints) + report UI, packaged
 * as a single self-contained script — no browser extension required.
 *
 * This is a separately maintained tool: edit standalone/src/audit-engine.js
 * and standalone/src/content.js directly (not the repo-root files, which back
 * the internal Chrome extension), then run standalone/build.sh to regenerate
 * dwao-a11y-audit.js.
 *
 * Run it one of three ways:
 *
 *   1. DevTools console — paste the whole file's contents into the console on
 *      any page and hit Enter. Opens the audit sidebar immediately.
 *
 *   2. Bookmarklet — one-click, no code changes to the site:
 *        javascript:(function(){var s=document.createElement('script');s.src='https://YOUR-HOST/dwao-a11y-audit.js';document.body.appendChild(s);})()
 *
 *   3. Script tag in your own codebase (e.g. dev/staging builds only):
 *        <script src="/path/to/dwao-a11y-audit.js" data-autorun="false"></script>
 *      With data-autorun="false" the sidebar does NOT open automatically —
 *      trigger it yourself via the public API:
 *        window.DWAOAudit.open()      // open the sidebar (optionally pass a
 *                                      // feature name: 'audit','contrast',
 *                                      // 'alttext','focus','keyboard',
 *                                      // 'screenreader','colorblind','vision','dyslexia')
 *        window.DWAOAudit.close()     // tear down the UI
 *        window.DWAOAudit.toggle()    // open if closed, close if open
 *      Omit data-autorun (or set it to any other value) to open immediately,
 *      same as options 1 and 2.
 *
 * Reports: from the Audit view, use the "HTML report" / export controls to
 * download a self-contained JSON or HTML report of every issue found — no
 * server or extension involved, it's a client-side Blob download.
 */
/* DWAO AI — WCAG 2.2 Audit Engine v2
   ─────────────────────────────────────────────────────────────────────────
   Returns: { results:[{id,name,level,principle,status,issues:[{el,msg,snippet,fix}],summary,manual}] }
   status: 'pass' | 'fail' | 'warn' | 'manual' | 'na'
   ───────────────────────────────────────────────────────────────────────── */
(function(){
  if (window.__ofAudit) return;

  // ── Color/contrast math (shared with content.js) ───────────────────────
  const lin = c => { const s=c/255; return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4); };
  const lum = (r,g,b) => 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);
  const cRatio = (l1,l2) => { const h=Math.max(l1,l2),lo=Math.min(l1,l2); return (h+0.05)/(lo+0.05); };
  const toHex = (r,g,b) => '#'+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
  function parseRGBA(str){
    if(!str||str==='transparent'||str==='rgba(0, 0, 0, 0)') return null;
    const m=str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if(!m) return null;
    return { r:+m[1], g:+m[2], b:+m[3], a:m[4]!==undefined?+m[4]:1 };
  }
  function getEffectiveBg(el){
    let cr=255,cg=255,cb=255; const stack=[]; let node=el;
    while(node && node!==document.documentElement){
      const c=parseRGBA(window.getComputedStyle(node).backgroundColor);
      if(c && c.a>0.01) stack.unshift(c);
      node=node.parentElement;
    }
    stack.forEach(({r,g,b,a})=>{cr=a*r+(1-a)*cr;cg=a*g+(1-a)*cg;cb=a*b+(1-a)*cb;});
    return { r:Math.round(cr), g:Math.round(cg), b:Math.round(cb) };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  const SKIP_SELECTORS = '#__of_sidebar__,#__of_overlay__,#__of_tt__,#__of_cbsv__';
  const snippetOf = el => {
    if(!el || !el.outerHTML) return '';
    let s = el.outerHTML.replace(/\s+/g,' ');
    if(s.length>200) s = s.slice(0,197)+'…';
    return s;
  };

  // ARIA-hidden test — checks the element AND its ancestors
  const isAriaHidden = el => {
    let n = el;
    while(n && n.nodeType===1){
      if(n.getAttribute && n.getAttribute('aria-hidden')==='true') return true;
      n = n.parentElement;
    }
    return false;
  };

  // Visibility: present in the layout, not display:none, not collapsed, not aria-hidden, not inside our own UI, not "visually hidden" (offscreen technique used for sr-only)
  const isVisible = el => {
    if(!el || !el.getBoundingClientRect) return false;
    if(el.closest && el.closest(SKIP_SELECTORS)) return false;
    if(isAriaHidden(el)) return false;
    const s = window.getComputedStyle(el);
    if(s.display==='none' || s.visibility==='hidden' || s.visibility==='collapse') return false;
    if(parseFloat(s.opacity)===0) return false;
    const r = el.getBoundingClientRect();
    if(r.width<=0 || r.height<=0) return false;
    // Visually-hidden / screen-reader-only patterns — content is exposed to AT but invisible to sighted; still real for a11y
    return true;
  };

  // Detect "visually hidden but in tab order" (skip-link patterns) — treat as visible for content checks
  const isVisuallyHiddenButFocusable = el => {
    if(!el) return false;
    const s = window.getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return (r.width<=1 && r.height<=1) || s.clip==='rect(0px, 0px, 0px, 0px)' || (s.position==='absolute' && (parseFloat(s.left||'0')<-9000 || parseFloat(s.top||'0')<-9000));
  };

  // Has an ancestor (or self) that is interactive — used to suppress duplicate flags on descendants
  const hasInteractiveAncestor = (el, includeSelf=true) => {
    let n = includeSelf ? el : el.parentElement;
    while(n && n.nodeType===1){
      const tag = n.tagName;
      if(['A','BUTTON','SELECT','TEXTAREA','SUMMARY','LABEL'].includes(tag)) return n;
      if(tag==='INPUT' && n.type!=='hidden') return n;
      const role = n.getAttribute && n.getAttribute('role');
      if(role && ['button','link','checkbox','radio','tab','menuitem','menuitemcheckbox','menuitemradio','option','switch','combobox','slider','spinbutton','textbox','searchbox','treeitem','gridcell'].includes(role)) return n;
      if(n.hasAttribute && (n.hasAttribute('onclick') || n.hasAttribute('tabindex'))) return n;
      n = n.parentElement;
    }
    return null;
  };

  // Has an ancestor with cursor:pointer set by CSS — used to suppress duplicate cursor:pointer flags on children that just inherit
  const hasCursorPointerAncestor = (el) => {
    let n = el.parentElement;
    while(n && n.nodeType===1 && n!==document.documentElement){
      try { if(window.getComputedStyle(n).cursor==='pointer') return n; } catch(e){}
      n = n.parentElement;
    }
    return null;
  };

  // Robust CSS selector path (id > unique class > tag:nth-of-type chain, capped depth)
  const buildSelector = (el) => {
    if(!el || el.nodeType!==1) return '';
    if(el.id && document.querySelectorAll('#'+CSS.escape(el.id)).length===1) return '#'+CSS.escape(el.id);
    const parts=[]; let n=el; let depth=0;
    while(n && n.nodeType===1 && n!==document.body && depth<6){
      let part = n.tagName.toLowerCase();
      if(n.id){ part='#'+CSS.escape(n.id); parts.unshift(part); break; }
      // a single distinguishing class
      const cls = (typeof n.className==='string'?n.className:'').trim().split(/\s+/).filter(c=>c && !/^[a-z]+-[0-9]+$/.test(c) && c.length<30)[0];
      if(cls) part += '.'+CSS.escape(cls);
      // nth-of-type if siblings of same tag
      const sib = n.parentElement ? Array.from(n.parentElement.children).filter(c=>c.tagName===n.tagName) : [];
      if(sib.length>1) part += ':nth-of-type('+(sib.indexOf(n)+1)+')';
      parts.unshift(part);
      n = n.parentElement; depth++;
    }
    return parts.join(' > ') || el.tagName.toLowerCase();
  };

  // Capture parent context for an element — useful in reports
  const captureContext = (el) => {
    if(!el || el.nodeType!==1) return null;
    const parent = el.parentElement;
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: (typeof el.className==='string'? el.className.trim().slice(0,200): null),
      selector: buildSelector(el),
      xpath: buildXPath(el),
      parentTag: parent? parent.tagName.toLowerCase(): null,
      parentSelector: parent? buildSelector(parent): null,
      parentSnippet: parent? snippetOf(parent).slice(0,200): null,
      position: { x: Math.round(r.x), y: Math.round(r.y + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) },
      visible: isVisible(el),
    };
  };

  // XPath builder (simple, sufficient for jump-to-element in DevTools)
  const buildXPath = (el) => {
    if(!el || el.nodeType!==1) return '';
    if(el.id) return `//*[@id="${el.id}"]`;
    const parts=[]; let n=el;
    while(n && n.nodeType===1 && n!==document.body){
      let i=1, sib=n.previousElementSibling;
      while(sib){ if(sib.tagName===n.tagName) i++; sib=sib.previousElementSibling; }
      parts.unshift(`${n.tagName.toLowerCase()}[${i}]`);
      n = n.parentElement;
    }
    return '/html/body/'+parts.join('/');
  };

  // Computed-style snapshot for a few diagnostically useful properties
  const captureStyles = (el) => {
    if(!el || el.nodeType!==1) return null;
    try {
      const s = window.getComputedStyle(el);
      return {
        color: s.color, backgroundColor: s.backgroundColor,
        fontSize: s.fontSize, fontWeight: s.fontWeight,
        display: s.display, visibility: s.visibility, opacity: s.opacity,
        cursor: s.cursor, position: s.position,
        width: s.width, height: s.height,
      };
    } catch(e){ return null; }
  };
  const accessibleName = el => {
    if(!el) return '';
    if(el.getAttribute('aria-labelledby')){
      const ids=el.getAttribute('aria-labelledby').split(/\s+/);
      const t=ids.map(id=>document.getElementById(id)?.textContent||'').join(' ').trim();
      if(t) return t;
    }
    if(el.getAttribute('aria-label')) return el.getAttribute('aria-label').trim();
    if(el.tagName==='INPUT' || el.tagName==='SELECT' || el.tagName==='TEXTAREA'){
      if(el.id){
        const lab=document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if(lab) return lab.textContent.trim();
      }
      const wrapLab=el.closest('label');
      if(wrapLab) return wrapLab.textContent.trim();
      if(el.getAttribute('title')) return el.getAttribute('title').trim();
      // placeholder is NOT an accessible name
      return '';
    }
    if(el.tagName==='IMG' && el.alt!==null) return el.alt.trim();
    if(el.tagName==='BUTTON' || el.tagName==='A'){
      // include text from descendant alt/aria-label as part of accessible name
      const imgAlt = Array.from(el.querySelectorAll('img[alt]')).map(i=>i.alt).join(' ').trim();
      const txt = (el.textContent || '').trim();
      if(txt) return txt;
      if(imgAlt) return imgAlt;
      if(el.getAttribute('title')) return el.getAttribute('title').trim();
      return '';
    }
    return (el.textContent || '').trim();
  };

  // ── Detection runner ────────────────────────────────────────────────────
  function enrichIssue(iss){
    if(!iss || !iss.el) return iss;
    iss.context = captureContext(iss.el);
    iss.styles = captureStyles(iss.el);
    if(!iss.snippet && iss.el.outerHTML) iss.snippet = snippetOf(iss.el);
    return iss;
  }

  function runAudit(){
    const results = [];
    const add = (id,name,level,principle,fn) => {
      try {
        const out = fn();
        if(out.issues) out.issues = out.issues.map(enrichIssue);
        results.push({ id, name, level, principle, ...out });
      }
      catch(e){ results.push({ id, name, level, principle, status:'manual', issues:[], summary:'Could not auto-check: '+e.message, manual:true }); }
    };

    // ═══════════════════════════════════════════════════════════════════
    // PRINCIPLE 1 — PERCEIVABLE
    // ═══════════════════════════════════════════════════════════════════

    // 1.1.1 Non-text Content
    add('1.1.1','Non-text Content','A','Perceivable',()=>{
      const issues=[];
      document.querySelectorAll('img').forEach(img=>{
        if(img.closest && img.closest(SKIP_SELECTORS)) return;
        if(!isVisible(img)) return;
        const role = img.getAttribute('role');
        if(role==='presentation' || role==='none') return;
        if(img.getAttribute('aria-hidden')==='true') return;
        // tracking pixels & spacer GIFs (1x1) — skip
        if(img.naturalWidth<=2 && img.naturalHeight<=2 && img.naturalWidth>0) return;
        const alt = img.getAttribute('alt');
        if(alt === null){
          issues.push({el:img, msg:'<img> missing alt attribute.', fix:'Add alt="description" or alt="" for decorative images.'});
        } else if(alt.trim()==='' && (img.width>20 && img.height>20)){
          // Empty alt is correct for decorative; only flag when image is the link's only content
          const inLink = img.closest('a,button');
          if(inLink){
            const name = accessibleName(inLink).trim();
            // accessibleName already includes textContent; if it equals empty alt it means no other text
            if(!name){
              issues.push({el:img, msg:'Image inside <'+inLink.tagName.toLowerCase()+'> has empty alt and the link/button has no other accessible name.', fix:'Add descriptive alt text describing the link destination, or add aria-label to the link/button.'});
            }
          }
        } else if(alt && /^(image|picture|graphic|photo)\s+(of|:)/i.test(alt)){
          issues.push({el:img, msg:`Alt text "${alt.slice(0,50)}" starts with redundant phrase.`, fix:'Remove "image of"/"picture of" prefix; screen readers already announce role.'});
        } else if(alt && /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(alt.trim())){
          issues.push({el:img, msg:'Alt text appears to be a filename.', fix:'Replace filename with meaningful description.'});
        }
      });
      document.querySelectorAll('input[type="image"]').forEach(inp=>{
        if(!isVisible(inp)) return;
        if(!inp.alt && !inp.getAttribute('aria-label') && !inp.getAttribute('aria-labelledby')){
          issues.push({el:inp, msg:'<input type="image"> missing alt/aria-label.', fix:'Add alt attribute describing the button action.'});
        }
      });
      document.querySelectorAll('area[href]').forEach(a=>{
        if(!a.alt && !a.getAttribute('aria-label')){
          issues.push({el:a, msg:'<area> with href missing alt.', fix:'Add alt describing the area\'s purpose.'});
        }
      });
      document.querySelectorAll('svg').forEach(svg=>{
        if(!isVisible(svg)) return;
        if(svg.closest('button,a,label,summary')) return; // parent handles naming
        if(svg.getAttribute('aria-hidden')==='true') return;
        const r = svg.getBoundingClientRect();
        if(r.width<=20 || r.height<=20) return; // tiny icon — almost always decorative
        const hasTitle = svg.querySelector(':scope > title');
        const hasLabel = svg.getAttribute('aria-label') || svg.getAttribute('aria-labelledby');
        const role = svg.getAttribute('role');
        if(!hasTitle && !hasLabel && role!=='presentation' && role!=='none'){
          issues.push({el:svg, msg:'Standalone <svg> has no <title>, aria-label, or aria-hidden.', fix:'Add <title> child, aria-label, or aria-hidden="true" if decorative.'});
        }
      });
      const total=document.querySelectorAll('img,input[type=image],svg').length;
      return { status: issues.length?'fail':(total?'pass':'na'), issues, summary: issues.length?`${issues.length} image(s) need attention`:`All ${total} image(s) have appropriate text alternatives` };
    });

    // 1.2.1 Audio-only / Video-only (Prerecorded)
    add('1.2.1','Audio-only / Video-only (Prerecorded)','A','Perceivable',()=>{
      const issues=[];
      document.querySelectorAll('audio,video').forEach(m=>{
        if(m.tagName==='VIDEO'){
          // video-only if no audio tracks — hard to detect, flag for manual review
          if(!m.querySelector('track[kind="descriptions"]') && !m.getAttribute('aria-label')){
            issues.push({el:m, msg:'Video found — verify it has a text alternative or descriptive audio track if it has no soundtrack.', snippet:snippetOf(m), fix:'Provide transcript or audio description for video-only content.'});
          }
        } else {
          if(!document.querySelector(`[aria-describedby="${m.id}"]`) && !m.getAttribute('aria-label')){
            issues.push({el:m, msg:'Audio element should have a transcript nearby.', snippet:snippetOf(m), fix:'Provide a text transcript for audio-only content.'});
          }
        }
      });
      const total=document.querySelectorAll('audio,video').length;
      return { status: total===0?'na':(issues.length?'warn':'manual'), issues, summary: total===0?'No audio/video on page':`${total} media element(s) — manual review recommended`, manual:total>0 };
    });

    // 1.2.2 Captions (Prerecorded)
    add('1.2.2','Captions (Prerecorded)','A','Perceivable',()=>{
      const issues=[];
      document.querySelectorAll('video').forEach(v=>{
        const tracks=v.querySelectorAll('track[kind="captions"], track[kind="subtitles"]');
        if(tracks.length===0){
          issues.push({el:v, msg:'<video> has no <track kind="captions"> element.', snippet:snippetOf(v), fix:'Add <track kind="captions" src="..." srclang="en" label="English">.'});
        }
      });
      const total=document.querySelectorAll('video').length;
      return { status: total===0?'na':(issues.length?'fail':'pass'), issues, summary: total===0?'No video on page':`${issues.length} of ${total} video(s) missing captions` };
    });

    // 1.2.3 Audio Description or Media Alternative
    add('1.2.3','Audio Description or Media Alternative','A','Perceivable',()=>{
      const total=document.querySelectorAll('video').length;
      return { status: total===0?'na':'manual', issues:[], summary: total===0?'No video on page':`${total} video(s) — verify audio description or full text alternative provided`, manual:total>0 };
    });

    // 1.2.4 Captions (Live)
    add('1.2.4','Captions (Live)','AA','Perceivable',()=>{
      return { status:'manual', issues:[], summary:'Manual: any live streamed media must provide live captions.', manual:true };
    });

    // 1.2.5 Audio Description (Prerecorded)
    add('1.2.5','Audio Description (Prerecorded)','AA','Perceivable',()=>{
      const issues=[];
      document.querySelectorAll('video').forEach(v=>{
        if(!v.querySelector('track[kind="descriptions"]')){
          issues.push({el:v, msg:'<video> has no <track kind="descriptions">.', snippet:snippetOf(v), fix:'Add audio description track, or provide a separate described version.'});
        }
      });
      const total=document.querySelectorAll('video').length;
      return { status: total===0?'na':(issues.length?'warn':'pass'), issues, summary: total===0?'No video on page':`${issues.length} of ${total} video(s) may lack audio description` };
    });

    // 1.3.1 Info and Relationships
    add('1.3.1','Info and Relationships','A','Perceivable',()=>{
      const issues=[];
      // Tables without proper structure
      document.querySelectorAll('table').forEach(t=>{
        if(!isVisible(t)) return;
        if(t.getAttribute('role')==='presentation' || t.getAttribute('role')==='none') return;
        const ths=t.querySelectorAll('th');
        const trs=t.querySelectorAll('tr');
        if(trs.length>1 && ths.length===0){
          // Only flag if it's actually a data table (has multiple rows & columns)
          const firstRow = trs[0];
          const cols = firstRow ? firstRow.children.length : 0;
          if(cols>=2 && trs.length>=2){
            issues.push({el:t, msg:`Table has ${trs.length} rows but no <th> headers.`, fix:'Mark header cells with <th> and add scope="col"/scope="row".'});
          }
        }
        // Only flag missing scope on TH if the table is complex (>1 header column or row)
        const hasColHeaders = t.querySelector('thead th, tr:first-child th');
        const hasRowHeaders = t.querySelector('tbody th:first-child, tr td:first-child th');
        if(hasColHeaders && hasRowHeaders){
          ths.forEach(th=>{
            if(!th.getAttribute('scope') && !th.getAttribute('headers')){
              issues.push({el:th, msg:'<th> in complex table missing scope attribute.', fix:'Add scope="col" or scope="row" to clarify header relationship.'});
            }
          });
        }
      });
      // Lists faked with non-<li> direct children
      document.querySelectorAll('ul,ol').forEach(list=>{
        if(!isVisible(list)) return;
        if(list.getAttribute('role')==='none' || list.getAttribute('role')==='presentation') return;
        Array.from(list.children).forEach(child=>{
          if(child.tagName!=='LI' && child.tagName!=='SCRIPT' && child.tagName!=='TEMPLATE' && child.tagName!=='STYLE'){
            issues.push({el:child, msg:`Direct child of <${list.tagName.toLowerCase()}> is <${child.tagName.toLowerCase()}>, expected <li>.`, fix:'Wrap list items in <li> elements only.'});
          }
        });
      });
      // Form inputs without labels
      document.querySelectorAll('input,select,textarea').forEach(inp=>{
        if(!isVisible(inp)) return;
        if(['hidden','submit','button','reset','image'].includes(inp.type)) return;
        if(!accessibleName(inp)){
          issues.push({el:inp, msg:`<${inp.tagName.toLowerCase()}${inp.type?' type="'+inp.type+'"':''}> has no associated label.`, fix:'Wrap in <label>, use <label for="id">, or add aria-label/aria-labelledby.'});
        }
      });
      // Fieldsets for radio/checkbox groups
      const radioGroups={};
      document.querySelectorAll('input[type=radio]').forEach(r=>{
        if(!isVisible(r)) return;
        const n=r.name; if(!n) return;
        (radioGroups[n]=radioGroups[n]||[]).push(r);
      });
      Object.entries(radioGroups).forEach(([n,arr])=>{
        if(arr.length<=1) return;
        const first = arr[0];
        if(first.closest('fieldset')) return;
        const radiogroup = first.closest('[role=radiogroup]');
        if(radiogroup && (radiogroup.getAttribute('aria-label')||radiogroup.getAttribute('aria-labelledby'))) return;
        issues.push({el:first, msg:`Radio group "${n}" (${arr.length} inputs) not wrapped in <fieldset> with <legend>.`, fix:'Wrap radio buttons in <fieldset><legend>Group label</legend>…</fieldset>, or use a container with role="radiogroup" + aria-label.'});
      });
      // role="presentation"/"none" on landmarks
      document.querySelectorAll('[role=presentation],[role=none]').forEach(el=>{
        if(['NAV','MAIN','HEADER','FOOTER','ASIDE','SECTION','ARTICLE'].includes(el.tagName)){
          issues.push({el, msg:`Landmark <${el.tagName.toLowerCase()}> stripped of semantics with role="${el.getAttribute('role')}".`, fix:'Remove role="presentation"/"none" from landmark elements.'});
        }
      });
      return { status: issues.length?'fail':'pass', issues, summary: issues.length?`${issues.length} structural issue(s) found`:'Structure & relationships look correct' };
    });

    // 1.3.2 Meaningful Sequence
    add('1.3.2','Meaningful Sequence','A','Perceivable',()=>{
      const issues=[];
      // Positive tabindex disrupts order
      document.querySelectorAll('[tabindex]').forEach(el=>{
        const ti=parseInt(el.getAttribute('tabindex'),10);
        if(ti>0){
          issues.push({el, msg:`tabindex="${ti}" creates non-DOM tab order.`, snippet:snippetOf(el), fix:'Use tabindex="0" or restructure DOM instead of positive tabindex.'});
        }
      });
      // CSS order/flex-direction:row-reverse — visual signal only, flag manual
      return { status: issues.length?'fail':'pass', issues, summary: issues.length?`${issues.length} positive tabindex issue(s)`:'Reading order appears DOM-driven' };
    });

    // 1.3.3 Sensory Characteristics
    add('1.3.3','Sensory Characteristics','A','Perceivable',()=>{
      const issues=[];
      const phrases=['click the red','the green button','on the right','on the left','above','below','round button','square button'];
      const bodyText=document.body.innerText.toLowerCase();
      phrases.forEach(p=>{
        if(bodyText.includes(p)){
          issues.push({el:document.body, msg:`Possible sensory-only instruction: "${p}".`, snippet:p, fix:'Combine shape/colour/position cues with text labels.'});
        }
      });
      return { status: issues.length?'warn':'pass', issues, summary: issues.length?`${issues.length} possible sensory-only reference(s)`:'No obvious sensory-only instructions detected', manual:true };
    });

    // 1.3.4 Orientation
    add('1.3.4','Orientation','AA','Perceivable',()=>{
      const issues=[];
      // Look for orientation lock in CSS
      const sheets=Array.from(document.styleSheets);
      let locked=false;
      try {
        sheets.forEach(s=>{
          try {
            Array.from(s.cssRules||[]).forEach(r=>{
              if(r.cssText && /orientation\s*:\s*(landscape|portrait)/i.test(r.cssText) && /display\s*:\s*none|visibility\s*:\s*hidden/i.test(r.cssText)){
                locked=true;
              }
            });
          } catch(e){}
        });
      } catch(e){}
      if(locked){
        issues.push({el:document.documentElement, msg:'CSS appears to hide content in one orientation.', snippet:'@media (orientation:…)', fix:'Allow content in both portrait and landscape orientations.'});
      }
      return { status: issues.length?'fail':'pass', issues, summary: issues.length?'Orientation may be locked':'No orientation lock detected', manual:!issues.length };
    });

    // 1.3.5 Identify Input Purpose
    add('1.3.5','Identify Input Purpose','AA','Perceivable',()=>{
      const issues=[];
      const autocompleteHints={
        email:['email'],
        tel:['tel','tel-national'],
        password:['current-password','new-password'],
        url:['url'],
      };
      document.querySelectorAll('input').forEach(inp=>{
        const t=(inp.type||'text').toLowerCase();
        const name=(inp.name||inp.id||'').toLowerCase();
        const ac=inp.getAttribute('autocomplete');
        const shouldHave=/email|phone|tel|address|name|zip|postal|city|country|cc-|card|birth/i.test(name) || ['email','tel','password'].includes(t);
        if(shouldHave && (!ac || ac==='off')){
          issues.push({el:inp, msg:`Input collecting personal data should have autocomplete attribute (type=${t}, name=${name}).`, snippet:snippetOf(inp), fix:'Add autocomplete="email" / "tel" / "name" / "street-address" etc. as appropriate.'});
        }
      });
      return { status: issues.length?'warn':'pass', issues, summary: issues.length?`${issues.length} input(s) missing autocomplete hints`:'Personal data inputs have autocomplete hints' };
    });

    // 1.4.1 Use of Color
    add('1.4.1','Use of Color','A','Perceivable',()=>{
      const issues=[];
      // Links inside text without underline or other distinguisher
      document.querySelectorAll('p a, li a, td a, span > a').forEach(a=>{
        if(!isVisible(a)) return;
        const s=window.getComputedStyle(a);
        if(s.textDecorationLine==='none' && !a.querySelector('b,strong,em,i,u') && a.children.length===0){
          // check if surrounding text colour differs by more than colour alone
          const parent=a.parentElement;
          const ps=window.getComputedStyle(parent);
          if(ps.color===s.color) return;
          // colour is the only distinguisher — flag
          issues.push({el:a, msg:'Inline link distinguished from text only by colour (no underline/bold).', snippet:snippetOf(a), fix:'Add text-decoration:underline or another non-colour cue.'});
        }
      });
      return { status: issues.length?'warn':'pass', issues, summary: issues.length?`${issues.length} colour-only distinguisher(s) found`:'No colour-only signalling detected', manual:true };
    });

    // 1.4.2 Audio Control
    add('1.4.2','Audio Control','A','Perceivable',()=>{
      const issues=[];
      document.querySelectorAll('audio[autoplay],video[autoplay]').forEach(m=>{
        if(!m.muted && !m.controls){
          issues.push({el:m, msg:'Autoplay media without controls or muted attribute.', snippet:snippetOf(m), fix:'Add controls attribute, mute by default, or remove autoplay.'});
        }
      });
      return { status: issues.length?'fail':'pass', issues, summary: issues.length?`${issues.length} autoplay issue(s)`:'No problematic auto-playing media' };
    });

    // 1.4.3 Contrast (Minimum) — biggest auto-test
    add('1.4.3','Contrast (Minimum)','AA','Perceivable',()=>{
      const issues=[];
      const seen=new WeakSet();
      const signatures=new Set(); // dedupe identical fg/bg/size combos at the same selector path
      let manualCount=0;
      const walker=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(n){
          if(!n.textContent.trim()) return NodeFilter.FILTER_REJECT;
          const p=n.parentElement;
          if(!p || seen.has(p)) return NodeFilter.FILTER_REJECT;
          if(['SCRIPT','STYLE','NOSCRIPT','TEMPLATE'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
          if(p.closest(SKIP_SELECTORS)) return NodeFilter.FILTER_REJECT;
          if(!isVisible(p)) return NodeFilter.FILTER_REJECT;
          // Tiny opacity isn't "invisible" but it's so faint that contrast is meaningless and the user can't read it anyway — skip
          const op = parseFloat(window.getComputedStyle(p).opacity);
          if(op < 0.1) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      let node, checked=0;
      while((node=walker.nextNode()) && checked<500){
        const p=node.parentElement; seen.add(p);
        const style=window.getComputedStyle(p);
        const fgRaw=parseRGBA(style.color);
        if(!fgRaw || fgRaw.a<0.1) continue;
        // Walk up looking for non-solid backgrounds (image, gradient). If we hit one before a solid colour, we can't compute reliably.
        let n=p, hasComplexBg=false;
        while(n && n!==document.documentElement){
          const ns = window.getComputedStyle(n);
          const bgi = ns.backgroundImage;
          if(bgi && bgi!=='none'){ hasComplexBg=true; break; }
          const bc = parseRGBA(ns.backgroundColor);
          if(bc && bc.a>=0.99) break; // fully opaque solid — safe to stop
          n = n.parentElement;
        }
        if(hasComplexBg){ manualCount++; continue; }
        const bg=getEffectiveBg(p);
        // Apply foreground alpha against the effective bg
        let fr=fgRaw.r, fg=fgRaw.g, fb=fgRaw.b;
        if(fgRaw.a < 1){
          fr = Math.round(fgRaw.a*fr + (1-fgRaw.a)*bg.r);
          fg = Math.round(fgRaw.a*fg + (1-fgRaw.a)*bg.g);
          fb = Math.round(fgRaw.a*fb + (1-fgRaw.a)*bg.b);
        }
        const ratio=cRatio(lum(fr,fg,fb),lum(bg.r,bg.g,bg.b));
        const fs=parseFloat(style.fontSize);
        const fw=parseInt(style.fontWeight,10)||400;
        const isLarge=(fs>=24) || (fs>=18.66 && fw>=700);
        const required=isLarge?3:4.5;
        checked++;
        if(ratio<required){
          const fgHex=toHex(fr,fg,fb), bgHex=toHex(bg.r,bg.g,bg.b);
          // dedupe: same fg/bg/size on similar selector path → only report once
          const sig = `${fgHex}|${bgHex}|${fs|0}|${fw}|${buildSelector(p).split('>').slice(-2).join('>')}`;
          if(signatures.has(sig)) continue;
          signatures.add(sig);
          issues.push({
            el:p,
            msg:`Contrast ${ratio.toFixed(2)}:1 (needs ${required}:1 for ${isLarge?'large':'normal'} text).`,
            fix:`Adjust text or background colour. FG ${fgHex}, BG ${bgHex}.`,
            ratio, fgHex, bgHex, required,
            fontSize: fs, fontWeight: fw, isLarge,
            text: (node.textContent||'').trim().slice(0,60)
          });
        }
      }
      let summary;
      if(issues.length===0 && manualCount===0) summary = `All ${checked} text element(s) pass AA contrast`;
      else if(issues.length===0) summary = `${checked} pass · ${manualCount} on image/gradient bg (verify manually)`;
      else summary = `${issues.length} unique contrast failures of ${checked} text elements${manualCount?` (${manualCount} on complex backgrounds skipped)`:''}`;
      return { status: issues.length?'fail':(manualCount?'warn':'pass'), issues, summary };
    });

    // 1.4.4 Resize Text
    add('1.4.4','Resize Text','AA','Perceivable',()=>{
      const issues=[];
      // Look for viewport meta with user-scalable=no or maximum-scale
      const vp=document.querySelector('meta[name="viewport"]');
      if(vp){
        const c=vp.getAttribute('content')||'';
        if(/user-scalable\s*=\s*(no|0)/i.test(c)){
          issues.push({el:vp, msg:'Viewport prevents user scaling (user-scalable=no).', snippet:snippetOf(vp), fix:'Remove user-scalable=no from viewport meta.'});
        }
        const ms=c.match(/maximum-scale\s*=\s*([\d.]+)/i);
        if(ms && parseFloat(ms[1])<2){
          issues.push({el:vp, msg:`maximum-scale=${ms[1]} limits zoom below 200%.`, snippet:snippetOf(vp), fix:'Remove or raise maximum-scale to at least 2.0.'});
        }
      }
      // px font sizes everywhere (less critical but noted)
      return { status: issues.length?'fail':'pass', issues, summary: issues.length?'Zoom is restricted':'Page allows 200% zoom' };
    });

    // 1.4.5 Images of Text
    add('1.4.5','Images of Text','AA','Perceivable',()=>{
      return { status:'manual', issues:[], summary:'Manual: verify no decorative images contain critical text (use real text + CSS).', manual:true };
    });

    // 1.4.10 Reflow
    add('1.4.10','Reflow','AA','Perceivable',()=>{
      const issues=[];
      // horizontal scrollbar at full width suggests reflow issues
      const docW=document.documentElement.scrollWidth;
      const viewW=window.innerWidth;
      if(docW>viewW+5){
        issues.push({el:document.body, msg:`Document is wider than viewport (${docW}px vs ${viewW}px) — horizontal scrolling required.`, snippet:'document', fix:'Ensure content reflows at 320 CSS pixels wide without horizontal scroll.'});
      }
      // Fixed-width containers
      document.querySelectorAll('div,section,article').forEach(el=>{
        const s=window.getComputedStyle(el);
        if(s.minWidth && s.minWidth.endsWith('px') && parseFloat(s.minWidth)>800){
          issues.push({el, msg:`Element has min-width:${s.minWidth} — may prevent reflow.`, snippet:snippetOf(el), fix:'Use max-width with responsive units instead of fixed min-width.'});
        }
      });
      return { status: issues.length?'warn':'pass', issues, summary: issues.length?`${issues.length} reflow concern(s)`:'No obvious reflow blockers' };
    });

    // 1.4.11 Non-text Contrast
    add('1.4.11','Non-text Contrast','AA','Perceivable',()=>{
      const issues=[];
      const sigs=new Set();
      document.querySelectorAll('button,input:not([type=hidden]):not([type=submit]):not([type=button]),select,textarea').forEach(el=>{
        if(!isVisible(el)) return;
        if(el.disabled) return; // disabled controls are exempt from contrast
        const s=window.getComputedStyle(el);
        // 1) If there's a visible background colour distinct from page bg, skip border test (the bg differentiates the control)
        const ownBg=parseRGBA(s.backgroundColor);
        const parentBg=el.parentElement?getEffectiveBg(el.parentElement):{r:255,g:255,b:255};
        if(ownBg && ownBg.a>0.5){
          const bgRatio = cRatio(lum(ownBg.r,ownBg.g,ownBg.b), lum(parentBg.r,parentBg.g,parentBg.b));
          if(bgRatio>=3) return; // background already distinguishes the control
        }
        // 2) Otherwise check border contrast
        const bw=parseFloat(s.borderTopWidth);
        if(bw<1) return;
        const borderC=parseRGBA(s.borderTopColor);
        if(!borderC || borderC.a<0.3) return;
        const r=cRatio(lum(borderC.r,borderC.g,borderC.b),lum(parentBg.r,parentBg.g,parentBg.b));
        if(r>=3) return;
        const sig = `${toHex(borderC.r,borderC.g,borderC.b)}|${toHex(parentBg.r,parentBg.g,parentBg.b)}|${el.tagName}`;
        if(sigs.has(sig)) return; sigs.add(sig);
        issues.push({el, msg:`UI component border contrast ${r.toFixed(2)}:1 (needs 3:1).`, fix:`Darken border or change page background. Border ${toHex(borderC.r,borderC.g,borderC.b)} vs BG ${toHex(parentBg.r,parentBg.g,parentBg.b)}.`,
          ratio:r, fgHex:toHex(borderC.r,borderC.g,borderC.b), bgHex:toHex(parentBg.r,parentBg.g,parentBg.b), required:3});
      });
      return { status: issues.length?'warn':'pass', issues:issues.slice(0,30), summary: issues.length?`${issues.length} UI border(s) low contrast`:'UI component contrast OK' };
    });

    // 1.4.12 Text Spacing
    add('1.4.12','Text Spacing','AA','Perceivable',()=>{
      const issues=[];
      // Look for !important on line-height/letter-spacing that could block user overrides
      const sheets=Array.from(document.styleSheets);
      try {
        sheets.forEach(s=>{
          try{
            Array.from(s.cssRules||[]).forEach(r=>{
              if(r.cssText && /(line-height|letter-spacing|word-spacing)\s*:[^;]+!important/i.test(r.cssText) && !r.cssText.includes('@')){
                issues.push({el:null, msg:'CSS uses !important on text-spacing properties — may block user overrides.', snippet:r.cssText.slice(0,100), fix:'Avoid !important on line-height, letter-spacing, word-spacing.'});
              }
            });
          }catch(e){}
        });
      } catch(e){}
      return { status: issues.length?'warn':'pass', issues:issues.slice(0,5), summary: issues.length?'Text-spacing !important rules found':'No text-spacing overrides detected', manual:true };
    });

    // 1.4.13 Content on Hover or Focus
    add('1.4.13','Content on Hover or Focus','AA','Perceivable',()=>{
      const issues=[];
      document.querySelectorAll('[title]').forEach(el=>{
        if(el.getAttribute('title').length>20){
          issues.push({el, msg:'Long title attribute — native tooltip is not dismissible/hoverable/persistent.', snippet:snippetOf(el), fix:'Replace title with a custom tooltip that is dismissible (Esc), hoverable, and persistent.'});
        }
      });
      return { status: issues.length?'warn':'pass', issues:issues.slice(0,20), summary: issues.length?`${issues.length} title-attribute tooltip(s)`:'No long title tooltips', manual:true };
    });

    // ═══════════════════════════════════════════════════════════════════
    // PRINCIPLE 2 — OPERABLE
    // ═══════════════════════════════════════════════════════════════════

    // 2.1.1 Keyboard
    add('2.1.1','Keyboard','A','Operable',()=>{
      const issues=[];
      const seen=new WeakSet();
      document.querySelectorAll('[onclick]').forEach(el=>{
        if(!isVisible(el)) return;
        const tag=el.tagName;
        if(['A','BUTTON','INPUT','SELECT','TEXTAREA'].includes(tag)) return;
        // suppress if it inherits interactivity from an ancestor (i.e. the click handler may be redundant or the ancestor handles keyboard)
        if(hasInteractiveAncestor(el, false)) return;
        const role=el.getAttribute('role');
        if(role && ['button','link','checkbox','tab','menuitem','option','switch'].includes(role)){
          if(!el.hasAttribute('tabindex')){
            issues.push({el, msg:`Element with onclick + role="${role}" has no tabindex.`, fix:'Add tabindex="0" and a keydown handler for Enter/Space.'});
          }
        } else {
          issues.push({el, msg:`Non-interactive <${tag.toLowerCase()}> with onclick — not keyboard-operable.`, fix:'Use <button> or <a>, or add role="button", tabindex="0", and keyboard handlers (Enter/Space).'});
        }
        seen.add(el);
      });
      // Elements with cursor:pointer but no semantics — far more conservative now
      document.querySelectorAll('div,span,li').forEach(el=>{
        if(seen.has(el)) return;
        if(!isVisible(el)) return;
        if(el.hasAttribute('onclick') || el.hasAttribute('tabindex') || el.getAttribute('role')) return;
        // skip if any ancestor is already interactive (the cursor:pointer is from the parent's hover)
        if(hasInteractiveAncestor(el, false)) return;
        // skip if the element itself contains an interactive child (then the child is the click target)
        if(el.querySelector('a[href],button,input,select,textarea,[role=button],[role=link],[tabindex]')) return;
        const s=window.getComputedStyle(el);
        if(s.cursor!=='pointer') return;
        // The cursor:pointer must actually be SET on this element, not just inherited as a computed style.
        // Walk up: if any parent also has cursor:pointer, this is likely inherited from a real interactive parent.
        if(hasCursorPointerAncestor(el)) return;
        const r=el.getBoundingClientRect();
        if(r.width<30 || r.height<20) return; // too small to be the click target
        // require at least 30px tall to look like an actual control, OR contain text
        const text = (el.textContent||'').trim();
        if(!text || text.length<2) return;
        issues.push({el, msg:'Element styled clickable (cursor:pointer) but not keyboard-focusable.', fix:'Convert to <button>, or add role="button", tabindex="0", and keyboard handlers.'});
      });
      return { status: issues.length?'fail':'pass', issues:issues.slice(0,40), summary: issues.length?`${issues.length} keyboard-inaccessible interactive element(s)`:'All interactive elements appear keyboard-accessible' };
    });

    // 2.1.2 No Keyboard Trap
    add('2.1.2','No Keyboard Trap','A','Operable',()=>{
      const issues=[];
      // Detect contentEditable without escape mechanism (heuristic)
      document.querySelectorAll('[contenteditable=true],[contenteditable=""]').forEach(el=>{
        // Can't actually test trap without simulating keys — flag tabbable iframes from foreign origins
      });
      // Iframes without title that may trap focus
      document.querySelectorAll('iframe').forEach(f=>{
        if(!f.getAttribute('title')){
          issues.push({el:f, msg:'<iframe> without title — focus entering iframe may not be announced and may trap users.', snippet:snippetOf(f), fix:'Add a meaningful title attribute to every iframe.'});
        }
      });
      // Modal dialogs without proper focus management
      document.querySelectorAll('[role=dialog],[role=alertdialog],dialog').forEach(d=>{
        if(isVisible(d)){
          const closer=d.querySelector('[aria-label*="close" i],[aria-label*="dismiss" i],button[data-dismiss],[data-close]');
          if(!closer){
            issues.push({el:d, msg:'Dialog visible but no clear close/dismiss button found — may trap keyboard users.', snippet:snippetOf(d), fix:'Provide a close button and ensure Esc dismisses; trap focus within dialog only while open.'});
          }
        }
      });
      return { status: issues.length?'warn':'pass', issues, summary: issues.length?`${issues.length} potential keyboard-trap risk(s)`:'No obvious keyboard traps detected', manual:true };
    });

    // 2.1.4 Character Key Shortcuts
    add('2.1.4','Character Key Shortcuts','A','Operable',()=>{
      return { status:'manual', issues:[], summary:'Manual: if single-key shortcuts exist, ensure they can be disabled or remapped.', manual:true };
    });

    // 2.2.1 Timing Adjustable
    add('2.2.1','Timing Adjustable','A','Operable',()=>{
      const issues=[];
      // meta refresh
      const ref=document.querySelector('meta[http-equiv="refresh" i]');
      if(ref){
        const c=ref.getAttribute('content')||'';
        const m=c.match(/^\s*(\d+)/);
        if(m && +m[1]>0 && +m[1]<20){
          issues.push({el:ref, msg:`Page auto-refreshes every ${m[1]}s.`, snippet:snippetOf(ref), fix:'Remove meta refresh, or provide controls to extend/disable.'});
        }
      }
      return { status: issues.length?'fail':'pass', issues, summary: issues.length?'Auto-refresh found':'No auto-refresh detected', manual:!issues.length };
    });

    // 2.2.2 Pause, Stop, Hide
    add('2.2.2','Pause, Stop, Hide','A','Operable',()=>{
      const issues=[];
      // CSS animations longer than 5s with infinite iteration
      document.querySelectorAll('*').forEach(el=>{
        const s=window.getComputedStyle(el);
        if(s.animationIterationCount==='infinite' && s.animationName!=='none'){
          const dur=parseFloat(s.animationDuration);
          if(dur>0){
            // flag once per unique style
          }
        }
      });
      document.querySelectorAll('marquee,blink').forEach(el=>{
        issues.push({el, msg:`<${el.tagName.toLowerCase()}> is deprecated and inaccessible.`, snippet:snippetOf(el), fix:'Replace with static text or a pausable CSS animation.'});
      });
      return { status: issues.length?'fail':'pass', issues, summary: issues.length?`${issues.length} non-pausable motion issue(s)`:'No marquee/blink elements', manual:true };
    });

    // 2.3.1 Three Flashes or Below Threshold
    add('2.3.1','Three Flashes or Below Threshold','A','Operable',()=>{
      return { status:'manual', issues:[], summary:'Manual: verify no content flashes more than 3 times per second.', manual:true };
    });

    // 2.4.1 Bypass Blocks (Skip link)
    add('2.4.1','Bypass Blocks (Skip link)','A','Operable',()=>{
      const issues=[];
      const hasMain=document.querySelector('main, [role=main]');
      // skip link = first focusable link, often visually hidden, jumps to main content
      const firstLink=document.querySelector('a[href^="#"]');
      let hasSkip=false;
      document.querySelectorAll('a[href^="#"]').forEach(a=>{
        const href=a.getAttribute('href');
        if(!href || href==='#') return;
        const txt=(a.textContent||'').toLowerCase();
        if(/skip|jump|main content|to content/.test(txt)){
          // verify target exists
          const target=document.querySelector(href);
          if(target) hasSkip=true;
        }
      });
      if(!hasSkip && !hasMain){
        issues.push({el:document.body, msg:'No skip link AND no <main> landmark found — keyboard users cannot bypass repeated content.', snippet:'<body>', fix:'Add a "Skip to main content" link as the first focusable element, pointing to <main id="main">.'});
      } else if(!hasSkip){
        issues.push({el:document.body, msg:'No "Skip to main content" link detected.', snippet:'<body>', fix:'Add a skip link as the first focusable element of the page.'});
      }
      return { status: issues.length?'fail':'pass', issues, summary: issues.length?'Skip-link missing':'Skip-link / bypass mechanism present' };
    });

    // 2.4.2 Page Titled
    add('2.4.2','Page Titled','A','Operable',()=>{
      const issues=[];
      const t=document.title;
      if(!t || !t.trim()){
        issues.push({el:document.querySelector('title')||document.head, msg:'Page has no <title>.', snippet:'<title>', fix:'Add a unique, descriptive <title> to the <head>.'});
      } else if(t.trim().length<3){
        issues.push({el:document.querySelector('title'), msg:`Page title is too short: "${t}".`, snippet:'<title>'+t+'</title>', fix:'Make the title descriptive of the page content.'});
      } else if(/untitled|new tab|new page|document/i.test(t)){
        issues.push({el:document.querySelector('title'), msg:`Generic page title: "${t}".`, snippet:'<title>'+t+'</title>', fix:'Replace with a unique title describing this page.'});
      }
      return { status: issues.length?'fail':'pass', issues, summary: issues.length?'Page title problem':`Page title OK: "${t}"` };
    });

    // 2.4.3 Focus Order
    add('2.4.3','Focus Order','A','Operable',()=>{
      const issues=[];
      const positives=document.querySelectorAll('[tabindex]');
      positives.forEach(el=>{
        const ti=parseInt(el.getAttribute('tabindex'),10);
        if(ti>0) issues.push({el, msg:`tabindex="${ti}" — positive values disrupt natural focus order.`, snippet:snippetOf(el), fix:'Use tabindex="0" and order DOM correctly.'});
      });
      return { status: issues.length?'fail':'pass', issues, summary: issues.length?`${issues.length} positive tabindex(es)`:'Focus order follows DOM' };
    });

    // 2.4.4 Link Purpose
    add('2.4.4','Link Purpose (In Context)','A','Operable',()=>{
      const issues=[];
      document.querySelectorAll('a[href]').forEach(a=>{
        if(!isVisible(a)) return;
        if(a.getAttribute('aria-hidden')==='true') return;
        const name=accessibleName(a);
        if(!name){
          issues.push({el:a, msg:'Link has no accessible name (empty link).', fix:'Add visible text, aria-label, or alt text for icon-only links.'});
          return;
        }
        // Ambiguous link text
        if(/^(click here|here|more|read more|learn more|link|details|view|see more|more info)\.?$/i.test(name.trim())){
          // If aria-describedby provides context, this is OK
          if(a.getAttribute('aria-describedby')) return;
          issues.push({el:a, msg:`Ambiguous link text: "${name}".`, fix:'Replace with descriptive text that conveys the link\'s destination.'});
        }
      });
      return { status: issues.length?'fail':'pass', issues:issues.slice(0,40), summary: issues.length?`${issues.length} link(s) with unclear purpose`:'All links have clear purpose' };
    });

    // 2.4.5 Multiple Ways
    add('2.4.5','Multiple Ways','AA','Operable',()=>{
      const issues=[];
      const nav=document.querySelector('nav, [role=navigation]');
      const search=document.querySelector('input[type=search],[role=search]');
      const sitemap=document.querySelector('a[href*="sitemap" i]');
      const ways=[nav,search,sitemap].filter(Boolean).length;
      if(ways<2){
        issues.push({el:document.body, msg:'Page provides only one way to locate content (no combination of nav + search + sitemap).', snippet:'<body>', fix:'Provide at least two of: navigation menu, site search, sitemap, A–Z index, related links.'});
      }
      return { status: issues.length?'warn':'pass', issues, summary: issues.length?'Fewer than 2 location mechanisms':'Multiple ways available', manual:true };
    });

    // 2.4.6 Headings and Labels
    add('2.4.6','Headings and Labels','AA','Operable',()=>{
      const issues=[];
      // Empty headings
      document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h=>{
        if(!isVisible(h)) return;
        const hasContent = (h.textContent||'').trim() || h.getAttribute('aria-label') || h.getAttribute('aria-labelledby') || h.querySelector('img[alt]:not([alt=""])');
        if(!hasContent){
          issues.push({el:h, msg:`Empty <${h.tagName.toLowerCase()}>.`, fix:'Add text content or aria-label, or remove the empty heading.'});
        }
      });
      // Heading order
      const hs=Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).filter(isVisible);
      let prev=0;
      hs.forEach(h=>{
        const lvl=+h.tagName[1];
        if(prev && lvl>prev+1){
          issues.push({el:h, msg:`Heading level jumps from h${prev} to h${lvl}.`, fix:`Use h${prev+1} for proper hierarchy.`, prevLevel:prev, thisLevel:lvl});
        }
        prev=lvl;
      });
      // h1 count
      const h1s=Array.from(document.querySelectorAll('h1')).filter(isVisible);
      if(h1s.length>1){
        issues.push({el:h1s[1], msg:`Page has ${h1s.length} visible <h1> elements — typically only one main page heading.`, fix:'Keep a single <h1> describing the page; demote others to <h2> or below.'});
      }
      // Empty labels
      document.querySelectorAll('label').forEach(l=>{
        if(!isVisible(l)) return;
        if(!(l.textContent||'').trim() && !l.querySelector('img[alt]:not([alt=""])')){
          issues.push({el:l, msg:'Empty <label>.', fix:'Add descriptive text inside the label.'});
        }
      });
      return { status: issues.length?'fail':'pass', issues, summary: issues.length?`${issues.length} heading/label issue(s)`:'Headings & labels look good' };
    });

    // 2.4.7 Focus Visible
    add('2.4.7','Focus Visible','AA','Operable',()=>{
      const issues=[];
      // Look for global outline:none/0 with no replacement
      const sheets=Array.from(document.styleSheets);
      try{
        sheets.forEach(s=>{
          try{
            Array.from(s.cssRules||[]).forEach(r=>{
              if(!r.cssText) return;
              if(/:focus[^{]*{[^}]*outline\s*:\s*(none|0)/i.test(r.cssText) && !/box-shadow|border/i.test(r.cssText)){
                issues.push({el:null, msg:`CSS removes focus outline without replacement.`, snippet:r.cssText.slice(0,140), fix:'Replace outline:none with a visible focus indicator (outline, box-shadow, or border change).'});
              }
            });
          }catch(e){}
        });
      } catch(e){}
      // Universal outline:none
      try{
        sheets.forEach(s=>{
          try{
            Array.from(s.cssRules||[]).forEach(r=>{
              if(r.selectorText==='*' && /outline\s*:\s*(none|0)/i.test(r.cssText||'')){
                issues.push({el:null, msg:'Universal selector removes outline.', snippet:r.cssText.slice(0,140), fix:'Do not remove outline globally; style :focus-visible explicitly.'});
              }
            });
          }catch(e){}
        });
      } catch(e){}
      return { status: issues.length?'fail':'pass', issues:issues.slice(0,10), summary: issues.length?`${issues.length} focus-visible removal rule(s)`:'No outline removals detected' };
    });

    // 2.4.11 Focus Not Obscured
    add('2.4.11','Focus Not Obscured (Minimum)','AA','Operable',()=>{
      const issues=[];
      // sticky/fixed headers and footers may obscure focus
      document.querySelectorAll('header,nav,footer,[role=banner],[role=navigation],[role=contentinfo]').forEach(el=>{
        const s=window.getComputedStyle(el);
        if(s.position==='fixed' || s.position==='sticky'){
          const r=el.getBoundingClientRect();
          if(r.height>60){
            issues.push({el, msg:`Fixed/sticky element (${r.height|0}px tall) may obscure focused items when scrolling.`, snippet:snippetOf(el), fix:'Use scroll-margin-top on focusable elements or shrink fixed bars.'});
          }
        }
      });
      return { status: issues.length?'warn':'pass', issues, summary: issues.length?`${issues.length} fixed bar(s) — verify focus not obscured`:'No tall fixed bars detected', manual:true };
    });

    // 2.5.1 Pointer Gestures
    add('2.5.1','Pointer Gestures','A','Operable',()=>{
      return { status:'manual', issues:[], summary:'Manual: any multi-point or path-based gestures (pinch, swipe path) must have single-point alternatives.', manual:true };
    });

    // 2.5.2 Pointer Cancellation
    add('2.5.2','Pointer Cancellation','A','Operable',()=>{
      return { status:'manual', issues:[], summary:'Manual: actions should trigger on pointerup (not pointerdown), allowing the user to abort by moving off.', manual:true };
    });

    // 2.5.3 Label in Name
    add('2.5.3','Label in Name','A','Operable',()=>{
      const issues=[];
      document.querySelectorAll('button,a[href],input[type=button],input[type=submit],[role=button],[role=link]').forEach(el=>{
        if(!isVisible(el)) return;
        // Get the visible text — strip non-letter glyphs (emoji icons commonly appear before labels)
        let visible=(el.textContent||el.value||'').trim().toLowerCase();
        // Remove emoji/symbol characters; keep letters & digits & ASCII punctuation
        visible = visible.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}]/gu,'').trim();
        if(!visible || visible.length<2) return; // no useful visible text
        const aria=(el.getAttribute('aria-label')||'').trim().toLowerCase();
        if(!aria) return; // no aria-label to compare against
        if(!aria.includes(visible)){
          issues.push({el, msg:`Visible text "${visible}" not contained in aria-label "${aria}".`, fix:'Make sure aria-label starts with or contains the visible text so voice-control users can speak it.'});
        }
      });
      return { status: issues.length?'fail':'pass', issues:issues.slice(0,30), summary: issues.length?`${issues.length} label-in-name mismatch(es)`:'aria-label values include visible text' };
    });

    // 2.5.4 Motion Actuation
    add('2.5.4','Motion Actuation','A','Operable',()=>{
      const motionEvents=['devicemotion','deviceorientation'];
      let found=false;
      // Heuristic: look in inline scripts
      Array.from(document.scripts).forEach(s=>{
        motionEvents.forEach(e=>{ if(s.textContent && s.textContent.includes(e)) found=true; });
      });
      if(found){
        return { status:'warn', issues:[{el:null, msg:'Device-motion event listeners detected.', snippet:'devicemotion/deviceorientation', fix:'Provide UI alternative and allow user to disable motion-triggered actions.'}], summary:'Motion actuation detected', manual:true };
      }
      return { status:'pass', issues:[], summary:'No motion-actuated controls detected' };
    });

    // 2.5.7 Dragging Movements
    add('2.5.7','Dragging Movements','AA','Operable',()=>{
      const issues=[];
      document.querySelectorAll('[draggable=true]').forEach(el=>{
        issues.push({el, msg:'Draggable element — ensure single-pointer alternative (button, arrow keys).', snippet:snippetOf(el), fix:'Add buttons/keyboard support for reordering/moving without dragging.'});
      });
      return { status: issues.length?'warn':'pass', issues, summary: issues.length?`${issues.length} draggable element(s) — verify alternatives`:'No draggable elements', manual:true };
    });

    // 2.5.8 Target Size Minimum (24×24)
    add('2.5.8','Target Size Minimum','AA','Operable',()=>{
      const issues=[];
      document.querySelectorAll('a[href],button:not([disabled]),input[type=button]:not([disabled]),input[type=submit]:not([disabled]),input[type=checkbox]:not([disabled]),input[type=radio]:not([disabled]),[role=button]:not([aria-disabled=true])').forEach(el=>{
        if(!isVisible(el)) return;
        if(el.closest(SKIP_SELECTORS)) return;
        const r=el.getBoundingClientRect();
        if(r.width===0||r.height===0) return;
        if(r.width>=24 && r.height>=24) return;
        // Inline link inside text — exempt per WCAG
        if(el.tagName==='A' && el.closest('p,li,td,th,h1,h2,h3,h4,h5,h6,span,em,strong,small,dt,dd,figcaption,blockquote')){
          // verify it's actually inline (not display:block/flex)
          const d = window.getComputedStyle(el).display;
          if(d==='inline' || d==='inline-block') return;
        }
        // "Inline of a sentence" exception: paragraph contains other text aside from this link
        // Equivalent target available nearby: skip if there's a sibling control with same destination
        if(el.tagName==='A'){
          const href = el.getAttribute('href');
          if(href){
            const dup = el.parentElement && Array.from(el.parentElement.querySelectorAll(`a[href="${href.replace(/"/g,'\\"')}"]`)).find(s=>s!==el && s.getBoundingClientRect().width>=24 && s.getBoundingClientRect().height>=24);
            if(dup) return;
          }
        }
        // Spacing exception: if surrounding clear space (no other interactive within 24px) ⇒ pass (we approximate by neighbours within 12px each side)
        issues.push({el, msg:`Target size ${Math.round(r.width)}×${Math.round(r.height)}px — below 24×24px minimum.`, fix:'Increase clickable area to at least 24×24 CSS pixels (padding/min-width/min-height).',
          targetSize:{w:Math.round(r.width),h:Math.round(r.height)}, required:24});
      });
      return { status: issues.length?'warn':'pass', issues:issues.slice(0,30), summary: issues.length?`${issues.length} target(s) under 24×24px`:'All targets ≥24×24px' };
    });

    // ═══════════════════════════════════════════════════════════════════
    // PRINCIPLE 3 — UNDERSTANDABLE
    // ═══════════════════════════════════════════════════════════════════

    // 3.1.1 Language of Page
    add('3.1.1','Language of Page','A','Understandable',()=>{
      const issues=[];
      const lang=document.documentElement.getAttribute('lang');
      if(!lang){
        issues.push({el:document.documentElement, msg:'<html> missing lang attribute.', snippet:'<html>', fix:'Add lang="en" (or appropriate ISO 639 code) to <html>.'});
      } else if(lang.length<2){
        issues.push({el:document.documentElement, msg:`<html lang="${lang}"> appears invalid.`, snippet:`<html lang="${lang}">`, fix:'Use a valid ISO 639 language code like "en", "fr", "hi".'});
      }
      return { status: issues.length?'fail':'pass', issues, summary: issues.length?'<html lang> missing':`<html lang="${lang}">` };
    });

    // 3.1.2 Language of Parts
    add('3.1.2','Language of Parts','AA','Understandable',()=>{
      return { status:'manual', issues:[], summary:'Manual: passages in another language should have lang="…" on their wrapper.', manual:true };
    });

    // 3.2.1 On Focus
    add('3.2.1','On Focus','A','Understandable',()=>{
      const issues=[];
      // Look for inline onfocus handlers that change context
      document.querySelectorAll('[onfocus]').forEach(el=>{
        const h=el.getAttribute('onfocus')||'';
        if(/submit|location|window\.open|navigate/i.test(h)){
          issues.push({el, msg:'onfocus handler appears to change context (submit/navigation).', snippet:snippetOf(el), fix:'Do not navigate or submit on focus; wait for explicit user action.'});
        }
      });
      return { status: issues.length?'fail':'pass', issues, summary: issues.length?'Focus-change behaviour detected':'No on-focus context changes detected', manual:true };
    });

    // 3.2.2 On Input
    add('3.2.2','On Input','A','Understandable',()=>{
      const issues=[];
      document.querySelectorAll('select[onchange]').forEach(s=>{
        const h=s.getAttribute('onchange')||'';
        if(/submit|location|window\.open/i.test(h)){
          issues.push({el:s, msg:'Select onchange triggers navigation/submit — context change on input.', snippet:snippetOf(s), fix:'Use a separate "Go" button instead of auto-submitting on change.'});
        }
      });
      return { status: issues.length?'warn':'pass', issues, summary: issues.length?'Input-triggered context changes':'No auto-submit on input detected', manual:true };
    });

    // 3.2.3 Consistent Navigation
    add('3.2.3','Consistent Navigation','AA','Understandable',()=>{
      return { status:'manual', issues:[], summary:'Manual: nav menus must appear in same order across pages.', manual:true };
    });

    // 3.2.4 Consistent Identification
    add('3.2.4','Consistent Identification','AA','Understandable',()=>{
      return { status:'manual', issues:[], summary:'Manual: same-function components must use same labels/icons across pages.', manual:true };
    });

    // 3.2.6 Consistent Help
    add('3.2.6','Consistent Help','A','Understandable',()=>{
      return { status:'manual', issues:[], summary:'Manual: help mechanisms (contact, chat) must appear in consistent location across pages.', manual:true };
    });

    // 3.3.1 Error Identification
    add('3.3.1','Error Identification','A','Understandable',()=>{
      const issues=[];
      // Required fields without aria-required or required attr
      document.querySelectorAll('input[required],select[required],textarea[required]').forEach(inp=>{
        if(!inp.getAttribute('aria-required') && !inp.required){
          // already has required attribute, that's fine
        }
      });
      // forms with novalidate
      document.querySelectorAll('form[novalidate]').forEach(f=>{
        issues.push({el:f, msg:'Form has novalidate — ensure custom validation provides clear error messages.', snippet:snippetOf(f), fix:'When intercepting validation, expose errors via aria-invalid + aria-describedby.'});
      });
      return { status: issues.length?'warn':'pass', issues, summary: issues.length?`${issues.length} form(s) need error-handling review`:'No obvious error-handling issues', manual:true };
    });

    // 3.3.2 Labels or Instructions
    add('3.3.2','Labels or Instructions','A','Understandable',()=>{
      const issues=[];
      document.querySelectorAll('input,select,textarea').forEach(inp=>{
        if(!isVisible(inp)) return;
        if(['hidden','submit','button','reset','image'].includes(inp.type)) return;
        const name = accessibleName(inp);
        const placeholder = inp.getAttribute('placeholder');
        if(!name){
          if(placeholder){
            issues.push({el:inp, msg:'Input has placeholder but no label.', fix:'Placeholders disappear on typing and are not a substitute for labels. Add a real <label>.'});
          } else {
            issues.push({el:inp, msg:`<${inp.tagName.toLowerCase()}${inp.type?' type="'+inp.type+'"':''}> has no label/instruction.`, fix:'Add a <label>, aria-label, or aria-labelledby.'});
          }
        }
      });
      return { status: issues.length?'fail':'pass', issues:issues.slice(0,30), summary: issues.length?`${issues.length} input(s) without proper labels`:'All form inputs labeled' };
    });

    // 3.3.3 Error Suggestion
    add('3.3.3','Error Suggestion','AA','Understandable',()=>{
      return { status:'manual', issues:[], summary:'Manual: when errors are detected and suggestions are known, present them to the user.', manual:true };
    });

    // 3.3.4 Error Prevention
    add('3.3.4','Error Prevention (Legal, Financial, Data)','AA','Understandable',()=>{
      return { status:'manual', issues:[], summary:'Manual: high-stakes forms (legal/financial/delete) must allow reverse, check, or confirm.', manual:true };
    });

    // 3.3.7 Redundant Entry
    add('3.3.7','Redundant Entry','A','Understandable',()=>{
      return { status:'manual', issues:[], summary:'Manual: don\'t make users re-enter info already provided in the same flow.', manual:true };
    });

    // 3.3.8 Accessible Authentication
    add('3.3.8','Accessible Authentication','AA','Understandable',()=>{
      const issues=[];
      // password fields that block paste are a flag
      document.querySelectorAll('input[type=password]').forEach(p=>{
        if(p.getAttribute('onpaste')==='return false' || p.getAttribute('onpaste')?.includes('false')){
          issues.push({el:p, msg:'Password field blocks paste — fails accessible authentication.', snippet:snippetOf(p), fix:'Allow paste so password managers can fill the field.'});
        }
      });
      return { status: issues.length?'fail':'pass', issues, summary: issues.length?'Auth field issue':'No auth-paste blockers detected', manual:!issues.length };
    });

    // ═══════════════════════════════════════════════════════════════════
    // PRINCIPLE 4 — ROBUST
    // ═══════════════════════════════════════════════════════════════════

    // 4.1.1 Parsing (deprecated — always N/A)
    add('4.1.1','Parsing','A','Robust',()=>({ status:'na', issues:[], summary:'Deprecated in WCAG 2.2 (always Not Applicable).' }));

    // 4.1.2 Name, Role, Value
    add('4.1.2','Name, Role, Value','A','Robust',()=>{
      const issues=[];
      // Custom interactive elements without role
      document.querySelectorAll('[onclick]').forEach(el=>{
        if(!isVisible(el)) return;
        if(['A','BUTTON','INPUT','SELECT','TEXTAREA','SUMMARY'].includes(el.tagName)) return;
        if(hasInteractiveAncestor(el, false)) return; // ancestor handles role/name
        if(!el.getAttribute('role')){
          issues.push({el, msg:`Custom interactive <${el.tagName.toLowerCase()}> has no role attribute.`, fix:'Add an appropriate ARIA role (button, link, checkbox, etc.).'});
        }
      });
      // Unknown ARIA roles
      const validRoles=new Set(['alert','alertdialog','application','article','banner','button','cell','checkbox','columnheader','combobox','complementary','contentinfo','dialog','document','feed','figure','form','grid','gridcell','group','heading','img','link','list','listbox','listitem','log','main','marquee','math','menu','menubar','menuitem','menuitemcheckbox','menuitemradio','meter','navigation','none','note','option','presentation','progressbar','radio','radiogroup','region','row','rowgroup','rowheader','scrollbar','search','searchbox','separator','slider','spinbutton','status','switch','tab','table','tablist','tabpanel','term','textbox','timer','toolbar','tooltip','tree','treegrid','treeitem','blockquote','caption','code','definition','deletion','emphasis','generic','insertion','mark','paragraph','strong','subscript','superscript','time','directory','doc-abstract','doc-acknowledgments','doc-afterword','doc-appendix','doc-backlink','doc-biblioentry','doc-bibliography','doc-biblioref','doc-chapter','doc-colophon','doc-conclusion','doc-cover','doc-credit','doc-credits','doc-dedication','doc-endnote','doc-endnotes','doc-epigraph','doc-epilogue','doc-errata','doc-example','doc-footnote','doc-foreword','doc-glossary','doc-glossref','doc-index','doc-introduction','doc-noteref','doc-notice','doc-pagebreak','doc-pagelist','doc-part','doc-preface','doc-prologue','doc-pullquote','doc-qna','doc-subtitle','doc-tip','doc-toc']);
      document.querySelectorAll('[role]').forEach(el=>{
        if(!isVisible(el)) return;
        const role=el.getAttribute('role').trim().toLowerCase();
        if(!role) return;
        // Roles can be a space-separated list (fallback chain)
        const roles = role.split(/\s+/);
        const allInvalid = roles.every(r => !validRoles.has(r));
        if(allInvalid){
          issues.push({el, msg:`Unknown role="${role}".`, fix:'Use a valid ARIA role (see WAI-ARIA spec).'});
        }
      });
      // aria-labelledby / aria-describedby pointing to non-existent IDs
      document.querySelectorAll('[aria-labelledby],[aria-describedby]').forEach(el=>{
        if(!isVisible(el)) return;
        ['aria-labelledby','aria-describedby'].forEach(attr=>{
          const v=el.getAttribute(attr);
          if(!v) return;
          v.split(/\s+/).forEach(id=>{
            if(!id) return;
            if(!document.getElementById(id)){
              issues.push({el, msg:`${attr}="${id}" references missing element.`, fix:`Ensure an element with id="${id}" exists, or remove the reference.`});
            }
          });
        });
      });
      // Duplicate IDs — only visible ones
      const ids={};
      document.querySelectorAll('[id]').forEach(el=>{
        if(!el.id) return;
        if(!isVisible(el)) return;
        (ids[el.id]=ids[el.id]||[]).push(el);
      });
      Object.entries(ids).forEach(([id,els])=>{
        if(els.length>1){
          issues.push({el:els[1], msg:`Duplicate id="${id}" — ${els.length} visible elements share this ID.`, fix:'IDs must be unique within the document.'});
        }
      });
      // Buttons without accessible name
      document.querySelectorAll('button').forEach(b=>{
        if(!isVisible(b)) return;
        if(b.getAttribute('aria-hidden')==='true') return;
        const name = accessibleName(b);
        if(!name && !b.querySelector('img[alt]:not([alt=""])') && !b.querySelector('svg[aria-label],svg[aria-labelledby]')){
          issues.push({el:b, msg:'<button> has no accessible name (empty text, no aria-label).', fix:'Add visible text content or aria-label for icon-only buttons.'});
        }
      });
      // Links without accessible name
      document.querySelectorAll('a[href]').forEach(a=>{
        if(!isVisible(a)) return;
        if(a.getAttribute('aria-hidden')==='true') return;
        const name = accessibleName(a);
        if(!name && !a.querySelector('img[alt]:not([alt=""])') && !a.querySelector('svg[aria-label],svg[aria-labelledby]')){
          issues.push({el:a, msg:'<a> has no accessible name.', fix:'Add visible text content or aria-label.'});
        }
      });
      return { status: issues.length?'fail':'pass', issues:issues.slice(0,40), summary: issues.length?`${issues.length} name/role/value issue(s)`:'Names, roles, values look correct' };
    });

    // 4.1.3 Status Messages
    add('4.1.3','Status Messages','AA','Robust',()=>{
      const issues=[];
      document.querySelectorAll('[class*="toast" i],[class*="snackbar" i],[class*="notification" i],[class*="alert" i],[class*="status-message" i]').forEach(el=>{
        if(!isVisible(el)) return;
        if(el.getAttribute('aria-hidden')==='true') return;
        // skip if it OR an ancestor has the right role/live region
        let n=el;
        while(n && n.nodeType===1){
          const live = n.getAttribute('aria-live');
          const role = n.getAttribute('role');
          if(live || (role && ['alert','status','log'].includes(role))) return;
          n = n.parentElement;
        }
        // Must have meaningful text content to be a real status message worth flagging
        const t = (el.textContent||'').trim();
        if(t.length<3) return;
        issues.push({el, msg:'Likely status/notification element has no role="status"/"alert" or aria-live.', fix:'Add role="status" (polite) or role="alert" (assertive) so screen readers announce updates.'});
      });
      return { status: issues.length?'warn':'pass', issues:issues.slice(0,15), summary: issues.length?`${issues.length} potential status element(s) without aria-live`:'No status-message issues detected', manual:true };
    });

    return results;
  }

  window.__ofAudit = { run: runAudit };
})();
/* DWAO AI — Accessibility Suite v2 (content.js) */
(function () {
  if (window.__dwaoA11y) window.__dwaoA11y.destroy();

  const DWAO_LOGO_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAMB0lEQVR4nO1bbWxUVRp+3nPvnXba0t2aUqnYhtKiSxOtlhasLALRHwWjVTRNQIIx/tJohMQPJEZjdE0MrivEiImKMUoiQUBYSdAgH8bSINgQsa3ptLRpVZxuSmkV2um9c579MXNPZ+pUq4CzrH2T5s695+N9z3Per/PeW4FYxHmQUgpKKZAESWitz2e6P5zkfAEQEXO91BYPXAAAkojxqeKgXApkX9DZLqGF+6TSLUC6aRwNUAAEAFNc8QttvgaM1/Zbxif2u3i+ZRwfYF00hr+Pohdt5j+9CUwCkG4B0k22pAxdGqMO6Y8lxnOJRLmY4KX85+T5pC8Cf32/kAdcuPzot9EfwXcUgEkTSLcAYymVSU70WSpKNJVR8xltn9SAdAtwsSm19oyqwP89AONTDIQ/vQlMApBuAdJNtqQt4UlNJkSJJOSiF09GkUSXOLYx4XeqTjLmeaoT/3hjxp78DR8KLMsyRdZY/99WD5AE5r8Gne0nCkqpcZMLkkBcoLGclGWZtsSiqN/Tn9dv55h2EYFSyvAhY/da6xg/EShRE644+3OJihdrzbwp5EdcAyZa0bVtO0mQsRNaljUqePw+Go0mtSfe27YNz/PGLsEsROsoEvfQByYV+UAmzj9WNl/mxDlEKUWtNUpKSnDNNdfAdV2zCH/ScDiMUCiEH3/8MUnw4uJiVFRUQGuN1tZWdHZ2GiFEBCKCwsJCVFdXo729Hc3NzUYIXzPy8vJQVVWFzMwMNDe3IBRqh1IWACIv7zLU1NRAKaCrqwtfffXVuIv3Qb/88stRXV2NoqIiKKXQ29uLpqYmdHR0pAbdcRwC4Jo1a0iS0WiUY+ncuXNsamrio48+ypycHMa3hYsXLzZ99u7dS9u2Gdcoxn0Lt23bRpIMhUKcOnUqAVBEaNs2AfCFF14wc9TV1REAs7KyCYBr164zbSdOnGBubq4Z78uglCIATpkyhc8//zw7Ozt/toZTp07x3Xff5dVXX00AtG2HIoqA0ACwevVqaq3peR5bWlrY0NDAw4cP8/jx4xweHjaT7du3j4WFhQTAYDDI1tZWaq3Z39/PsrIyAqBlWQTAGTNmcGBggK7rkiTr6+tNu4gwIyODx44do9aa3d3dBiDbtpmdnc2mpiaS5MjICEny9ttvJwA6jkOlFJVSFBFOmzaNBw8eTFp0X18fe3t76XmeedbT08OFCxfGZQhQxEoGwCdfUADMyMhgRUUFN2/eTK01SfKjjz5iZmYmAXDTpk1m3KpVqwiAgUCAAPjAAw+QJCORCLXWfPvtt80CAbCyspJnz54lSb7zzjtmcQB42223UWvNgYFBfvfdd9Ra87333qOI0LIsA4DjONyxY4eR4dNPP2VtbS1LS0tZUlLCG264gZs2bWIkEiFJdnV1sbS0lCJCpezUAKxYsSJJTX21S2S0YsUKAuDdd99tdvitt94yCxQR7t69m1prDg4OkiQ7OztZUFBgVPjBBx8kSWqtee+99xrAAXDLli0kyf379xszCYfDLC8vJwCzAcuWLaPWmlpr7tu3z5jJ2L8XX3zRbOCGDRsJCC3LSQ3A8uXLk1TZB+K6667jwMAAtdb88MMPCYDTpk3jyZMnSZLNzc3Mz88nAJaVlbG3t5fRaJQbNmxgf38/SfKuu+4yc2/fvp0k+e2333LGjBkG6JkzZzIcDpMkn3rqKZaUlPCnn34iST755JNJWvb+++8bM7npppsMOIkaopRibm4u29vbqbVmW1uIeXn5BIQTSoV9rx4KhRAKhSAiuOqqq5CXl4dwOIzPP/8cAFBWVoY5c+ZARFBbW4upU6eis7MTGzZsQHt7OwCgtrYWAHDFFVfg+uuvBwAcO3YMXV1dcBwHJFFfX4+CggIMDQ1hz5496OzsRENDA0hi2bJlyMrKgud5CAaDKC8vBwB0d3ejpaUVIgLPi0JEwbIseJ4Hy1IYHBzE0aNHISKYPn06yspmAuDEzgKMh5iRkRETCrOzs5GbmwuS+PjjjwEAgUAA8+bNA0ncfPPNIImGhgacPHkSjY2NAIDFixcjEAigoqICxcXFAIADBw4YPsFgEHfeeScA4OjRo2hpaYFlWdixYwdEBNdeey0WLFgArTVycnKQk5MDAOjv78fZs+dAAtGoX9RVIAGtNUQEp0+fBgAEg5nIzY2NmxAAfpwVEWRmZgIAPM/D8PAwAODIkSPo7e0FAMyfPx8zZ87EjTfeCBHB3r17AQC7du1CNBpFaWkpampqMG/ePFiWhTNnzmD//v1mzoULF6KqqgoksXnzZkQiEUSjUWzduhXd3d0IBAJYvnw5AGBoaAiu68YXFYTjOACIrKwsKKXguiMQiZ0vfHABwHU9RCIjACZQEFFKmQyuoKAARUVFIImenh709fVBRNDR0YHGxkbU1dWhtLQUq1atQkFBAcLhMA4ePAgAaGpqQltbG2bPno36+nqUlZWBpHnuZ5H19fVQSmFoaAhLly5FdXU1HMdBJBIxSdqSJUtQWlqKjo4O9PT0YNasWbjyyitRVFSE1tZBaK3ju65gWWISutmzZ4Mk+vpOo6f7VExLUjnBe+65h5ZlMRAI0HEc4wyfeeYZ02fdunVJzuihhx4iSQ4NDbGrq4skuXXr1qQ+r732Gkny+++/5+nTp0mSa9euNQlNcXFx3Plpjkd+TrBmzRoC4GOPPWbaXn75X3GvLwQUAUXLsk208Mdu3/4hAUUlGamjwB133JEUQhzH4f3338+BgQGSZFtbGwsLC01MBsDy8nLT7icfK1euTAptt956Kz3Po+d51FozEolw7ty5hs/jjz9OMhYWV69ezcrKSlZXz2VVVTUrKyu5YMECnjhxglprNjY2MhgMMj8/n19//bUB/7nn/hEPtYoiisFgFleuXMlTp36g53mMRIZ54/ybaDuZnDp1OuGHuEceeYSu6zISiXDbtm18+umn+eyzz3L9+vU8cOCAAaevr4+33HJLUhrqA3Ho0CG6rsuRkRGGw2ET2nwel112Gdva2ui6Ll3X5ZdffsmsrCwz/rPPPqPrugyFOpidPSVlPF+//p/UWvPs2bNctGgRAXDJkiUmzJJka+s33LNnD3fv3s0vvvjC5Ckk+cQTT8S0MvMvLJr5t1EA1q5dO67a+bv6ySefsKqqyizKB8CfY9260dz9gw8+MMmUUsr0eeONN0yfl156ySysrq7OPH/llY1xzQlSKZtK2XScDFqW4pw5cxN4bDcy1NTU8PDhw+PK39nVxfvuuy8mr5NJqAzaGdm0tY6FuMbGRmzcuBGe55mw4V/7+vpw6NAhHDlyBFprE1998vOEnTt3Ij8/H5ZlYefOnUnncP8I+uabb2JoaAhaa2zZssUccaPRKF599VWcOzeM119/HSIKnueZEBzjJzhx4is8/PAjmDXrKvSGexEIZGFkJILGxkYsWnQzli69FQv+Ph9XTJ+OgOMg/J9eNB0/jn/v2oXwD99DWQHoKCECRF0vVi9IPE7+elQQ+KCNjRa/5yux2LHYj92jJGKBjMXzxEKNCOJ1AsCxg4AIXDcCpaw4/7H1hQRedmasDwmJ16Uk5iyQxCj5zSyTKzopqyqx8bZtQUSZMJQKED+skoRmvO4AAUHYlg1SQGooZUEAuJ6HxKKIpWw4AQeep5GVlY2hc+cw4kaM/JZlQwSxOalRUjYLVsDBN81fAwQIxhODGIg2YY8WIlMqgSRcVcq35v4w1/PvBIAFyM8/tdEE6AH0+6QaT8B2nFibGwVUFKACoJAz5a+gFgwP92NgcCC2WZJQUgNhWXbMLJVg4MwZiFhQsGJ8yFiN0Wy2yuDoAplwHQvCr5nIeGXOCfRPqAAzLgN9VVUCSNwUoOJACDjOd0N+JQqIAaKjMT9rWc6oRgrNF32irMyJSpwW8k0Q8O2f8d9iVHqsyfrtWmsosQDEfVx8H0Vo8L9g7wYTGf/eseN3iKs4ohj9YsyKa04yv8TdH+vcBQJIgh/AJfFmKO57gFHrkgv33aDgf9wEYpTog5jw7PzpEnk9nrhHF/bjrUvABC4uTQKQbgHSTZMApFuAdNMkAOkWIN00CUC6BUg3TQKQbgHSTZMApFuAdJOdrn+N+W108U7sf3oA/vQm8F+I0b6WuhVQkAAAAABJRU5ErkJggg=='
.trim()
  const C = {
    primary:'rgb(96, 165, 250)', primaryDk:'rgb(59, 130, 246)', gold:'rgb(245, 158, 11)',
    bg:'rgb(8, 8, 8)', card:'rgb(24, 24, 24)', cardHover:'rgb(36, 36, 36)',
    panel:'rgb(18, 18, 18)', border:'rgb(54, 54, 54)', borderL:'rgb(40, 40, 40)',
    text:'rgb(240, 240, 240)', textDim:'rgb(180, 180, 180)', muted:'rgb(140, 140, 140)',
    green:'rgb(74, 222, 128)', greenL:'rgb(20, 42, 26)',
    red:'rgb(248, 113, 113)', redL:'rgb(48, 20, 20)',
    orange:'rgb(251, 146, 60)', orangeL:'rgb(46, 28, 12)',
    yellow:'rgb(250, 204, 21)', yellowL:'rgb(46, 38, 10)',
    blue:'rgb(96, 165, 250)', blueL:'rgb(20, 32, 48)',
    SIDEBAR_W:380,
  };

  const I = {
    contrast:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20z"/></svg>`,
    reader:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5"/><path d="M11 13 22 2"/><path d="m22 2-5 1 4 4 1-5z"/></svg>`,
    focus:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>`,
    image:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`,
    palette:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`,
    keyboard:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/></svg>`,
    audit:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    back:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>`,
    close:`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
    hover:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l7.07 17 2.51-7.39L21 11.07z"/></svg>`,
    scan:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/></svg>`,
    wand:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 4-1 1M4 15l1-1M12 2v1M2 12h1M20 12h1M12 20v1M19 5l-1 1M5 19l1-1"/><path d="m3 21 9-9"/><path d="m12.5 6.5 5 5-9 9L3 21z"/></svg>`,
    copy:`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
    next:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>`,
    play:`<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    pause:`<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
    prev:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>`,
    download:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>`,
    refresh:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 15.5-6.36L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.36L3 16"/><path d="M3 21v-5h5"/></svg>`,
    warn:`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    fail:`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    pass:`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    info:`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    eye:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>`,
  };

  let sidebar=null, overlayContainer=null;
  let highlights=[], rafId=null;
  let hoverTooltip=null, hoverActive=false;
  let srItems=[], srIdx=0, srPlaying=false;
  let activeFilter='', dyslexiaEl=null;
  let auditResults=null, auditFilter='all', auditLevelFilter='all';
  let auditCollapsed = new Set(['manual','na','pass']);
  let scoreInfoOpen = false;
  const fixTargets = new Map(); let fixIdCounter = 0;

  const lin = c => { const s=c/255; return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4); };
  const lum = (r,g,b) => 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);
  const cRatio = (l1,l2) => { const h=Math.max(l1,l2),lo=Math.min(l1,l2); return (h+0.05)/(lo+0.05); };
  const toHex = (r,g,b) => '#'+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
  const hexA = (c,a) => { const m=c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/); if(!m) return c; return `rgba(${m[1]},${m[2]},${m[3]},${a})`; };
  const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));

  function parseRGBA(str) {
    if (!str||str==='transparent'||str==='rgba(0, 0, 0, 0)') return null;
    const m = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (!m) return null;
    return { r:+m[1], g:+m[2], b:+m[3], a:m[4]!==undefined?+m[4]:1 };
  }
  function getEffectiveBg(el) {
    let cr=255, cg=255, cb=255; const stack=[]; let node=el;
    while (node && node!==document.documentElement) {
      const c=parseRGBA(window.getComputedStyle(node).backgroundColor);
      if (c && c.a>0.01) stack.unshift(c);
      node=node.parentElement;
    }
    stack.forEach(({r,g,b,a}) => { cr=a*r+(1-a)*cr; cg=a*g+(1-a)*cg; cb=a*b+(1-a)*cb; });
    return { r:Math.round(cr), g:Math.round(cg), b:Math.round(cb) };
  }
  function hexToRGB(hex) {
    return { r:parseInt(hex.slice(1,3),16), g:parseInt(hex.slice(3,5),16), b:parseInt(hex.slice(5,7),16) };
  }
  function suggestFixColor(fgHex, bgHex, targetRatio=4.5) {
    const bg=hexToRGB(bgHex);
    const bgL=lum(bg.r,bg.g,bg.b);
    const tryDir = (dir) => {
      let {r,g,b}=hexToRGB(fgHex);
      for (let i=0;i<100;i++) {
        r=clamp(r+dir,0,255); g=clamp(g+dir,0,255); b=clamp(b+dir,0,255);
        if (cRatio(lum(r,g,b),bgL)>=targetRatio) return toHex(r,g,b);
        if ((dir<0&&r<=0&&g<=0&&b<=0)||(dir>0&&r>=255&&g>=255&&b>=255)) return null;
      }
      return null;
    };
    const dark=tryDir(-4), light=tryDir(4);
    if (!dark && !light) return null;
    if (!dark) return light;
    if (!light) return dark;
    const fg=hexToRGB(fgHex);
    const dD=Math.abs(hexToRGB(dark).r-fg.r)+Math.abs(hexToRGB(dark).g-fg.g)+Math.abs(hexToRGB(dark).b-fg.b);
    const dL=Math.abs(hexToRGB(light).r-fg.r)+Math.abs(hexToRGB(light).g-fg.g)+Math.abs(hexToRGB(light).b-fg.b);
    return dD<dL?dark:light;
  }
  function getElementContrast(el) {
    const style=window.getComputedStyle(el);
    const fgRaw=parseRGBA(style.color);
    if (!fgRaw||fgRaw.a<0.1) return null;
    const fg={r:fgRaw.r,g:fgRaw.g,b:fgRaw.b};
    const bg=getEffectiveBg(el);
    const ratio=cRatio(lum(fg.r,fg.g,fg.b),lum(bg.r,bg.g,bg.b));
    return { ratio, fgHex:toHex(fg.r,fg.g,fg.b), bgHex:toHex(bg.r,bg.g,bg.b), el };
  }

  function setupOverlay() {
    if (overlayContainer) { overlayContainer._cleanup?.(); overlayContainer.remove(); }
    overlayContainer=document.createElement('div');
    overlayContainer.id='__of_overlay__';
    Object.assign(overlayContainer.style, {
      position:'fixed',top:'0',left:'0',
      width:`calc(100vw - ${C.SIDEBAR_W}px)`,height:'100vh',
      pointerEvents:'none',zIndex:'2147483644',overflow:'hidden',
    });
    document.documentElement.appendChild(overlayContainer);
    const onScroll=()=>{ cancelAnimationFrame(rafId); rafId=requestAnimationFrame(syncHighlights); };
    window.addEventListener('scroll',onScroll,{passive:true,capture:true});
    window.addEventListener('resize',onScroll,{passive:true});
    overlayContainer._cleanup=()=>{
      window.removeEventListener('scroll',onScroll,{capture:true});
      window.removeEventListener('resize',onScroll);
    };
  }
  function syncHighlights() {
    highlights.forEach(({el,box,badge})=>{
      const r=el.getBoundingClientRect();
      const vis=r.width>0&&r.height>0&&r.bottom>0&&r.top<window.innerHeight;
      if (!vis){box.style.display='none';if(badge)badge.style.display='none';return;}
      box.style.display=''; box.style.top=r.top+'px'; box.style.left=r.left+'px';
      box.style.width=r.width+'px'; box.style.height=r.height+'px';
      if(badge){badge.style.display='';badge.style.top=Math.max(0,r.top-10)+'px';badge.style.left=Math.max(0,r.left-10)+'px';}
    });
  }
  function clearOverlays() {
    highlights.forEach(({box,badge})=>{box.remove();badge?.remove();});
    highlights=[];
  }
  function addHighlight(el,color,label='',opacity=0.12) {
    if(!el || !el.getBoundingClientRect) return null;
    const r=el.getBoundingClientRect();
    if (!r.width||!r.height) return null;
    const box=document.createElement('div');
    Object.assign(box.style,{
      position:'fixed',top:r.top+'px',left:r.left+'px',
      width:r.width+'px',height:r.height+'px',
      background:hexA(color,opacity),border:`2px solid ${color}`,
      borderRadius:'3px',pointerEvents:'none',boxSizing:'border-box',
    });
    if (label) {
      const lbl=document.createElement('div');
      Object.assign(lbl.style,{position:'absolute',top:'0',left:'0',background:color,color:'rgb(255, 255, 255)',
        fontSize:'9px',fontWeight:'700',padding:'2px 5px',borderRadius:'0 0 4px 0',
        lineHeight:'1.5',maxWidth:'180px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
        fontFamily:'system-ui,sans-serif'});
      lbl.textContent=label; box.appendChild(lbl);
    }
    overlayContainer.appendChild(box);
    highlights.push({el,box,badge:null});
    return box;
  }
  function addBadge(el,num,color) {
    if(!el) return null;
    const r=el.getBoundingClientRect();
    const b=document.createElement('div');
    Object.assign(b.style,{position:'fixed',top:Math.max(0,r.top-10)+'px',left:Math.max(0,r.left-10)+'px',
      width:'20px',height:'20px',borderRadius:'50%',background:color,color:'rgb(255, 255, 255)',
      fontSize:'9px',fontWeight:'700',display:'flex',alignItems:'center',justifyContent:'center',
      pointerEvents:'none',fontFamily:'monospace',boxShadow:'0 1px 4px rgba(0,0,0,.3)'});
    b.textContent=num; overlayContainer.appendChild(b);
    const last=highlights[highlights.length-1];
    if (last) last.badge=b;
    return b;
  }
  function scrollToEl(el){
    if(!el || !el.scrollIntoView) return;
    try{ el.scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){}
  }

  function buildSidebar() {
    sidebar=document.createElement('div');
    sidebar.id='__of_sidebar__';
    Object.assign(sidebar.style,{position:'fixed',top:'0',right:'0',width:C.SIDEBAR_W+'px',height:'100vh',
      background:C.bg,borderLeft:`1px solid ${C.border}`,zIndex:'2147483646',
      fontFamily:'system-ui,-apple-system,sans-serif',fontSize:'13px',color:C.text,
      display:'flex',flexDirection:'column',boxShadow:'-2px 0 20px rgba(0,0,0,.1)',overflow:'hidden'});
    document.documentElement.appendChild(sidebar);
    document.documentElement.style.transition='margin-right .25s ease';
    document.documentElement.style.marginRight=C.SIDEBAR_W+'px';
  }
  function makeHdr(title,onBack,subtitle) {
    const h=document.createElement('div');
    Object.assign(h.style,{display:'flex',alignItems:'center',gap:'8px',padding:'0 14px',
      height:'54px',background:C.bg,borderBottom:`1px solid ${C.border}`,flexShrink:'0'});
    const logo=`<div style="width:28px;height:28px;border-radius:7px;flex-shrink:0;overflow:hidden;
      background:rgb(0, 0, 0);display:flex;align-items:center;
      justify-content:center;font-weight:900;font-size:10px;color:rgb(255, 255, 255)">
      <img src="${DWAO_LOGO_B64}" alt="DWAO" style="width:100%;height:100%;object-fit:cover;display:block"></div>`;
    h.innerHTML=`
      ${onBack?`<button id="__of_bk__" style="background:none;border:none;cursor:pointer;
        padding:6px;color:${C.muted};display:flex;align-items:center;margin-left:-4px">${I.back}</button>`:logo}
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${title}</div>
        <div style="font-size:10px;color:${C.muted}">${subtitle||(onBack?'':'DWAO AI · v2')}</div>
      </div>
      <button id="__of_cl__" style="background:none;border:none;cursor:pointer;padding:6px;
        color:${C.muted};display:flex;align-items:center">${I.close}</button>`;
    h.querySelector('#__of_cl__').onclick=cleanup;
    if(onBack) h.querySelector('#__of_bk__').onclick=typeof onBack==='function'?onBack:(()=>{stopHover();clearOverlays();showHome();});
    return h;
  }
  function makeBody(html='') {
    const b=document.createElement('div');
    Object.assign(b.style,{flex:'1',overflowY:'auto',padding:'14px'});
    b.innerHTML=html; return b;
  }
  const passTag=p=>p?`<span style="background:${C.greenL};color:${C.green};font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px">PASS</span>`
    :`<span style="background:${C.redL};color:${C.red};font-size:10px;font-weight:700;padding:2px 8px;border-radius:4px">FAIL</span>`;
  const statCard=(l,v,col)=>`<div style="background:${C.panel};border-radius:8px;padding:10px;text-align:center;border:1px solid ${C.border}">
    <div style="font-size:20px;font-weight:700;color:${col}">${v}</div>
    <div style="font-size:10px;color:${C.muted};margin-top:2px">${l}</div></div>`;

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function showHome() {
    stopHover(); clearOverlays();
    sidebar.innerHTML='';
    sidebar.appendChild(makeHdr('DWAO AI', null));
    const tiles=[
      {f:'audit',icon:I.audit,label:'Full WCAG 2.2 Audit',desc:'56 automated checkpoints · one-click',hero:true},
      {f:'contrast',icon:I.contrast,label:'Colour Contrast',desc:'Eyedropper · hover · full-page scan'},
      {f:'alttext',icon:I.image,label:'Alt Text Review',desc:'All images on the page'},
      {f:'focus',icon:I.focus,label:'Focus Order',desc:'Visualise tab sequence'},
      {f:'keyboard',icon:I.keyboard,label:'Keyboard Test',desc:'Focusable elements + trap risk'},
      {f:'screenreader',icon:I.reader,label:'Screen Reader',desc:'Hear how the page reads'},
      {f:'colorblind',icon:I.palette,label:'Colour Blindness',desc:'Protanopia · Deuteranopia · more'},
      {f:'vision',icon:I.eye,label:'Impaired Vision',desc:'Blur · contrast · greyscale'},
      {f:'dyslexia',icon:I.image,label:'Dyslexia Simulator',desc:'Spacing & legibility'},
    ];
    let html='';
    const hero=tiles.find(t=>t.hero);
    html+=`<button data-f="${hero.f}" style="display:flex;align-items:center;gap:12px;width:100%;
      padding:14px 14px;border-radius:10px;border:none;cursor:pointer;text-align:left;
      background:linear-gradient(135deg,${C.primary},${C.primaryDk});color:rgb(255, 255, 255);
      box-shadow:0 4px 14px rgba(96,165,250,.3);margin-bottom:14px">
      <div style="width:38px;height:38px;border-radius:9px;background:rgba(255,255,255,.18);
        display:flex;align-items:center;justify-content:center;flex-shrink:0">${hero.icon}</div>
      <div style="flex:1"><div style="font-size:13px;font-weight:700">${hero.label}</div>
      <div style="font-size:10px;opacity:.85;margin-top:2px">${hero.desc}</div></div>
      <div style="opacity:.7">${I.next}</div></button>`;
    html+=`<div style="font-size:10px;font-weight:700;color:${C.muted};text-transform:uppercase;letter-spacing:.6px;margin:4px 0 8px">Manual Tools</div>`;
    tiles.filter(t=>!t.hero).forEach(t=>{
      html+=`<button data-f="${t.f}" style="display:flex;align-items:center;gap:10px;width:100%;
        padding:9px 10px;margin-bottom:5px;border-radius:8px;border:1px solid ${C.border};
        background:${C.card};color:${C.text};cursor:pointer;text-align:left;transition:all .12s">
        <div style="width:30px;height:30px;border-radius:7px;background:${C.panel};display:flex;
          align-items:center;justify-content:center;flex-shrink:0;color:${C.primary}">${t.icon}</div>
        <div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600;color:${C.text}">${t.label}</div>
        <div style="font-size:10px;color:${C.muted};margin-top:1px">${t.desc}</div></div>
        <div style="color:${C.muted};flex-shrink:0">${I.next}</div></button>`;
    });
    const body=makeBody(html); sidebar.appendChild(body);
    const foot=document.createElement('div');
    Object.assign(foot.style,{padding:'10px 14px',borderTop:`1px solid ${C.border}`,fontSize:'10px',color:C.muted,textAlign:'center',flexShrink:'0',background:C.panel});
    foot.textContent='DWAO AI · Accessibility Suite v2'; sidebar.appendChild(foot);
    body.querySelectorAll('[data-f]').forEach(btn=>{
      btn.addEventListener('mouseenter',()=>{
        if(!btn.matches('[data-f="audit"]')){btn.style.borderColor=C.primary;btn.style.background=C.cardHover;}
      });
      btn.addEventListener('mouseleave',()=>{
        if(!btn.matches('[data-f="audit"]')){btn.style.borderColor=C.border;btn.style.background=C.card;}
      });
      btn.onclick=()=>{clearOverlays();FEATURES[btn.dataset.f]?.();};
    });
  }

  // ── AUDIT ─────────────────────────────────────────────────────────────────
  function runAuditNow(){
    if(!window.__ofAudit){ return []; }
    return window.__ofAudit.run();
  }
  function featureAudit(){
    sidebar.innerHTML='';
    sidebar.appendChild(makeHdr('WCAG 2.2 Audit', true, 'Running…'));
    const body=makeBody(`<div style="text-align:center;padding:40px 20px;color:${C.muted};font-size:12px">
      <div style="width:42px;height:42px;border:3px solid ${C.borderL};border-top-color:${C.primary};
        border-radius:50%;margin:0 auto 14px;animation:ofspin 0.7s linear infinite"></div>
      <div>Running 56 checkpoints…</div>
      <style>@keyframes ofspin{to{transform:rotate(360deg)}}</style>
    </div>`);
    sidebar.appendChild(body);
    setTimeout(()=>{ auditResults = runAuditNow(); renderAudit(); }, 60);
  }
  function renderAudit(){
    sidebar.innerHTML='';
    const totals = countAudit(auditResults);
    sidebar.appendChild(makeHdr('WCAG 2.2 Audit', true,
      `${totals.fail} fail · ${totals.warn} warn · ${totals.pass} pass`));
    const html = renderAuditDashboard(totals);
    const body = makeBody(html);
    sidebar.appendChild(body);
    bindAuditHandlers(body);
  }
  function countAudit(results){
    const t={fail:0,warn:0,pass:0,manual:0,na:0,total:0,issues:0};
    results.forEach(r=>{ t.total++; t[r.status]++; if(r.issues) t.issues += r.issues.length; });
    return t;
  }
  function renderAuditDashboard(t){
    // Heuristic scoring, not a WCAG-defined metric — WCAG itself has no numeric
    // scoring, only pass/fail per success criterion. -8/-3 are arbitrary weights
    // chosen for this tool so a fail costs roughly 2.5x a warn. `manual`/`na`/`pass`
    // and per-checkpoint issue counts are not factored in. Breakdown is shown in
    // the UI (below) so this can be recomputed/verified manually rather than trusted blindly.
    const failPenalty = t.fail*8, warnPenalty = t.warn*3;
    const score = t.fail===0 && t.warn===0 ? 100 :
      Math.max(0, Math.round(100 - (failPenalty + warnPenalty)));
    const scoreColor = score>=90?C.green : score>=70?C.yellow : score>=50?C.orange : C.red;
    // let html=`
    //   <div style="display:flex;gap:10px;margin-bottom:14px">
    //     <div style="flex:0 0 90px;background:${C.panel};border:1px solid ${C.border};border-radius:10px;
    //       padding:12px 8px;text-align:center;">
    //       <div style="font-size:28px;font-weight:800;color:${scoreColor};line-height:1">${score}</div>
    //       <div style="font-size:9px;color:${C.muted};margin-top:3px;letter-spacing:.4px;text-transform:uppercase">Score</div>
    //     </div>
    //     <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:5px;font-size:10px">
    //       <div style="background:${C.redL};color:${C.red};padding:5px 8px;border-radius:6px;display:flex;align-items:center;gap:5px">${I.fail}<b>${t.fail}</b> fail</div>
    //       <div style="background:${C.yellowL};color:${C.yellow};padding:5px 8px;border-radius:6px;display:flex;align-items:center;gap:5px">${I.warn}<b>${t.warn}</b> warn</div>
    //       <div style="background:${C.greenL};color:${C.green};padding:5px 8px;border-radius:6px;display:flex;align-items:center;gap:5px">${I.pass}<b>${t.pass}</b> pass</div>
    //       <div style="background:${C.blueL};color:${C.blue};padding:5px 8px;border-radius:6px;display:flex;align-items:center;gap:5px">${I.info}<b>${t.manual}</b> manual</div>
    //     </div>
    //   </div>
    //   <div style="display:flex;gap:6px;margin-bottom:10px">
    //     <button id="__of_rerun__" style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;
    //       padding:7px;border-radius:7px;border:1px solid ${C.border};background:rgb(255, 255, 255);color:${C.text};
    //       font-size:11px;font-weight:600;cursor:pointer">${I.refresh} Re-run</button>
    //     <button id="__of_export__" style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;
    //       padding:7px;border-radius:7px;border:1px solid ${C.border};background:rgb(255, 255, 255);color:${C.text};
    //       font-size:11px;font-weight:600;cursor:pointer">${I.download} HTML report</button>
    //     <button id="__of_json__" style="display:flex;align-items:center;justify-content:center;gap:4px;
    //       padding:7px 10px;border-radius:7px;border:1px solid ${C.border};background:${C.card};color:${C.text};
    //       font-size:11px;font-weight:600;cursor:pointer" title="Download JSON">JSON</button>
    //   </div>
    //   <div style="display:flex;gap:5px;margin-bottom:6px;font-size:10px">
    //     ${['all','fail','warn','manual','pass','na'].map(k=>`
    //       <button data-fl="${k}" style="flex:1;padding:6px 4px;border-radius:6px;border:1px solid ${auditFilter===k?C.primary:C.border};background:${auditFilter===k?hexA(C.primary,.08):C.card};color:${auditFilter===k?C.primary:C.textDim};cursor:pointer;font-size:10px;font-weight:600;text-transform:capitalize">${k==='na'?'N/A':k}</button>
    //     `).join('')}
    //   </div>
    //   <div style="display:flex;gap:5px;margin-bottom:14px;font-size:10px">
    //     ${['all','A','AA'].map(k=>`
    //       <button data-lv="${k}" style="flex:1;padding:5px 4px;border-radius:6px;border:1px solid ${auditLevelFilter===k?C.gold:C.border};background:${auditLevelFilter===k?hexA(C.gold,.08):C.card};color:${auditLevelFilter===k?C.gold:C.textDim};cursor:pointer;font-size:10px;font-weight:600">${k==='all'?'All levels':'Level '+k}</button>
    //     `).join('')}
    //   </div>
    // `;
     let html=`
      <div style="display:flex;gap:10px;margin-bottom:14px">
        <div style="flex:0 0 90px;background:${C.panel};border:1px solid ${C.border};border-radius:10px;
          padding:12px 8px;text-align:center;">
          <div style="font-size:28px;font-weight:800;color:${scoreColor};line-height:1">${score}</div>
          <div style="font-size:9px;color:${C.muted};margin-top:3px;letter-spacing:.4px;text-transform:uppercase">Score</div>
        </div>
        <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:5px;font-size:10px">
          <div style="background:${C.redL};color:${C.red};padding:5px 8px;border-radius:6px;display:flex;align-items:center;gap:5px">${I.fail}<b>${t.fail}</b> fail</div>
          <div style="background:${C.yellowL};color:${C.yellow};padding:5px 8px;border-radius:6px;display:flex;align-items:center;gap:5px">${I.warn}<b>${t.warn}</b> warn</div>
          <div style="background:${C.greenL};color:${C.green};padding:5px 8px;border-radius:6px;display:flex;align-items:center;gap:5px">${I.pass}<b>${t.pass}</b> pass</div>
          <div style="background:${C.blueL};color:${C.blue};padding:5px 8px;border-radius:6px;display:flex;align-items:center;gap:5px">${I.info}<b>${t.manual}</b> manual</div>
        </div>
      </div>
      <div style="border:1px solid ${C.border};border-radius:8px;margin-bottom:12px;overflow:hidden;background:${C.panel}">
        <div data-scoreinfo style="display:flex;align-items:center;gap:6px;padding:9px 10px;cursor:pointer;user-select:none">
          <span style="display:flex;align-items:center;transition:transform .12s;transform:rotate(${scoreInfoOpen?'90':'0'}deg);color:${C.muted};flex-shrink:0">${I.next}</span>
          <span style="font-size:10px;font-weight:700;color:${C.textDim};flex:1">How is this score calculated?</span>
          <span style="font-size:9px;color:${C.muted}">${scoreInfoOpen?'Hide':'Details'}</span>
        </div>
        ${scoreInfoOpen?`
        <div style="padding:0 12px 12px;font-size:10px;color:${C.textDim};line-height:1.6">
          <div style="background:${C.card};border-radius:6px;padding:8px 10px;font-family:'SF Mono',monospace;font-size:10px;color:${C.text};margin-bottom:10px">
            100 − (fail × 8 + warn × 3), floored at 0<br>
            = 100 − (${t.fail} × 8 + ${t.warn} × 3)<br>
            = 100 − ${failPenalty + warnPenalty}<br>
            = <b style="color:${scoreColor}">${score}</b>
          </div>
          <div style="font-size:9px;font-weight:700;color:${C.text};text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px">Counted in the score</div>
          <div style="margin-bottom:2px">${I.fail} <b style="color:${C.red}">${t.fail}</b> fail checkpoint${t.fail===1?'':'s'} — <b>8 points</b> each</div>
          <div style="margin-bottom:10px">${I.warn} <b style="color:${C.yellow}">${t.warn}</b> warn checkpoint${t.warn===1?'':'s'} — <b>3 points</b> each</div>
          <div style="font-size:9px;font-weight:700;color:${C.text};text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px">Not counted</div>
          <div style="margin-bottom:2px">${t.pass} pass · ${t.manual} manual · ${t.na} N/A checkpoints</div>
          <div style="margin-bottom:2px">Issue count within a checkpoint (1 failing element costs the same as 50)</div>
          <div style="margin-bottom:10px">WCAG conformance level (A/AA) and principle — no weighting</div>
          <div style="padding:7px 9px;background:${C.yellowL};border-left:3px solid ${C.gold};border-radius:0 5px 5px 0;color:${C.yellow}">
            ${I.warn} WCAG defines no numeric scoring standard. This is a heuristic specific to this tool — not an official WCAG, ADA, or Section 508 compliance metric.
          </div>
        </div>`:''}
      </div>
      <div style="display:flex;gap:6px;margin-bottom:10px">
        <button id="__of_rerun__" style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;
          padding:7px;border-radius:7px;border:1px solid ${C.border};background:${C.card};color:${C.text};
          font-size:11px;font-weight:600;cursor:pointer">${I.refresh} Re-run</button>
        <button id="__of_export__" style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;
          padding:7px;border-radius:7px;border:1px solid ${C.border};background:${C.card};color:${C.text};
          font-size:11px;font-weight:600;cursor:pointer">${I.download} HTML report</button>
      </div>
      <div style="display:flex;gap:5px;margin-bottom:6px;font-size:10px">
        ${['all','fail','warn','manual','pass','na'].map(k=>`
          <button data-fl="${k}" style="flex:1;padding:6px 4px;border-radius:6px;border:1px solid ${auditFilter===k?C.primary:C.border};background:${auditFilter===k?hexA(C.primary,.08):C.card};color:${auditFilter===k?C.primary:C.textDim};cursor:pointer;font-size:10px;font-weight:600;text-transform:capitalize">${k==='na'?'N/A':k}</button>
        `).join('')}
      </div>
      <div style="display:flex;gap:5px;margin-bottom:14px;font-size:10px">
        ${['all','A','AA'].map(k=>`
          <button data-lv="${k}" style="flex:1;padding:5px 4px;border-radius:6px;border:1px solid ${auditLevelFilter===k?C.gold:C.border};background:${auditLevelFilter===k?hexA(C.gold,.08):C.card};color:${auditLevelFilter===k?C.gold:C.textDim};cursor:pointer;font-size:10px;font-weight:600">${k==='all'?'All levels':'Level '+k}</button>
        `).join('')}
      </div>
    `;
    const filtered = auditResults.filter(r=>{
      if(auditFilter!=='all' && r.status!==auditFilter) return false;
      if(auditLevelFilter!=='all' && r.level!==auditLevelFilter) return false;
      return true;
    });
    if(filtered.length===0){
      html += `<div style="text-align:center;padding:30px 14px;color:${C.muted};font-size:11px;background:${C.panel};border-radius:8px">No checkpoints match the current filter.</div>`;
    } else {
      const STATUS_GROUPS = [
        {key:'fail', label:'Critical Issues', color:C.red},
        {key:'warn', label:'Warnings', color:C.yellow},
        {key:'manual', label:'Manual Review', color:C.blue},
        {key:'na', label:'Not Applicable', color:C.muted},
        {key:'pass', label:'Passed', color:C.green},
      ];
      STATUS_GROUPS.forEach(g=>{
        const items = filtered.filter(r=>r.status===g.key);
        if(items.length===0) return;
        const collapsed = auditCollapsed.has(g.key);
        html += `<div data-grp="${g.key}" style="display:flex;align-items:center;gap:6px;margin:14px 0 6px;cursor:pointer;user-select:none">
          <span style="display:flex;align-items:center;transition:transform .12s;transform:rotate(${collapsed?'0':'90'}deg);color:${C.muted}">${I.next}</span>
          <span style="font-size:10px;font-weight:700;color:${g.color};text-transform:uppercase;letter-spacing:.7px">${g.label}</span>
          <span style="flex:1;height:1px;background:${C.borderL}"></span>
          <span style="font-size:10px;color:${C.textDim};font-weight:600">${items.length}</span>
        </div>`;
        if(!collapsed){
          items.forEach(r=>{ html += renderCheckpointRow(r); });
        }
      });
    }
    return html;
  }
  function statusBadge(status){
    const map={
      fail:{bg:C.redL,fg:C.red,t:'FAIL',icon:I.fail},
      warn:{bg:C.yellowL,fg:C.yellow,t:'WARN',icon:I.warn},
      pass:{bg:C.greenL,fg:C.green,t:'PASS',icon:I.pass},
      manual:{bg:C.blueL,fg:C.blue,t:'MANUAL',icon:I.info},
      na:{bg:C.borderL,fg:C.muted,t:'N/A',icon:''},
    };
    const m=map[status]||map.manual;
    return `<span style="display:inline-flex;align-items:center;gap:3px;background:${m.bg};color:${m.fg};
      font-size:9px;font-weight:800;padding:2px 6px;border-radius:4px;flex-shrink:0;letter-spacing:.4px">${m.icon}${m.t}</span>`;
  }
  function renderCheckpointRow(r){
    const issueCount = r.issues?.length || 0;
    const showCount = issueCount>0 ? `<span style="background:${r.status==='fail'?C.redL:C.yellowL};color:${r.status==='fail'?C.red:C.yellow};font-size:9px;font-weight:700;padding:1px 6px;border-radius:8px;margin-left:4px">${issueCount}</span>` : '';
    return `
      <button data-cp="${r.id}" style="display:block;width:100%;text-align:left;background:${C.card};
        border:1px solid ${C.border};border-radius:7px;padding:8px 10px;margin-bottom:5px;cursor:pointer;
        transition:all .1s">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
          <code style="font-size:9px;background:${C.panel};color:${C.textDim};padding:1px 5px;border-radius:3px;font-family:'SF Mono',monospace">${r.id}</code>
          <span style="font-size:9px;color:${C.muted};font-weight:600">${r.level}</span>
          <span style="flex:1"></span>
          ${statusBadge(r.status)}${showCount}
        </div>
        <div style="font-size:11px;font-weight:600;color:${C.text};margin-bottom:2px">${r.name}</div>
        <div style="font-size:10px;color:${C.muted};line-height:1.4">${r.summary||''}</div>
      </button>`;
  }
  function bindAuditHandlers(body){
    body.querySelector('#__of_rerun__').onclick=()=>{ featureAudit(); };
    body.querySelector('#__of_export__').onclick=()=>{ exportReport('html'); };
    body.querySelector('[data-scoreinfo]')?.addEventListener('click',()=>{ scoreInfoOpen=!scoreInfoOpen; renderAudit(); });
    body.querySelectorAll('[data-fl]').forEach(b=>b.onclick=()=>{ auditFilter=b.dataset.fl; renderAudit(); });
    body.querySelectorAll('[data-lv]').forEach(b=>b.onclick=()=>{ auditLevelFilter=b.dataset.lv; renderAudit(); });
    body.querySelectorAll('[data-grp]').forEach(h=>h.onclick=()=>{
      const key=h.dataset.grp;
      if(auditCollapsed.has(key)) auditCollapsed.delete(key); else auditCollapsed.add(key);
      renderAudit();
    });
    body.querySelectorAll('[data-cp]').forEach(btn=>{
      btn.addEventListener('mouseenter',()=>{btn.style.borderColor=C.primary;btn.style.background=C.cardHover;});
      btn.addEventListener('mouseleave',()=>{btn.style.borderColor=C.border;btn.style.background=C.card;});
      btn.onclick=()=>{ showCheckpointDetail(btn.dataset.cp); };
    });
  }
  // ── Fix-code generator ───────────────────────────────────────────────────
  // Returns { lang, code, note } per issue type, or null if no canned fix
  function generateFixCode(checkpointId, issue){
    const el = issue.el;
    const tag = el?.tagName?.toLowerCase() || '';
    const selector = el ? buildSelector(el) : '';
    const snip = (issue.snippet || '').trim();

    // 1.4.3 / 1.4.11 Contrast — emit CSS with the suggested colour
    if((checkpointId==='1.4.3' || checkpointId==='1.4.11') && issue.ratio){
      const fix = suggestFixColor(issue.fgHex, issue.bgHex, issue.required || 4.5);
      if(fix){
        const newRatio = cRatio(lum(...Object.values(hexToRGB(fix))), lum(...Object.values(hexToRGB(issue.bgHex)))).toFixed(2);
        return { lang:'css', code:
`${selector} {\n  color: ${fix}; /* was ${issue.fgHex} — now ${newRatio}:1 */\n}`,
          note:`Apply this rule. Achieves ${newRatio}:1 against ${issue.bgHex}.` };
      }
    }

    // 1.1.1 Non-text content
    if(checkpointId==='1.1.1'){
      if(tag==='img'){
        if(el.getAttribute('alt')===null){
          return { lang:'html', code:`<!-- Pick ONE based on the image's purpose: -->\n<img src="${el.getAttribute('src')||'…'}" alt="Describe what the image conveys">\n\n<!-- OR if purely decorative -->\n<img src="${el.getAttribute('src')||'…'}" alt="">`,
            note:'Add an alt attribute. Use empty alt="" only for purely decorative images.' };
        }
        if(/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(el.getAttribute('alt')||'')){
          return { lang:'html', code:`<img src="${el.getAttribute('src')||'…'}" alt="Describe what the image conveys, not its filename">`,
            note:'Replace the filename with a meaningful description.' };
        }
      }
      if(tag==='svg'){
        return { lang:'html', code:`<!-- If decorative -->\n<svg aria-hidden="true">…</svg>\n\n<!-- If meaningful -->\n<svg role="img" aria-label="Describe the icon">…</svg>`,
          note:'SVGs need aria-hidden="true" (decorative) or aria-label/role="img" (meaningful).' };
      }
    }

    // 1.3.1 Info & relationships
    if(checkpointId==='1.3.1'){
      if(tag==='table'){
        return { lang:'html', code:`<table>\n  <thead>\n    <tr>\n      <th scope="col">Column 1</th>\n      <th scope="col">Column 2</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr><td>…</td><td>…</td></tr>\n  </tbody>\n</table>`,
          note:'Use <th scope="col"> for column headers and <th scope="row"> for row headers.' };
      }
      if(tag==='th'){
        return { lang:'html', code:`<th scope="col">Column header</th>\n<!-- or -->\n<th scope="row">Row header</th>`,
          note:'Add scope="col" or scope="row" to <th>.' };
      }
      if(['input','select','textarea'].includes(tag)){
        const id = el.id || `${tag}-${Date.now()}`;
        return { lang:'html', code:`<label for="${id}">Field label</label>\n<${tag} id="${id}" name="${el.name||id}"${tag==='input'?` type="${el.type||'text'}"`:''}>${tag==='textarea'?'</textarea>':tag==='select'?'<option>…</option></select>':''}`,
            note:'Associate every form control with a <label>.' };
      }
      // radio group
      if(tag==='input' && el.type==='radio'){
        return { lang:'html', code:`<fieldset>\n  <legend>Group label (e.g. "Choose payment method")</legend>\n  <label><input type="radio" name="${el.name}" value="…"> Option 1</label>\n  <label><input type="radio" name="${el.name}" value="…"> Option 2</label>\n</fieldset>`,
          note:'Wrap radio groups in <fieldset> with a <legend>.' };
      }
    }

    // 1.3.2 / 2.4.3 Positive tabindex
    if((checkpointId==='1.3.2' || checkpointId==='2.4.3') && el?.hasAttribute('tabindex')){
      const ti = el.getAttribute('tabindex');
      if(+ti > 0){
        return { lang:'html', code:`<!-- Before -->\n<${tag} tabindex="${ti}">…</${tag}>\n\n<!-- After -->\n<${tag} tabindex="0">…</${tag}>`,
          note:'Replace positive tabindex with 0, then reorder the DOM to match the intended focus sequence.' };
      }
    }

    // 1.3.5 Autocomplete
    if(checkpointId==='1.3.5'){
      const name=(el?.name||el?.id||'').toLowerCase();
      let suggest='on';
      if(/email/.test(name)) suggest='email';
      else if(/phone|tel|mobile/.test(name)) suggest='tel';
      else if(/first.*name|fname/.test(name)) suggest='given-name';
      else if(/last.*name|lname|surname/.test(name)) suggest='family-name';
      else if(/^name$|full.*name/.test(name)) suggest='name';
      else if(/zip|postal/.test(name)) suggest='postal-code';
      else if(/city/.test(name)) suggest='address-level2';
      else if(/country/.test(name)) suggest='country';
      else if(/address|street/.test(name)) suggest='street-address';
      else if(/card.*num|cc.*num/.test(name)) suggest='cc-number';
      else if(el?.type==='password') suggest='current-password';
      return { lang:'html', code:`<input type="${el?.type||'text'}" name="${el?.name||''}" autocomplete="${suggest}">`,
        note:'Add the correct autocomplete value so browsers and assistive tech can prefill.' };
    }

    // 1.4.1 Use of colour — inline link
    if(checkpointId==='1.4.1' && tag==='a'){
      return { lang:'css', code:`/* Distinguish inline links by more than colour */\np a, li a, td a {\n  text-decoration: underline;\n  text-underline-offset: 2px;\n}\n\np a:hover {\n  text-decoration-thickness: 2px;\n}`,
        note:'Add underline (or other non-colour indicator) to inline links.' };
    }

    // 1.4.2 Audio control
    if(checkpointId==='1.4.2' && (tag==='audio'||tag==='video')){
      return { lang:'html', code:`<${tag} controls muted>\n  <source src="…">\n</${tag}>`,
        note:'Add controls and either remove autoplay or start muted.' };
    }

    // 1.4.4 Resize text (viewport)
    if(checkpointId==='1.4.4'){
      return { lang:'html', code:`<meta name="viewport" content="width=device-width, initial-scale=1">`,
        note:'Do not set user-scalable=no or maximum-scale below 2.' };
    }

    // 2.1.1 Keyboard
    if(checkpointId==='2.1.1'){
      return { lang:'html', code:`<!-- Best: use semantic elements -->\n<button type="button" onclick="doThing()">Do thing</button>\n\n<!-- If you must use a div -->\n<div\n  role="button"\n  tabindex="0"\n  onclick="doThing()"\n  onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();doThing();}"\n>Do thing</div>`,
        note:'Prefer <button>. If using a div, add role, tabindex, and Enter/Space handlers.' };
    }

    // 2.1.2 No keyboard trap — iframe
    if(checkpointId==='2.1.2' && tag==='iframe'){
      return { lang:'html', code:`<iframe src="${el.getAttribute('src')||'…'}" title="Describe what this iframe contains"></iframe>`,
        note:'Every iframe needs a title attribute.' };
    }

    // 2.2.1 Timing — meta refresh
    if(checkpointId==='2.2.1' && tag==='meta'){
      return { lang:'html', code:`<!-- Remove this -->\n<meta http-equiv="refresh" content="…">\n\n<!-- Use JS with user control instead -->\n<button onclick="location.reload()">Refresh now</button>`,
        note:'Replace meta refresh with a user-controlled refresh button.' };
    }

    // 2.4.1 Skip link
    if(checkpointId==='2.4.1'){
      return { lang:'html', code:`<!-- Put this as the first focusable element in <body> -->\n<a href="#main" class="skip-link">Skip to main content</a>\n\n<main id="main" tabindex="-1">\n  …\n</main>\n\n<style>\n.skip-link {\n  position: absolute;\n  left: -9999px;\n  top: 0;\n  background: rgb(26, 86, 219);\n  color: rgb(255, 255, 255);\n  padding: 10px 14px;\n  z-index: 9999;\n}\n.skip-link:focus {\n  left: 8px;\n  top: 8px;\n}\n</style>`,
        note:'Add a skip link that becomes visible on focus and jumps past repeated content.' };
    }

    // 2.4.2 Page title
    if(checkpointId==='2.4.2'){
      return { lang:'html', code:`<head>\n  <title>Specific page topic — Site name</title>\n</head>`,
        note:'Give every page a unique, descriptive title.' };
    }

    // 2.4.4 Link purpose
    if(checkpointId==='2.4.4' && tag==='a'){
      return { lang:'html', code:`<!-- Bad -->\n<a href="…">Click here</a>\n\n<!-- Good -->\n<a href="…">Download the Q3 financial report (PDF, 2 MB)</a>\n\n<!-- Or with aria-label -->\n<a href="…" aria-label="Download Q3 financial report PDF">Download</a>`,
        note:'Make link text describe the destination, not "click here" or "read more".' };
    }

    // 2.4.6 Headings & labels
    if(checkpointId==='2.4.6'){
      if(/^h[1-6]$/.test(tag)){
        return { lang:'html', code:`<!-- Maintain heading hierarchy: don't skip levels -->\n<h1>Page title</h1>\n  <h2>Section</h2>\n    <h3>Subsection</h3>\n  <h2>Next section</h2>`,
          note:'Use exactly one <h1> and never skip heading levels.' };
      }
      if(tag==='label'){
        return { lang:'html', code:`<label for="${el.getAttribute('for')||'input-id'}">Describe what the input is for</label>`,
          note:'Labels must have descriptive text.' };
      }
    }

    // 2.4.7 Focus visible
    if(checkpointId==='2.4.7'){
      return { lang:'css', code:`/* Don't remove focus outline without replacement */\n:focus-visible {\n  outline: 2px solid rgb(26, 86, 219);\n  outline-offset: 2px;\n  border-radius: 3px;\n}\n\n/* Remove the universal outline:none rule */`,
        note:'Replace outline:none with a visible :focus-visible style.' };
    }

    // 2.4.11 Focus not obscured
    if(checkpointId==='2.4.11'){
      return { lang:'css', code:`/* Add scroll-margin so sticky headers don't hide focused elements */\n:target,\n:focus-visible {\n  scroll-margin-top: 80px; /* roughly your fixed-header height */\n}`,
        note:'Use scroll-margin-top on focusable elements when you have a sticky header.' };
    }

    // 2.5.3 Label in name
    if(checkpointId==='2.5.3'){
      const visible=(el?.textContent||el?.value||'').trim();
      const aria=(el?.getAttribute('aria-label')||'').trim();
      return { lang:'html', code:`<!-- Bad: aria-label doesn't contain visible text -->\n<${tag} aria-label="${aria}">${visible}</${tag}>\n\n<!-- Good: aria-label starts with or contains the visible text -->\n<${tag} aria-label="${visible}${aria?' ('+aria+')':''}">${visible}</${tag}>`,
        note:'Voice-control users speak the visible text — it must appear in the accessible name.' };
    }

    // 2.5.7 Dragging
    if(checkpointId==='2.5.7'){
      return { lang:'html', code:`<!-- Provide button alternatives next to draggable items -->\n<li draggable="true">\n  Item\n  <button aria-label="Move up">↑</button>\n  <button aria-label="Move down">↓</button>\n</li>`,
        note:'Drag interactions need single-point (click/keyboard) alternatives.' };
    }

    // 2.5.8 Target size
    if(checkpointId==='2.5.8'){
      return { lang:'css', code:`/* Ensure interactive targets are at least 24x24 CSS pixels */\nbutton, a, [role="button"], input[type="checkbox"], input[type="radio"] {\n  min-width: 24px;\n  min-height: 24px;\n}\n\n/* Or add padding to reach the size */\n.icon-button {\n  padding: 6px;\n}`,
        note:'Pad small targets (icon buttons, checkboxes) to reach 24×24px.' };
    }

    // 3.1.1 Language
    if(checkpointId==='3.1.1'){
      return { lang:'html', code:`<!DOCTYPE html>\n<html lang="en">\n<!-- or "hi" for Hindi, "fr" for French, etc. -->`,
        note:'Add a valid ISO 639 language code to <html>.' };
    }

    // 3.3.2 Labels or instructions
    if(checkpointId==='3.3.2'){
      const id = el?.id || `field-${Date.now()}`;
      return { lang:'html', code:`<!-- Don't rely on placeholder alone -->\n<label for="${id}">Field name</label>\n<input id="${id}" type="${el?.type||'text'}" placeholder="optional hint">\n\n<!-- For complex inputs, add instructions -->\n<label for="${id}">Phone number</label>\n<input id="${id}" type="tel" aria-describedby="${id}-help">\n<small id="${id}-help">Format: +91 9876543210</small>`,
        note:'Every input needs a real <label>. Placeholders disappear when typing.' };
    }

    // 3.3.8 Accessible auth
    if(checkpointId==='3.3.8' && tag==='input' && el?.type==='password'){
      return { lang:'html', code:`<!-- Remove paste blockers -->\n<input type="password" name="password" autocomplete="current-password">\n<!-- Do NOT use onpaste="return false" -->`,
        note:'Password fields must allow paste so password managers work.' };
    }

    // 4.1.2 Name, role, value
    if(checkpointId==='4.1.2'){
      if(issue.msg?.includes('Duplicate id')){
        return { lang:'html', code:`<!-- Make every id unique on the page -->\n<input id="email-signup">\n<input id="email-newsletter">`,
          note:'Duplicate IDs break label association and aria references.' };
      }
      if(issue.msg?.includes('aria-labelledby') || issue.msg?.includes('aria-describedby')){
        return { lang:'html', code:`<!-- The id referenced must exist -->\n<label id="email-label">Email</label>\n<input aria-labelledby="email-label">`,
          note:'Make sure every aria-labelledby/describedby points to an existing id.' };
      }
      if(tag==='button'){
        return { lang:'html', code:`<button aria-label="Describe the action">\n  <svg aria-hidden="true">…</svg>\n</button>`,
          note:'Icon-only buttons need aria-label or visually-hidden text.' };
      }
    }

    // 4.1.3 Status messages
    if(checkpointId==='4.1.3'){
      return { lang:'html', code:`<!-- For non-urgent updates -->\n<div role="status" aria-live="polite">\n  Settings saved\n</div>\n\n<!-- For errors / urgent updates -->\n<div role="alert" aria-live="assertive">\n  Login failed: invalid password\n</div>`,
        note:'Use role="status" (polite) or role="alert" (assertive) so screen readers announce updates.' };
    }

    return null;
  }

  function buildSelector(el){
    if(!el || el.nodeType!==1) return '';
    if(el.id) return '#' + CSS.escape(el.id);
    const tag = el.tagName.toLowerCase();
    const cls = (el.className && typeof el.className === 'string') ? el.className.trim().split(/\s+/).slice(0,2).map(c=>'.'+CSS.escape(c)).join('') : '';
    return tag + cls;
  }

  function showCheckpointDetail(id){
    const r = auditResults.find(x=>x.id===id);
    if(!r) return;
    sidebar.innerHTML='';
    sidebar.appendChild(makeHdr(r.id+' '+r.name, ()=>{ clearOverlays(); renderAudit(); }, `Level ${r.level} · ${r.principle}`));
    let html=`
      <div style="margin-bottom:12px">${statusBadge(r.status)}</div>
      <div style="background:${C.panel};border:1px solid ${C.border};border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:11px;line-height:1.55;color:${C.textDim}">
        ${r.summary||''}
      </div>
    `;
    if(r.issues && r.issues.length>0){
      html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <div style="font-size:11px;font-weight:700;color:${C.text}">${r.issues.length} issue${r.issues.length>1?'s':''}</div>
        <span style="flex:1"></span>
        <button id="__of_hi_all__" style="font-size:10px;padding:4px 8px;border-radius:5px;border:1px solid ${C.border};background:${C.card};color:${C.primary};cursor:pointer;font-weight:600">Highlight all</button>
      </div>`;
      r.issues.forEach((iss,idx)=>{
        const ratioInfo = iss.ratio ? `
          <div style="display:flex;align-items:center;gap:8px;margin-top:8px;padding:8px;background:${C.panel};border-radius:6px">
            <div style="display:flex;gap:3px;align-items:center">
              <div style="width:18px;height:18px;border-radius:3px;background:${iss.bgHex};border:1px solid rgba(0,0,0,.1)"></div>
              <div style="width:18px;height:18px;border-radius:3px;background:${iss.fgHex};border:1px solid rgba(0,0,0,.1)"></div>
            </div>
            <div style="font:700 14px/1 monospace;color:${iss.ratio<3?C.red:iss.ratio<4.5?C.orange:C.green}">${iss.ratio.toFixed(2)}:1</div>
            <span style="font-size:10px;color:${C.muted}">need ${iss.required}:1</span>
          </div>` : '';
        const fixCode = generateFixCode(r.id, iss);
        const hasFixCode = !!fixCode;
        const hasLocate = !!iss.el;
        html += `
          <div class="__of_iss" data-issi="${idx}" style="border:1px solid ${C.border};border-radius:8px;margin-bottom:8px;background:${C.card};overflow:hidden">
            <div style="display:flex;align-items:flex-start;gap:8px;padding:10px 12px 8px">
              <span style="background:${C.redL};color:${C.red};font-size:9px;font-weight:800;padding:1px 5px;border-radius:3px;flex-shrink:0;margin-top:1px">#${idx+1}</span>
              <div style="font-size:11px;font-weight:600;color:${C.text};line-height:1.4;flex:1">${iss.msg}</div>
            </div>
            <div style="display:flex;border-top:1px solid ${C.borderL};background:${C.panel}">
              <button data-tab="desc" data-i="${idx}" class="__of_tab __of_tab_active" style="flex:1;padding:7px 6px;border:none;background:${C.card};font-size:10px;font-weight:700;color:${C.primary};cursor:pointer;border-right:1px solid ${C.borderL};border-bottom:2px solid ${C.primary}">Description</button>
              ${hasFixCode?`<button data-tab="fix" data-i="${idx}" class="__of_tab" style="flex:1;padding:7px 6px;border:none;background:transparent;font-size:10px;font-weight:600;color:${C.textDim};cursor:pointer;border-right:1px solid ${C.borderL};border-bottom:2px solid transparent">${I.wand} Fix code</button>`:''}
              ${hasLocate?`<button data-tab="loc" data-i="${idx}" class="__of_tab" style="flex:1;padding:7px 6px;border:none;background:transparent;font-size:10px;font-weight:600;color:${C.textDim};cursor:pointer;border-bottom:2px solid transparent">Locate</button>`:''}
            </div>
            <div data-pane="desc" data-i="${idx}" style="padding:10px 12px">
              ${iss.snippet ? `<div style="background:rgb(15, 23, 42);color:rgb(203, 213, 225);font:11px/1.5 'SF Mono',monospace;padding:7px 9px;border-radius:5px;margin-bottom:6px;overflow-x:auto;white-space:pre-wrap;word-break:break-all">${escapeHtml(iss.snippet)}</div>` : ''}
              ${ratioInfo}
              ${iss.fix ? `<div style="background:${C.yellowL};border-left:3px solid ${C.gold};border-radius:0 5px 5px 0;padding:7px 9px;margin-top:6px;font-size:10px;color:${C.yellow};line-height:1.5"><b>Why:</b> ${iss.fix}</div>` : ''}
            </div>
            ${hasFixCode?`
            <div data-pane="fix" data-i="${idx}" style="padding:10px 12px;display:none">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                <span style="background:${C.blueL};color:${C.blue};font-size:9px;font-weight:800;padding:2px 6px;border-radius:3px;letter-spacing:.4px">${fixCode.lang.toUpperCase()}</span>
                <button data-copyfix="${idx}" style="font-size:10px;padding:3px 8px;border-radius:4px;border:1px solid ${C.border};background:${C.card};color:${C.textDim};cursor:pointer;font-weight:600;display:flex;align-items:center;gap:3px">${I.copy} Copy</button>
              </div>
              <pre style="background:rgb(15, 23, 42);color:rgb(226, 232, 240);font:11px/1.55 'SF Mono',Consolas,monospace;padding:10px 12px;border-radius:6px;overflow-x:auto;margin:0;white-space:pre-wrap;word-break:normal"><code data-fixcode="${idx}">${escapeHtml(fixCode.code)}</code></pre>
              <div style="margin-top:8px;font-size:10px;color:${C.textDim};line-height:1.5;background:${C.panel};border-radius:5px;padding:7px 9px"><b>Note:</b> ${escapeHtml(fixCode.note)}</div>
            </div>`:''}
            ${hasLocate?`
            <div data-pane="loc" data-i="${idx}" style="padding:10px 12px;display:none">
              <div style="font-size:10px;color:${C.textDim};line-height:1.5;margin-bottom:8px">Highlight this element on the page and scroll to it.</div>
              <button data-jiss="${idx}" style="font-size:11px;padding:7px 12px;border-radius:5px;border:none;background:${C.primary};color:rgb(255, 255, 255);cursor:pointer;font-weight:600;width:100%">Locate on page</button>
            </div>`:''}
          </div>`;
      });
    } else if(r.status==='pass'){
      html += `<div style="text-align:center;padding:30px 14px;background:${C.greenL};border-radius:8px;color:${C.green};font-size:11px;font-weight:600">
        ${I.pass} No issues detected for this checkpoint.
      </div>`;
    } else if(r.status==='manual'){
      html += `<div style="text-align:center;padding:30px 14px;background:${C.blueL};border-radius:8px;color:${C.blue};font-size:11px;line-height:1.6">
        ${I.info} <b>Manual verification needed</b><br>
        <span style="color:${C.textDim};font-weight:500">This checkpoint cannot be fully automated.</span>
      </div>`;
    } else if(r.status==='na'){
      html += `<div style="text-align:center;padding:30px 14px;background:${C.panel};border-radius:8px;color:${C.muted};font-size:11px">
        Not applicable to this page.
      </div>`;
    }
    const body=makeBody(html);
    sidebar.appendChild(body);
    const hiAll=body.querySelector('#__of_hi_all__');
    if(hiAll){
      hiAll.onclick=()=>{
        clearOverlays();
        r.issues.forEach((iss,i)=>{
          if(iss.el){ addHighlight(iss.el, C.red, '', 0.15); addBadge(iss.el, i+1, C.red); }
        });
        if(r.issues[0]?.el) scrollToEl(r.issues[0].el);
      };
    }
    body.querySelectorAll('[data-jiss]').forEach(b=>{
      b.onclick=()=>{
        const idx=+b.dataset.jiss;
        const iss=r.issues[idx];
        if(iss && iss.el){
          clearOverlays();
          addHighlight(iss.el, C.red, '', 0.18);
          addBadge(iss.el, idx+1, C.red);
          scrollToEl(iss.el);
        }
      };
    });

    // Tab switching within each issue card
    body.querySelectorAll('[data-tab]').forEach(btn=>{
      btn.onclick=()=>{
        const i = btn.dataset.i;
        const tab = btn.dataset.tab;
        // toggle tab buttons in the same card
        const card = btn.closest('.__of_iss');
        card.querySelectorAll('[data-tab]').forEach(t=>{
          const active = t.dataset.tab===tab;
          t.style.background = active?C.card:'transparent';
          t.style.color = active?C.primary:C.textDim;
          t.style.borderBottom = active?`2px solid ${C.primary}`:'2px solid transparent';
          t.style.fontWeight = active?'700':'600';
        });
        // toggle panes
        card.querySelectorAll('[data-pane]').forEach(p=>{
          p.style.display = p.dataset.pane===tab ? '' : 'none';
        });
      };
    });

    // Copy fix-code buttons
    body.querySelectorAll('[data-copyfix]').forEach(btn=>{
      btn.onclick=()=>{
        const i = btn.dataset.copyfix;
        const codeEl = body.querySelector(`[data-fixcode="${i}"]`);
        if(!codeEl) return;
        const text = codeEl.textContent;
        navigator.clipboard?.writeText(text).then(()=>{
          const orig = btn.innerHTML;
          btn.innerHTML = `${I.pass} Copied`;
          btn.style.color = C.green;
          btn.style.borderColor = C.green;
          setTimeout(()=>{
            btn.innerHTML = orig;
            btn.style.color = C.textDim;
            btn.style.borderColor = C.border;
          }, 1500);
        });
      };
    });
  }

  function exportReport(format){
    if(!auditResults) return;
    const totals = countAudit(auditResults);
    // Same heuristic as renderAuditDashboard() — not a WCAG-defined metric, see comment there.
    const failPenalty = totals.fail*8, warnPenalty = totals.warn*3;
    const score = totals.fail===0 && totals.warn===0 ? 100 :
      Math.max(0, Math.round(100 - (failPenalty + warnPenalty)));

    // Enrich every issue with its fix code (computed on the fly from generateFixCode)
    const enriched = auditResults.map(r => ({
      ...r,
      issues: (r.issues||[]).map((iss, idx) => {
        const fixCode = generateFixCode(r.id, iss);
        return {
          index: idx + 1,
          message: iss.msg,
          fix: iss.fix,
          snippet: iss.snippet || '',
          ratio: iss.ratio, fgHex: iss.fgHex, bgHex: iss.bgHex, required: iss.required,
          fontSize: iss.fontSize, fontWeight: iss.fontWeight, isLarge: iss.isLarge,
          text: iss.text,
          targetSize: iss.targetSize,
          element: iss.context ? {
            tag: iss.context.tag,
            id: iss.context.id,
            classes: iss.context.classes,
            cssSelector: iss.context.selector,
            xpath: iss.context.xpath,
            boundingRect: iss.context.position,
            visible: iss.context.visible,
          } : null,
          parent: iss.context ? {
            tag: iss.context.parentTag,
            cssSelector: iss.context.parentSelector,
            snippet: iss.context.parentSnippet,
          } : null,
          computedStyles: iss.styles,
          fixCode: fixCode ? { language: fixCode.lang, code: fixCode.code, note: fixCode.note } : null,
        };
      })
    }));

    if(format==='json'){
      const data = {
        meta: {
          url: location.href,
          title: document.title,
          userAgent: navigator.userAgent,
          viewport: { w: window.innerWidth, h: window.innerHeight },
          generated: new Date().toISOString(),
          tool: 'DWAO AI — Accessibility Suite v2',
        },
        score,
        totals: { ...totals, principleBreakdown: principleBreakdown(enriched) },
        results: enriched.map(r=>({
          checkpoint: r.id,
          name: r.name,
          level: r.level,
          principle: r.principle,
          status: r.status,
          summary: r.summary,
          issueCount: (r.issues||[]).length,
          issues: r.issues,
        })),
      };
      downloadFile('wcag-audit.json','application/json',JSON.stringify(data,null,2));
      return;
    }

    // ─── HTML REPORT ───────────────────────────────────────────────────────
    const sc = score>=90?'g':score>=70?'y':score>=50?'o':'r';
    const reportStyles = `
      *{box-sizing:border-box}
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:1100px;margin:0 auto;padding:30px 24px 80px;color:rgb(30, 41, 59);line-height:1.55;background:rgb(255, 255, 255)}
      h1{font-size:28px;margin:0 0 4px;font-weight:800;letter-spacing:-0.01em}
      h2{font-size:18px;margin:32px 0 12px;padding-bottom:8px;border-bottom:2px solid rgb(226, 232, 240);font-weight:700}
      h3{margin:0;font-size:15px;font-weight:700}
      a{color:rgb(26, 86, 219);text-decoration:none} a:hover{text-decoration:underline}
      .meta{color:rgb(100, 116, 139);font-size:13px;margin-bottom:24px}
      .scorebox{display:flex;gap:20px;background:linear-gradient(135deg,rgb(248, 250, 252),rgb(255, 255, 255));border:1px solid rgb(226, 232, 240);border-radius:14px;padding:24px;margin-bottom:24px;align-items:center}
      .score{font-size:64px;font-weight:800;line-height:1;letter-spacing:-0.02em}
      .score.g{color:rgb(22, 163, 74)}.score.y{color:rgb(202, 138, 4)}.score.o{color:rgb(234, 88, 12)}.score.r{color:rgb(220, 38, 38)}
      .scorelabel{font-size:13px;color:rgb(100, 116, 139);margin-bottom:10px}
      .stat{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:6px;font-size:12px;font-weight:700;margin:0 4px 4px 0}
      .s-fail{background:rgb(254, 226, 226);color:rgb(220, 38, 38)}.s-warn{background:rgb(254, 243, 199);color:rgb(146, 64, 14)}
      .s-pass{background:rgb(220, 252, 231);color:rgb(22, 163, 74)}.s-manual{background:rgb(219, 234, 254);color:rgb(37, 99, 235)}
      .s-na{background:rgb(241, 245, 249);color:rgb(100, 116, 139)}
      .toc{background:rgb(248, 250, 252);border:1px solid rgb(226, 232, 240);border-radius:10px;padding:14px 18px;margin-bottom:24px;font-size:13px}
      .toc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:6px 16px;margin-top:8px}
      .toc a{display:flex;justify-content:space-between;padding:4px 0;color:rgb(71, 85, 105);border-bottom:1px dotted rgb(226, 232, 240)}
      .toc a:hover{color:rgb(26, 86, 219);text-decoration:none}
      .toc .id{font-family:'SF Mono',Consolas,monospace;font-size:11px;color:rgb(148, 163, 184)}
      .cp{border:1px solid rgb(226, 232, 240);border-radius:10px;padding:18px 20px;margin-bottom:14px;background:rgb(255, 255, 255)}
      .cp.cp-fail{border-left:4px solid rgb(220, 38, 38)}
      .cp.cp-warn{border-left:4px solid rgb(202, 138, 4)}
      .cp.cp-pass{border-left:4px solid rgb(22, 163, 74)}
      .cp.cp-manual{border-left:4px solid rgb(37, 99, 235)}
      .cp.cp-na{border-left:4px solid rgb(203, 213, 225)}
      .cp-head{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}
      .cp .cid{font-family:'SF Mono',Consolas,monospace;background:rgb(241, 245, 249);padding:2px 7px;border-radius:4px;font-size:11px;color:rgb(71, 85, 105)}
      .summary{color:rgb(71, 85, 105);font-size:13px;margin:4px 0 0}
      .iss{border:1px solid rgb(226, 232, 240);border-left:3px solid rgb(220, 38, 38);background:rgb(255, 255, 255);padding:14px 16px;margin:12px 0 0;border-radius:0 6px 6px 0}
      .iss-warn{border-left-color:rgb(202, 138, 4)}
      .iss-num{background:rgb(254, 226, 226);color:rgb(220, 38, 38);font-size:10px;font-weight:800;padding:2px 7px;border-radius:3px;letter-spacing:0.4px}
      .iss-warn .iss-num{background:rgb(254, 243, 199);color:rgb(146, 64, 14)}
      .iss-msg{font-weight:600;color:rgb(30, 41, 59);margin-bottom:8px;font-size:14px;line-height:1.45}
      .iss-grid{display:grid;grid-template-columns:120px 1fr;gap:8px 16px;font-size:12px;margin:10px 0}
      .iss-grid dt{color:rgb(100, 116, 139);font-weight:600}
      .iss-grid dd{margin:0;color:rgb(30, 41, 59);word-break:break-all}
      .iss-grid code{font-family:'SF Mono',Consolas,monospace;background:rgb(241, 245, 249);padding:1px 5px;border-radius:3px;font-size:11px;color:rgb(26, 86, 219)}
      .code-block{position:relative;background:rgb(15, 23, 42);color:rgb(203, 213, 225);padding:11px 14px;border-radius:6px;font:11.5px/1.55 'SF Mono',Consolas,monospace;margin:8px 0;white-space:pre-wrap;word-break:break-word;overflow-x:auto}
      .code-label{display:inline-block;background:rgb(30, 41, 59);color:rgb(148, 163, 184);font:10px/1 'SF Mono',Consolas,monospace;padding:3px 7px;border-radius:3px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;font-weight:700}
      .code-label.html{background:rgb(219, 234, 254);color:rgb(30, 64, 175)}
      .code-label.css{background:rgb(252, 231, 243);color:rgb(159, 18, 57)}
      .copy-btn{position:absolute;top:6px;right:6px;background:rgb(51, 65, 85);color:rgb(226, 232, 240);border:none;font:11px system-ui;padding:4px 10px;border-radius:4px;cursor:pointer;opacity:0.7}
      .copy-btn:hover{opacity:1;background:rgb(71, 85, 105)}
      .fix-note{background:rgb(255, 251, 235);border-left:3px solid rgb(245, 158, 11);padding:8px 12px;margin-top:8px;font-size:12px;color:rgb(146, 64, 14);border-radius:0 5px 5px 0;line-height:1.55}
      .swatches{display:inline-flex;gap:4px;align-items:center;padding:5px 8px;background:rgb(248, 250, 252);border-radius:5px;font-family:monospace;font-size:11px}
      .sw{width:18px;height:18px;border-radius:3px;border:1px solid rgba(0,0,0,.1);display:inline-block;vertical-align:middle}
      .ratio-bad{color:rgb(220, 38, 38);font-weight:700}
      .ratio-warn{color:rgb(234, 88, 12);font-weight:700}
      .ratio-good{color:rgb(22, 163, 74);font-weight:700}
      details{margin-top:8px}
      summary{cursor:pointer;font-size:12px;color:rgb(100, 116, 139);padding:4px 0}
      summary:hover{color:rgb(26, 86, 219)}
      .empty{text-align:center;padding:20px;background:rgb(248, 250, 252);border-radius:8px;color:rgb(100, 116, 139);font-size:13px}
      .principle-head{display:flex;align-items:center;gap:10px}
      .principle-num{background:rgb(26, 86, 219);color:rgb(255, 255, 255);width:24px;height:24px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:800}
      @media print { body{max-width:none} .copy-btn{display:none} }
    `;

    const breakdown = principleBreakdown(enriched);

    let html=`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
      <title>WCAG 2.2 Audit — ${escapeHtml(document.title)}</title>
      <style>${reportStyles}</style></head><body>
      <h1>WCAG 2.2 Accessibility Audit</h1>
      <div class="meta">
        <b>${escapeHtml(document.title)}</b><br>
        <a href="${escapeHtml(location.href)}">${escapeHtml(location.href)}</a><br>
        Generated ${new Date().toLocaleString()} · Viewport ${window.innerWidth}×${window.innerHeight}<br>
        <span style="font-size:11px">Tool: DWAO AI — Accessibility Suite v2</span>
      </div>

      <div class="scorebox">
        <div>
          <div class="score ${sc}">${score}</div>
          <div style="font-size:11px;color:rgb(100, 116, 139);text-align:center;margin-top:2px;letter-spacing:0.5px">/ 100</div>
        </div>
        <div style="flex:1">
          <div class="scorelabel">Accessibility score (penalty: fail×8 + warn×3)</div>
          <div>
            <span class="stat s-fail">${totals.fail} fail</span>
            <span class="stat s-warn">${totals.warn} warn</span>
            <span class="stat s-pass">${totals.pass} pass</span>
            <span class="stat s-manual">${totals.manual} manual</span>
            <span class="stat s-na">${totals.na} N/A</span>
          </div>
          <div style="margin-top:8px;font-size:11px;color:rgb(100, 116, 139)">
            100 − (${totals.fail} fail × 8 + ${totals.warn} warn × 3) = 100 − ${failPenalty + warnPenalty} = <b>${score}</b>
            &nbsp;·&nbsp; pass/manual/N-A not counted — heuristic only, not a WCAG-defined metric
          </div>
          <div style="margin-top:10px;font-size:12px;color:rgb(100, 116, 139)">
            Total issues found: <b>${totals.issues}</b> across <b>${totals.total}</b> checkpoints
          </div>
        </div>
      </div>

      <div class="toc">
        <b style="font-size:13px">Quick navigation</b>
        <div class="toc-grid">
          ${enriched.filter(r=>r.status==='fail'||r.status==='warn').map(r=>`
            <a href="#cp-${r.id.replace(/\./g,'-')}">
              <span><span class="id">${r.id}</span> ${escapeHtml(r.name)}</span>
              <span class="stat s-${r.status}" style="font-size:9px;padding:1px 5px">${r.issues.length||r.status}</span>
            </a>`).join('')}
        </div>
      </div>
    `;

    ['Perceivable','Operable','Understandable','Robust'].forEach((p,pi)=>{
      const items=enriched.filter(r=>r.principle===p);
      if(!items.length) return;
      const pb = breakdown[p];
      html+=`<h2 class="principle-head">
        <span class="principle-num">${pi+1}</span>
        <span>${p}</span>
        <span style="margin-left:auto;font-size:11px;font-weight:500;color:rgb(100, 116, 139)">${pb.fail} fail · ${pb.warn} warn · ${pb.pass} pass</span>
      </h2>`;
      items.forEach(r=>{
        html += renderCheckpointReport(r);
      });
    });

    // Inline copy-to-clipboard script
    html+=`<script>
      document.querySelectorAll('.copy-btn').forEach(btn=>{
        btn.addEventListener('click',()=>{
          const code = btn.parentElement.querySelector('code')?.textContent || '';
          navigator.clipboard?.writeText(code).then(()=>{
            const t=btn.textContent; btn.textContent='✓ Copied'; setTimeout(()=>btn.textContent=t,1500);
          });
        });
      });
    </script></body></html>`;

    downloadFile('wcag-audit.html','text/html',html);
  }

  function principleBreakdown(results){
    const map={};
    ['Perceivable','Operable','Understandable','Robust'].forEach(p=>{
      map[p]={fail:0,warn:0,pass:0,manual:0,na:0};
    });
    results.forEach(r=>{ if(map[r.principle]) map[r.principle][r.status]++; });
    return map;
  }

  function ratioClass(ratio,required){
    if(!ratio) return '';
    if(ratio >= required) return 'ratio-good';
    if(ratio >= required*0.7) return 'ratio-warn';
    return 'ratio-bad';
  }

  function renderCheckpointReport(r){
    const cssClass = `cp cp-${r.status}`;
    let inner = `
      <div class="${cssClass}" id="cp-${r.id.replace(/\./g,'-')}">
        <div class="cp-head">
          <h3>${escapeHtml(r.name)}</h3>
          <span class="cid">${r.id}</span>
          <span class="stat s-${r.status}" style="font-size:10px">${r.status.toUpperCase()} · LEVEL ${r.level}</span>
        </div>
        <p class="summary">${escapeHtml(r.summary||'')}</p>
    `;
    if(r.issues && r.issues.length){
      r.issues.forEach((iss)=>{
        inner += renderIssueReport(iss, r.status);
      });
    } else if(r.status==='pass'){
      inner += `<div class="empty" style="background:rgb(220, 252, 231);color:rgb(22, 163, 74)">✓ No issues detected</div>`;
    } else if(r.status==='manual'){
      inner += `<div class="empty" style="background:rgb(219, 234, 254);color:rgb(37, 99, 235)">ℹ Manual verification needed</div>`;
    } else if(r.status==='na'){
      inner += `<div class="empty">Not applicable to this page</div>`;
    }
    inner += `</div>`;
    return inner;
  }

  function renderIssueReport(iss, parentStatus){
    const issClass = parentStatus==='warn' ? 'iss iss-warn' : 'iss';
    const numClass = parentStatus==='warn' ? 'iss-warn' : '';
    let html = `<div class="${issClass}">
      <span class="iss-num">#${iss.index}</span>
      <div class="iss-msg" style="display:inline;margin-left:6px">${escapeHtml(iss.message)}</div>
    `;

    // Element details
    if(iss.element){
      html += `<dl class="iss-grid">`;
      html += `<dt>Element</dt><dd><code>&lt;${iss.element.tag}${iss.element.id?` id="${escapeHtml(iss.element.id)}"`:''}${iss.element.classes?` class="${escapeHtml(iss.element.classes.slice(0,80))}${iss.element.classes.length>80?'…':''}"`:''}&gt;</code></dd>`;
      if(iss.element.cssSelector) html += `<dt>CSS selector</dt><dd><code>${escapeHtml(iss.element.cssSelector)}</code></dd>`;
      if(iss.element.xpath) html += `<dt>XPath</dt><dd><code style="font-size:10px">${escapeHtml(iss.element.xpath)}</code></dd>`;
      if(iss.element.boundingRect){
        const r=iss.element.boundingRect;
        html += `<dt>Position</dt><dd>${r.x}, ${r.y} · ${r.w}×${r.h}px</dd>`;
      }
      html += `</dl>`;
    }

    // Contrast-specific
    if(iss.ratio){
      const rc = ratioClass(iss.ratio, iss.required);
      html += `<div style="margin:8px 0;font-size:13px">
        <span class="swatches"><span class="sw" style="background:${iss.bgHex}"></span> ${iss.bgHex}</span>
        <span style="margin:0 6px;color:rgb(100, 116, 139)">on</span>
        <span class="swatches"><span class="sw" style="background:${iss.fgHex}"></span> ${iss.fgHex}</span>
        <span style="margin-left:10px"><span class="${rc}">${iss.ratio.toFixed(2)}:1</span> · needs ${iss.required}:1</span>
        ${iss.fontSize?`<span style="color:rgb(100, 116, 139);font-size:12px;margin-left:10px">${iss.fontSize|0}px${iss.fontWeight>=700?' bold':''}${iss.isLarge?' (large)':''}</span>`:''}
      </div>`;
      if(iss.text) html += `<div style="font-size:12px;color:rgb(100, 116, 139);margin:6px 0">Text sample: <i>"${escapeHtml(iss.text)}"</i></div>`;
    }

    // Target size
    if(iss.targetSize){
      html += `<div style="margin:8px 0;font-size:13px">
        Actual: <b>${iss.targetSize.w}×${iss.targetSize.h}px</b> · Required: ≥${iss.required}×${iss.required}px
      </div>`;
    }

    // Failing snippet
    if(iss.snippet){
      html += `<div class="code-label">Failing element</div>
        <div class="code-block"><button class="copy-btn">Copy</button><code>${escapeHtml(iss.snippet)}</code></div>`;
    }

    // Parent context
    if(iss.parent && iss.parent.snippet){
      html += `<details>
        <summary>↑ Parent: &lt;${iss.parent.tag}&gt; ${iss.parent.cssSelector?'· '+escapeHtml(iss.parent.cssSelector):''}</summary>
        <div class="code-block" style="margin-top:4px"><code>${escapeHtml(iss.parent.snippet)}</code></div>
      </details>`;
    }

    // Why / quick fix
    if(iss.fix){
      html += `<div class="fix-note"><b>Why this fails:</b> ${escapeHtml(iss.fix)}</div>`;
    }

    // Fix code (the actionable patch)
    if(iss.fixCode){
      html += `<div style="margin-top:10px"><div class="code-label ${iss.fixCode.language}">${iss.fixCode.language.toUpperCase()} fix</div>
        <div class="code-block"><button class="copy-btn">Copy</button><code>${escapeHtml(iss.fixCode.code)}</code></div>`;
      if(iss.fixCode.note) html += `<div class="fix-note">${escapeHtml(iss.fixCode.note)}</div>`;
      html += `</div>`;
    }

    // Computed styles (collapsed by default — useful for debugging contrast)
    if(iss.computedStyles && iss.ratio){
      const s = iss.computedStyles;
      html += `<details>
        <summary>Computed styles</summary>
        <dl class="iss-grid" style="margin-top:6px">
          <dt>color</dt><dd><code>${escapeHtml(s.color||'')}</code></dd>
          <dt>background</dt><dd><code>${escapeHtml(s.backgroundColor||'')}</code></dd>
          <dt>font-size</dt><dd>${escapeHtml(s.fontSize||'')}</dd>
          <dt>font-weight</dt><dd>${escapeHtml(s.fontWeight||'')}</dd>
        </dl>
      </details>`;
    }

    html += `</div>`;
    return html;
  }
  function downloadFile(name,mime,content){
    const blob=new Blob([content],{type:mime});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download=name;
    document.body.appendChild(a); a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
  }

  // ── CONTRAST ──────────────────────────────────────────────────────────────
  function stopHover() {
    hoverActive=false;
    document.removeEventListener('mousemove',onHoverMove,true);
    document.removeEventListener('click',onHoverClick,true);
    document.documentElement.style.cursor='';
    hoverTooltip?.remove(); hoverTooltip=null;
  }
  function onHoverMove(e) {
    if (!hoverActive||e.target.closest('#__of_sidebar__')||e.target.closest('#__of_tt__')) return;
    const el=document.elementFromPoint(e.clientX,e.clientY);
    if (!el||el.closest('#__of_sidebar__')) return;
    const info=getElementContrast(el);
    if (!info||info.ratio===Infinity) { hoverTooltip&&(hoverTooltip.style.opacity='0'); return; }
    showHoverTooltip(e.clientX, e.clientY, info, false);
  }
  function onHoverClick(e) {
    if (!hoverActive||e.target.closest('#__of_sidebar__')) return;
    e.preventDefault(); e.stopPropagation();
    const el=document.elementFromPoint(e.clientX,e.clientY);
    if (!el||el.closest('#__of_sidebar__')) return;
    const info=getElementContrast(el);
    if (!info) return;
    updatePinnedInfo(info, el);
  }
  function showHoverTooltip(cx,cy,info,pinned) {
    if (!hoverTooltip) {
      hoverTooltip=document.createElement('div');
      hoverTooltip.id='__of_tt__';
      Object.assign(hoverTooltip.style,{position:'fixed',pointerEvents:'none',zIndex:'2147483647',
        fontFamily:'system-ui,sans-serif',background:'rgb(30, 41, 59)',color:'rgb(241, 245, 249)',
        borderRadius:'10px',padding:'12px',boxShadow:'0 8px 32px rgba(0,0,0,.5)',
        width:'220px',transition:'opacity .08s',fontSize:'12px',lineHeight:'1'});
      document.documentElement.appendChild(hoverTooltip);
    }
    const {ratio,fgHex,bgHex,el}=info;
    // Detect if THIS element's text is "large" per WCAG (>=24px, or >=18.66px bold)
    const style=el?window.getComputedStyle(el):null;
    const fs=style?parseFloat(style.fontSize):16;
    const fw=style?(parseInt(style.fontWeight,10)||400):400;
    const isLarge=(fs>=24)||(fs>=18.66 && fw>=700);
    const required=isLarge?3:4.5;
    const pass=ratio>=required;
    const mc=pass?'rgb(74, 222, 128)':'rgb(248, 113, 113)';
    hoverTooltip.innerHTML=`
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div style="display:flex;gap:4px;align-items:center">
          <div style="width:20px;height:20px;border-radius:4px;background:${bgHex};border:1px solid rgba(255,255,255,.2)"></div>
          <div style="color:rgba(255,255,255,.4);font-size:9px">vs</div>
          <div style="width:20px;height:20px;border-radius:4px;background:${fgHex};border:1px solid rgba(255,255,255,.2)"></div>
        </div>
        <div style="font:700 22px/1 monospace;color:${mc}">${ratio.toFixed(2)}<span style="font-size:11px;color:rgba(255,255,255,.4)">:1</span></div>
      </div>
      <div style="background:${pass?'rgba(74,222,128,.15)':'rgba(248,113,113,.15)'};padding:6px 10px;border-radius:5px;display:flex;align-items:center;justify-content:space-between;font-size:11px">
        <span style="color:rgba(255,255,255,.85);font-weight:600">WCAG AA · ${isLarge?'Large':'Normal'} text</span>
        <span style="color:${mc};font-weight:700">${pass?'✓ Pass':`✗ Fail (need ${required}:1)`}</span>
      </div>
      <div style="margin-top:8px;font-size:9px;color:rgba(255,255,255,.3);display:flex;justify-content:space-between">
        <span>BG ${bgHex}</span><span>FG ${fgHex} · ${fs|0}px${fw>=700?' bold':''}</span>
      </div>
      ${!pinned?`<div style="margin-top:8px;font-size:9px;color:rgba(255,255,255,.4);text-align:center">Click to pin & see fix</div>`:''}
    `;
    const tw=230,th=150,tx=cx+16>window.innerWidth-C.SIDEBAR_W-tw?cx-tw-8:cx+16;
    const ty=cy+16>window.innerHeight-th?cy-th-8:cy+16;
    hoverTooltip.style.left=tx+'px'; hoverTooltip.style.top=ty+'px'; hoverTooltip.style.opacity='1';
  }
  function updatePinnedInfo(info,el) {
    const panel=sidebar.querySelector('#__of_pinned__');
    if (!panel) return;
    const {ratio,fgHex,bgHex}=info;
    const style=window.getComputedStyle(el);
    const fs=parseFloat(style.fontSize);
    const fw=parseInt(style.fontWeight,10)||400;
    const isLarge=(fs>=24)||(fs>=18.66 && fw>=700);
    const required=isLarge?3:4.5;
    const pass=ratio>=required;
    const mc=pass?C.green:C.red;
    const fix=!pass?suggestFixColor(fgHex,bgHex,required):null;
    const tid=++fixIdCounter; fixTargets.set('hover_'+tid,{el,prop:'color'});
    const tag=el.tagName.toLowerCase();
    const preview=`<div style="background:${bgHex};color:${fgHex};padding:6px 10px;border-radius:5px;font-size:12px;font-weight:500">Aa — Preview</div>`;
    panel.innerHTML=`
      <div style="border-top:1px solid ${C.border};padding-top:12px;margin-top:4px">
        <div style="font-size:10px;font-weight:700;color:${C.muted};text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">
          Pinned · &lt;${tag}&gt; · ${fs|0}px${fw>=700?' bold':''}
        </div>
        ${preview}
        <div style="display:flex;align-items:center;justify-content:space-between;margin:10px 0 8px">
          <div style="font:700 20px/1 monospace;color:${mc}">${ratio.toFixed(2)}:1</div>
          ${passTag(pass)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:10px;margin-bottom:10px">
          <div style="background:${C.panel};border-radius:5px;padding:6px;text-align:center"><div style="color:${C.muted}">AA Normal (4.5:1)</div><div style="margin-top:3px">${passTag(ratio>=4.5)}</div></div>
          <div style="background:${C.panel};border-radius:5px;padding:6px;text-align:center"><div style="color:${C.muted}">AA Large (3:1)</div><div style="margin-top:3px">${passTag(ratio>=3)}</div></div>
        </div>
        <div style="font-size:10px;color:${C.muted};margin-bottom:10px;text-align:center">
          This element is <b style="color:${C.text}">${isLarge?'large':'normal'}</b> text — needs <b style="color:${C.text}">${required}:1</b>
        </div>
        ${!pass && fix ? `
        <div style="background:${C.yellowL};border:1px solid rgb(120, 96, 20);border-radius:7px;padding:10px 12px">
          <div style="font-size:11px;font-weight:700;color:${C.yellow};margin-bottom:6px">${I.wand} Suggested fix</div>
          <div style="font-size:10px;color:${C.textDim};margin-bottom:8px">
            Change colour from <code>${fgHex}</code> to <code>${fix}</code> → reaches ${cRatio(lum(...Object.values(hexToRGB(fix))),lum(...Object.values(hexToRGB(bgHex)))).toFixed(2)}:1.
          </div>
          <div style="display:flex;gap:6px">
            <button data-apply="hover_${tid}" data-fix="${fix}" style="padding:6px 10px;border-radius:5px;border:none;background:${C.primary};color:rgb(255, 255, 255);font-size:10px;font-weight:700;cursor:pointer">Apply on page</button>
            <button data-copy="${fix}" style="padding:6px 10px;border-radius:5px;border:1px solid ${C.border};background:${C.card};color:${C.text};font-size:10px;font-weight:700;cursor:pointer">${I.copy} Copy</button>
          </div>
        </div>` : ''}
      </div>`;
    panel.querySelector('[data-apply]')?.addEventListener('click',e=>{
      const t=fixTargets.get(e.currentTarget.dataset.apply);
      if(t&&t.el) t.el.style.color=e.currentTarget.dataset.fix;
    });
    panel.querySelector('[data-copy]')?.addEventListener('click',e=>{
      navigator.clipboard?.writeText(e.currentTarget.dataset.copy);
      e.currentTarget.textContent='✓ Copied';
    });
  }
  function featureContrast(){
    sidebar.innerHTML='';
    sidebar.appendChild(makeHdr('Colour Contrast',true));
    const body=makeBody(`
      <div style="display:flex;gap:5px;margin-bottom:12px">
        <button data-mode="hover" style="flex:1;padding:8px 4px;border-radius:7px;border:1px solid ${C.primary};background:${hexA(C.primary,.06)};color:${C.primary};font-size:11px;font-weight:700;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px">${I.hover}<span>Hover</span></button>
        <button data-mode="scan" style="flex:1;padding:8px 4px;border-radius:7px;border:1px solid ${C.border};background:${C.card};color:${C.text};font-size:11px;font-weight:700;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px">${I.scan}<span>Scan all</span></button>
      </div>
      <div id="__of_mode__"></div>
      <div id="__of_pinned__"></div>
    `);
    sidebar.appendChild(body);
    const modeBox=body.querySelector('#__of_mode__');
    const setMode=(m)=>{
      stopHover();clearOverlays();
      body.querySelectorAll('[data-mode]').forEach(b=>{
        const active=b.dataset.mode===m;
        b.style.borderColor=active?C.primary:C.border;
        b.style.background=active?hexA(C.primary,.06):C.card;
        b.style.color=active?C.primary:C.text;
      });
      if(m==='hover'){
        modeBox.innerHTML=`<div style="background:${C.panel};border-radius:8px;padding:12px;font-size:11px;color:${C.textDim};line-height:1.5">
          Hover over any element to see its contrast ratio. Click to pin and see fix suggestions.
        </div>`;
        hoverActive=true;
        document.addEventListener('mousemove',onHoverMove,true);
        document.addEventListener('click',onHoverClick,true);
        document.documentElement.style.cursor='crosshair';
      } else if(m==='scan'){
        modeBox.innerHTML=`<div style="text-align:center;padding:14px;font-size:11px;color:${C.muted}">Scanning all text on the page…</div>`;
        setTimeout(()=>doFullScan(modeBox),50);
      }
    };
    body.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
    setMode('hover');
  }
  function doFullScan(box){
    const fails=[]; const seen=new WeakSet();
    const walker=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(n){
        if(!n.textContent.trim()) return NodeFilter.FILTER_REJECT;
        const p=n.parentElement;
        if(!p || seen.has(p)) return NodeFilter.FILTER_REJECT;
        if(['SCRIPT','STYLE','NOSCRIPT'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
        if(p.closest('#__of_sidebar__,#__of_overlay__')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let node; let total=0;
    while((node=walker.nextNode()) && total<500){
      const p=node.parentElement; seen.add(p);
      const style=window.getComputedStyle(p);
      if(style.display==='none'||style.visibility==='hidden') continue;
      const fg=parseRGBA(style.color); if(!fg||fg.a<0.1) continue;
      const bg=getEffectiveBg(p);
      const ratio=cRatio(lum(fg.r,fg.g,fg.b),lum(bg.r,bg.g,bg.b));
      const fs=parseFloat(style.fontSize);
      const fw=parseInt(style.fontWeight,10)||400;
      const isLarge=(fs>=24) || (fs>=18.66 && fw>=700);
      const req=isLarge?3:4.5;
      total++;
      if(ratio<req){
        fails.push({el:p,ratio,fgHex:toHex(fg.r,fg.g,fg.b),bgHex:toHex(bg.r,bg.g,bg.b),req,text:(p.textContent||'').slice(0,40)});
      }
    }
    clearOverlays();
    fails.slice(0,80).forEach((f,i)=>{ addHighlight(f.el,C.red,'',0.12); addBadge(f.el,i+1,C.red); });
    box.innerHTML=`
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px">
        ${statCard('Checked',total,C.text)}
        ${statCard('Passing',total-fails.length,C.green)}
        ${statCard('Failing',fails.length,C.red)}
      </div>
      <div style="font-size:11px;font-weight:700;color:${C.text};margin-bottom:6px">${fails.length} failing element${fails.length===1?'':'s'}${fails.length>80?' (showing 80)':''}</div>
      <div style="max-height:400px;overflow-y:auto">
      ${fails.slice(0,80).map((f,i)=>`
        <button data-fi="${i}" style="display:block;width:100%;text-align:left;background:${C.card};border:1px solid ${C.border};border-radius:6px;padding:8px 10px;margin-bottom:5px;cursor:pointer">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
            <span style="background:${C.redL};color:${C.red};font-size:9px;font-weight:800;padding:1px 5px;border-radius:3px">${i+1}</span>
            <code style="font:700 12px/1 monospace;color:${C.red}">${f.ratio.toFixed(2)}:1</code>
            <span style="font-size:9px;color:${C.muted}">need ${f.req}:1</span>
            <span style="flex:1"></span>
            <div style="width:14px;height:14px;border-radius:3px;background:${f.fgHex};border:1px solid rgba(0,0,0,.1)"></div>
            <div style="width:14px;height:14px;border-radius:3px;background:${f.bgHex};border:1px solid rgba(0,0,0,.1)"></div>
          </div>
          <div style="font-size:10px;color:${C.textDim};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">"${escapeHtml(f.text)}"</div>
        </button>`).join('')}
      </div>`;
    box.querySelectorAll('[data-fi]').forEach(b=>b.onclick=()=>{
      const f=fails[+b.dataset.fi]; if(f) scrollToEl(f.el);
    });
  }

  // ── ALT TEXT ──────────────────────────────────────────────────────────────
  function featureAltText(){
    sidebar.innerHTML='';
    sidebar.appendChild(makeHdr('Alt Text Review',true));
    const imgs=Array.from(document.querySelectorAll('img'));
    const data=imgs.map(img=>{
      const alt=img.getAttribute('alt');
      let status='good',msg='';
      if(alt===null){status='fail';msg='Missing alt attribute';}
      else if(alt.trim()===''){status='deco';msg='Decorative (empty alt)';}
      else if(/^(image|picture|graphic|photo)\s*(of|:)?/i.test(alt)){status='warn';msg='Redundant prefix';}
      else if(/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(alt.trim())){status='fail';msg='Alt is a filename';}
      else if(alt.length<3){status='warn';msg='Very short alt';}
      else msg='Has alt text';
      return {img,alt,status,msg};
    });
    const stats={good:0,warn:0,fail:0,deco:0};
    data.forEach(d=>stats[d.status]++);
    clearOverlays();
    data.forEach(d=>{
      if(d.status==='fail') addHighlight(d.img,C.red,'',.18);
      else if(d.status==='warn') addHighlight(d.img,C.orange,'',.15);
    });
    const body=makeBody(`
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:12px">
        ${statCard('Total',data.length,C.text)}
        ${statCard('Good',stats.good,C.green)}
        ${statCard('Warn',stats.warn,C.orange)}
        ${statCard('Fail',stats.fail,C.red)}
      </div>
      <div style="font-size:10px;color:${C.muted};margin-bottom:8px">${stats.deco} decorative (empty alt)</div>
      <div style="max-height:500px;overflow-y:auto">
      ${data.map((d,i)=>{
        const color = d.status==='fail'?C.red : d.status==='warn'?C.orange : d.status==='deco'?C.muted : C.green;
        return `<button data-ai="${i}" style="display:flex;gap:9px;width:100%;background:${C.card};border:1px solid ${C.border};border-radius:7px;padding:8px 10px;margin-bottom:6px;cursor:pointer;text-align:left;align-items:flex-start">
          <img src="${d.img.src}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;background:${C.panel};flex-shrink:0" onerror="this.style.display='none'">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px">
              <span style="background:${hexA(color,.15)};color:${color};font-size:9px;font-weight:800;padding:1px 5px;border-radius:3px">${d.status.toUpperCase()}</span>
              <span style="font-size:10px;color:${C.muted}">${d.msg}</span>
            </div>
            <div style="font-size:11px;color:${C.text};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.alt===null?'<i style="color:'+C.red+'">(no alt attribute)</i>':d.alt.trim()===''?'<i style="color:'+C.muted+'">(empty)</i>':escapeHtml(d.alt)}</div>
          </div>
        </button>`;
      }).join('')}
      </div>
    `);
    sidebar.appendChild(body);
    body.querySelectorAll('[data-ai]').forEach(b=>b.onclick=()=>{
      const d=data[+b.dataset.ai]; if(d) scrollToEl(d.img);
    });
  }

  // ── FOCUS ORDER ──────────────────────────────────────────────────────────
  function isFocusableEl(el){
    if(!el) return false;
    const ti=el.getAttribute('tabindex');
    if(ti && parseInt(ti,10)<0) return false;
    if(ti && parseInt(ti,10)>=0) return true;
    if(['A','AREA'].includes(el.tagName)) return !!el.getAttribute('href');
    if(['BUTTON','SELECT','TEXTAREA'].includes(el.tagName)) return !el.disabled;
    if(el.tagName==='INPUT') return !el.disabled && el.type!=='hidden';
    if(el.tagName==='IFRAME') return true;
    if(el.isContentEditable) return true;
    return false;
  }
  function featureFocus(){
    sidebar.innerHTML='';
    sidebar.appendChild(makeHdr('Focus Order',true));
    const all=Array.from(document.querySelectorAll('a[href],button,input,select,textarea,iframe,[tabindex],[contenteditable]'))
      .filter(el=>{
        if(!isFocusableEl(el)) return false;
        if(el.closest('#__of_sidebar__')) return false;
        const r=el.getBoundingClientRect();
        return r.width>0 && r.height>0;
      });
    const sorted=[...all].sort((a,b)=>{
      const ta=parseInt(a.getAttribute('tabindex')||'0',10);
      const tb=parseInt(b.getAttribute('tabindex')||'0',10);
      if(ta>0 && tb>0) return ta-tb;
      if(ta>0) return -1;
      if(tb>0) return 1;
      return 0;
    });
    clearOverlays();
    sorted.forEach((el,i)=>{ addHighlight(el,C.primary,'',.08); addBadge(el,i+1,C.primary); });
    const positives=sorted.filter(el=>parseInt(el.getAttribute('tabindex')||'0',10)>0);
    const body=makeBody(`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px">
        ${statCard('Focusable',sorted.length,C.primary)}
        ${statCard('Positive tabindex',positives.length,positives.length?C.red:C.green)}
      </div>
      ${positives.length?`<div style="background:${C.redL};border-left:3px solid ${C.red};border-radius:0 5px 5px 0;padding:8px 10px;font-size:10px;color:${C.red};margin-bottom:10px;line-height:1.5">${I.fail} <b>Positive tabindex detected</b> — these override DOM order and create unpredictable navigation.</div>`:''}
      <div style="max-height:480px;overflow-y:auto">
      ${sorted.map((el,i)=>{
        const ti=el.getAttribute('tabindex');
        const tag=el.tagName.toLowerCase();
        const text=(el.textContent||el.value||el.getAttribute('aria-label')||'').trim().slice(0,40);
        return `<button data-fi="${i}" style="display:flex;align-items:center;gap:8px;width:100%;text-align:left;background:${C.card};color:${C.text};border:1px solid ${C.border};border-radius:6px;padding:6px 8px;margin-bottom:4px;cursor:pointer">
          <span style="background:${C.primary};color:rgb(255, 255, 255);font-size:9px;font-weight:700;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">${i+1}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600;color:${C.text}">&lt;${tag}${ti?` tabindex="${ti}"`:''}&gt;</div>
            <div style="font-size:10px;color:${C.muted};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(text)||'<i>(no text)</i>'}</div>
          </div>
        </button>`;
      }).join('')}
      </div>
    `);
    sidebar.appendChild(body);
    body.querySelectorAll('[data-fi]').forEach(b=>b.onclick=()=>{const el=sorted[+b.dataset.fi];if(el){scrollToEl(el);el.focus?.();}});
  }

  // ── KEYBOARD ─────────────────────────────────────────────────────────────
  function featureKeyboard(){
    sidebar.innerHTML='';
    sidebar.appendChild(makeHdr('Keyboard Test',true));
    const issues={inaccessible:[], unfocusable:[], trapRisk:[], missingHandlers:[]};
    document.querySelectorAll('[onclick]').forEach(el=>{
      if(['A','BUTTON','INPUT','SELECT','TEXTAREA'].includes(el.tagName)) return;
      const role=el.getAttribute('role');
      const ti=el.getAttribute('tabindex');
      if(!ti) issues.inaccessible.push(el);
      else if(!role) issues.missingHandlers.push(el);
    });
    document.querySelectorAll('div,span').forEach(el=>{
      if(el.closest('#__of_sidebar__')) return;
      const s=window.getComputedStyle(el);
      if(s.cursor!=='pointer') return;
      if(el.hasAttribute('onclick')||el.hasAttribute('tabindex')||el.getAttribute('role')) return;
      const r=el.getBoundingClientRect();
      if(r.width<20||r.height<20) return;
      if(el.querySelector('a,button,input')) return;
      issues.unfocusable.push(el);
    });
    document.querySelectorAll('iframe:not([title])').forEach(el=>issues.trapRisk.push(el));
    document.querySelectorAll('[role=dialog],[role=alertdialog],dialog').forEach(d=>{
      const s=window.getComputedStyle(d);
      if(s.display==='none'||s.visibility==='hidden') return;
      if(!d.querySelector('[aria-label*="close" i],[data-dismiss],[data-close]')) issues.trapRisk.push(d);
    });
    clearOverlays();
    [...issues.inaccessible,...issues.unfocusable,...issues.missingHandlers].forEach(el=>addHighlight(el,C.red,'',.15));
    issues.trapRisk.forEach(el=>addHighlight(el,C.orange,'',.13));
    const total = issues.inaccessible.length + issues.unfocusable.length + issues.missingHandlers.length + issues.trapRisk.length;
    function renderIssueRow(key,el){
      const tag=el.tagName.toLowerCase();
      const snippet=(el.outerHTML||'').replace(/\s+/g,' ').slice(0,80);
      return `<button data-k="${key}" style="display:block;width:100%;text-align:left;background:${C.card};color:${C.text};border:1px solid ${C.border};border-radius:6px;padding:6px 9px;margin-bottom:4px;cursor:pointer">
        <div style="font-size:11px;font-weight:600;color:${C.text}">&lt;${tag}&gt;</div>
        <div style="font-size:10px;color:${C.muted};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(snippet)}</div>
      </button>`;
    }
    const body=makeBody(`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px">
        ${statCard('Inaccessible',issues.inaccessible.length+issues.unfocusable.length+issues.missingHandlers.length,issues.inaccessible.length+issues.unfocusable.length+issues.missingHandlers.length?C.red:C.green)}
        ${statCard('Trap risks',issues.trapRisk.length,issues.trapRisk.length?C.orange:C.green)}
      </div>
      ${total===0?`<div style="text-align:center;padding:30px 14px;background:${C.greenL};border-radius:8px;color:${C.green};font-size:12px;font-weight:600">${I.pass} No keyboard issues detected</div>`:''}
      ${issues.inaccessible.length?`
        <div style="font-size:11px;font-weight:700;color:${C.red};margin:10px 0 6px;display:flex;align-items:center;gap:5px">${I.fail} onclick without tabindex (${issues.inaccessible.length})</div>
        ${issues.inaccessible.slice(0,15).map((el,i)=>renderIssueRow('inac_'+i,el)).join('')}
      `:''}
      ${issues.unfocusable.length?`
        <div style="font-size:11px;font-weight:700;color:${C.red};margin:10px 0 6px;display:flex;align-items:center;gap:5px">${I.fail} cursor:pointer but unfocusable (${issues.unfocusable.length})</div>
        ${issues.unfocusable.slice(0,15).map((el,i)=>renderIssueRow('unf_'+i,el)).join('')}
      `:''}
      ${issues.missingHandlers.length?`
        <div style="font-size:11px;font-weight:700;color:${C.red};margin:10px 0 6px;display:flex;align-items:center;gap:5px">${I.fail} onclick without role (${issues.missingHandlers.length})</div>
        ${issues.missingHandlers.slice(0,15).map((el,i)=>renderIssueRow('mh_'+i,el)).join('')}
      `:''}
      ${issues.trapRisk.length?`
        <div style="font-size:11px;font-weight:700;color:${C.orange};margin:10px 0 6px;display:flex;align-items:center;gap:5px">${I.warn} Potential trap risk (${issues.trapRisk.length})</div>
        ${issues.trapRisk.slice(0,15).map((el,i)=>renderIssueRow('tr_'+i,el)).join('')}
      `:''}
    `);
    sidebar.appendChild(body);
    const map={inac:issues.inaccessible, unf:issues.unfocusable, mh:issues.missingHandlers, tr:issues.trapRisk};
    body.querySelectorAll('[data-k]').forEach(b=>{
      b.onclick=()=>{
        const [k,i]=b.dataset.k.split('_'); const el=map[k]?.[+i];
        if(el) scrollToEl(el);
      };
    });
  }

  // ── SCREEN READER ────────────────────────────────────────────────────────
  function stopSR(){srPlaying=false;window.speechSynthesis?.cancel();}
  function buildSRItems(){
    const items=[];
    const walk=node=>{
      if(!node) return;
      if(node.nodeType===3){const t=node.textContent.trim();if(t)items.push({text:t,el:node.parentElement,type:'text'});return;}
      if(node.nodeType!==1) return;
      if(node.closest && node.closest('#__of_sidebar__,#__of_overlay__')) return;
      const tag=node.tagName;
      if(['SCRIPT','STYLE','NOSCRIPT'].includes(tag)) return;
      const style=window.getComputedStyle(node);
      if(style.display==='none'||style.visibility==='hidden') return;
      if(tag==='IMG'){const a=node.alt;if(a)items.push({text:`Image: ${a}`,el:node,type:'img'});return;}
      if(tag==='A'){const t=(node.textContent||'').trim();if(t)items.push({text:`Link: ${t}`,el:node,type:'link'});return;}
      if(tag==='BUTTON'){const t=(node.textContent||node.getAttribute('aria-label')||'').trim();if(t)items.push({text:`Button: ${t}`,el:node,type:'btn'});return;}
      if(/^H[1-6]$/.test(tag)){const t=(node.textContent||'').trim();if(t)items.push({text:`Heading level ${tag[1]}: ${t}`,el:node,type:'h'});return;}
      Array.from(node.childNodes).forEach(walk);
    };
    walk(document.body);
    return items;
  }
  function featureScreenReader(){
    stopSR(); srItems=buildSRItems(); srIdx=0;
    sidebar.innerHTML=''; sidebar.appendChild(makeHdr('Screen Reader',true));
    const body=makeBody(`
      <div style="background:${C.panel};border-radius:8px;padding:11px;margin-bottom:12px;font-size:11px;color:${C.textDim};line-height:1.5">
        Plays the page in linear order using your browser's Speech Synthesis API.
      </div>
      <div style="background:${C.card};border:1px solid ${C.border};border-radius:8px;padding:12px;margin-bottom:10px">
        <div style="font-size:10px;color:${C.muted};margin-bottom:6px"><span id="__sr_i__">1</span> / ${srItems.length}</div>
        <div id="__sr_txt__" style="font-size:13px;font-weight:600;color:${C.text};min-height:40px;line-height:1.4"></div>
        <div style="display:flex;gap:5px;margin-top:10px">
          <button id="__sr_prev__" style="padding:7px 10px;border-radius:6px;border:1px solid ${C.border};background:${C.card};color:${C.text};cursor:pointer;display:flex;align-items:center">${I.prev}</button>
          <button id="__sr_play__" style="flex:1;padding:7px;border-radius:6px;border:none;background:${C.primary};color:rgb(255, 255, 255);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;font-size:11px;font-weight:700">${I.play} Play</button>
          <button id="__sr_next__" style="padding:7px 10px;border-radius:6px;border:1px solid ${C.border};background:${C.card};color:${C.text};cursor:pointer;display:flex;align-items:center">${I.next}</button>
        </div>
      </div>
      <div style="max-height:380px;overflow-y:auto;border:1px solid ${C.border};border-radius:8px">
        ${srItems.map((it,i)=>`<div data-si="${i}" style="padding:6px 10px;font-size:11px;border-bottom:1px solid ${C.borderL};cursor:pointer">${escapeHtml(it.text).slice(0,80)}</div>`).join('')}
      </div>
    `);
    sidebar.appendChild(body);
    function updateSR(){
      const item=srItems[srIdx];if(!item)return;
      body.querySelector('#__sr_txt__').textContent=item.text;
      body.querySelector('#__sr_i__').textContent=srIdx+1;
      clearOverlays();
      if(item.el){addHighlight(item.el,C.primary,'',0.2);scrollToEl(item.el);}
      body.querySelectorAll('[data-si]').forEach(r=>{
        const i=+r.dataset.si;
        r.style.background=i===srIdx?hexA(C.primary,.1):'';
        r.style.color=i===srIdx?C.primary:C.text;
        if(i===srIdx)r.scrollIntoView({block:'nearest'});
      });
    }
    function speak(text,onEnd){if(!window.speechSynthesis){onEnd?.();return;}window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=1.1;u.onend=onEnd;window.speechSynthesis.speak(u);}
    function playNext(){if(!srPlaying||srIdx>=srItems.length){srPlaying=false;return;}updateSR();speak(srItems[srIdx].text,()=>{if(srPlaying){srIdx++;playNext();}});}
    body.querySelector('#__sr_play__').onclick=()=>{srPlaying=!srPlaying;body.querySelector('#__sr_play__').innerHTML=srPlaying?I.pause:I.play;if(srPlaying)playNext();else window.speechSynthesis?.cancel();};
    body.querySelector('#__sr_prev__').onclick=()=>{srPlaying=false;window.speechSynthesis?.cancel();body.querySelector('#__sr_play__').innerHTML=I.play+' Play';srIdx=Math.max(0,srIdx-1);updateSR();};
    body.querySelector('#__sr_next__').onclick=()=>{srPlaying=false;window.speechSynthesis?.cancel();body.querySelector('#__sr_play__').innerHTML=I.play+' Play';srIdx=Math.min(srItems.length-1,srIdx+1);updateSR();};
    body.querySelectorAll('[data-si]').forEach(r=>r.onclick=()=>{srPlaying=false;window.speechSynthesis?.cancel();body.querySelector('#__sr_play__').innerHTML=I.play+' Play';srIdx=+r.dataset.si;updateSR();});
    updateSR();
  }

  // ── VISION FILTERS ───────────────────────────────────────────────────────
  function applyFilter(f){document.documentElement.style.filter=f||'';activeFilter=f;}
  function simFeature(title,sims,accent) {
    sidebar.innerHTML=''; sidebar.appendChild(makeHdr(title,true));
    if(title==='Colour Blindness'&&!document.getElementById('__of_cbsv__')){
      const sv=document.createElementNS('http://www.w3.org/2000/svg','svg');
      sv.id='__of_cbsv__';sv.setAttribute('style','position:absolute;width:0;height:0;overflow:hidden');
      sv.innerHTML=`<defs>
        <filter id="cbp"><feColorMatrix type="matrix" values="0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0"/></filter>
        <filter id="cbd"><feColorMatrix type="matrix" values="0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0"/></filter>
        <filter id="cbt"><feColorMatrix type="matrix" values="0.95 0.05 0 0 0 0 0.433 0.567 0 0 0 0.475 0.525 0 0 0 0 0 1 0"/></filter>
        <filter id="cba"><feColorMatrix type="saturate" values="0"/></filter>
      </defs>`;
      document.body.appendChild(sv);
    }
    const body=makeBody(`
      <p style="font-size:11px;color:${C.muted};margin-bottom:14px;line-height:1.5">Simulate how ${title.toLowerCase()} affects perception of your page.</p>
      ${sims.map(s=>`<button data-sf="${s.f}" style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:10px 12px;margin-bottom:6px;border-radius:8px;border:1px solid ${activeFilter===s.f?accent:C.border};background:${activeFilter===s.f?hexA(accent,.07):C.card};color:${activeFilter===s.f?accent:C.text};cursor:pointer;text-align:left">
        <div><div style="font-size:12px;font-weight:700">${s.name}</div><div style="font-size:10px;color:${C.muted};margin-top:2px">${s.desc}</div></div>
        ${activeFilter===s.f?`<span style="font-size:10px;font-weight:700;color:${accent}">ACTIVE</span>`:''}
      </button>`).join('')}
    `);
    sidebar.appendChild(body);
    body.querySelectorAll('[data-sf]').forEach(btn=>btn.onclick=()=>{applyFilter(btn.dataset.sf);simFeature(title,sims,accent);});
  }
  function featureColorBlind(){simFeature('Colour Blindness',[
    {name:'Normal vision',desc:'No simulation',f:''},
    {name:'Protanopia',desc:'Red-blind (~1% males)',f:'url(#cbp)'},
    {name:'Deuteranopia',desc:'Green-blind (~6% males)',f:'url(#cbd)'},
    {name:'Tritanopia',desc:'Blue-blind (~0.01%)',f:'url(#cbt)'},
    {name:'Achromatopsia',desc:'No colour vision',f:'url(#cba)'},
  ],C.primary);}
  function featureVision(){simFeature('Impaired Vision',[
    {name:'Normal vision',desc:'No simulation',f:''},
    {name:'Blurred vision',desc:'Cataracts / astigmatism',f:'blur(3px)'},
    {name:'Low contrast',desc:'Glaucoma / age-related',f:'contrast(0.4) brightness(1.2)'},
    {name:'Greyscale',desc:'Reduced colour perception',f:'grayscale(1)'},
  ],C.gold);}
  function featureDyslexia(){
    sidebar.innerHTML=''; sidebar.appendChild(makeHdr('Dyslexia Simulator',true));
    const body=makeBody(`
      <p style="font-size:11px;color:${C.muted};margin-bottom:14px;line-height:1.5">Simulates how people with dyslexia may read your page. Affects ~10% of people.</p>
      <button id="__dys__" style="width:100%;padding:11px;border-radius:8px;border:2px solid ${dyslexiaEl?C.primary:C.border};background:${dyslexiaEl?hexA(C.primary,.07):C.card};color:${dyslexiaEl?C.primary:C.text};cursor:pointer;font-size:12px;font-weight:700">
        ${dyslexiaEl?'✓ Dyslexia mode ON — click to disable':'Enable dyslexia simulation'}
      </button>
      <div style="margin-top:14px;padding:12px;background:${C.panel};border-radius:8px;font-size:12px;line-height:1.6;border:1px solid ${C.border};${dyslexiaEl?'letter-spacing:.08em;word-spacing:.2em;line-height:1.9':''}">
        The quick brown fox jumps over the lazy dog.<br>Web accessibility means everyone can use the web equally.
      </div>
    `);
    sidebar.appendChild(body);
    body.querySelector('#__dys__').onclick=()=>{
      if(dyslexiaEl){dyslexiaEl.remove();dyslexiaEl=null;}
      else{dyslexiaEl=document.createElement('style');dyslexiaEl.textContent='body,body *{letter-spacing:.08em!important;word-spacing:.2em!important;line-height:1.9!important}';document.head.appendChild(dyslexiaEl);}
      featureDyslexia();
    };
  }

  // ── ROUTING + INIT ───────────────────────────────────────────────────────
  const FEATURES={
    audit:featureAudit, contrast:featureContrast, alttext:featureAltText,
    focus:featureFocus, keyboard:featureKeyboard, screenreader:featureScreenReader,
    colorblind:featureColorBlind, vision:featureVision, dyslexia:featureDyslexia,
  };

  function cleanup(){
    stopSR(); stopHover(); clearOverlays();
    overlayContainer?._cleanup?.(); overlayContainer?.remove(); overlayContainer=null;
    sidebar?.remove(); sidebar=null;
    document.documentElement.style.marginRight='';
    document.documentElement.style.filter='';
    dyslexiaEl?.remove(); dyslexiaEl=null;
    document.getElementById('__of_cbsv__')?.remove();
    hoverTooltip?.remove(); hoverTooltip=null;
    window.__dwaoA11y=null; window.__dwaoA11yLoaded=false;
  }

  window.__dwaoA11y={destroy:cleanup};
  window.__dwaoA11yLoaded=true;

  // ── Standalone public API ────────────────────────────────────────────────
  // This build is maintained independently of the browser-extension content
  // script — no chrome.* messaging here, just a plain window API.
  window.DWAOAudit={
    open(feature){
      cleanup();
      setupOverlay(); buildSidebar(); showHome();
      if(feature) FEATURES[feature]?.();
    },
    close:cleanup,
    toggle(){ window.__dwaoA11yLoaded ? cleanup() : window.DWAOAudit.open(); },
  };

  const _script=document.currentScript;
  const _autorun=!_script || _script.getAttribute('data-autorun')!=='false';
  if(_autorun){ setupOverlay(); buildSidebar(); showHome(); }
})();
