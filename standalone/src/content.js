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
