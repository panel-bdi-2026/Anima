'use strict';
// ============================================================
//  MISIONES (amplía los encargos de world2.js)
//  - Los habitantes ofrecen sus encargos en persona, no solo en el
//    tablón: muestran «!» sobre la cabeza cuando tienen uno para ti y
//    «?» cuando lo cumpliste (o cuando eres tú quien les trae algo).
//    Siguen con sus rutinas: hay que encontrarlos donde estén.
//  - Encargos nuevos: llevar un paquete de un pueblo a otro, derrotar
//    ánimas en una ruta, capturar especies y explorar una Grieta.
//  - En el menú, «MISIONES» muestra los encargos en curso.
// ============================================================
Object.assign(ITEMS, {
  paquete_semillas: { name: 'Paquete de Semillas', price: 0, desc: 'Semillas de la granjera de Pueblo Alba para el panadero de Villa Musgo.', icon: 'berry', color: '#c8a060', rare: true },
  carta_sellada: { name: 'Carta Sellada', price: 0, desc: 'Una carta del cartero de Villa Musgo para la corredora de Ciudad Roca.', icon: 'key', color: '#f0e0b0', rare: true },
});
QUESTS.push(
  { id: 'q_semillas', town: 'alba', giver: 'alba_farmer', badges: 0, title: 'Semillas para el pan', text: 'Lleva el Paquete de Semillas al panadero de Villa Musgo.',
    carry: { item: 'paquete_semillas', to: 'vm_baker', say: ['¿Semillas de Pueblo Alba? ¡Justo lo que necesitaba para el pan de cereales!', '¡Dale las gracias a la granjera de mi parte!'] },
    offer: ['¡Hola! ¿Vas hacia Villa Musgo?', 'El panadero me pidió semillas para su pan. ¿Se las llevarías?'], reward: { money: 500, items: { pocion: 3 } } },
  { id: 'q_ruta1', town: 'alba', giver: 'alba_man', badges: 0, title: 'Hierba alta', text: 'Derrota 3 ánimas salvajes en la Ruta 1.', prog: () => [stat('win_ruta1'), 3],
    offer: ['Las ánimas salvajes de la Ruta 1 asustan a los que vienen al pueblo.', '¿Podrías derrotar a 3 para que se calmen un poco?'], reward: { money: 300, items: { esfera: 5 } } },
  { id: 'q_coleccion', town: 'alba', giver: 'alba_girl', badges: 0, title: 'Ánimas nuevas', text: 'Captura 3 especies distintas.', prog: () => [caughtN(), 3],
    offer: ['¡Quiero ver ánimas que no conozco!', '¿Capturarías 3 especies distintas y me las enseñas?'], reward: { money: 300, items: { superesfera: 3 } } },
  { id: 'q_carta', town: 'musgo', giver: 'vm_mail', badges: 1, title: 'Correo urgente', text: 'Lleva la Carta Sellada a la corredora de Ciudad Roca.',
    carry: { item: 'carta_sellada', to: 'cr_jogger', say: ['¿Una carta para mí? ¡Es de mi hermano, que vive en el puerto!', 'Dile al cartero que muchas gracias.'] },
    offer: ['¡Ay, tengo demasiadas cartas hoy!', 'Esta va para la corredora de Ciudad Roca. ¿Me harías el favor?'], reward: { money: 900, items: { superpocion: 2 } } },
  { id: 'q_grieta', town: 'musgo', giver: 'vm_artist', badges: 1, title: 'La Grieta Ánima', text: 'Explora una Grieta Ánima y derrota a su alfa colosal.', prog: () => [stat('dng_clears'), 1],
    offer: ['Quiero pintar el interior de una Grieta Ánima, pero me da miedo entrar.', '¿Explorarías una y derrotarías a su alfa colosal?'], reward: { money: 1500, items: { llave_esencia: 2, caramelo: 1 } } },
);
Object.assign(Quests, {
  // ¿se puede ofrecer este encargo ahora?
  canOffer(q) { return this.state(q) === 'new' && G.badges.filter(Boolean).length >= q.badges && this.active().length < 3 && (q.town !== 'alba' || Game.flag('got_starter')); },
  // marca sobre la cabeza: '!' encargo nuevo, '?' encargo cumplido o paquete para esta persona
  marker(id) {
    if (!G || !G.party || !G.party.length) return null;
    for (const q of QUESTS) {
      if (this.state(q) !== 'active') continue;
      if (q.carry && q.carry.to === id && G.bag[q.carry.item] && !G.flags['qdel_' + q.id]) return '?';
      if (q.giver === id && this.done(q)) return '?';
    }
    return QUESTS.some((q) => q.giver === id && this.canOffer(q)) ? '!' : null;
  },
});
// encargos de llevar algo: se cumplen al entregarlo
{
  const _done = Quests.done.bind(Quests), _prog = Quests.progText.bind(Quests), _name = Quests.giverName.bind(Quests);
  Quests.done = (q) => (q.carry ? !!G.flags['qdel_' + q.id] : _done(q));
  Quests.progText = (q) => (q.carry ? (G.flags['qdel_' + q.id] ? 'Entregado' : 'Pendiente') : _prog(q));
  Quests.giverName = (q) => ({ alba_farmer: 'Granjera de Pueblo Alba', alba_man: 'Señor del estanque', alba_girl: 'Chica de Pueblo Alba', vm_mail: 'Cartero de la villa', vm_artist: 'Pintora de la villa' }[q.giver] || _name(q));
  const _hook = Quests.talkHook.bind(Quests);
  Quests.talkHook = async function (n) {
    const id = n.def.id;
    // entregar un paquete
    const c = QUESTS.find((q) => q.carry && q.carry.to === id && this.state(q) === 'active' && G.bag[q.carry.item] && !G.flags['qdel_' + q.id]);
    if (c) {
      await say(c.carry.say); Game.take(c.carry.item, 1); G.flags['qdel_' + c.id] = 1;
      World.banner = { text: `Entregado. Vuelve con: ${this.giverName(c)}`, t: 0 }; Sound.sfx('super'); return true;
    }
    // cobrar o recordar (lo de siempre)
    if (await _hook(n)) return true;
    // ofrecer un encargo en persona
    const q = QUESTS.find((x) => x.giver === id && this.canOffer(x));
    if (!q) return false;
    const r = await ask((q.offer || [`¿Me harías un favor? ${q.text}`]), ['Acepto', 'Ahora no']);
    if (r !== 0) { await say('Bueno, si cambias de idea, aquí estaré.'); return true; }
    G.quests[q.id] = 'active'; Sound.sfx('select');
    if (q.carry) { Game.give(q.carry.item, 1); Sound.jingle('item'); await say(`Recibes: ${ITEMS[q.carry.item].name}.`); }
    await say(`Nueva misión: «${q.title}». ${q.text} La puedes ver en el menú, en MISIONES.`);
    return true;
  };
}
// marca «!» / «?» sobre los habitantes que tienen un encargo
// Ícono en píxeles: insignia redonda con borde oscuro, degradado, brillo arriba a la izquierda y una
// puntita hacia abajo (señala a la persona); el signo va centrado y con sombra.
// '!' dorado = encargo nuevo; '?' celeste = encargo cumplido o paquete para esta persona.
const QuestMark = {
  // a doble resolución, como los personajes HD (en 2D se dibuja a la mitad)
  W: 32, H: 40, cache: {},
  icon(m) {
    if (this.cache[m]) return this.cache[m];
    const W = this.W, H = this.H, [c, x] = U.makeCanvas(W, H), px = (col, a, b, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    const gold = m === '!', ink = '#2a1408';
    const ramp = gold ? ['#fff8d0', '#ffe478', '#ffcc34', '#f4a41c', '#d0780e'] : ['#effcff', '#b0eeff', '#68ccf8', '#3098e0', '#1c66b4'];
    const cx = 16, cy = 15, R = 13.2;
    // cuerpo redondo con degradado (claro arriba) y borde de 2 píxeles
    for (let j = 0; j < 31; j++) for (let i = 0; i < W; i++) {
      const d = Math.hypot(i + 0.5 - cx, j + 0.5 - cy);
      if (d <= R && d > R - 2) px(ink, i, j);
      else if (d <= R - 2) px(ramp[Math.min(4, 1 + Math.floor(((j - 3) / 25) * 4))], i, j);
    }
    // sombra interior abajo (volumen)
    for (let j = 0; j < 31; j++) for (let i = 0; i < W; i++) { const d = Math.hypot(i + 0.5 - cx, j + 0.5 - (cy - 2)); const e = Math.hypot(i + 0.5 - cx, j + 0.5 - cy); if (e <= R - 2 && d > R - 3) px(ramp[4], i, j); }
    // puntita hacia abajo, centrada
    for (let k = 0; k < 6; k++) { const w = 12 - k * 2; px(ink, cx - w / 2, 27 + k, w, 1); if (w > 4) px(ramp[4], cx - w / 2 + 2, 27 + k, w - 4, 1); }
    // brillo arriba a la izquierda
    px(ramp[0], 7, 7, 4, 2); px(ramp[0], 7, 9, 2, 2); px('#ffffff', 8, 7, 2, 1);
    // signo centrado (8 de ancho), con sombra
    const glyph = gold
      ? ['..XXXX..', '..XXXX..', '..XXXX..', '..XXXX..', '..XXXX..', '..XXXX..', '...XX...', '...XX...', '........', '........', '..XXXX..', '..XXXX..']
      : ['..XXXX..', '.XXXXXX.', 'XX....XX', 'XX....XX', '.....XX.', '....XX..', '...XX...', '...XX...', '........', '........', '...XX...', '...XX...'];
    const gx = cx - 4, gy = 9;
    for (const [col, dx, dy] of [[gold ? '#9a5208' : '#0e3a70', 1, 1], ['#ffffff', 0, 0]])
      glyph.forEach((row, r) => { for (let k = 0; k < 8; k++) if (row[k] === 'X') px(col, gx + k + dx, gy + r + dy); });
    return (this.cache[m] = c);
  },
};
{
  // en 2D: el ícono sobre la cabeza (en 3D va aparte, flotando: ver abajo)
  const _de = World.drawEntity;
  World.drawEntity = function (ctx, e, cx, cy) {
    const r = _de.call(this, ctx, e, cx, cy);
    if (!World.hiDraw && e.def && !e.gone && !e.hidden && !e.lying) {
      const m = Quests.marker(e.def.id);
      if (m) {
        const x = Math.round(e.px - cx) + 8 - 8, y = Math.round(e.py - cy) - 34 - Math.round(Math.abs(Math.sin(Engine.time * 3)) * 2);
        ctx.drawImage(QuestMark.icon(m), x, y, 16, 20);
      }
    }
    return r;
  };
}
// en 3D: un letrero que siempre mira a la cámara, sobre la cabeza, con un halo suave; sube y baja despacio
if (typeof World3D !== 'undefined') {
  const _sync = World3D.syncSprites;
  World3D.syncSprites = function (world) {
    const r = _sync.call(this, world);
    try {
      this.qmarks = this.qmarks || new Map();
      const seen = new Set(), t = Engine.time;
      for (const e of world.entities()) {
        if (!e.def || e.hidden || e.gone || e.lying) continue;
        const m = Quests.marker(e.def.id); if (!m) continue;
        let q = this.qmarks.get(e);
        if (!q || q.m !== m) {
          if (q) this.root.remove(q.g);
          const g = new THREE.Group();
          const tex = this.tex(QuestMark.icon(m)); tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
          const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
          icon.scale.set(0.72, 0.72 * (QuestMark.H / QuestMark.W), 1); icon.renderOrder = 5;
          const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TitleArt.softTex(), color: m === '!' ? '#ffd060' : '#80d8ff', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
          glow.scale.set(1.5, 1.5, 1);
          g.add(glow, icon); this.root.add(g);
          q = { g, icon, glow, m, ph: Math.random() * 6 }; this.qmarks.set(e, q);
        }
        if (q.g.parent !== this.root) this.root.add(q.g); // el mapa se volvió a armar
        seen.add(e);
        const b = Math.sin(t * 2.6 + q.ph);
        q.g.position.set((e.px + 8) / 16, (typeof CharFrames !== 'undefined' && CharFrames.SET[e.look] ? 3.15 : 2.55) + b * 0.07, (e.py + 14) / 16);
        q.icon.scale.set(0.72 * (1 + Math.max(0, b) * 0.04), 0.72 * (QuestMark.H / QuestMark.W), 1);
        q.glow.material.opacity = 0.38 + 0.14 * (b * 0.5 + 0.5);
        q.g.visible = true;
      }
      for (const [e, q] of this.qmarks) if (!seen.has(e)) { this.root.remove(q.g); this.qmarks.delete(e); }
    } catch (err) { console.error(err); }
    return r;
  };
}
// registro de misiones (menú)
class QuestLog {
  constructor() { this.i = 0; }
  update() {
    if (Input.pressed('b') || Input.pressed('a') || Input.mouse.pressed[2] || Input.mouse.pressed[0]) { Sound.sfx('cancel'); this.done(); }
  }
  draw(ctx) {
    screenBg(ctx, '#2a2040', '#1e1630');
    UI.box(ctx, 4, 4, 312, 20, 'title'); Font.drawCenter(ctx, 'MISIONES', 160, 10, '#ffffff');
    const L = Quests.active(), done = QUESTS.filter((q) => Quests.state(q) === 'done').length;
    if (!L.length) { Font.drawCenter(ctx, 'No tienes misiones en curso.', 160, 96, '#c8c0e0'); Font.drawCenter(ctx, 'Busca a quien tenga un «!» sobre la cabeza,', 160, 110, '#8a82a8'); Font.drawCenter(ctx, 'o mira el tablón de los centros.', 160, 122, '#8a82a8'); }
    L.forEach((q, k) => {
      const y = 30 + k * 44, ok = Quests.done(q);
      UI.box(ctx, 8, y, 304, 40, 'dark');
      Font.draw(ctx, (ok ? '? ' : '! ') + q.title, 16, y + 5, ok ? '#80e0ff' : '#ffd048');
      Font.drawRight(ctx, Quests.progText(q), 304, y + 5, '#c8c0e0');
      Font.draw(ctx, ok ? `Listo: vuelve con ${Quests.giverName(q)}.` : q.text, 16, y + 17, '#ffffff');
      Font.draw(ctx, `Pide: ${Quests.giverName(q)}`, 16, y + 28, '#8a82a8');
    });
    Font.drawCenter(ctx, `Completadas: ${done} de ${QUESTS.length} · B: volver`, 160, 226, '#8a82a8');
  }
}
StartMenu.prototype.items = (function (orig) {
  return function () { const it = orig.call(this); if (G.flags.got_starter) it.splice(Math.min(3, it.length - 1), 0, ['MISIONES', 'quests']); return it; };
})(StartMenu.prototype.items);
StartMenu.prototype.pick = (function (orig) {
  return async function (k) {
    if (k !== 'quests') return orig.call(this, k);
    this.busy = true; await runScene(new QuestLog()); this.busy = false;
  };
})(StartMenu.prototype.pick);
