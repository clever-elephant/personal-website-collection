(() => {
  'use strict';
  const S = window.SITE;
  const IW = 1672, IH = 941; // 所有背景图的原始尺寸,下面坐标都以它为基准
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const at = (x, y, w, h) => `left:${x / IW * 100}%;top:${y / IH * 100}%;width:${w / IW * 100}%;height:${h / IH * 100}%`;
  const real = (href) => !!href && href !== '#';
  const ext = (href) => /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '';
  const root = document.documentElement;
  const pill = $('#pill'), homeBtn = $('#home'), tip = $('#tip');
  document.title = S.siteTitle;

  /* ---------- 视图配置:focus 宽屏时完整显示的区域;band/snaps 窄屏时横向滑动的条带 ---------- */
  const V = {
    island: {
      title: S.siteTitle, img: 'img/scene-3.jpg', night: 'img/scene-3-night.jpg',
      focus: [220, 40, 1260, 860], fill: true, start: 836,
    },
    about: {
      title: '关于我', img: 'img/ui-about.jpg', crop: 100,
      focus: [220, 205, 1290, 650], band: [235, 600], fitW: 590, snaps: [540, 1130],
    },
    works: {
      title: '作品', img: 'img/ui-works.jpg', pad: 72,
      focus: [240, 40, 1200, 620], band: [250, 410], fitW: 330, snaps: [522, 848, 1160],
    },
    blog: {
      title: '博客', img: 'img/ui-blog.jpg', crop: 125,
      focus: [300, 130, 1080, 770], band: [270, 520], fitW: 480, snaps: [540, 835, 1110],
    },
    contact: {
      title: '联系', img: 'img/ui-contact-2.jpg', crop: 100,
      focus: [540, 110, 600, 720], band: [118, 700], fitW: 500, snaps: [826],
    },
  };

  /* ---------- 各视图的叠加内容 ---------- */
  const build = {
    island() {
      const spots = [
        ['about', '关于我', [330, 108, 365, 318], [512, 108]],
        ['works', '作品', [1022, 140, 372, 290], [1205, 140]],
        ['blog', '博客', [358, 442, 198, 192], [456, 442]],
        ['contact', '联系', [684, 350, 70, 112], [718, 350]],
      ];
      return spots.map(([id, name, r, [tx, ty]]) => `
        <a class="spot" href="#${id}" style="${at(...r)}" aria-label="${name}"><i class="glow"></i></a>
        <span class="tag" style="left:${tx / IW * 100}%;top:${ty / IH * 100}%" data-for="${id}">${name}</span>`).join('');
    },

    about() {
      const a = S.about;
      const line = (y, html) => `<i class="patch" style="${at(624, y - 11, 168, 22)};--py:${y - 41}"></i><p class="line" style="${at(628, y - 18, 220, 36)}">${html}</p>`;
      const badges = [[955, 425], [1095, 425], [1240, 425], [955, 595], [1095, 595], [1240, 595]];
      return `
        ${a.avatar ? `<img class="avatar" src="${esc(a.avatar)}" alt="${esc(a.name)}" style="${at(318, 417, 218, 208)}">` : ''}
        ${line(438, `<b>${esc(a.name)}</b><small>${esc(a.role)}</small>`)}
        ${line(500, esc(a.likes))}
        ${line(558, esc(a.doing))}
        <p class="intro" style="${at(884, 282, 345, 70)}">${esc(a.intro)}</p>
        ${badges.map(([x, y], i) => a.skills[i] ? `<button class="badge" data-tip="${esc(a.skills[i])}" aria-label="${esc(a.skills[i])}" style="${at(x - 66, y - 72, 132, 150)}"></button>` : '').join('')}`;
    },

    works() {
      return `
        <div class="wall"></div>
        <button class="arrow" data-dir="-1" aria-label="上一组" style="${at(252, 352, 100, 100)}"></button>
        <button class="arrow" data-dir="1" aria-label="下一组" style="${at(1320, 352, 100, 100)}"></button>
        <div class="dots" style="${at(757, 603, 162, 38)}"></div>`;
    },

    blog() {
      const notes = [[456, 316, 178, 124, -3], [1058, 318, 182, 100, 3], [446, 630, 190, 104, -2], [715, 660, 205, 92, 2], [985, 650, 228, 88, -1], [1052, 452, 116, 84, 4]];
      return `
        ${S.blog.slice(0, 6).map((p, i) => {
          const [x, y, w, h, r] = notes[i];
          return `<button class="note${i === 5 ? ' small' : ''}" data-i="${i}" style="${at(x, y, w, h)};--r:${r}deg"><time>${esc(p.date)}</time><b>${esc(p.title)}</b></button>`;
        }).join('')}
        <article class="detail" hidden style="${at(640, 360, 375, 255)}"></article>`;
    },

    contact() {
      const apps = [[707, 400], [828, 400], [948, 400], [753, 550], [903, 550]];
      return `
        ${S.contact.slice(0, 5).map((c, i) => `<button class="app" data-i="${i}" aria-label="${esc(c.label)}" style="${at(apps[i][0] - 58, apps[i][1] - 58, 116, 150)}"></button>`).join('')}
        <div class="screen" hidden style="${at(630, 230, 390, 440)}"></div>
        <button class="paw" aria-label="返回主屏幕" style="${at(780, 682, 92, 90)}"></button>`;
    },
  };

  /* ---------- 生成 DOM ---------- */
  const views = {};
  const host = $('#views');
  for (const id of Object.keys(V)) {
    const v = V[id];
    const el = document.createElement('section');
    el.className = `view v-${id}`;
    el.hidden = true;
    el.setAttribute('aria-labelledby', `h-${id}`);
    el.innerHTML = `
      <div class="blur" style="background-image:url(${v.img})"></div>
      <div class="scroller"><div class="stage">
        <img class="bg" src="${v.img}" alt="" draggable="false" decoding="async">
        ${v.night ? `<img class="bg night" src="${v.night}" alt="" draggable="false"><canvas class="water" aria-hidden="true"></canvas><div class="skyclip" aria-hidden="true"><i class="skymoon"></i></div>` : ''}
        <h1 class="sr" id="h-${id}" tabindex="-1">${esc(v.title)}</h1>
        ${build[id]()}
      </div></div>`;
    host.append(el);
    views[id] = { ...v, el, stage: $('.stage', el), scroller: $('.scroller', el) };
  }
  // 窄屏时背景图是否已加载
  Object.values(views).forEach((v) => { v.el.querySelectorAll('img.bg').forEach((img) => img.addEventListener('load', () => v.el.classList.add('ready'), { once: true })); });

  // 预先解码所有背景图,切换时不再临时解码
  Object.values(V).forEach((v) => [v.img, v.night].filter(Boolean).forEach((src) => { const i = new Image(); i.src = src; i.decode && i.decode().catch(() => {}); }));

  /* ---------- 布局:等比缩放背景图,让关键区域落在屏幕里 ---------- */
  const MIN = 0.55;
  let navH = 0;
  function layout(v) {
    const W = innerWidth, H = innerHeight;
    const [fx, fy, fw, fh] = v.focus;
    const crop = v.crop || 0, pad = v.pad || 0;
    let s = Math.max(W / IW, (H - pad) / (IH - crop));
    let narrow = false;
    if (fw * s > W || fh * s > H) {
      s = Math.min(W / fw, H / fh);
      if (s < MIN) {
        narrow = true;
        s = v.fill ? H / IH : Math.min(W * 0.92 / v.fitW, (H - navH - 24) / v.band[1]);
      }
    }
    if (!narrow && crop) s = Math.max(s, H / (IH - crop));
    v.s = s; v.narrow = narrow;
    v.el.classList.toggle('narrow', narrow);
    const sw = IW * s, sh = IH * s;
    const st = v.stage.style, sc = v.scroller.style;
    st.width = sw + 'px'; st.height = sh + 'px';
    if (v.onSize) v.onSize(sw, sh);
    v.el.style.setProperty('--u', s + 'px');
    const clamp = (val, lo, hi) => Math.min(hi, Math.max(lo, val));
    if (!narrow) {
      sc.cssText = '';
      const cx = fx + fw / 2, cy = fy + fh / 2;
      v.x = sw >= W ? clamp(W / 2 - cx * s, W - sw, 0) : (W - sw) / 2;
      v.y = pad ? pad : sh >= H ? clamp(H / 2 - cy * s, H - sh, -crop * s) : (H - sh) / 2;
      st.transform = `translate(${v.x}px,${v.y}px)`;
    } else if (v.fill) {
      sc.cssText = 'overflow-x:auto';
      st.transform = '';
      v.x = 0; v.y = 0;
      v.scroller.scrollLeft = v.start * s - W / 2;
    } else {
      const [by, bh] = v.band;
      const top = navH + Math.max(12, (H - navH - bh * s) / 2);
      sc.cssText = `overflow-x:auto;top:${top}px;height:${bh * s}px;scroll-snap-type:x mandatory`;
      st.transform = `translateY(${-by * s}px)`;
      v.x = 0; v.y = top - by * s;
      // 吸附点
      v.stage.querySelectorAll('.snap').forEach((n) => n.remove());
      v.snaps.forEach((x) => {
        const n = document.createElement('i');
        n.className = 'snap';
        n.style.cssText = `left:${x * s}px;top:${by * s}px`;
        v.stage.append(n);
      });
      if (v.scroller.dataset.w !== String(W)) {
        v.scroller.dataset.w = String(W);
        v.scroller.scrollLeft = v.snaps[0] * s - W / 2;
      }
    }
  }

  function placeNav() {
    const v = views[current];
    if (!v) return;
    const narrow = v.narrow;
    root.classList.toggle('is-narrow', narrow);
    pill.style.cssText = '';
    pill.classList.remove('fit');
    homeBtn.hidden = true;
    pill.hidden = false;
    pill.querySelectorAll('[data-go]').forEach((a) => {
      if (a.dataset.go === current) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  function measureNav() {
    pill.style.cssText = ''; pill.classList.remove('fit');
    root.classList.add('is-narrow');
    navH = pill.getBoundingClientRect().bottom;
  }

  function relayout() {
    measureNav();
    Object.values(views).forEach(layout);
    placeNav();
  }

  /* ---------- 作品:分页 ---------- */
  const works = (() => {
    const v = views.works, wall = $('.wall', v.el), dots = $('.dots', v.el);
    const frames = [[404, 297, 236, 182], [750, 297, 196, 174], [1052, 307, 216, 166]];
    const plates = [526, 849, 1165];
    const items = S.works, pages = Math.max(1, Math.ceil(items.length / 3));
    let page = 0;
    const render = (dir) => {
      wall.innerHTML = frames.map((r, i) => {
        const it = items[page * 3 + i];
        if (!it) return `<span class="frame empty" style="${at(...r)}"></span>`;
        const tag = real(it.href) ? `a class="frame" href="${esc(it.href)}"${ext(it.href)}` : 'span class="frame"';
        return `<${tag} style="${at(...r)}">
            <img src="${esc(it.cover)}" alt="${real(it.href) ? '' : esc(it.title)}"><span class="sr">${esc(it.title)}</span></${tag.split(' ')[0]}>
          <span class="plate" style="${at(plates[i] - 64, 519, 128, 40)}" aria-hidden="true">${esc(it.title)}</span>`;
      }).join('');
      dots.innerHTML = Array.from({ length: pages }, (_, i) => `<button aria-label="第 ${i + 1} 组" aria-current="${i === page}"></button>`).join('');
      dots.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => go(i)));
      if (dir && !reduced) wall.animate([{ opacity: 0, transform: `translateX(${dir * 2}%)` }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.9,.3,1)' });
    };
    const go = (p) => { const d = p > page ? 1 : -1; page = (p + pages) % pages; render(d); };
    v.el.querySelectorAll('.arrow').forEach((b) => b.addEventListener('click', () => go(page + +b.dataset.dir)));
    v.el.querySelectorAll('.arrow').forEach((b) => { b.hidden = pages < 2; });
    render();
  })();

  /* ---------- 博客:便签展开 ---------- */
  const blog = (() => {
    const v = views.blog, detail = $('.detail', v.el);
    let opener = null;
    const close = () => {
      if (detail.hidden) return false;
      detail.hidden = true; v.el.classList.remove('reading');
      opener?.focus({ preventScroll: true });
      return true;
    };
    v.el.querySelectorAll('.note').forEach((n) => n.addEventListener('click', () => {
      const p = S.blog[+n.dataset.i];
      opener = n;
      detail.innerHTML = `<time>${esc(p.date)}</time><h2>${esc(p.title)}</h2><p>${esc(p.excerpt)}</p>
        <div class="row">${real(p.href) ? `<a class="btn" href="${esc(p.href)}"${ext(p.href)}>阅读全文</a>` : ''}<button class="btn ghost" data-back>收起</button></div>`;
      detail.hidden = false; v.el.classList.add('reading');
      if (v.narrow) v.scroller.scrollTo({ left: 835 * v.s - innerWidth / 2, behavior: reduced ? 'auto' : 'smooth' });
      if (!reduced) detail.animate([{ transform: 'rotate(-8deg) scale(.6)', opacity: 0 }, { transform: 'rotate(-1.5deg) scale(1)', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,1.3,.3,1)' });
      $('[data-back]', detail).addEventListener('click', close);
      $('.btn', detail).focus({ preventScroll: true });
    }));
    return { close };
  })();

  /* ---------- 联系:手机 ---------- */
  const phone = (() => {
    const v = views.contact, screen = $('.screen', v.el);
    let opener = null;
    const toast = (m) => { const t = $('.toast', screen); if (!t) return; t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 1600); };
    const icons = [[707, 400], [828, 400], [948, 400], [753, 550], [903, 550]];
    const close = () => {
      if (screen.hidden) return false;
      screen.hidden = true; opener?.focus({ preventScroll: true });
      return true;
    };
    v.el.querySelectorAll('.app').forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i, c = S.contact[i], [x, y] = icons[i];
      opener = b;
      screen.innerHTML = `<span class="icon" style="--ix:${x};--iy:${y}"></span><h2>${esc(c.label)}</h2>
        <p class="value">${esc(c.value)}</p>
        <div class="row">${real(c.href) ? `<a class="btn" href="${esc(c.href)}"${ext(c.href)}>打开</a>` : ''}${c.copy ? `<button class="btn${real(c.href) ? ' ghost' : ''}" data-copy>复制</button>` : ''}</div>
        <p class="toast" role="status" aria-live="polite"></p>`;
      screen.hidden = false;
      if (!reduced) screen.animate([{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,1.3,.3,1)' });
      const cp = $('[data-copy]', screen);
      cp?.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(c.value); toast('已复制'); } catch { toast('复制失败,请长按选择'); }
      });
      ($('.btn', screen) || $('.paw', v.el)).focus({ preventScroll: true });
    }));
    $('.paw', v.el).addEventListener('click', close);
    return { close };
  })();

  /* ---------- 徽章提示 ---------- */
  const showTip = (el) => {
    const r = el.getBoundingClientRect();
    tip.textContent = el.dataset.tip;
    tip.style.left = r.left + r.width / 2 + 'px';
    tip.style.top = r.top + 'px';
    tip.classList.add('on');
  };
  const hideTip = () => tip.classList.remove('on');
  document.querySelectorAll('[data-tip]').forEach((b) => {
    b.addEventListener('pointerenter', () => showTip(b));
    b.addEventListener('focus', () => showTip(b));
    b.addEventListener('click', () => showTip(b));
    b.addEventListener('pointerleave', hideTip);
    b.addEventListener('blur', hideTip);
  });

  /* ---------- 小岛:悬停时对应标签跳动 ---------- */
  views.island.el.querySelectorAll('.spot').forEach((s) => {
    const tag = $(`.tag[data-for="${s.getAttribute('href').slice(1)}"]`, views.island.el);
    s.addEventListener('pointerenter', () => tag.classList.add('hot'));
    s.addEventListener('pointerleave', () => tag.classList.remove('hot'));
    s.addEventListener('focus', () => tag.classList.add('hot'));
    s.addEventListener('blur', () => tag.classList.remove('hot'));
  });

  /* ---------- 小岛活场景:空场景背景(水面/瀑布/云/炊烟) + 36 株独立植物(各自扎根摇摆) ---------- */
  const water = (() => {
    const noop = { setNight() {} };
    const cv = $('.water', views.island.el);
    const gl = cv && cv.getContext('webgl', { premultipliedAlpha: true, alpha: false, antialias: true });
    if (!gl) { cv?.remove(); return noop; }
    const A = 'img/island/';
    // 背景上的轻微位移:[中心x, 底部y, 宽, 高, 幅度, 频率, 相位]
    const DRIFT = [
      [545, 108, 130, 100, 3.0, 0.8, 0.0],      // 炊烟
      [208, 88, 330, 150, 7.0, 0.06, 0.0],      // 云
      [80, 228, 150, 70, 5.0, 0.07, 1.5],
      [1462, 105, 290, 100, 7.0, 0.055, 2.6],
      [1584, 230, 160, 75, 5.0, 0.065, 0.8],
    ];
    const COMMON = `precision highp float;
      uniform float t,night;
      const vec2 R=vec2(1672.,941.);
      const float hz=362.;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      // 风场:阵风从左往右推进,0=无风 1=阵风
      float wind(float x){float g=n(vec2(t*.16-x*.0018,1.7))*.75+n(vec2(t*.43-x*.0035,8.3))*.25;return smoothstep(.2,.9,g);}
      float cloudShadow(vec2 P){return smoothstep(.58,.82,n(P*vec2(.0016,.0028)+vec2(-t*.018,t*.004)))*.07*(1.-night);}`;

    /* 背景 */
    const bgVS = `attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0,1);}`;
    const bgFS = `${COMMON}
      varying vec2 uv;
      uniform sampler2D bDay,bNight,mWater;
      uniform vec4 dz[${DRIFT.length}],dp[${DRIFT.length}];
      vec3 bg(vec2 P){vec2 q=clamp(P/R,vec2(.0005),vec2(.9995));return mix(texture2D(bDay,q).rgb,texture2D(bNight,q).rgb,night);}
      void main(){
        vec2 P=uv*R;
        vec4 wm=texture2D(mWater,uv);
        float m=wm.r,sh=wm.g;
        float d=clamp((P.y-hz)/580.,0.,1.),ps=.12+.88*d;
        vec2 off=vec2(0.);
        for(int i=0;i<${DRIFT.length};i++){
          vec4 a=dz[i],b=dp[i];
          float dx=(P.x-a.x)/(a.z*.5),hy=(a.y-P.y)/a.w;
          if(abs(dx)>1.2||hy<-.05||hy>1.25)continue;
          float side=1.-smoothstep(.7,1.2,abs(dx));
          if(i==0)off.x+=b.x*smoothstep(0.,.7,hy)*side*(1.-smoothstep(1.,1.25,hy))*(n(vec2(P.y*.02-t*.6,t*.2))-.5)*2.;
          else off.x+=b.x*side*(1.-smoothstep(.85,1.2,abs(hy-.5)*2.))*sin(t*b.y+b.z);
        }
        vec3 col=bg(P-off);
        vec3 base=bg(P);
        float open=m*(1.-smoothstep(.12,.42,sh))*smoothstep(hz+3.,hz+40.,P.y);
        if(open>.01){
          vec2 dir=vec2(.55,.3)*ps;
          float j=n(P*.006)*.6,p0=fract(t*.045+j),p1=fract(t*.045+j+.5);
          vec2 wob=vec2(n(P*vec2(.01,.03)/ps+t*.15)-.5,n(P*vec2(.01,.03)/ps-t*.12)-.5)*1.4*ps;
          col=mix(col,mix(bg(P-dir*(p0-.5)*40.+wob),bg(P-dir*(p1-.5)*40.+wob),abs(p0-.5)*2.),open);
        }
        if(m>.01){
          float lum=dot(base,vec3(.3,.5,.2));
          float foam=smoothstep(.62,.85,lum)*smoothstep(.1,.35,sh);
          float surge=sin(t*.9-sh*5.+n(P*.01)*2.);
          col+=m*foam*surge*mix(.07,.04,night);
          col+=m*smoothstep(.45,.8,sh)*smoothstep(.3,1.,surge)*mix(.05,.025,night)*vec3(.9,1.,1.);
          vec2 w=vec2((P.x-836.)/ps,(P.y-hz)/(ps*ps)*.55),g=w*vec2(.03,.08),c=floor(g);
          float k=h(c);
          float dist=length((fract(g)-(vec2(h(c+3.1),h(c+7.7))*.6+.2))*vec2(1.,2.));
          float tw=pow(max(0.,sin(t*(.8+k*1.2)+k*60.)),24.);
          float moon=exp(-pow((P.x-1555.)/90.,2.));
          col=mix(col,mix(vec3(1.),vec3(1.,.92,.7),night),smoothstep(.1,0.,dist)*tw*step(mix(.8,.9-moon*.6,night),k)*open*mix(.55,.8,night));
        }
        float fall=step(1195.,P.x)*step(P.x,1368.)*step(522.,P.y)*step(P.y,695.)*smoothstep(.15,.45,base.b-base.r*.7);
        if(fall>.01){
          float q0=fract(t*.9),q1=fract(t*.9+.5);
          col=mix(col,mix(bg(vec2(P.x,max(526.,P.y-(q0-.5)*34.))),bg(vec2(P.x,max(526.,P.y-(q1-.5)*34.))),abs(q0-.5)*2.),fall);
        }
        float pool=step(1235.,P.x)*step(P.x,1405.)*smoothstep(655.,685.,P.y)*(1.-smoothstep(698.,715.,P.y));
        col+=pool*smoothstep(.55,.85,n(P*.07+vec2(0.,-t*1.6)))*.09*smoothstep(.6,.9,base.r);
        col*=1.-(1.-m)*smoothstep(hz,hz+20.,P.y)*cloudShadow(P);
        if(night>.01){
          float fl=0.;
          fl+=exp(-pow(length(P-vec2(415.,328.))/34.,2.))*(.6+.4*n(vec2(t*2.,1.)));
          fl+=exp(-pow(length(P-vec2(580.,318.))/34.,2.))*(.6+.4*n(vec2(t*1.8,5.)));
          fl+=exp(-pow(length(P-vec2(507.,300.))/22.,2.))*(.6+.4*n(vec2(t*3.,9.)));
          fl+=exp(-pow(length(P-vec2(1110.,295.))/22.,2.))*(.6+.4*n(vec2(t*2.7,13.)));
          fl+=exp(-pow(length(P-vec2(1272.,295.))/22.,2.))*(.6+.4*n(vec2(t*3.2,17.)));
          col+=night*fl*.07*vec3(1.,.8,.45);
        }
        gl_FragColor=vec4(col,1.);
      }`;

    /* 植物:根部钉在地上,越往上偏移越大(茎/树干的弯曲),叠加各自的振荡 + 阵风倾斜 + 拨动 */
    const spVS = `${COMMON}
      attribute vec2 g;
      uniform vec2 at,size,anchor;uniform vec4 uvr;uniform float kind,flip,amp,freq,phase,push,mode;
      varying vec2 vuv,vP,vg;
      void main(){
        vg=g;
        if(mode>.5){ // 接触阴影:根部下方的扁椭圆
          float sw=size.x*(kind<.5?.55:kind<1.5?.62:.92),sh=sw*.3;
          vec2 P=at+vec2((g.x-.5)*sw+sw*.08,(g.y-.62)*sh);
          vP=P;vuv=vec2(0.);
          gl_Position=vec4(P.x/R.x*2.-1.,1.-P.y/R.y*2.,0,1);return;
        }
        vec2 P=at+(vec2(g.x,g.y)-anchor)*size;
        float hy=clamp((at.y-P.y)/size.y,0.,1.);
        float w=wind(at.x);
        // 摆动:阵风时向右倾,并围绕倾斜位置振荡;每株频率与相位不同
        float osc=sin(t*freq+phase)*.6+sin(t*freq*2.13+phase*1.7)*.22+sin(t*freq*.47+phase*.3)*.18;
        float d=amp*(w*.9+osc*(.35+.65*w))+push;
        float prof=kind<.5?pow(hy,1.6):kind<1.5?smoothstep(.22,1.,hy)*hy:hy*hy*.6;
        float dx=d*prof;
        float dy=-dx*dx/(2.*max(size.y,1.))*hy; // 弯曲时顶端略微下沉(弧长不变)
        vec2 Q=P+vec2(dx,dy);
        vP=Q;
        vec2 u=vec2(flip>.5?1.-g.x:g.x,g.y);
        vuv=uvr.xy+u*uvr.zw;
        gl_Position=vec4(Q.x/R.x*2.-1.,1.-Q.y/R.y*2.,0,1);
      }`;
    const spFS = `${COMMON}
      varying vec2 vuv,vP,vg;
      uniform sampler2D atlas,mWater;uniform vec3 grade;uniform float mode,occ;
      bool inside(vec2 P,float bit){
        if(mod(floor(occ/bit),2.)<.5)return false;
        if(bit==1.)return P.x>=345.&&P.x<=693.&&P.y<=440.&&P.y>=(P.x<590.?138.+(590.-P.x)*.45:138.+(P.x-590.)*1.16); // 房子
        if(bit==2.)return P.x>=1020.&&P.x<=1400.&&P.y<=432.&&P.y>=(P.x<1190.?138.+(1190.-P.x)*.52:138.+(P.x-1190.)*.45); // 博物馆
        if(bit==4.)return texture2D(mWater,clamp(P/R,0.,1.)).b>.5;           // 栅栏(像素掩码)
        return P.x>=683.&&P.x<=757.&&P.y>=352.&&P.y<=462.;             // 邮筒
      }
      void main(){
        if(inside(vP,1.)||inside(vP,2.)||inside(vP,4.)||inside(vP,8.))discard;
        if(mode>.5){
          float r=length((vg-.5)*2.);
          float a=smoothstep(1.,.15,r)*mix(.2,.12,night);
          gl_FragColor=vec4(vec3(.08,.16,.06)*a*.0,a);return;
        }
        vec4 c=texture2D(atlas,vuv);
        vec3 gr=mix(grade,vec3(dot(grade,vec3(.333))),.4); // 夜色:压暗并偏冷,但别把白花染成蓝
        c.rgb*=mix(vec3(1.),gr,night)*(1.-cloudShadow(vP));
        gl_FragColor=c;
      }`;

    const compile = (vsSrc, fsSrc) => {
      const mk = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      const pr = gl.createProgram(); gl.attachShader(pr, mk(gl.VERTEX_SHADER, vsSrc)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, fsSrc)); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
      const U = {}; const nU = gl.getProgramParameter(pr, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < nU; i++) { const name = gl.getActiveUniform(pr, i).name.replace(/\[0\]$/, ''); U[name] = gl.getUniformLocation(pr, name); }
      return { pr, U };
    };
    let BG, SP;
    try { BG = compile(bgVS, bgFS); SP = compile(spVS, spFS); } catch (e) { console.warn(e); cv.remove(); return noop; }

    const tri = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, tri); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const GX = 6, GY = 16, verts = [], idx = [];
    for (let y = 0; y <= GY; y++) for (let x = 0; x <= GX; x++) verts.push(x / GX, y / GY);
    for (let y = 0; y < GY; y++) for (let x = 0; x < GX; x++) { const a = y * (GX + 1) + x; idx.push(a, a + 1, a + GX + 1, a + 1, a + GX + 2, a + GX + 1); }
    const grid = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, grid); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    const ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);

    let failed = false, scene = null;
    const fail = (e) => { if (failed) return; failed = true; console.warn('小岛动画不可用,改用静态图', e); cv.remove(); views.island.el.classList.remove('live'); };
    const TEX = { bDay: 'plate-day.webp', bNight: 'plate-night.webp', mWater: 'water.png', atlas: 'sprites.webp' };
    const tex = {};
    const loadTex = (name, file) => new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        try {
          const tx = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, tx);
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, name === 'atlas');
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); // file:// 打开时会被跨域拦截
          [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((p) => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));
          if (name === 'atlas') { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
          else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          tex[name] = tx; res();
        } catch (e) { rej(e); }
      };
      img.onerror = rej;
      img.src = A + file;
    });
    const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
    Promise.all([fetch(A + 'scene.json').then((r) => r.json()), ...Object.entries(TEX).map(([n, f]) => loadTex(n, f))])
      .then(([s]) => {
        scene = s;
        const OCC = { cottage: 1, museum: 2, fence: 4, mailbox: 8 };
        scene.items.forEach((it, i) => {
          it.k = it.kind === 'flower' ? 0 : it.kind === 'tree' ? 1 : 2;
          it.occBits = it.occ.reduce((a, o) => a | OCC[o], 0);
          // 摆幅(顶端像素)与频率:花细长轻,摆得多、快;树重,慢而小;灌木只在被拨动时晃
          it.amp = it.k === 0 ? it.size[1] * (0.05 + rnd(i, 1) * 0.03) : it.k === 1 ? it.size[1] * 0.011 : 0;
          it.freq = it.k === 0 ? 2.4 + rnd(i, 2) * 1.6 : 0.9 + rnd(i, 2) * 0.4;
          it.phase = rnd(i, 3) * 6.283;
          it.px = 0; it.pv = 0;
        });
        views.island.el.classList.add('live');
        draw(performance.now());
      })
      .catch(fail);

    gl.useProgram(BG.pr);
    gl.uniform4fv(BG.U.dz, new Float32Array(DRIFT.flatMap((d) => d.slice(0, 4))));
    gl.uniform4fv(BG.U.dp, new Float32Array(DRIFT.flatMap((d) => [d[4], d[5], d[6], 0])));

    // 拨动:弹簧阻尼(欠阻尼,会回弹几下)
    const stepSprings = (dt) => {
      if (!dt || !scene) return;
      for (const p of scene.items) {
        if (!p.px && !p.pv) continue;
        const k = p.k === 0 ? 70 : p.k === 1 ? 14 : 45, zeta = p.k === 0 ? 0.13 : 0.2;
        p.pv += (-k * p.px - 2 * zeta * Math.sqrt(k) * p.pv) * dt;
        p.px += p.pv * dt;
        if (Math.abs(p.px) < 0.02 && Math.abs(p.pv) < 0.05) p.px = p.pv = 0;
      }
    };
    let lastPt = null;
    const brush = (e) => {
      if (reduced || failed || !scene) return;
      const r = views.island.stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * IW, y = (e.clientY - r.top) / r.height * IH;
      const now = performance.now();
      if (lastPt && now - lastPt.t < 120) {
        const vx = (x - lastPt.x) / Math.max(8, now - lastPt.t) * 1000;
        for (const p of scene.items) {
          const x0 = p.at[0] - p.size[0] * p.anchor[0] * 0.8, x1 = p.at[0] + p.size[0] * (1 - p.anchor[0]) * 0.8;
          const top = p.at[1] - p.size[1] * p.anchor[1];
          if (x < x0 || x > x1 || y < top || y > p.at[1]) continue;
          const hit = Math.max(0.3, (p.at[1] - y) / p.size[1]);
          const gain = p.k === 0 ? 0.06 : p.k === 1 ? 0.012 : 0.03;
          const cap = p.k === 0 ? p.size[1] * 0.25 : p.k === 1 ? 6 : 6;
          p.pv = Math.max(-cap * 6, Math.min(cap * 6, p.pv + vx * gain * hit));
        }
      }
      lastPt = { x, y, t: now };
    };
    views.island.el.addEventListener('pointermove', brush, { passive: true });
    views.island.el.addEventListener('pointerleave', () => { lastPt = null; });

    let nightVal = 0, nightTarget = 0, last = 0;
    const draw = (now) => {
      if (failed || !scene) return;
      nightVal += (nightTarget - nightVal) * Math.min(1, (now - last) / 400 || 1);
      stepSprings(Math.min(0.05, Math.max(0, (now - (last || now)) / 1000)));
      last = now;
      const t = reduced ? 3 : now / 1000;
      gl.viewport(0, 0, cv.width, cv.height);
      gl.disable(gl.BLEND);
      gl.useProgram(BG.pr);
      [['bDay', 0], ['bNight', 1], ['mWater', 2]].forEach(([nm, i]) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex[nm]); gl.uniform1i(BG.U[nm], i); });
      gl.uniform1f(BG.U.t, t); gl.uniform1f(BG.U.night, nightVal);
      gl.bindBuffer(gl.ARRAY_BUFFER, tri);
      const lp = gl.getAttribLocation(BG.pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(SP.pr);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex.atlas); gl.uniform1i(SP.U.atlas, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex.mWater); gl.uniform1i(SP.U.mWater, 1);
      gl.uniform1f(SP.U.t, t); gl.uniform1f(SP.U.night, nightVal);
      gl.uniform3fv(SP.U.grade, scene.grade);
      gl.bindBuffer(gl.ARRAY_BUFFER, grid);
      const lg = gl.getAttribLocation(SP.pr, 'g'); gl.enableVertexAttribArray(lg); gl.vertexAttribPointer(lg, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      const [AW, AH] = scene.atlas;
      const set = (p, mode) => {
        gl.uniform2f(SP.U.at, p.at[0], p.at[1]); gl.uniform2f(SP.U.size, p.size[0], p.size[1]); gl.uniform2f(SP.U.anchor, p.anchor[0], p.anchor[1]);
        gl.uniform4f(SP.U.uvr, p.uv[0] / AW, p.uv[1] / AH, p.uv[2] / AW, p.uv[3] / AH);
        gl.uniform1f(SP.U.kind, p.k); gl.uniform1f(SP.U.flip, p.flip ? 1 : 0);
        gl.uniform1f(SP.U.amp, p.amp); gl.uniform1f(SP.U.freq, p.freq); gl.uniform1f(SP.U.phase, p.phase); gl.uniform1f(SP.U.push, p.px);
        gl.uniform1f(SP.U.occ, p.occBits); gl.uniform1f(SP.U.mode, mode);
        gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
      };
      for (const p of scene.items) set(p, 1); // 先画所有接触阴影
      for (const p of scene.items) set(p, 0); // 再由远到近画植物
    };
    views.island.onSize = (w, hh) => {
      const k = Math.min(1.5, devicePixelRatio || 1, Math.sqrt(2.6e6 / (w * hh)));
      cv.width = Math.round(w * k); cv.height = Math.round(hh * k);
      draw(performance.now());
    };
    const loop = (now) => {
      if (current === 'island' && !document.hidden) draw(now);
      if (!reduced && !failed) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return { setNight(v) { nightTarget = v ? 1 : 0; if (reduced || !last) nightVal = nightTarget; draw(performance.now()); } };
  })();

  /* ---------- 路由 ---------- */
  let current = null;
  const ids = Object.keys(V);
  const fromHash = () => { const h = location.hash.slice(1); return ids.includes(h) ? h : 'island'; };
  const islandOrigin = { about: [512, 280], works: [1205, 300], blog: [456, 540], contact: [718, 410] };

  function show(id, animate) {
    if (id === current) return;
    const prevId = current, prev = prevId ? views[prevId] : null, next = views[id];
    hideTip(); blog.close(); phone.close();
    current = id;
    document.body.dataset.view = id;
    next.el.hidden = false;
    next.el.inert = false;
    layout(next);
    placeNav();
    if (prev) {
      prev.el.inert = true;
      const isl = views.island;
      const done = () => { prev.el.hidden = true; prev.el.getAnimations().forEach((a) => a.cancel()); if (prevId === 'island') isl.stage.style.transformOrigin = ''; };
      if (!animate || reduced) done();
      else if (prevId === 'island' || id === 'island') {
        // 从小岛"走进"某个地点:以该地点为中心放大淡出
        const o = islandOrigin[prevId === 'island' ? id : prevId];
        isl.stage.style.transformOrigin = `${o[0] * isl.s}px ${o[1] * isl.s}px`;
        const base = isl.stage.style.transform || 'translate(0,0)';
        const zoom = [{ transform: base, opacity: 1 }, { transform: `${base} scale(1.6)`, opacity: 0 }];
        if (prevId === 'island') {
          isl.stage.animate(zoom, { duration: 650, easing: 'cubic-bezier(.5,0,.3,1)' }).finished.then(done, done);
          next.el.animate([{ opacity: 0, transform: 'scale(1.05)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 260, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards' });
        } else {
          prev.el.style.zIndex = 2;
          prev.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, fill: 'forwards' }).finished.then(() => { prev.el.style.zIndex = ''; done(); }, done);
          const back = () => { isl.stage.style.transformOrigin = ''; };
          isl.stage.animate([...zoom].reverse(), { duration: 650, easing: 'cubic-bezier(.3,0,.2,1)' }).finished.then(back, back);
        }
      } else {
        next.el.style.zIndex = 2;
        next.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380 }).finished.then(() => { next.el.style.zIndex = ''; done(); }, done);
      }
    }
    if (animate) $(`#h-${id}`).focus({ preventScroll: true });
  }

  addEventListener('hashchange', () => show(fromHash(), true));
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (blog.close() || phone.close()) return;
    if (current !== 'island') location.hash = '';
  });
  let rt;
  addEventListener('resize', () => { cancelAnimationFrame(rt); rt = requestAnimationFrame(relayout); });

  /* ---------- 昼夜 ---------- */
  const isNightHour = () => { const h = new Date().getHours(); return h >= 19 || h < 6; };
  let night;
  try { const saved = localStorage.getItem('island-night'); night = saved === null ? isNightHour() : saved === '1'; } catch { night = isNightHour(); }
  const applyMode = () => {
    water.setNight(night);
    root.dataset.time = night ? 'night' : 'day';
    $('#mode').setAttribute('aria-pressed', String(night));
    $('#mode').setAttribute('aria-label', night ? '切换到白天' : '切换到夜晚');
  };
  // 月亮沿弧线从右侧海平线升起 / 落下(位置用底图坐标 1672×941)
  const moon = $('.skymoon', views.island.el);
  const MP = [[1655, 410], [1430, 170], [1553, 72]];
  const arc = (t) => {
    const a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
    return [a * MP[0][0] + b * MP[1][0] + c * MP[2][0], a * MP[0][1] + b * MP[1][1] + c * MP[2][1]];
  };
  let moonAnim;
  function moonArc(up) {
    if (reduced) return;
    moonAnim && moonAnim.cancel();
    const n = 32, ease = (x) => 1 - Math.pow(1 - x, 2.4);
    const frames = Array.from({ length: n + 1 }, (_, i) => {
      const t = ease(up ? i / n : 1 - i / n), [x, y] = arc(t);
      return { left: x / 16.72 + '%', top: y / 9.41 + '%', opacity: 1, transform: `translate(-50%,-50%) scale(${0.82 + 0.18 * t})` };
    });
    const a = moonAnim = moon.animate(frames, { duration: up ? 2600 : 1800, easing: 'linear', fill: up ? 'backwards' : 'forwards' });
    a.onfinish = () => { if (moonAnim === a) { a.cancel(); moonAnim = null; } };
  }
  $('#mode').addEventListener('click', () => {
    night = !night;
    moonArc(night);
    try { localStorage.setItem('island-night', night ? '1' : '0'); } catch {}
    applyMode();
  });
  applyMode();

  /* ---------- 背景音乐 ---------- */
  const bgm = $('#bgm'), musicBtn = $('#music'), VOL = 0.4;
  let wantMusic = false, fade;
  try { wantMusic = localStorage.getItem('island-music') === '1'; } catch {}
  const ramp = (to, done) => {
    clearInterval(fade);
    fade = setInterval(() => {
      const d = to - bgm.volume;
      if (Math.abs(d) < 0.03) { bgm.volume = to; clearInterval(fade); done && done(); }
      else bgm.volume = Math.max(0, Math.min(1, bgm.volume + Math.sign(d) * 0.03));
    }, 40);
  };
  const syncMusic = (on) => {
    musicBtn.setAttribute('aria-pressed', String(on));
    musicBtn.setAttribute('aria-label', on ? '暂停背景音乐' : '播放背景音乐');
  };
  const playMusic = () => {
    bgm.volume = 0;
    return bgm.play().then(() => { ramp(VOL); syncMusic(true); }, () => syncMusic(false));
  };
  const stopMusic = () => { syncMusic(false); ramp(0, () => bgm.pause()); };
  const showMusic = () => { musicBtn.hidden = false; };
  if (bgm.readyState >= 1) showMusic(); else bgm.addEventListener('loadedmetadata', showMusic, { once: true });
  bgm.addEventListener('error', () => { musicBtn.hidden = true; });
  musicBtn.addEventListener('click', () => {
    wantMusic = bgm.paused;
    try { localStorage.setItem('island-music', wantMusic ? '1' : '0'); } catch {}
    wantMusic ? playMusic() : stopMusic();
  });
  // 浏览器禁止自动播放:上次开着的话,等第一次点击页面再续播
  if (wantMusic) {
    const resume = (e) => { if (musicBtn.contains(e.target)) return; removeEventListener('pointerdown', resume, true); if (wantMusic && bgm.paused) playMusic(); };
    addEventListener('pointerdown', resume, true);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) bgm.pause(); else if (wantMusic && bgm.paused && bgm.readyState) playMusic();
  });

  addEventListener('load', relayout);
  if (window.ResizeObserver) new ResizeObserver(() => { cancelAnimationFrame(rt); rt = requestAnimationFrame(relayout); }).observe(root);
  relayout();
  Object.values(views).forEach((v) => { v.el.hidden = true; v.el.inert = true; });
  show(fromHash(), false);

  /* ---------- 花瓣 / 萤火虫 ---------- */
  const cv = $('#petals'), ctx = cv.getContext('2d');
  let parts = [], dpr = 1;
  const sizeCanvas = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  };
  const spawn = (init) => ({
    x: Math.random() * innerWidth, y: init ? Math.random() * innerHeight : -20,
    r: 3.2 + Math.random() * 3, vy: 0.25 + Math.random() * 0.4, vx: 0.15 + Math.random() * 0.35,
    a: Math.random() * 6.28, va: (Math.random() - 0.5) * 0.04, ph: Math.random() * 6.28,
  });
  const outdoor = () => current === 'island' || current === 'blog' || current === 'contact';
  if (!reduced) {
    sizeCanvas();
    addEventListener('resize', sizeCanvas);
    parts = Array.from({ length: 12 }, () => spawn(true));
    let t0 = performance.now();
    const tick = (t) => {
      const dt = Math.min(3, (t - t0) / 16.7); t0 = t;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      if (outdoor() && !document.hidden) {
        const glow = night && current === 'island';
        for (const p of parts) {
          p.ph += 0.02 * dt;
          p.y += p.vy * dt * (glow ? 0.3 : 1);
          p.x += (p.vx + Math.sin(p.ph) * 0.5) * dt * (glow ? 0.4 : 1);
          p.a += p.va * dt;
          if (p.y > innerHeight + 20 || p.x > innerWidth + 20) Object.assign(p, spawn(false), { x: Math.random() * innerWidth * 0.8 - innerWidth * 0.1 });
          ctx.save();
          ctx.translate(p.x, p.y);
          if (glow) {
            const g = 0.5 + 0.5 * Math.sin(p.ph * 2);
            ctx.fillStyle = `rgba(255,236,140,${0.35 + 0.55 * g})`;
            ctx.shadowColor = '#ffe57a'; ctx.shadowBlur = 12;
            ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, 6.28); ctx.fill();
          } else {
            ctx.rotate(p.a);
            ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(p.ph * 1.6))); // 翻转时变扁
            const r = p.r;
            ctx.fillStyle = `rgba(244,196,206,${0.55 + 0.3 * Math.abs(Math.sin(p.ph))})`;
            ctx.beginPath(); // 花瓣:尖头 + 顶端小缺口
            ctx.moveTo(-r, 0);
            ctx.quadraticCurveTo(-r * 0.2, -r * 0.75, r * 0.85, -r * 0.3);
            ctx.lineTo(r * 0.6, 0);
            ctx.lineTo(r * 0.85, r * 0.3);
            ctx.quadraticCurveTo(-r * 0.2, r * 0.75, -r, 0);
            ctx.fill();
          }
          ctx.restore();
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
})();
