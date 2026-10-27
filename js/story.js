'use strict';
// ============================================================
//  Historia y eventos (Capítulo 1 + postjuego legendario)
// ============================================================

// escena de fondo para la introducción
class IntroScene {
  constructor() { this.opaque = true; this.t = 0; this.show = 'prof'; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1c2448'); g.addColorStop(1, '#4a3a6a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 30; i++) P(ctx, (i * 73) % W, (i * 41) % 170, 1, 1, i % 3 ? '#ffffff' : '#a0c0ff');
    drawShadow(ctx, 160, 160, 40, 6, 0.35);
    if (this.show === 'prof' || this.show === 'both') {
      const spr = HiChar.get(LOOKS.prof);
      ctx.drawImage(spr, 0, 0, 32, 48, this.show === 'both' ? 80 : 128, 66, 64, 96);
    }
    if (this.show === 'creature' || this.show === 'both') {
      const bob = Math.sin(this.t * 3) * 2;
      ctx.drawImage(CreatureGfx.get('voltin', 64), this.show === 'both' ? 170 : 128, 98 + bob);
    }
    if (this.show === 'player') { const spr = HiChar.get(LOOKS.player); ctx.drawImage(spr, 0, 0, 32, 48, 128, 66, 64, 96); }
    if (this.show === 'rival') { const spr = HiChar.get(LOOKS.rival); ctx.drawImage(spr, 0, 0, 32, 48, 128, 66, 64, 96); }
  }
}

// créditos finales del capítulo
class CreditsScene {
  constructor() {
    this.opaque = true; this.t = 0;
    this.lines = ['', 'ÁNIMA: REGIÓN ALBA', '', 'Capítulo 1', 'completado', '', '', 'Has conseguido 3 medallas', `Códice: ${Object.keys(G.caught).length} ánimas capturadas`, `Tiempo de juego: ${Game.timeStr(G.playTime)}`,
      '', '', 'Diseño, programación, gráficos y música', 'creados íntegramente por código', '', '', 'Gracias por jugar', '', '', 'Pero la aventura continúa...', '', 'Tres guardianes legendarios', 'han despertado en la región.', '', '', ''];
  }
  update(dt) { this.t += dt; if (this.t > 26 || (this.t > 3 && (Input.pressed('a') || Input.pressed('start')))) this.done(); }
  draw(ctx) {
    P(ctx, 0, 0, W, H, '#0c0a18');
    for (let i = 0; i < 50; i++) P(ctx, (i * 97 + this.t * (5 + (i % 3) * 5)) % W, (i * 53) % H, 1, 1, i % 4 ? '#ffffff' : '#ffe0a0');
    const y0 = H - this.t * 18;
    this.lines.forEach((ln, i) => {
      const y = y0 + i * 16;
      if (y > -12 && y < H) Font.drawCenter(ctx, ln, 160, y, i === 1 ? '#ffd048' : '#e8e0f8');
    });
    const party = G.party.slice(0, 6);
    party.forEach((c, i) => {
      const x = 30 + i * 46, y = 200 + Math.sin(this.t * 3 + i) * 2;
      ctx.drawImage(CreatureGfx.get(c.sp, 32, c.shiny), x, y - 20);
    });
  }
}

const RIVAL_PICK = { ignito: 'burbujo', burbujo: 'semillin', semillin: 'ignito' };
const STAGE2 = { ignito: 'fogarzo', burbujo: 'marolo', semillin: 'hojardo' };
const STAGE3 = { ignito: 'magmaurio', burbujo: 'coralis', semillin: 'robledor' };

const Story = {
  async newGame() {
    G = newGameState();
    const sc = new IntroScene();
    Scenes.push(sc);
    Sound.music('town');
    await Fade.in(0.6);
    const sp = 'Profesora Ceiba';
    await say(['¡Hola! ¡Bienvenido al mundo de las ánimas!', 'Me llamo Ceiba, pero todos me llaman la Profesora.'], { speaker: sp });
    sc.show = 'creature';
    Sound.sfx('appear');
    await say(['Este mundo está habitado por criaturas llamadas ÁNIMAS.', 'Algunas personas las tienen como compañeras. Otras luchan junto a ellas.'], { speaker: sp });
    sc.show = 'both';
    await say(['En la Región Alba, los combates son muy especiales: ¡se libran en TIEMPO REAL!', 'Entrenador y ánima se mueven juntos, esquivan y atacan como uno solo.', 'Y lo más fascinante: según cómo luches, ¡tus ánimas evolucionarán de forma distinta!'], { speaker: sp });
    sc.show = 'player';
    await say('Pero háblame de ti. ¿Cómo te llamas?', { speaker: sp });
    let r = await choose(['Escribir nombre', 'ALEX', 'NOA', 'SAM'], { x: 200, y: 80 });
    if (r <= 0) G.name = (await runScene(new NameEntry('¿Cómo te llamas?', ''))) || 'Alex';
    else G.name = ['', 'Alex', 'Noa', 'Sam'][r];
    await say(`¡Así que te llamas ${G.name}! ¡Encantada!`, { speaker: sp });
    sc.show = 'rival';
    await say(['Este es mi nieto. Habéis sido rivales desde que erais pequeños...', '...Eh... ¿Cómo se llamaba?'], { speaker: sp });
    r = await choose(['Escribir nombre', 'DANTE', 'LUCA', 'IRIS'], { x: 200, y: 80 });
    if (r <= 0) G.rival = (await runScene(new NameEntry('¿Cómo se llama tu rival?', ''))) || 'Dante';
    else G.rival = ['', 'Dante', 'Luca', 'Iris'][r];
    await say(`¡Eso es! ¡Se llama ${G.rival}!`, { speaker: sp });
    sc.show = 'player';
    await say([`${G.name}, tu propia leyenda está a punto de comenzar.`, '¡Un mundo de sueños y aventuras con ánimas te espera! ¡Adelante!'], { speaker: sp });
    await Fade.out(0.8);
    Scenes.pop(sc);
    G.map = 'casa_jugador'; G.x = 2; G.y = 2; G.dir = 'down';
    World.start();
    await wait(0.5);
    World.runScript(async () => { await say(['Hoy es el gran día...', 'La Profesora Ceiba dijo que tenía algo importante para ti. ¡El laboratorio está al sur del pueblo!']); });
  },

  async run(name, def, npc) {
    const fn = this.scripts[name];
    if (!fn) { console.warn('Script inexistente', name); return; }
    await fn.call(this, def || {}, npc);
  },

  async partnerTalk() {
    const c = G.party[0];
    const n = cName(c);
    let lines;
    const st = calcStats(c);
    if (c.hp < st.hp * 0.3) lines = [`${n} parece agotado. Deberías llevarlo a un Centro Ánima.`];
    else if (c.bond >= BOND_HIGH + 40) lines = [`${n} te mira con muchísimo cariño.`, `¡${n} da saltitos de alegría a tu alrededor!`, `${n} se frota contra tu pierna.`];
    else if (c.bond >= BOND_HIGH) lines = [`${n} está muy contento de ir contigo.`, `${n} tararea una melodía alegre.`];
    else if (!Game.isDay()) lines = [`${n} mira las estrellas con curiosidad.`, `${n} bosteza. Parece que tiene sueño.`];
    else lines = [`${n} te mira con atención.`, `${n} olfatea el aire con curiosidad.`, `${n} parece listo para la aventura.`];
    Sound.sfx('appear');
    await say(U.choice(lines));
  },

  scripts: {
    async mom() {
      if (!Game.flag('mom_talk')) {
        Game.setFlag('mom_talk');
        await say([`¡Buenos días, ${G.name}!`, 'La Profesora Ceiba pasó por aquí. ¡Quiere verte en su laboratorio!', 'Está al sur del pueblo. ¡Ten cuidado!'], { speaker: 'Mamá' });
        return;
      }
      if (G.party.length) {
        await say(`${G.name}, ¡pareces cansado! Descansa un poco.`, { speaker: 'Mamá' });
        await Fade.out(0.3); Game.healAll(); await Sound.jingle('heal'); await Fade.in(0.3);
        G.lastHeal = { map: 'casa_jugador', x: 6, y: 4 };
        await say('¡Tus ánimas están como nuevas! ¡Ánimo en tu viaje!', { speaker: 'Mamá' });
      } else await say('¡Ve al laboratorio de la Profesora!', { speaker: 'Mamá' });
    },
    async sister() {
      if (!Game.flag('sister_gift') && Game.flag('got_starter')) {
        Game.setFlag('sister_gift');
        await say([`¡Hola, ${G.name}! Mi hermano ${G.rival} ya se ha ido de viaje.`, 'Toma esto. ¡Te será útil!'], { speaker: 'Lía' });
        Game.give('pocion', 3); Game.give('esfera', 2); Sound.jingle('item');
        await say(`¡${G.name} recibió 3 Pociones y 2 Esferas!`);
        return;
      }
      await say(Game.flag('got_starter') ? 'Si tus ánimas están heridas, ¡usa una Poción desde la mochila!' : `¿Buscas a ${G.rival}? Fue al laboratorio de la abuela.`, { speaker: 'Lía' });
    },
    async alba_block() {
      const n = World.npc('alba_block');
      Sound.sfx('alert');
      if (n) World.emote(n, '!');
      await say(['¡Eh, espera! ¡No puedes salir del pueblo sin un ánima!', 'Las ánimas salvajes de la hierba alta son peligrosas.', 'La Profesora Ceiba te espera en su laboratorio, al sur.'], { speaker: 'Ayudante' });
      await World.walk(World.player, ['down']);
    },
    async prof() {
      const sp = 'Profesora Ceiba';
      if (!Game.flag('met_prof')) {
        Game.setFlag('met_prof');
        await say([`¡Ah, ${G.name}! ¡Por fin llegas!`, `${G.rival} ya está aquí, impaciente como siempre.`], { speaker: sp });
        World.refreshNpcs();
        Sound.sfx('appear');
        await say(['¡Abuela! ¡Yo llegué primero, así que elijo primero!'], { speaker: G.rival });
        await say(['Paciencia. Sobre la mesa hay tres esferas, cada una con un ánima.', 'Ignito, de tipo Fuego. Burbujo, de tipo Agua. Y Semillín, de tipo Planta.', `${G.name}, tú eliges primero. ¡Adelante, mira las esferas de la mesa!`], { speaker: sp });
        return;
      }
      if (!Game.flag('got_starter')) { await say('Elige una de las tres esferas de la mesa. ¡Tómate tu tiempo!', { speaker: sp }); return; }
      if (Game.flag('chapter1_done') && !Game.flag('prof_legend_talk')) {
        Game.setFlag('prof_legend_talk');
        await say(['¡Lo has hecho de maravilla en tu viaje!', 'Escucha: he detectado tres señales de energía enormes en la región.', 'Una en lo más profundo del Bosque Susurro, otra en la cima de la Ruta 3 y otra al final del muelle de Puerto Marea.', 'Creo que son los guardianes legendarios de Alba. Si logras reunir a los tres... quizá aparezca algo más.'], { speaker: sp });
        return;
      }
      // recompensas del códice
      const caught = Object.keys(G.caught).length;
      const rewards = [[5, 'superesfera', 5], [10, 'lente_foco', 1], [20, 'piedra_sinergia', 1], [30, 'ultraesfera', 5], [40, 'maestra', 1], [55, 'caramelo', 5]];
      for (const [n, item, q] of rewards) {
        const f = 'dexrw_' + n;
        if (caught >= n && !Game.flag(f)) {
          Game.setFlag(f);
          await say([`¡Ya has capturado ${caught} tipos de ánimas! ¡Fantástico!`, 'Toma esto como recompensa por tu investigación.'], { speaker: sp });
          Game.give(item, q); Sound.jingle('item');
          await say(`¡${G.name} recibió ${q > 1 ? q + ' × ' : ''}${ITEMS[item].name}!`);
          return;
        }
      }
      const next = rewards.find(([n]) => caught < n);
      await say([`Tu Códice tiene ${caught} ánimas capturadas de ${SPECIES_LIST.length}.`, next ? `Cuando llegues a ${next[0]}, ¡tendré un regalo para ti!` : '¡Has completado casi todo! Eres increíble.', 'Recuerda: el estilo con el que luchas decide la forma final de muchas ánimas.'], { speaker: sp });
    },
    async starter(def) {
      const key = def.key, sp = SPECIES[key];
      if (!Game.flag('met_prof')) { await say('Son tres esferas. Será mejor hablar primero con la Profesora.'); return; }
      if (Game.flag('got_starter')) { await say('La Profesora guarda aquí sus ánimas de investigación.'); return; }
      const desc = { ignito: 'el ánima de tipo FUEGO', burbujo: 'el ánima de tipo AGUA', semillin: 'el ánima de tipo PLANTA' }[key];
      const peek = new StarterPeek(key);
      Scenes.push(peek);
      const r = await ask(`¿Eliges a ${sp.name}, ${desc}?`);
      Scenes.pop(peek);
      if (r !== 0) return;
      const c = newCreature(key, 5, { bond: 100 });
      Game.addCreature(c);
      G.starter = key;
      Game.setFlag('got_starter'); Game.setFlag('starter_taken_' + key);
      Sound.jingle('fanfare');
      await say(`¡${G.name} recibió a ${sp.name}!`);
      const nn = await ask(`¿Quieres ponerle un mote a ${sp.name}?`);
      if (nn === 0) { const name = await runScene(new NameEntry(`Mote para ${sp.name}:`, sp.name)); if (name && name !== sp.name) c.nick = name; }
      // el rival elige
      const rk = RIVAL_PICK[key];
      G.rivalStarter = rk;
      const rv = World.npc('lab_rival');
      await say(`¡Entonces yo me quedo con este! ¡${SPECIES[rk].name}!`, { speaker: G.rival });
      if (rv) {
        const tx = ({ ignito: 5, burbujo: 6, semillin: 7 })[rk];
        const path = []; let x = rv.x; while (x < tx) { path.push('right'); x++; } while (x > tx) { path.push('left'); x--; }
        rv.scripted = true;
        const ok = await this.safeWalk(rv, path);
        rv.dir = 'down';
        Game.setFlag('starter_taken_' + rk);
        Sound.jingle('item');
        await wait(0.3);
        rv.dir = World.player.x < rv.x ? 'left' : World.player.x > rv.x ? 'right' : 'down';
        if (!ok) Game.setFlag('starter_taken_' + rk);
      } else Game.setFlag('starter_taken_' + rk);
      Sound.music('trainer');
      await say([`¡Espera, ${G.name}! ¡Vamos a ver de qué son capaces nuestras ánimas!`, '¡Combatamos!'], { speaker: G.rival });
      const res = await Battle.trainer({ title: G.rival, cls: 'Rival', name: G.rival, party: [[rk, 5]], look: 'rival', skill: 0.25, money: 0, npc: rv });
      Game.healAll();
      if (res === 'win') await say(['¿Qué? ¡Imposible! ¡Elegí al ánima con ventaja de tipo!', 'Bah... Solo ha sido suerte.'], { speaker: G.rival });
      else await say(['¡Ja! ¡Gané! ¡Soy un genio!', '...Bueno, tampoco lo has hecho mal.'], { speaker: G.rival });
      await say([`Abuela, ¡voy a ser el mejor entrenador de la región! ¡Nos vemos, ${G.name}!`], { speaker: G.rival });
      if (rv) { const ex = rv.x < 5 ? ['down'] : rv.x > 7 ? ['down'] : rv.x < 6 ? ['left', 'left', 'down'] : ['right', 'right', 'down']; await this.safeWalk(rv, ex.concat(['down', 'down', 'down', 'down', 'down'])); }
      Game.setFlag('rival1_left');
      World.refreshNpcs();
      Sound.music('town');
      await say(['¡Qué combate tan emocionante! Has visto lo distintos que son los combates aquí.', 'Toma: esto es el CÓDICE ÁNIMA. Registra automáticamente las ánimas que veas y captures.'], { speaker: 'Profesora Ceiba' });
      Game.setFlag('got_dex'); Sound.jingle('item');
      await say(`¡${G.name} recibió el Códice Ánima!`);
      Game.give('esfera', 5);
      await say(['Y estas cinco Esferas. En combate, MANTÉN la tecla E para apuntar y SUÉLTALA para lanzar.', 'Si aciertas mientras el ánima está aturdida, de espaldas o preparando un ataque, ¡será más fácil capturarla!', 'Tu ánima te seguirá allá donde vayas. ¡Habla con ella de vez en cuando!', 'Ah, y cada ánima gana PUNTOS DE TALENTO al subir de nivel. Asígnalos desde el menú de ánimas.', 'Ve al norte, pasando la Ruta 1, hasta Villa Musgo. ¡Allí está el primer gimnasio!'], { speaker: 'Profesora Ceiba' });
    },
    async nurse(def) {
      const r = await ask(['¡Hola! Bienvenido al Centro Ánima.', 'Aquí curamos a tus ánimas para que recuperen todas sus fuerzas. ¿Quieres que las cure?'], ['Sí', 'No'], { speaker: 'Enfermera' });
      if (r !== 0) { await say('¡Vuelve cuando quieras!', { speaker: 'Enfermera' }); return; }
      await say('Muy bien, dame tus ánimas un momento.', { speaker: 'Enfermera' });
      await Sound.jingle('heal');
      Game.healAll();
      G.lastHeal = { map: G.map, x: 6, y: 4 };
      await say(['Gracias por esperar. ¡Tus ánimas están en plena forma!', '¡Esperamos volver a verte!'], { speaker: 'Enfermera' });
    },
    async shop(def) { await openShop(def.shop); },
    async guide() {
      const tips = {
        gym1: ['¡Hola, aspirante! La líder Hiedra usa ánimas de PLANTA.', 'El Fuego, el Viento y los Bichos son eficaces contra ellas.', 'Sus Esporas aturden: cuando veas el círculo rojo en el suelo, ¡apártate!'],
        gym2: ['La líder Bruna usa ánimas de ROCA, muy resistentes.', 'El Agua y la Planta las rompen con facilidad.', 'Sus avalanchas caen donde estás: ¡no te quedes quieto!'],
        gym3: ['El Capitán Nerón domina el AGUA y la ELECTRICIDAD.', 'La Planta resiste ambos tipos. ¡La Roca también aguanta bien la electricidad!', 'Sus rayos son largos y rectos: ¡esquiva hacia los lados!'],
      };
      await say(tips[G.map] || ['¡Ánimo!'], { speaker: 'Guía' });
      const r = await ask('¿Quieres que cure a tus ánimas antes del combate?', ['Sí', 'No'], { speaker: 'Guía' });
      if (r === 0) { await Sound.jingle('heal'); Game.healAll(); await say('¡Listo! ¡A por la medalla!', { speaker: 'Guía' }); }
    },
    async leader1() { await Story.leader(0, 'Hiedra', [['semillin', 10], ['hongui', 11], ['hojardo', 13]], ['Bienvenido al Gimnasio Musgo. Soy Hiedra.', 'Mis ánimas crecen despacio, pero sus raíces son profundas.', '¡Veamos si tienes la paciencia de un verdadero entrenador!'], ['Has florecido ante mis ojos...', 'Te has ganado la MEDALLA RAÍZ.'], 'amuleto_planta', 'Mi trabajador moverá el árbol caído de la Ruta 2. ¡El camino al este está libre!'); },
    async leader2() { await Story.leader(1, 'Bruna', [['guijin', 17], ['escarabron', 18], ['pedrusco', 19]], ['¡Ja! ¡Otro aspirante! Soy Bruna, la roca inquebrantable de esta ciudad.', 'Mis ánimas son duras como el granito. ¿Tus ataques podrán siquiera rasguñarlas?', '¡Demuéstramelo!'], ['¡Increíble! ¡Me has hecho añicos!', 'Toma la MEDALLA PEÑA. Te la has ganado.'], 'amuleto_roca', 'Con mi medalla, el guardia de la salida este te dejará pasar a la Ruta 3.'); },
    async leader3() { await Story.leader(2, 'Nerón', [['aleton', 25], ['dinamo', 25], ['murcin', 25], ['tifonar', 26], ['marolo', 28]], ['¡Ahoy! Soy el Capitán Nerón.', 'Cuarenta años navegando me enseñaron que el mar no perdona... ¡y yo tampoco!', '¡Prepárate para la tormenta!'], ['¡Por todos los mares! ¡Me has hundido!', 'Llévate la MEDALLA OLEAJE, grumete.'], 'amuleto_agua', 'Ahora puedes acceder al muelle. Creo que alguien te espera allí.'); },
    async gift_berries() {
      if (Game.flag('gift_berries')) { await say('Las bayas crecen en los árboles de la región. ¡Y además curan!'); return; }
      Game.setFlag('gift_berries');
      await say(['¡Hola! Recogí demasiadas bayas esta mañana. ¡Toma unas cuantas!']);
      Game.give('baya', 5); Sound.jingle('item');
      await say(`¡${G.name} recibió 5 Bayas Vigor!`);
    },
    async sage() {
      await say(['Soy la Maestra de Talentos. Te contaré un secreto de las ánimas.', 'Cada dos niveles, un ánima gana un PUNTO DE TALENTO.', 'Puedes invertirlos en tres ramas: ÍMPETU para el combate cercano, TEMPLE para la distancia y VIGOR para resistir.', 'Los talentos de nivel superior se desbloquean al invertir en los anteriores.'], { speaker: 'Maestra' });
      if (!Game.flag('sage_gift')) {
        Game.setFlag('sage_gift');
        await say('Toma. Con esta Hierba Olvido, un ánima puede reiniciar sus talentos.', { speaker: 'Maestra' });
        Game.give('hierba_olvido', 1); Sound.jingle('item');
        await say(`¡${G.name} recibió una Hierba Olvido!`);
      }
    },
    async gift_candy() {
      if (Game.flag('gift_candy')) { await say('¡Los caramelos raros son deliciosos! Bueno, eso dicen las ánimas.'); return; }
      Game.setFlag('gift_candy');
      await say('¡He encontrado esto en la montaña! A mí no me sirve. ¡Para ti!');
      Game.give('caramelo', 1); Game.give('cinta_veloz', 1); Sound.jingle('item');
      await say(`¡${G.name} recibió un Caramelo Raro y una Cinta Veloz!`);
      await say('La Cinta Veloz es un amuleto. ¡Equípaselo a un ánima desde el menú de ánimas!');
    },
    async gift_ultra() {
      if (!Game.flag('gift_ultra')) {
        Game.setFlag('gift_ultra');
        await say(['¡Ahoy! Un viejo lobo de mar como yo ya no necesita esto.', '¡Úsalo bien, joven entrenador!']);
        Game.give('superesfera', 5); Game.give('baya_auto', 1); Sound.jingle('item');
        await say(`¡${G.name} recibió 5 Superesferas y una Baya Auto!`);
        return;
      }
      await say('La Baya Auto cura a tu ánima automáticamente cuando está en apuros. ¡Una vez por combate!');
    },
    async rival2(tr) {
      Sound.music('trainer');
      const p = World.player;
      const rv = World.spawnTemp('rival', p.x - 3, p.y, 'right');
      Sound.sfx('alert');
      await say(`¡${G.name}! ¡Espera!`, { speaker: G.rival });
      await this.safeWalk(rv, ['right', 'right']);
      p.dir = 'left';
      await say([`Así que tú también tienes la Medalla Peña.`, '¡Mis ánimas se han hecho mucho más fuertes desde el laboratorio!', '¡Te lo demostraré ahora mismo!'], { speaker: G.rival });
      const team = [['alondro', 16], ['voltin', 15], ['hongui', 15], [STAGE2[G.rivalStarter || 'burbujo'] || 'marolo', 18]];
      const res = await Battle.trainer({ title: G.rival, cls: 'Rival', name: G.rival, party: team, look: 'rival', skill: 0.62, npc: rv });
      if (res === 'win') {
        Game.setFlag('rival2_done');
        await say(['¡Grr! ¡Otra vez!', 'He oído que el Equipo Eclipse está en la Cueva Eco, al final de la Ruta 3.', '¡Si los ves, dales una lección de mi parte!'], { speaker: G.rival });
        await this.safeWalk(rv, ['left', 'left', 'left']);
      }
      World.removeTemp(rv);
      Sound.music(World.map.music);
    },
    async rival3() {
      Sound.music('trainer');
      const p = World.player;
      const rv = World.spawnTemp('rival', p.x + 4, p.y, 'left');
      await say(`¡${G.name}! Te estaba esperando.`, { speaker: G.rival });
      await this.safeWalk(rv, ['left', 'left', 'left']);
      p.dir = 'right';
      await say(['Tres medallas... Igual que yo.', 'Mi ánima evolucionó de una forma que nunca había visto. ¡Cada combate nos cambia!', 'Este es nuestro combate definitivo. ¡Sin excusas!'], { speaker: G.rival });
      const rk = G.rivalStarter || 'burbujo';
      const team = [['alondro', 25], ['dinamo', 24], ['pedrusco', 24], ['setalon', 24], [STAGE3[rk] || STAGE2[rk], 27]];
      const res = await Battle.trainer({ title: G.rival, cls: 'Rival', name: G.rival, party: team, look: 'rival', skill: 0.75, boss: true, music: 'boss', npc: rv });
      if (res !== 'win') { World.removeTemp(rv); return; }
      Game.setFlag('rival3_done');
      await say(['...He perdido.', `Eres increíble, ${G.name}. De verdad.`, 'Me voy al norte, a buscar las siguientes medallas. La próxima vez, ¡ganaré yo!'], { speaker: G.rival });
      await this.safeWalk(rv, ['right', 'right', 'right']);
      World.removeTemp(rv);
      await Story.ending();
    },
    async legend(def, npc) {
      const key = def.creature;
      const sp = SPECIES[key];
      Sound.sfx('shadow');
      Shake.start(2, 0.6);
      await say([`¡${sp.name.toUpperCase()}!`, `El aire tiembla. El legendario ${sp.name} te observa...`]);
      const c = newCreature(key, def.lv || 35);
      const res = await Battle.wild(c, npc ? { foePos: [npc.x * 16 + 8, npc.y * 16 + 12], hideNpc: npc } : {});
      if (res === 'caught') { Game.setFlag('leg_' + key); }
      else if (res === 'win') await say(`${sp.name} se ha desvanecido... Quizá vuelva a aparecer más tarde.`);
      else if (res === 'run') await say(`${sp.name} sigue ahí, esperando...`);
      if (['silvaneo', 'auroros', 'marealis'].every((k) => Game.flag('leg_' + k)) && !Game.flag('trio_done')) {
        Game.setFlag('trio_done');
        await say(['Sientes una luz cálida en el horizonte...', 'Algo ha despertado en Pueblo Alba, donde amanecen las aventuras.']);
      }
      World.refreshNpcs();
    },
  },

  async leader(i, name, team, intro, outro, gift, after) {
    const f = 'badge' + (i + 1);
    const spk = 'Líder ' + name;
    if (Game.flag(f)) { await say(after, { speaker: spk }); return; }
    Sound.music('boss');
    await say(intro, { speaker: spk });
    const ar = MAPS[G.map].arena;
    if (ar) {
      await say('¡Colócate en tu lado de la arena!', { speaker: spk });
      await World.walkTo(World.player, ar.x + Math.floor(ar.w / 2), ar.y + ar.h - 1);
      World.player.dir = 'up';
    }
    const res = await Battle.trainer({ title: spk, cls: 'Líder', name, party: team, look: ['hiedra', 'bruna', 'neron'][i], skill: [0.55, 0.6, 0.8][i], boss: true, music: 'boss', gym: true, heals: i < 2 ? 1 : 2 });
    if (res !== 'win') return;
    Game.setFlag(f); G.badges[i] = true;
    await say(outro, { speaker: spk });
    await Sound.jingle('badge');
    await say(`¡${G.name} recibió la ${BADGES[i].name}!`);
    Game.give(gift, 1);
    await say([`Llévate también este ${ITEMS[gift].name}. Equípalo a un ánima para potenciar sus ataques.`, after], { speaker: spk });
    World.refreshNpcs();
  },

  async ending() {
    Game.setFlag('chapter1_done');
    await say(['Una brisa salada recorre el muelle...', 'Has derrotado a tres líderes, frustrado los planes del Equipo Eclipse y superado a tu rival.']);
    await Fade.out(1);
    Sound.music('ending');
    await runScene(new CreditsScene());
    World.refreshNpcs();
    Sound.music(World.map.music);
    await Fade.in(0.8);
    await say(['¡FIN DEL CAPÍTULO 1!', 'Puedes seguir explorando, completar el Códice y buscar a los guardianes legendarios.', 'Habla con la Profesora Ceiba en Pueblo Alba para saber más. ¡No olvides guardar!']);
  },

  // camina sin quedarse bloqueado si algo obstruye el camino
  async safeWalk(e, dirs) {
    for (const d of dirs) {
      const [dx, dy] = DIRS[d];
      if (World.blocked(e.x + dx, e.y + dy, e) && !(World.follower.x === e.x + dx && World.follower.y === e.y + dy)) { e.dir = d; return false; }
      await World.walk(e, [d]);
    }
    return true;
  },
};

// ventana para ver la ánima inicial antes de elegir
class StarterPeek {
  constructor(key) { this.key = key; this.t = 0; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    UI.box(ctx, 90, 24, 140, 130);
    const sp = SPECIES[this.key];
    P(ctx, 100, 32, 120, 90, '#e8f0f8');
    drawShadow(ctx, 160, 112, 22, 4, 0.2);
    CreatureAnim.portrait(ctx, this.key, 80, false, 120, 36, 'peek');
    Font.drawCenter(ctx, sp.name, 160, 126, '#2a2236');
    sp.types.forEach((t) => UI.typeBadge(ctx, t, 145, 138));
  }
}
