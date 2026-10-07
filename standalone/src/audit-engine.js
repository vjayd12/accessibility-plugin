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
