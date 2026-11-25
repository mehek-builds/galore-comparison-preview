/*
 * Galore / ripple direction: the water.
 * One fixed, page-wide water surface. A real height-field wave simulation
 * (WebGL2, half-float ping-pong) with a canvas-2D CPU fallback.
 *
 *   Water.drop(x, y, radiusPx, strength)   a droplet at viewport coordinates
 *   Water.layer(heightPx, draw)            redraw the submerged layer (page-anchored at y=0)
 *   Water.fade(alpha, ms)                  fade the submerged layer
 *   Water.depth(0..1)                      colour grade: 0 surface, 1 deep
 *
 * The submerged layer is a 2D canvas the page draws into (the sunk belief, the
 * holdings, the backtest waterline). The water refracts it, so everything in it
 * moves with the waves.
 */
(function () {
  'use strict';
  var qs = new URLSearchParams(location.search);
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || qs.get('still') === '1';
  var forceCpu = qs.get('gl') === '0';

  var cv = document.createElement('canvas');
  cv.className = 'water';
  cv.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(cv, document.body.firstChild);

  var layer = document.createElement('canvas');
  var lctx = layer.getContext('2d');
  var LS = 0.6; // layer resolution scale

  var S = {
    vw: 1, vh: 1, dpr: 1, drops: [], depth: 0, depthT: 0, la: 0, laT: 0, laRate: 1,
    layerH: 1, layerDirty: false, scroll: window.scrollY || 0, shift: 0,
    mode: 'none', hidden: false, dirty: true, lastDrop: 0, calm: [-9, -9], lights: [], mx: 0.5, my: 0.5, mk: 0, mkT: 0, tx: 0.5, ty: 0.5
  };

  var W = window.Water = {
    reduce: reduce, mode: 'none', layerScale: LS,
    drop: function (x, y, r, s) {
      if (reduce) return;
      if (S.drops.length > 48) S.drops.shift();
      S.drops.push([x, y, r || 14, s == null ? 0.5 : s]);
      S.lastDrop = performance.now();
    },
    layer: function (h, draw) {
      h = Math.max(1, Math.min(2400, Math.round(h)));
      var w = Math.round(S.vw * LS), hh = Math.round(h * LS);
      if (layer.width !== w || layer.height !== hh) { layer.width = w; layer.height = hh; }
      S.layerH = h;
      lctx.setTransform(LS, 0, 0, LS, 0, 0);
      lctx.clearRect(0, 0, S.vw, h);
      if (draw) draw(lctx, S.vw, h);
      S.layerDirty = true; S.dirty = true;
    },
    fade: function (a, ms) {
      S.laT = a; S.laRate = ms ? 1000 / ms : 1e6;
      if (reduce) S.la = a;
      S.dirty = true;
    },
    calm: function (y0, y1) { S.calm = [y0 / S.vh, y1 / S.vh]; S.dirty = true; },
    lights: function (a) { S.lights = a.slice(0, 4); S.dirty = true; },
    depth: function (d) { S.depthT = Math.max(0, Math.min(1, d)); S.dirty = true; },
    view: function () { return { w: S.vw, h: S.vh }; }
  };

  /* ------------------------------------------------------------------ WebGL2 */
  var VS = '#version 300 es\nin vec2 p;uniform float f;out vec2 v;void main(){v=vec2(p.x*.5+.5,.5+p.y*.5*f);gl_Position=vec4(p,0.,1.);}';

  var STEP = '#version 300 es\nprecision highp float;\n' +
    'uniform sampler2D uS;uniform vec2 uPx;uniform float uShift,uAsp,uDamp;uniform vec4 uD[8];uniform int uN;in vec2 v;out vec4 o;\n' +
    'vec2 T(vec2 p){if(p.x<0.||p.x>1.||p.y<0.||p.y>1.)return vec2(0.);return texture(uS,p).rg;}\n' +
    'void main(){vec2 p=v+vec2(0.,uShift);vec2 c=T(p);\n' +
    'float a=(T(p+vec2(uPx.x,0.)).r+T(p-vec2(uPx.x,0.)).r+T(p+vec2(0.,uPx.y)).r+T(p-vec2(0.,uPx.y)).r)*.25;\n' +
    'float vel=(c.g+(a-c.r)*1.86)*uDamp;float h=c.r+vel+(a-c.r)*.045;\n' +
    'for(int i=0;i<8;i++){if(i>=uN)break;vec2 d=(v-uD[i].xy)*vec2(uAsp,1.);float r=uD[i].z;h+=uD[i].w*exp(-dot(d,d)/(r*r));}\n' +
    'float e=min(min(v.x,1.-v.x),min(v.y,1.-v.y));float k=mix(.86,1.,smoothstep(0.,.05,e));\n' +
    'o=vec4(h*k,vel*k,0.,1.);}';

  var DRAW = '#version 300 es\nprecision highp float;\n' +
    'uniform sampler2D uS,uL;uniform vec2 uPx,uView,uCalm;uniform vec3 uM;uniform vec4 uG[4];uniform float uT,uDepth,uLA,uScroll,uLH;in vec2 v;out vec4 o;\n' +
    'float H(vec2 p){return texture(uS,p).r;}\n' +
    'float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}\n' +
    'vec4 L(vec2 u){if(u.y<0.||u.y>1.||u.x<0.||u.x>1.)return vec4(0.);return texture(uL,u);}\n' +
    'void main(){float asp=uView.x/uView.y;\n' +
    'vec2 g=vec2(H(v+vec2(uPx.x,0.))-H(v-vec2(uPx.x,0.)),H(v+vec2(0.,uPx.y))-H(v-vec2(0.,uPx.y)));\n' +
    'float lap=H(v+vec2(uPx.x,0.))+H(v-vec2(uPx.x,0.))+H(v+vec2(0.,uPx.y))+H(v-vec2(0.,uPx.y))-4.*H(v);\n' +
    'vec2 q=vec2(v.x*asp,v.y+uScroll/uView.y);vec2 a=vec2(0.);\n' +
    'a+=vec2(.8,.6)*cos(dot(q,vec2(.8,.6))*7.+uT*.30);\n' +
    'a+=vec2(-.5,.86)*cos(dot(q,vec2(-.5,.86))*12.+uT*.42+1.7)*.62;\n' +
    'a+=vec2(.2,-.98)*cos(dot(q,vec2(.2,-.98))*19.-uT*.36+4.)*.4;\n' +
    'a+=vec2(.95,.3)*cos(dot(q,vec2(.95,.3))*33.+uT*.6)*.2;\n' +
    'float cm=1.-smoothstep(uCalm.x-.16,uCalm.x+.05,v.y)*(1.-smoothstep(uCalm.y-.05,uCalm.y+.16,v.y));float k=mix(.04,1.,cm);\n' +
    'vec2 n=(g*2.6+a*.017)*k;lap*=k;\n' +
    'vec2 cp=q*2.3+n*9.;float ct=uT*.2;\n' +
    'float c1=sin(cp.x*1.7+sin(cp.y*1.3+ct)*1.8+ct)+sin(cp.y*1.9+sin(cp.x*1.1-ct*.8)*1.7-ct*.6)+sin((cp.x+cp.y)*1.2+sin(cp.x*.7+ct*.5)*2.+ct*.4);\n' +
    'float ca=pow(max(0.,1.-abs(c1)*.5),3.6)*k;\n' +
    'float d=uDepth;const vec3 B=vec3(0.,.0157,.0706);const vec3 I=vec3(.910,.933,.949);\n' +
    'vec3 top=mix(B,I,mix(.072,.03,d));\n' +
    'vec3 bot=mix(B,I,mix(.014,.004,d));\n' +
    'float gy=clamp(v.y+n.y*1.6,0.,1.);\n' +
    'vec3 col=mix(top,bot,smoothstep(0.,1.,gy));\n' +
    /* moonlight pooled on the surface, bent by the waves */
    'vec2 lp=(v-vec2(.5+.14*sin(uT*.06),-.12)+n*1.2)*vec2(asp*.55,1.);\n' +
    'col+=I*mix(.17,.06,d)*exp(-dot(lp,lp)*3.6);\n' +
    'vec2 lp2=(v-vec2(.8+.16*cos(uT*.05),1.02+.06*sin(uT*.08))+n)*vec2(asp*.6,1.);col+=I*.05*exp(-dot(lp2,lp2)*3.)*cm;\n' +
    'vec2 lp3=(v-vec2(.16+.1*sin(uT*.045+2.),.5+.3*cos(uT*.037))+n)*vec2(asp*.6,1.);col+=I*.028*exp(-dot(lp3,lp3)*4.)*cm;\n' +
    'col+=I*ca*mix(.05,.022,d);col*=1.-clamp(-H(v)*1.1,0.,.4)*k;\n' +
    /* submerged layer, refracted with a little chromatic split */
    'vec2 lu=vec2(v.x,(v.y*uView.y+uScroll)/uLH);vec2 ro=clamp(n,-.25,.25)*vec2(1./asp,uView.y/uLH)*.085;\n' +
    'vec4 l0=L(lu+ro);\n' +
    'col=col*(1.-l0.a*uLA*.55)+l0.rgb*uLA;\n' +
    /* slope lighting, specular glint, caustic focus */
    'float s=dot(n,vec2(-.42,-.9));\n' +
    'col+=I*max(s,0.)*1.05;\n' +
    'col*=1.-clamp(-s*1.5,0.,.45);\n' +
    'col+=I*pow(clamp(s*4.2,0.,1.),6.)*.42;\n' +
    'col+=I*.5*clamp(-lap*5.,0.,.5);\n' +
    'const vec3 G=vec3(.169,.941,.541);float ga=0.;\n' +
    'for(int i=0;i<4;i++){vec2 dg=(v-uG[i].xy+n*.6)*vec2(asp,1.);ga+=exp(-dot(dg,dg)/max(uG[i].z*uG[i].z,.0001))*uG[i].w;}\n' +
    'ga=min(ga,1.)*mix(.2,1.,cm);col+=G*ga*(.05+ca*.55+max(s,0.)*1.7+pow(clamp(s*4.2,0.,1.),6.)*.7+clamp(-lap*5.,0.,.5)*.6);\n' +
    'vec2 dm=(v-uM.xy)*vec2(asp,1.);col+=I*uM.z*exp(-dot(dm,dm)*16.)*(.035+ca*.3)*k;\n' +
    'vec2 vg=(v-.5)*vec2(1.05,1.);col*=1.-dot(vg,vg)*.42;\n' +
    'col+=(hash(gl_FragCoord.xy+fract(uT))-.5)/255.*1.6;\n' +
    'o=vec4(col,1.);}';

  function initGL() {
    var gl = cv.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) return null;
    if (!gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float')) return null;
    function sh(t, src) { var s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    function prog(fs) {
      var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
      gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (var i = 0; i < n; i++) { var nm = gl.getActiveUniform(p, i).name.replace('[0]', ''); u[nm] = gl.getUniformLocation(p, nm); }
      return { p: p, u: u };
    }
    var step, draw;
    try { step = prog(STEP); draw = prog(DRAW); } catch (e) { if (window.console) console.warn('water: shader', e); return null; }
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    var sw = 0, sh2 = 0, tex = [], fbo = [], cur = 0;
    function target(w, h) {
      var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      var f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      return ok ? [t, f] : null;
    }
    var ltex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, ltex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    var api = {
      resize: function () {
        cv.width = Math.round(S.vw * S.dpr); cv.height = Math.round(S.vh * S.dpr);
        var cell = S.vw < 700 ? 3 : 4;
        var w = Math.max(96, Math.min(640, Math.round(S.vw / cell))), h = Math.max(96, Math.min(640, Math.round(S.vh / cell)));
        if (w === sw && h === sh2) return true;
        sw = w; sh2 = h;
        for (var i = 0; i < 2; i++) { var t = target(w, h); if (!t) return false; tex[i] = t[0]; fbo[i] = t[1]; }
        return true;
      },
      step: function (shiftPx) {
        gl.useProgram(step.p); gl.viewport(0, 0, sw, sh2); gl.disable(gl.BLEND);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[1 - cur]);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[cur]);
        gl.uniform1i(step.u.uS, 0); gl.uniform1f(step.u.f, 1);
        gl.uniform2f(step.u.uPx, 1 / sw, 1 / sh2); gl.uniform1f(step.u.uShift, shiftPx / S.vh);
        gl.uniform1f(step.u.uAsp, S.vw / S.vh); gl.uniform1f(step.u.uDamp, 0.9925);
        var n = Math.min(8, S.drops.length), arr = new Float32Array(32);
        for (var i = 0; i < n; i++) { var d = S.drops[i]; arr[i * 4] = d[0] / S.vw; arr[i * 4 + 1] = d[1] / S.vh; arr[i * 4 + 2] = d[2] / S.vh; arr[i * 4 + 3] = d[3]; }
        S.drops.splice(0, n);
        gl.uniform4fv(step.u.uD, arr); gl.uniform1i(step.u.uN, n);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); cur = 1 - cur;
      },
      draw: function (t) {
        if (S.layerDirty) {
          gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, ltex);
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, layer);
          S.layerDirty = false;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, cv.width, cv.height);
        gl.useProgram(draw.p);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[cur]);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, ltex);
        gl.uniform1i(draw.u.uS, 0); gl.uniform1i(draw.u.uL, 1); gl.uniform1f(draw.u.f, -1);
        gl.uniform2f(draw.u.uPx, 1 / sw, 1 / sh2); gl.uniform2f(draw.u.uView, S.vw, S.vh);
        gl.uniform1f(draw.u.uT, t); gl.uniform1f(draw.u.uDepth, S.depth); gl.uniform1f(draw.u.uLA, S.la);
        gl.uniform1f(draw.u.uScroll, S.scroll); gl.uniform1f(draw.u.uLH, S.layerH);
        gl.uniform2f(draw.u.uCalm, S.calm[0], S.calm[1]); gl.uniform3f(draw.u.uM, S.mx, S.my, S.mk);
        var ga = new Float32Array(16); S.lights.forEach(function (l, i) { ga[i * 4] = l[0] / S.vw; ga[i * 4 + 1] = l[1] / S.vh; ga[i * 4 + 2] = l[2] / S.vh; ga[i * 4 + 3] = l[3]; }); gl.uniform4fv(draw.u.uG, ga);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    };
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); S.mode = 'lost'; W.mode = 'lost'; });
    return api;
  }

  /* ------------------------------------------------------- canvas-2D fallback */
  function initCPU() {
    var ctx = cv.getContext('2d'); if (!ctx) return null;
    var small = document.createElement('canvas'), sctx = small.getContext('2d');
    var w = 0, h = 0, A, V, img, CELL = 7, frac = 0;
    return {
      resize: function () {
        var dpr = Math.min(S.dpr, 1); cv.width = Math.round(S.vw * dpr); cv.height = Math.round(S.vh * dpr);
        w = Math.max(40, Math.round(S.vw / CELL)); h = Math.max(40, Math.round(S.vh / CELL));
        A = new Float32Array(w * h); V = new Float32Array(w * h); small.width = w; small.height = h; img = sctx.createImageData(w, h);
        return true;
      },
      step: function (shiftPx) {
        var i, x, y;
        frac += shiftPx / CELL; var rows = frac | 0; frac -= rows;
        if (rows) {
          var n = w * h, off = rows * w;
          if (Math.abs(off) >= n) { A.fill(0); V.fill(0); } else if (off > 0) { A.copyWithin(0, off); V.copyWithin(0, off); A.fill(0, n - off); V.fill(0, n - off); } else { A.copyWithin(-off, 0, n + off); V.copyWithin(-off, 0, n + off); A.fill(0, 0, -off); V.fill(0, 0, -off); }
        }
        while (S.drops.length) {
          var d = S.drops.shift(), cx = d[0] / CELL, cy = d[1] / CELL, r = Math.max(1.2, d[2] / CELL), R = Math.ceil(r * 2.4);
          for (y = Math.max(1, (cy - R) | 0); y < Math.min(h - 1, cy + R); y++) for (x = Math.max(1, (cx - R) | 0); x < Math.min(w - 1, cx + R); x++) {
            var dd = (x - cx) * (x - cx) + (y - cy) * (y - cy); A[y * w + x] += d[3] * Math.exp(-dd / (r * r));
          }
        }
        for (y = 1; y < h - 1; y++) for (x = 1; x < w - 1; x++) { i = y * w + x; var av = (A[i - 1] + A[i + 1] + A[i - w] + A[i + w]) * 0.25 - A[i]; V[i] = (V[i] + av * 1.86) * 0.985 + av * 0.045; }
        for (i = 0; i < w * h; i++) A[i] += V[i];
      },
      draw: function () {
        var px = img.data, d = S.depth, x, y, i, j;
        for (y = 0; y < h; y++) {
          var gy = y / h, t = gy * gy * (3 - 2 * gy);
          var e0 = Math.min(1, Math.max(0, (gy - (S.calm[0] - 0.16)) / 0.21)), e1 = Math.min(1, Math.max(0, (gy - (S.calm[1] - 0.05)) / 0.21)), ck = 0.04 + 0.96 * (1 - e0 * (1 - e1));
          var m0 = (0.072 + (0.03 - 0.072) * d) * (1 - t) + (0.014 + (0.004 - 0.014) * d) * t;
          var r0 = 0.910 * m0, g0 = 0.0157 + (0.933 - 0.0157) * m0, b0 = 0.0706 + (0.949 - 0.0706) * m0;
          for (x = 0; x < w; x++) {
            i = y * w + x; j = i * 4;
            var gx = (x > 0 && x < w - 1) ? A[i + 1] - A[i - 1] : 0, gyy = (y > 0 && y < h - 1) ? A[i + w] - A[i - w] : 0;
            var s = (gx * -0.42 + gyy * -0.9) * 2.6 * ck;
            var lx = (x / w - 0.5) * 1.2, ly = gy + 0.12, glow = Math.exp(-(lx * lx + ly * ly) * 2.6) * (1 - 0.6 * d);
            var up = s > 0 ? s * 1.0 : 0, dn = s < 0 ? Math.max(0.45, 1 + s * 2.2) : 1;
            var sp = s > 0 ? Math.pow(Math.min(1, s * 5.5), 5) * 0.5 : 0;
            var gr = 0; for (var li = 0; li < S.lights.length; li++) { var L = S.lights[li], ddx = (x / w - L[0] / S.vw) * S.vw / S.vh, ddy = gy - L[1] / S.vh, rr = L[2] / S.vh; gr += Math.exp(-(ddx * ddx + ddy * ddy) / (rr * rr)) * L[3]; } gr = Math.min(1, gr) * (0.06 + up * 1.7);
            px[j] = 255 * ((r0 + 0.182 * glow + 0.77 * up) * dn + 0.55 * sp + 0.169 * gr);
            px[j + 1] = 255 * ((g0 + 0.187 * glow + 0.79 * up) * dn + 0.56 * sp + 0.941 * gr);
            px[j + 2] = 255 * ((b0 + 0.190 * glow + 0.81 * up) * dn + 0.57 * sp + 0.541 * gr);
            px[j + 3] = 255;
          }
        }
        sctx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.globalAlpha = 1; ctx.drawImage(small, 0, 0, cv.width, cv.height);
        if (S.la > 0.01 && layer.width > 1) {
          var k = cv.width / S.vw; ctx.globalAlpha = S.la;
          ctx.drawImage(layer, 0, -S.scroll * k, cv.width, S.layerH * k);
        }
      }
    };
  }

  /* ------------------------------------------------------------------- loop */
  var R = null, acc = 0, last = 0, t0 = performance.now(), raf = 0;
  function measure() {
    S.vw = Math.max(1, window.innerWidth); S.vh = Math.max(1, window.innerHeight);
    S.dpr = Math.min(window.devicePixelRatio || 1, S.vw < 700 ? 2 : 1.5);
  }
  function boot() {
    measure();
    if (!forceCpu) { try { R = initGL(); if (R && !R.resize()) R = null; } catch (e) { R = null; } if (R) S.mode = 'webgl2'; }
    if (!R) {
      if (!forceCpu) { var c2 = document.createElement('canvas'); c2.className = cv.className; c2.setAttribute('aria-hidden', 'true'); cv.parentNode.replaceChild(c2, cv); cv = c2; }
      R = initCPU(); if (R) { R.resize(); S.mode = 'canvas2d'; }
    }
    W.mode = S.mode; document.documentElement.setAttribute('data-water', S.mode);
    if (!R) return;
    if (reduce) {
      /* a still surface: three frozen rings, no motion */
      S.drops.push([S.vw * 0.5, S.vh * 0.52, 26, 0.9], [S.vw * 0.2, S.vh * 0.8, 16, 0.5], [S.vw * 0.84, S.vh * 0.3, 12, 0.4]);
      for (var i = 0; i < 46; i++) R.step(0);
      S.drops.length = 0; W.drop = function () {};
    }
    last = performance.now(); raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    raf = 0;
    if (S.hidden || S.mode === 'lost') return;
    var dt = Math.min(64, now - last); last = now;
    var sy = window.scrollY || 0, dy = sy - S.scroll; S.scroll = sy;
    if (S.la !== S.laT) { var st = S.laRate * dt / 1000; S.la = S.la < S.laT ? Math.min(S.laT, S.la + st) : Math.max(S.laT, S.la - st); S.dirty = true; }
    if (Math.abs(S.depth - S.depthT) > 0.002) { S.depth += (S.depthT - S.depth) * Math.min(1, dt / 420); S.dirty = true; }
    S.mx += (S.tx - S.mx) * Math.min(1, dt / 140); S.my += (S.ty - S.my) * Math.min(1, dt / 140); S.mkT = Math.max(0, S.mkT - dt / 2600); S.mk += (S.mkT - S.mk) * Math.min(1, dt / 300);
    if (reduce) {
      if (dy) { R.step(dy); S.dirty = true; }
      if (S.dirty) { R.draw(0); S.dirty = false; }
    } else {
      acc += dt; var n = 0, per = S.mode === 'webgl2' ? 8.4 : 16.6;
      if (acc < per && dy) acc = per;
      while (acc >= per && n < 4) { R.step(n === 0 ? dy : 0); acc -= per; n++; }
      if (n === 4) acc = 0;
      R.draw((now - t0) / 1000);
    }
    raf = requestAnimationFrame(frame);
  }
  var rz = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rz); rz = setTimeout(function () { var ow = S.vw, oh = S.vh; measure(); if (R && (ow !== S.vw || Math.abs(oh - S.vh) > 120)) { R.resize(); S.dirty = true; window.dispatchEvent(new Event('water:resize')); } }, 120);
  });
  document.addEventListener('visibilitychange', function () {
    S.hidden = document.hidden; if (!S.hidden && !raf && R) { last = performance.now(); raf = requestAnimationFrame(frame); }
  });

  /* pointer wake: the cursor (or a finger) trails through the surface */
  var px = -1, py = -1, pt = 0;
  window.addEventListener('pointermove', function (e) {
    S.tx = e.clientX / S.vw; S.ty = e.clientY / S.vh; S.mkT = 0;
    return; /* No cursor wake across the page. */
    var now = performance.now();
    if (px < 0 || now - pt > 200) { px = e.clientX; py = e.clientY; pt = now; return; }
    var dx = e.clientX - px, dy = e.clientY - py, dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 7) return;
    var k = Math.min(3, Math.ceil(dist / 28));
    for (var i = 1; i <= k; i++) W.drop(px + dx * i / k, py + dy * i / k, 17, Math.min(0.075, 0.02 + dist * 0.001) / k * 1.3);
    px = e.clientX; py = e.clientY; pt = now;
  }, { passive: true });


  boot();
})();

