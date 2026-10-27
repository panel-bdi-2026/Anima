'use strict';
// ============================================================
//  Soporte de ratón en los menús y cursor propio
//  - Pasar el ratón por una opción la selecciona; clic izquierdo
//    confirma y clic derecho vuelve atrás. La rueda desplaza listas.
// ============================================================

const MouseUI = {
  inside(x, y, w, h) { const m = Input.mouse; return m.inside && m.x >= x && m.y >= y && m.x < x + w && m.y < y + h; },
  // selecciona por hover dentro de una lista vertical; devuelve true si el ratón está sobre algún elemento
  list(scene, prop, n, x, y0, step, w, offset = 0) {
    let over = false;
    for (let i = 0; i < n; i++) {
      if (this.inside(x, y0 + i * step - 2, w, step)) {
        over = true;
        if (Input.mouse.moved || Input.mouse.pressed[0]) {
          if (scene[prop] !== i + offset) { scene[prop] = i + offset; if (Input.mouse.moved) Sound.sfx('blip'); }
        }
      }
    }
    return over;
  },
  swallow() { Input.mouse.pressed[0] = false; },
  wrap(Cls, fn) {
    const orig = Cls.prototype.update;
    Cls.prototype.update = function (dt) {
      if (Input.mouse.inside && (Input.mouse.moved || Input.mouse.pressed[0] || Input.mouse.wheel)) fn.call(this);
      return orig.call(this, dt);
    };
  },
};

MouseUI.wrap(Choice, function () {
  const over = MouseUI.list(this, 'i', this.options.length, this.x, this.y + 7, 14, this.w);
  if (!over && Input.mouse.pressed[0]) MouseUI.swallow();
});
MouseUI.wrap(StartMenu, function () {
  if (this.busy) return;
  const over = MouseUI.list(this, 'i', this.items().length, 222, 11, 15, 94);
  if (!over && Input.mouse.pressed[0]) MouseUI.swallow();
});
MouseUI.wrap(TitleScreen, function () {
  if (!this.menu || this.busy) return;
  const n = this.options().length, over = MouseUI.list(this, 'i', n, W - 146, H - 26 - n * 19 + 2, 19, 128);
  if (!over && Input.mouse.pressed[0]) MouseUI.swallow();
});
MouseUI.wrap(PartyScreen, function () {
  if (this.busy) return;
  const over = MouseUI.list(this, 'i', G.party.length, 8, 8, 30, 304);
  if (!over && Input.mouse.pressed[0]) MouseUI.swallow();
});
MouseUI.wrap(BagScreen, function () {
  if (this.busy) return;
  const n = Math.min(9, this.items().length + 1 - this.scroll);
  const over = MouseUI.list(this, 'i', n, 110, 14, 14, 204, this.scroll);
  if (!over && Input.mouse.pressed[0]) MouseUI.swallow();
});
MouseUI.wrap(ShopScreen, function () {
  if (this.busy) return;
  const n = Math.min(8, this.list().length + 1 - this.scroll);
  const over = MouseUI.list(this, 'i', n, 145, 34, 17, 166, this.scroll);
  if (!over && Input.mouse.pressed[0]) MouseUI.swallow();
});
MouseUI.wrap(BoxScreen, function () {
  const n = Math.min(12, G.box.length - this.scroll);
  const over = MouseUI.list(this, 'i', n, 150, 28, 16, 164, this.scroll);
  if (!over && Input.mouse.pressed[0]) MouseUI.swallow();
});
MouseUI.wrap(DexScreen, function () {
  if (this.detail) return;
  const n = Math.min(14, SPECIES_LIST.length - this.scroll);
  const over = MouseUI.list(this, 'i', n, 160, 28, 14.5, 154, this.scroll);
  if (!over && Input.mouse.pressed[0]) MouseUI.swallow();
});
MouseUI.wrap(OptionsScreen, function () {
  const rows = this.rows ? this.rows() : 4;
  const over = MouseUI.list(this, 'i', rows, 30, 44, 17, 260);
  if (Input.mouse.pressed[0]) {
    if (!over) { MouseUI.swallow(); return; }
    if (this.i < rows - 1) { Input.pressedKeys[Input.mouse.x < 200 ? 'ArrowLeft' : 'ArrowRight'] = true; MouseUI.swallow(); }
  }
});
MouseUI.wrap(SummaryScreen, function () {
  if (Input.mouse.pressed[0]) {
    for (let k = 0; k < 3; k++) if (MouseUI.inside(8 + k * 70, 3, 64, 14)) { this.page = k; Sound.sfx('blip'); MouseUI.swallow(); return; }
  }
});
MouseUI.wrap(TalentScreen, function () {
  let over = false;
  for (let bx = 0; bx < 3; bx++) for (let by = 0; by < 3; by++) {
    if (MouseUI.inside(8 + bx * 104, 48 + by * 44, 98, 38)) { over = true; if (this.bx !== bx || this.by !== by) { this.bx = bx; this.by = by; if (Input.mouse.moved) Sound.sfx('blip'); } }
  }
  if (!over && Input.mouse.pressed[0]) MouseUI.swallow();
});
MouseUI.wrap(NameEntry, function () {
  if (!Input.mouse.pressed[0]) return;
  for (let y = 0; y < 7; y++) for (let x = 0; x < 10; x++) {
    if (MouseUI.inside(21 + x * 24, 60 + y * 18, 24, 18)) { this.cx = x; this.cy = y; this.grid = true; Input.pressedKeys.KeyZ = true; MouseUI.swallow(); return; }
  }
  if (MouseUI.inside(250, 60, 56, 16)) { this.cx = 10; this.cy = 0; this.grid = true; Input.pressedKeys.KeyZ = true; MouseUI.swallow(); return; }
  if (MouseUI.inside(20, 60 + 7 * 18, 80, 16)) { this.finish(); MouseUI.swallow(); return; }
  MouseUI.swallow();
});

// ---------- cursor propio ----------
const Cursor = {
  draw(ctx) {
    if (!Input.usingMouse()) return;
    const m = Input.mouse, x = Math.round(m.x), y = Math.round(m.y);
    const b = Battle.active;
    if (b && Scenes.top() === b && b.state === 'fight') {
      // retícula de combate
      const c = Input.mouse.down[0] || Input.mouse.down[2] ? '#ffe060' : '#ffffff';
      const o = 3 + Math.round(Math.sin(Engine.time * 8));
      for (const [dx, dy, w, h] of [[-o - 3, 0, 3, 1], [o + 1, 0, 3, 1], [0, -o - 3, 1, 3], [0, o + 1, 1, 3]]) { P(ctx, x + dx - 1, y + dy - 1, w + 2, h + 2, '#1c1622'); }
      for (const [dx, dy, w, h] of [[-o - 3, 0, 3, 1], [o + 1, 0, 3, 1], [0, -o - 3, 1, 3], [0, o + 1, 1, 3]]) P(ctx, x + dx, y + dy, w, h, c);
      P(ctx, x, y, 1, 1, c);
      return;
    }
    // flecha
    const rows = ['1', '11', '121', '1221', '12221', '122221', '1222221', '12222221', '122211', '1121', '11 21', '   21', '    1'];
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const ch = r[i]; if (ch === '1') P(ctx, x + i, y + j, 1, 1, '#1c1622'); else if (ch === '2') P(ctx, x + i, y + j, 1, 1, '#ffffff'); } });
  },
};
const _engineDraw = Engine.draw.bind(Engine);
Engine.draw = function () {
  _engineDraw();
  this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  Cursor.draw(this.ctx);
};
