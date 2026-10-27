'use strict';
// ============================================================
//  Datos del juego: tipos, ataques, criaturas (ánimas), objetos
//  Todo el contenido es original.
// ============================================================

const TYPES = {
  normal: { name: 'Normal', short: 'NOR', color: '#9c9484' },
  fuego: { name: 'Fuego', short: 'FUE', color: '#ee6a2c' },
  agua: { name: 'Agua', short: 'AGU', color: '#4486e4' },
  planta: { name: 'Planta', short: 'PLA', color: '#4eae44' },
  electrico: { name: 'Eléctrico', short: 'ELE', color: '#e0ac10' },
  roca: { name: 'Roca', short: 'ROC', color: '#a4844c' },
  viento: { name: 'Viento', short: 'VIE', color: '#62a8d0' },
  bicho: { name: 'Bicho', short: 'BIC', color: '#8eae20' },
  sombra: { name: 'Sombra', short: 'SOM', color: '#6a4ea4' },
  mente: { name: 'Mente', short: 'MEN', color: '#e2508a' },
};

// atacante -> defensor -> multiplicador (por defecto 1)
const CHART = {
  normal: { roca: 0.5 },
  fuego: { planta: 2, bicho: 2, sombra: 2, agua: 0.5, roca: 0.5, fuego: 0.5 },
  agua: { fuego: 2, roca: 2, planta: 0.5, agua: 0.5 },
  planta: { agua: 2, roca: 2, fuego: 0.5, planta: 0.5, bicho: 0.5, viento: 0.5 },
  electrico: { agua: 2, viento: 2, planta: 0.5, electrico: 0.5, roca: 0.5 },
  roca: { fuego: 2, viento: 2, bicho: 2, electrico: 2, roca: 0.5 },
  viento: { planta: 2, bicho: 2, roca: 0.5, electrico: 0.5 },
  bicho: { planta: 2, mente: 2, fuego: 0.5, viento: 0.5, sombra: 0.5 },
  sombra: { mente: 2, sombra: 2, normal: 0.5 },
  mente: { normal: 2, electrico: 2, mente: 0.5, sombra: 0.5 },
};
function typeMult(atkType, defTypes) {
  let m = 1;
  for (const t of defTypes) m *= (CHART[atkType] && CHART[atkType][t]) || 1;
  return m;
}

// ---------- ataques en tiempo real ----------
// kind: melee | dash | proj | beam | area | ring | buff | heal | blink | stealth
// cat: fis (Ataque/Defensa) | esp (Especial/Especial)
const MOVES = {
  // Normal
  embestida: { name: 'Embestida', type: 'normal', kind: 'dash', cat: 'fis', pow: 35, cd: 1.0, range: 44, desc: 'Carga corta contra el rival.' },
  zarpazo: { name: 'Zarpazo', type: 'normal', kind: 'melee', cat: 'fis', pow: 40, cd: 0.7, range: 24, desc: 'Arañazo rápido en arco.' },
  rugido: { name: 'Rugido', type: 'normal', kind: 'buff', cat: 'esp', pow: 0, cd: 8, debuff: 'atk', radius: 90, desc: 'Baja el Ataque de rivales cercanos.' },
  acometida: { name: 'Acometida', type: 'normal', kind: 'dash', cat: 'fis', pow: 45, cd: 1.6, range: 90, speed: 1.4, desc: 'Embiste a gran velocidad.' },
  carga_brutal: { name: 'Carga Brutal', type: 'normal', kind: 'melee', cat: 'fis', pow: 85, cd: 3.2, range: 28, windup: 0.35, status: 'stun', chance: 0.25, desc: 'Golpe demoledor que puede aturdir.' },
  grito: { name: 'Grito Sónico', type: 'normal', kind: 'ring', cat: 'esp', pow: 55, cd: 4, radius: 52, desc: 'Onda sonora a tu alrededor.' },
  rayo_total: { name: 'Rayo Total', type: 'normal', kind: 'beam', cat: 'esp', pow: 110, cd: 8, len: 230, width: 12, windup: 0.6, desc: 'Rayo devastador tras cargar.' },
  refuerzo: { name: 'Refuerzo', type: 'normal', kind: 'buff', cat: 'esp', pow: 0, cd: 10, buff: { atk: 1 }, desc: 'Sube tu Ataque.' },
  // Fuego
  ascua: { name: 'Ascua', type: 'fuego', kind: 'proj', cat: 'esp', pow: 40, cd: 0.8, speed: 170, size: 4, status: 'burn', chance: 0.1, desc: 'Lanza una brasa. Puede quemar.' },
  colmillo_igneo: { name: 'Colmillo Ígneo', type: 'fuego', kind: 'melee', cat: 'fis', pow: 60, cd: 1.4, range: 24, status: 'burn', chance: 0.15, desc: 'Mordisco en llamas.' },
  brasas: { name: 'Lluvia de Brasas', type: 'fuego', kind: 'proj', cat: 'esp', pow: 30, cd: 2.2, speed: 160, size: 3, n: 3, spread: 0.35, status: 'burn', chance: 0.1, desc: 'Tres brasas en abanico.' },
  llamarada: { name: 'Llamarada', type: 'fuego', kind: 'proj', cat: 'esp', pow: 90, cd: 4.5, speed: 140, size: 8, windup: 0.25, status: 'burn', chance: 0.25, desc: 'Gran bola de fuego.' },
  anillo_igneo: { name: 'Anillo Ígneo', type: 'fuego', kind: 'ring', cat: 'esp', pow: 70, cd: 5, radius: 58, status: 'burn', chance: 0.2, desc: 'Anillo de fuego a tu alrededor.' },
  lanzallamas: { name: 'Lanzallamas', type: 'fuego', kind: 'beam', cat: 'esp', pow: 80, cd: 4, len: 120, width: 10, windup: 0.2, status: 'burn', chance: 0.15, desc: 'Chorro de llamas frontal.' },
  // Agua
  burbuja: { name: 'Burbuja', type: 'agua', kind: 'proj', cat: 'esp', pow: 40, cd: 0.8, speed: 150, size: 4, status: 'slow', chance: 0.15, desc: 'Burbuja que puede ralentizar.' },
  cola_marea: { name: 'Cola Marea', type: 'agua', kind: 'melee', cat: 'fis', pow: 60, cd: 1.4, range: 26, desc: 'Coletazo de agua.' },
  chorro: { name: 'Chorro', type: 'agua', kind: 'beam', cat: 'esp', pow: 55, cd: 2.2, len: 100, width: 8, windup: 0.1, desc: 'Chorro de agua a presión.' },
  hidrobomba: { name: 'Hidrobomba', type: 'agua', kind: 'proj', cat: 'esp', pow: 95, cd: 5, speed: 150, size: 9, windup: 0.3, desc: 'Enorme masa de agua.' },
  remolino: { name: 'Remolino', type: 'agua', kind: 'area', cat: 'esp', pow: 60, cd: 4, radius: 30, delay: 0.6, status: 'slow', chance: 0.6, desc: 'Remolino bajo el rival.' },
  rocio: { name: 'Rocío Sanador', type: 'agua', kind: 'heal', cat: 'esp', pow: 0, cd: 12, heal: 0.25, desc: 'Recupera el 25% de PS.' },
  ola: { name: 'Gran Ola', type: 'agua', kind: 'ring', cat: 'esp', pow: 80, cd: 6, radius: 66, desc: 'Ola que barre alrededor.' },
  // Planta
  hoja_filo: { name: 'Hoja Filo', type: 'planta', kind: 'proj', cat: 'fis', pow: 45, cd: 1.0, speed: 210, size: 4, crit: 0.25, desc: 'Hoja cortante. Crítico frecuente.' },
  latigo: { name: 'Látigo Cepa', type: 'planta', kind: 'melee', cat: 'fis', pow: 45, cd: 0.9, range: 36, desc: 'Látigo de largo alcance.' },
  esporas: { name: 'Esporas', type: 'planta', kind: 'area', cat: 'esp', pow: 15, cd: 7, radius: 34, delay: 0.5, status: 'stun', chance: 0.7, desc: 'Nube que adormece al rival.' },
  drenaje: { name: 'Drenaje', type: 'planta', kind: 'proj', cat: 'esp', pow: 50, cd: 2, speed: 150, size: 5, drain: 0.5, desc: 'Absorbe vida del rival.' },
  tormenta_petalo: { name: 'Tormenta Pétalo', type: 'planta', kind: 'ring', cat: 'esp', pow: 85, cd: 6, radius: 58, desc: 'Remolino de pétalos.' },
  rayo_solar: { name: 'Rayo Solar', type: 'planta', kind: 'beam', cat: 'esp', pow: 120, cd: 8, len: 230, width: 14, windup: 1.0, desc: 'Carga luz y la dispara.' },
  espino: { name: 'Espino', type: 'planta', kind: 'proj', cat: 'fis', pow: 30, cd: 2, speed: 190, size: 3, n: 3, spread: 0.25, desc: 'Tres espinas en abanico.' },
  // Eléctrico
  chispa: { name: 'Chispa', type: 'electrico', kind: 'proj', cat: 'esp', pow: 40, cd: 0.8, speed: 220, size: 4, status: 'para', chance: 0.1, desc: 'Chispa veloz. Puede paralizar.' },
  puno_voltio: { name: 'Puño Voltio', type: 'electrico', kind: 'melee', cat: 'fis', pow: 65, cd: 1.4, range: 24, status: 'para', chance: 0.2, desc: 'Puñetazo eléctrico.' },
  onda_estatica: { name: 'Onda Estática', type: 'electrico', kind: 'ring', cat: 'esp', pow: 30, cd: 6, radius: 62, status: 'para', chance: 0.6, desc: 'Descarga que paraliza.' },
  rayo: { name: 'Rayo', type: 'electrico', kind: 'beam', cat: 'esp', pow: 85, cd: 3.5, len: 170, width: 8, windup: 0.25, status: 'para', chance: 0.1, desc: 'Potente rayo eléctrico.' },
  trueno: { name: 'Trueno', type: 'electrico', kind: 'area', cat: 'esp', pow: 105, cd: 6, radius: 28, delay: 0.8, status: 'para', chance: 0.3, desc: 'Cae un rayo sobre el rival.' },
  relampago: { name: 'Relámpago', type: 'electrico', kind: 'dash', cat: 'fis', pow: 60, cd: 2, range: 95, speed: 1.6, status: 'para', chance: 0.1, desc: 'Embestida eléctrica veloz.' },
  // Roca
  lanzarrocas: { name: 'Lanzarrocas', type: 'roca', kind: 'proj', cat: 'fis', pow: 50, cd: 1.3, speed: 150, size: 5, desc: 'Arroja una roca.' },
  golpe_roca: { name: 'Golpe Roca', type: 'roca', kind: 'melee', cat: 'fis', pow: 60, cd: 1.3, range: 24, desc: 'Golpe con puño de piedra.' },
  avalancha: { name: 'Avalancha', type: 'roca', kind: 'area', cat: 'fis', pow: 75, cd: 4, radius: 30, delay: 0.6, status: 'stun', chance: 0.2, desc: 'Rocas caen sobre el rival.' },
  coraza: { name: 'Coraza', type: 'roca', kind: 'buff', cat: 'esp', pow: 0, cd: 10, buff: { def: 2 }, desc: 'Sube mucho tu Defensa.' },
  terremoto: { name: 'Terremoto', type: 'roca', kind: 'ring', cat: 'fis', pow: 95, cd: 7, radius: 74, windup: 0.3, desc: 'Sacude el suelo alrededor.' },
  pedrisco: { name: 'Pedrisco', type: 'roca', kind: 'proj', cat: 'fis', pow: 30, cd: 2, speed: 160, size: 4, n: 3, spread: 0.3, desc: 'Tres piedras en abanico.' },
  // Viento
  picotazo: { name: 'Picotazo', type: 'viento', kind: 'melee', cat: 'fis', pow: 35, cd: 0.6, range: 22, desc: 'Picotazo rápido.' },
  rafaga: { name: 'Ráfaga', type: 'viento', kind: 'proj', cat: 'esp', pow: 45, cd: 1.0, speed: 190, size: 6, knock: 1, desc: 'Ráfaga que empuja.' },
  ala_corte: { name: 'Ala Corte', type: 'viento', kind: 'dash', cat: 'fis', pow: 60, cd: 1.8, range: 95, speed: 1.4, desc: 'Vuelo rasante cortante.' },
  tornado: { name: 'Tornado', type: 'viento', kind: 'area', cat: 'esp', pow: 70, cd: 4.5, radius: 32, delay: 0.4, desc: 'Tornado sobre el rival.' },
  vendaval: { name: 'Vendaval', type: 'viento', kind: 'beam', cat: 'esp', pow: 90, cd: 4.5, len: 170, width: 14, windup: 0.3, knock: 1, desc: 'Viento huracanado.' },
  viento_afin: { name: 'Viento Afín', type: 'viento', kind: 'buff', cat: 'esp', pow: 0, cd: 10, buff: { vel: 2 }, desc: 'Sube mucho tu Velocidad.' },
  // Bicho
  picadura: { name: 'Picadura', type: 'bicho', kind: 'melee', cat: 'fis', pow: 30, cd: 0.6, range: 22, status: 'poison', chance: 0.2, desc: 'Picadura venenosa.' },
  hilo: { name: 'Hilo Seda', type: 'bicho', kind: 'proj', cat: 'esp', pow: 15, cd: 1.5, speed: 150, size: 4, status: 'slow', chance: 0.8, desc: 'Hilo que ralentiza mucho.' },
  zumbido: { name: 'Zumbido', type: 'bicho', kind: 'ring', cat: 'esp', pow: 60, cd: 4, radius: 54, desc: 'Vibración de alas.' },
  tijera: { name: 'Tijera X', type: 'bicho', kind: 'melee', cat: 'fis', pow: 80, cd: 2, range: 26, desc: 'Corte en cruz.' },
  polvo_toxico: { name: 'Polvo Tóxico', type: 'bicho', kind: 'area', cat: 'esp', pow: 20, cd: 6, radius: 36, delay: 0.4, status: 'poison', chance: 0.9, desc: 'Nube que envenena.' },
  aguijon: { name: 'Aguijón', type: 'bicho', kind: 'proj', cat: 'fis', pow: 35, cd: 1.6, speed: 200, size: 3, n: 2, spread: 0.15, status: 'poison', chance: 0.2, desc: 'Dos aguijones venenosos.' },
  // Sombra
  lenguetazo: { name: 'Lengüetazo', type: 'sombra', kind: 'melee', cat: 'fis', pow: 30, cd: 0.8, range: 22, status: 'para', chance: 0.25, desc: 'Lametazo escalofriante.' },
  bola_sombra: { name: 'Bola Sombra', type: 'sombra', kind: 'proj', cat: 'esp', pow: 80, cd: 3, speed: 150, size: 7, desc: 'Esfera de oscuridad.' },
  sombra_furtiva: { name: 'Sombra Furtiva', type: 'sombra', kind: 'stealth', cat: 'fis', pow: 55, cd: 3, range: 26, desc: 'Aparece tras el rival y golpea.' },
  pesadilla: { name: 'Pesadilla', type: 'sombra', kind: 'area', cat: 'esp', pow: 40, cd: 5, radius: 34, delay: 0.5, status: 'poison', chance: 0.8, desc: 'Sombras que consumen al rival.' },
  velo: { name: 'Velo Oscuro', type: 'sombra', kind: 'buff', cat: 'esp', pow: 0, cd: 10, invuln: 1.2, desc: 'Te vuelves intangible un momento.' },
  garra_umbria: { name: 'Garra Umbría', type: 'sombra', kind: 'melee', cat: 'fis', pow: 70, cd: 1.5, range: 26, desc: 'Zarpazo de sombra.' },
  // Mente
  confusion: { name: 'Confusión', type: 'mente', kind: 'proj', cat: 'esp', pow: 50, cd: 1.0, speed: 160, size: 5, status: 'confuse', chance: 0.15, desc: 'Onda mental. Puede confundir.' },
  psicorrayo: { name: 'Psicorrayo', type: 'mente', kind: 'beam', cat: 'esp', pow: 65, cd: 2.6, len: 140, width: 8, windup: 0.15, status: 'confuse', chance: 0.1, desc: 'Rayo psíquico.' },
  barrera: { name: 'Barrera', type: 'mente', kind: 'buff', cat: 'esp', pow: 0, cd: 10, buff: { def: 1, esp: 1 }, desc: 'Sube Defensa y Especial.' },
  onda_mental: { name: 'Onda Mental', type: 'mente', kind: 'ring', cat: 'esp', pow: 80, cd: 5, radius: 60, desc: 'Pulso psíquico alrededor.' },
  teletransporte: { name: 'Teletransporte', type: 'mente', kind: 'blink', cat: 'esp', pow: 0, cd: 3, range: 80, desc: 'Te teletransportas hacia delante.' },
  psiquico: { name: 'Psíquico', type: 'mente', kind: 'area', cat: 'esp', pow: 95, cd: 5, radius: 30, delay: 0.6, desc: 'Fuerza mental sobre el rival.' },
  // movimientos exclusivos de los guardianes
  bosque_ancestral: { name: 'Bosque Ancestral', type: 'planta', kind: 'ring', cat: 'esp', pow: 120, cd: 7, radius: 82, windup: 0.4, status: 'slow', chance: 0.4, desc: 'El bosque entero golpea a su alrededor.' },
  alba_solar: { name: 'Alba Solar', type: 'fuego', kind: 'beam', cat: 'esp', pow: 130, cd: 7, len: 240, width: 16, windup: 0.6, status: 'burn', chance: 0.3, desc: 'La luz del primer amanecer, concentrada.' },
  maremoto: { name: 'Maremoto', type: 'agua', kind: 'area', cat: 'esp', pow: 125, cd: 6, radius: 44, delay: 0.7, status: 'slow', chance: 0.5, desc: 'Una ola gigante cae sobre el rival.' },
  destello_alba: { name: 'Destello Alba', type: 'mente', kind: 'ring', cat: 'esp', pow: 140, cd: 8, radius: 92, windup: 0.5, status: 'confuse', chance: 0.3, desc: 'Un estallido de luz que lo envuelve todo.' },
  meditar: { name: 'Meditar', type: 'mente', kind: 'heal', cat: 'esp', pow: 0, cd: 14, heal: 0.3, desc: 'Recupera el 30% de PS.' },
};

const KIND_LABEL = { melee: 'Cuerpo', dash: 'Carga', proj: 'Proyectil', beam: 'Rayo', area: 'Zona', ring: 'Onda', buff: 'Apoyo', heal: 'Cura', blink: 'Teleport', stealth: 'Sigilo' };

// ---------- criaturas ----------
const L = (arr) => arr.map(([lv, m]) => ({ lv, m }));
const LS = {
  ignito: L([[1, 'zarpazo'], [1, 'rugido'], [5, 'ascua'], [9, 'embestida'], [13, 'colmillo_igneo'], [16, 'garra_umbria'], [19, 'brasas'], [22, 'acometida'], [27, 'lanzallamas'], [33, 'llamarada']]),
  burbujo: L([[1, 'embestida'], [1, 'burbuja'], [6, 'cola_marea'], [9, 'rafaga'], [13, 'chorro'], [17, 'remolino'], [22, 'rocio'], [27, 'hidrobomba'], [33, 'ola']]),
  semillin: L([[1, 'latigo'], [1, 'rugido'], [5, 'hoja_filo'], [9, 'drenaje'], [13, 'esporas'], [17, 'espino'], [22, 'tormenta_petalo'], [30, 'rayo_solar']]),
  rabin: L([[1, 'embestida'], [3, 'zarpazo'], [6, 'rugido'], [10, 'acometida'], [15, 'refuerzo'], [21, 'carga_brutal'], [30, 'rayo_total']]),
  pipio: L([[1, 'picotazo'], [4, 'rugido'], [7, 'rafaga'], [12, 'acometida'], [16, 'ala_corte'], [22, 'viento_afin'], [28, 'tornado'], [34, 'vendaval']]),
  larvita: L([[1, 'picadura'], [1, 'hilo'], [5, 'aguijon']]),
  voltin: L([[1, 'embestida'], [1, 'chispa'], [6, 'rugido'], [10, 'onda_estatica'], [14, 'puno_voltio'], [19, 'relampago'], [25, 'rayo'], [32, 'trueno']]),
  guijin: L([[1, 'embestida'], [1, 'coraza'], [5, 'lanzarrocas'], [9, 'golpe_roca'], [14, 'pedrisco'], [19, 'avalancha'], [25, 'carga_brutal'], [32, 'terremoto']]),
  umbrin: L([[1, 'lenguetazo'], [1, 'rugido'], [8, 'sombra_furtiva'], [12, 'pesadilla'], [18, 'garra_umbria'], [23, 'bola_sombra'], [28, 'velo']]),
  escamin: L([[1, 'embestida'], [1, 'burbuja'], [6, 'cola_marea'], [11, 'acometida'], [16, 'chorro'], [22, 'remolino'], [28, 'hidrobomba']]),
};
const plus = (base, extra) => base.concat(L(extra)).sort((a, b) => a.lv - b.lv);
const LS2 = {
  psiqui: L([[1, 'confusion'], [1, 'rugido'], [6, 'teletransporte'], [10, 'psicorrayo'], [15, 'barrera'], [20, 'onda_mental'], [27, 'psiquico'], [33, 'meditar']]),
  hongui: L([[1, 'latigo'], [1, 'esporas'], [5, 'drenaje'], [9, 'hoja_filo'], [14, 'polvo_toxico'], [19, 'espino'], [25, 'tormenta_petalo'], [31, 'rayo_solar']]),
  brisin: L([[1, 'rafaga'], [1, 'rugido'], [6, 'grito'], [11, 'tornado'], [17, 'viento_afin'], [23, 'vendaval'], [30, 'rayo_total']]),
  murcin: L([[1, 'lenguetazo'], [1, 'picotazo'], [6, 'rafaga'], [11, 'sombra_furtiva'], [16, 'ala_corte'], [22, 'bola_sombra'], [28, 'vendaval']]),
};

const SPECIES_LIST = [
  // --- línea de fuego (inicial) ---
  { key: 'ignito', name: 'Ignito', types: ['fuego'], base: [39, 52, 43, 60, 65], catch: 45, exp: 62, learn: LS.ignito,
    evo: { lv: 13, to: 'fogarzo' }, desc: 'Un zorrito cuya cola arde con más fuerza cuando está contento. Su llama nunca se apaga mientras viva.',
    look: { body: 'quad', c1: '#f07a40', c2: '#fff0d4', c3: '#c84828', ears: 'pointy', tail: 'flame', eyes: 'cute', size: 0.72, pattern: 'belly' } },
  { key: 'fogarzo', name: 'Fogarzo', types: ['fuego'], base: [58, 64, 58, 80, 80], catch: 45, exp: 142, learn: LS.ignito,
    evo: { lv: 26, branch: { crit: 'style', a: 'magmaurio', b: 'solarix' } }, desc: 'Su lomo arde como una hoguera. Se dice que su forma adulta depende de cómo aprenda a luchar.',
    look: { body: 'quad', c1: '#e86634', c2: '#ffe4c0', c3: '#b83c20', ears: 'pointy', tail: 'flame', backExtra: 'flames', eyes: 'fierce', size: 0.88, pattern: 'belly' } },
  { key: 'magmaurio', name: 'Magmaurio', types: ['fuego', 'roca'], base: [85, 105, 95, 70, 70], catch: 45, exp: 236,
    learn: plus(LS.ignito, [[26, 'golpe_roca'], [30, 'avalancha'], [36, 'terremoto'], [42, 'carga_brutal']]),
    desc: 'Forjado en el combate cuerpo a cuerpo. Su piel se endurece como roca volcánica y embiste sin miedo.',
    look: { body: 'quad', c1: '#c4502c', c2: '#f8c070', c3: '#6a5a52', tail: 'flame', backExtra: 'crystals', head: 'bighorn', eyes: 'fierce', size: 1, pattern: 'belly' } },
  { key: 'solarix', name: 'Solarix', types: ['fuego', 'viento'], base: [75, 80, 70, 105, 100], catch: 45, exp: 236,
    learn: plus(LS.ignito, [[26, 'rafaga'], [30, 'ala_corte'], [36, 'vendaval'], [42, 'anillo_igneo']]),
    desc: 'Aprendió a luchar desde lejos, esquivando con gracia. Sus alas de fuego le permiten planear sobre el viento cálido.',
    look: { body: 'quad', c1: '#f29a3c', c2: '#fff4d0', c3: '#ffd060', ears: 'pointy', tail: 'flame', head: 'flame', wings: 'bigbird', eyes: 'cute', size: 1, pattern: 'belly' } },
  // --- línea de agua (inicial) ---
  { key: 'burbujo', name: 'Burbujo', types: ['agua'], base: [44, 48, 60, 58, 48], catch: 45, exp: 63, learn: LS.burbujo,
    evo: { lv: 13, to: 'marolo' }, desc: 'Respira por las branquias rosadas de su cabeza. Le encanta soplar burbujas para jugar.',
    look: { body: 'round', c1: '#72b4f0', c2: '#e4f6ff', c3: '#f088b0', ears: 'fin', tail: 'fin', eyes: 'cute', size: 0.7, pattern: 'belly' } },
  { key: 'marolo', name: 'Marolo', types: ['agua'], base: [64, 62, 75, 72, 62], catch: 45, exp: 142, learn: LS.burbujo,
    evo: { lv: 26, branch: { crit: 'style', a: 'abismar', b: 'coralis' } }, desc: 'Nada a gran velocidad. Su carácter cambia según el estilo de combate de su entrenador.',
    look: { body: 'biped', c1: '#5a9ce6', c2: '#e0f2ff', c3: '#f07aa8', ears: 'fin', tail: 'fin', head: 'crest', eyes: 'cute', size: 0.86, pattern: 'belly' } },
  { key: 'abismar', name: 'Abismar', types: ['agua', 'sombra'], base: [85, 100, 80, 90, 75], catch: 45, exp: 238,
    learn: plus(LS.burbujo, [[26, 'garra_umbria'], [30, 'bola_sombra'], [36, 'pesadilla']]),
    desc: 'Habita las fosas oscuras del mar. Ataca de cerca, emergiendo de las sombras del agua.',
    look: { body: 'serpent', c1: '#3a4a92', c2: '#a0b8f0', c3: '#7a58c4', ears: 'fin', head: 'crest', eyes: 'glow', eyeColor: '#80f0ff', size: 1, pattern: 'belly' } },
  { key: 'coralis', name: 'Coralis', types: ['agua', 'mente'], base: [80, 65, 85, 115, 80], catch: 45, exp: 238,
    learn: plus(LS.burbujo, [[26, 'confusion'], [30, 'psicorrayo'], [36, 'psiquico'], [40, 'meditar']]),
    desc: 'Su corona de coral amplifica ondas mentales. Prefiere mantener la distancia y leer los movimientos del rival.',
    look: { body: 'biped', c1: '#66bce6', c2: '#fff0f8', c3: '#f070a0', ears: 'fin', tail: 'fin', head: 'crown', eyes: 'cute', size: 1, pattern: 'belly' } },
  // --- línea de planta (inicial) ---
  { key: 'semillin', name: 'Semillín', types: ['planta'], base: [45, 49, 52, 60, 45], catch: 45, exp: 64, learn: LS.semillin,
    evo: { lv: 13, to: 'hojardo' }, desc: 'Toma el sol durante horas. El brote de su cabeza crece un poco cada vez que gana un combate.',
    look: { body: 'biped', c1: '#78c860', c2: '#f0f8d0', c3: '#3a9a48', head: 'sprout', eyes: 'cute', size: 0.7, pattern: 'belly' } },
  { key: 'hojardo', name: 'Hojardo', types: ['planta'], base: [62, 66, 70, 78, 58], catch: 45, exp: 141, learn: LS.semillin,
    evo: { lv: 26, branch: { crit: 'style', a: 'robledor', b: 'floraxia' } }, desc: 'Las hojas de su espalda captan la luz. Se adapta a su entorno y a su forma de luchar.',
    look: { body: 'biped', c1: '#5ab050', c2: '#eaf6c8', c3: '#2e8a40', head: 'leaf', ears: 'leafy', backExtra: 'leaves', eyes: 'cute', size: 0.86, pattern: 'belly' } },
  { key: 'robledor', name: 'Robledor', types: ['planta', 'roca'], base: [95, 100, 110, 70, 50], catch: 45, exp: 236,
    learn: plus(LS.semillin, [[26, 'golpe_roca'], [30, 'coraza'], [36, 'terremoto']]),
    desc: 'Un coloso de corteza y piedra. Se planta firme en el suelo y golpea con la fuerza de un roble centenario.',
    look: { body: 'golem', c1: '#6a9a48', c2: '#c8a878', c3: '#3e7a32', head: 'sprout', backExtra: 'leaves', eyes: 'fierce', size: 1, pattern: 'belly' } },
  { key: 'floraxia', name: 'Floraxia', types: ['planta', 'mente'], base: [75, 60, 75, 115, 95], catch: 45, exp: 236,
    learn: plus(LS.semillin, [[26, 'confusion'], [30, 'onda_mental'], [36, 'psiquico']]),
    desc: 'Sus pétalos emiten un aroma que calma la mente. Lucha a distancia con poderes psíquicos.',
    look: { body: 'biped', c1: '#66c06e', c2: '#fff0f8', c3: '#f472b4', head: 'crown', ears: 'leafy', eyes: 'cute', size: 1, pattern: 'belly' } },
  // --- Rabín ---
  { key: 'rabin', name: 'Rabín', types: ['normal'], base: [35, 50, 35, 30, 66], catch: 255, exp: 50, learn: LS.rabin,
    evo: { lv: 9, to: 'conejal' }, desc: 'Muy común en praderas. Sus largas orejas detectan el peligro a gran distancia.',
    look: { body: 'quad', c1: '#c8a078', c2: '#f8ecd8', c3: '#a07850', ears: 'long', tail: 'fluffy', eyes: 'cute', size: 0.62, pattern: 'belly' } },
  { key: 'conejal', name: 'Conejal', types: ['normal'], base: [60, 75, 55, 45, 90], catch: 120, exp: 120, learn: LS.rabin,
    evo: { lv: 20, branch: { crit: 'time', a: 'liebron', b: 'nocturo' } }, desc: 'Corre a una velocidad asombrosa. Su forma final depende de la hora en que evolucione.',
    look: { body: 'quad', c1: '#b88a60', c2: '#f8e8d0', c3: '#906840', ears: 'long', tail: 'fluffy', eyes: 'cute', size: 0.82, pattern: 'belly' } },
  { key: 'liebron', name: 'Liebrón', types: ['normal', 'viento'], base: [80, 90, 65, 60, 120], catch: 60, exp: 200,
    learn: plus(LS.rabin, [[20, 'rafaga'], [25, 'ala_corte'], [33, 'vendaval']]),
    desc: 'Evoluciona bajo el sol. Salta tan alto que parece cabalgar sobre las nubes.',
    look: { body: 'quad', c1: '#e0c08e', c2: '#fffaf0', c3: '#c09868', ears: 'long', tail: 'fluffy', backExtra: 'cloud', eyes: 'cute', size: 1, pattern: 'stripes' } },
  { key: 'nocturo', name: 'Nocturo', types: ['normal', 'sombra'], base: [80, 100, 70, 75, 95], catch: 60, exp: 200,
    learn: plus(LS.rabin, [[20, 'lenguetazo'], [25, 'garra_umbria'], [33, 'bola_sombra']]),
    desc: 'Evoluciona bajo la luna. Caza en silencio y sus ojos brillan en la oscuridad.',
    look: { body: 'quad', c1: '#585070', c2: '#c8c0e0', c3: '#2e2840', ears: 'long', tail: 'fluffy', eyes: 'glow', eyeColor: '#f0d050', size: 1, pattern: 'mask' } },
  // --- Pipío ---
  { key: 'pipio', name: 'Pipío', types: ['normal', 'viento'], base: [40, 45, 40, 35, 56], catch: 255, exp: 50, learn: LS.pipio,
    evo: { lv: 10, to: 'alondro' }, desc: 'Canta al amanecer. Su trino es tan agudo que despierta a todo el pueblo.',
    look: { body: 'bird', c1: '#b08860', c2: '#f8e8d0', c3: '#8a6040', eyes: 'cute', size: 0.62, pattern: 'belly' } },
  { key: 'alondro', name: 'Alondro', types: ['normal', 'viento'], base: [63, 65, 58, 52, 80], catch: 120, exp: 122, learn: LS.pipio,
    evo: { lv: 22, branch: { crit: 'style', a: 'tormentor', b: 'cefireo' } }, desc: 'Patrulla su territorio desde el aire. Su forma adulta refleja su forma de luchar.',
    look: { body: 'bird', c1: '#a07850', c2: '#f4e2c8', c3: '#785030', head: 'crest', eyes: 'fierce', size: 0.82, pattern: 'belly' } },
  { key: 'tormentor', name: 'Tormentor', types: ['viento', 'electrico'], base: [80, 105, 70, 90, 95], catch: 45, exp: 215,
    learn: plus(LS.pipio, [[22, 'chispa'], [26, 'relampago'], [32, 'rayo'], [40, 'trueno']]),
    desc: 'Se lanza en picado contra sus presas envuelto en relámpagos. Nace de la lucha cuerpo a cuerpo.',
    look: { body: 'bird', c1: '#4a5878', c2: '#f0e070', c3: '#f8d048', head: 'spikes', tail: 'bolt', wings: 'bigbird', eyes: 'fierce', size: 1, pattern: 'belly' } },
  { key: 'cefireo', name: 'Cefireo', types: ['viento'], base: [78, 80, 70, 85, 122], catch: 45, exp: 215,
    learn: plus(LS.pipio, [[22, 'viento_afin'], [26, 'tornado'], [32, 'vendaval'], [40, 'rayo_total']]),
    desc: 'Vuela más rápido que el viento. Evita cada golpe con elegancia y ataca desde la distancia.',
    look: { body: 'bird', c1: '#86c6e8', c2: '#ffffff', c3: '#e0f4ff', head: 'crest', tail: 'feather', wings: 'bigbird', eyes: 'cute', size: 1, pattern: 'belly' } },
  // --- Larvita ---
  { key: 'larvita', name: 'Larvita', types: ['bicho'], base: [45, 30, 35, 20, 45], catch: 255, exp: 39, learn: LS.larvita,
    evo: { lv: 7, to: 'crisalix' }, desc: 'Devora hojas sin parar. Teje hilos de seda para protegerse de los depredadores.',
    look: { body: 'bug', c1: '#a8d848', c2: '#f8f0a0', c3: '#f08830', head: 'antenna', eyes: 'cute', size: 0.62, pattern: 'spots' } },
  { key: 'crisalix', name: 'Crisálix', types: ['bicho'], base: [50, 20, 60, 25, 30], catch: 120, exp: 72, learn: L([[1, 'coraza'], [1, 'picadura'], [1, 'hilo']]),
    evo: { lv: 12, branch: { crit: 'bond', a: 'polillux', b: 'escarabron' } }, desc: 'Permanece inmóvil en su capullo. Lo que salga de él dependerá del cariño que reciba.',
    look: { body: 'pupa', c1: '#94ac5a', c2: '#d8e098', c3: '#d8c070', head: 'horn', eyes: 'fierce', size: 0.8 } },
  { key: 'polillux', name: 'Polillux', types: ['bicho', 'mente'], base: [70, 50, 60, 100, 85], catch: 45, exp: 178,
    learn: L([[1, 'confusion'], [1, 'hilo'], [12, 'zumbido'], [16, 'polvo_toxico'], [20, 'psicorrayo'], [26, 'onda_mental'], [32, 'meditar']]),
    desc: 'Surge cuando ha recibido mucho cariño. Sus escamas brillantes iluminan la noche.',
    look: { body: 'flyer', c1: '#ece0f4', c2: '#a8d4f8', c3: '#f2a6dc', head: 'antenna', wings: 'insect', eyes: 'cute', size: 1 } },
  { key: 'escarabron', name: 'Escarabrón', types: ['bicho', 'roca'], base: [75, 100, 95, 40, 55], catch: 45, exp: 178,
    learn: L([[1, 'tijera'], [1, 'picadura'], [12, 'golpe_roca'], [16, 'aguijon'], [20, 'avalancha'], [26, 'carga_brutal'], [32, 'terremoto']]),
    desc: 'Surge cuando ha luchado en soledad. Su caparazón es duro como el granito.',
    look: { body: 'beetle', c1: '#4a6a40', c2: '#d8c098', c3: '#c8b050', head: 'bighorn', eyes: 'fierce', size: 1, pattern: 'spots' } },
  // --- Voltín ---
  { key: 'voltin', name: 'Voltín', types: ['electrico'], base: [40, 45, 40, 60, 75], catch: 190, exp: 60, learn: LS.voltin,
    evo: { lv: 18, to: 'dinamo' }, desc: 'Acumula electricidad estática rodando por el suelo. Sus antenas chisporrotean al estar nervioso.',
    look: { body: 'round', c1: '#f8dc68', c2: '#fffbe0', c3: '#58c8f0', head: 'antenna', tail: 'bolt', eyes: 'cute', size: 0.66, pattern: 'belly' } },
  { key: 'dinamo', name: 'Dínamo', types: ['electrico'], base: [60, 62, 55, 85, 95], catch: 75, exp: 140, learn: LS.voltin,
    evo: { branch: { crit: 'item', a: 'tesloria', b: 'ferrovolt', ia: 'nucleo_mente', ib: 'nucleo_hierro' } }, desc: 'Genera energía sin parar. Reacciona a ciertos núcleos minerales transformándose.',
    look: { body: 'round', c1: '#f0c840', c2: '#fff4c0', c3: '#4a90e0', head: 'antenna', ears: 'horn', tail: 'bolt', eyes: 'fierce', size: 0.86, pattern: 'belly' } },
  { key: 'tesloria', name: 'Tesloria', types: ['electrico', 'mente'], base: [70, 55, 70, 120, 115], catch: 45, exp: 220,
    learn: plus(LS.voltin, [[20, 'confusion'], [28, 'psicorrayo'], [36, 'psiquico']]),
    desc: 'Flota envuelta en un campo eléctrico. Su mente es tan rápida como la luz.',
    look: { body: 'ghost', c1: '#f8e070', c2: '#fff8d0', c3: '#a070f0', head: 'crown', tail: 'bolt', eyes: 'glow', eyeColor: '#a0f0ff', size: 1 } },
  { key: 'ferrovolt', name: 'Ferrovolt', types: ['electrico', 'roca'], base: [85, 110, 105, 75, 55], catch: 45, exp: 220,
    learn: plus(LS.voltin, [[20, 'golpe_roca'], [28, 'coraza'], [36, 'terremoto']]),
    desc: 'Su cuerpo de hierro conduce corrientes enormes. Cada paso suyo hace saltar chispas.',
    look: { body: 'golem', c1: '#8890a2', c2: '#f8d848', c3: '#f8d848', head: 'antenna', backExtra: 'spikes', eyes: 'fierce', size: 1, pattern: 'belly' } },
  // --- Guijín ---
  { key: 'guijin', name: 'Guijín', types: ['roca'], base: [40, 70, 80, 30, 20], catch: 255, exp: 60, learn: LS.guijin,
    evo: { lv: 16, to: 'pedrusco' }, desc: 'Se confunde con las piedras del camino. Muchos viajeros tropiezan con él sin querer.',
    look: { body: 'round', c1: '#a89880', c2: '#d8ccb8', c3: '#7a6a58', eyes: 'fierce', size: 0.62, pattern: 'rock' } },
  { key: 'pedrusco', name: 'Pedrusco', types: ['roca'], base: [60, 90, 105, 40, 35], catch: 120, exp: 137, learn: LS.guijin,
    evo: { lv: 28, branch: { crit: 'stat', a: 'basaltor', b: 'monolito' } }, desc: 'Rueda montaña abajo para desplazarse. Su forma final depende de si es más fuerte o más resistente.',
    look: { body: 'golem', c1: '#9a8a72', c2: '#c8bca4', c3: '#6a5c4a', eyes: 'fierce', size: 0.85, pattern: 'rock' } },
  { key: 'basaltor', name: 'Basaltor', types: ['roca', 'fuego'], base: [85, 120, 100, 65, 50], catch: 45, exp: 223,
    learn: plus(LS.guijin, [[28, 'colmillo_igneo'], [32, 'lanzallamas'], [38, 'llamarada']]),
    desc: 'Su núcleo es lava viva. Cuando se enfada, las grietas de su cuerpo brillan al rojo.',
    look: { body: 'golem', c1: '#4a4048', c2: '#ff9040', c3: '#ff7030', backExtra: 'flames', eyes: 'glow', eyeColor: '#ffb040', size: 1, pattern: 'belly' } },
  { key: 'monolito', name: 'Monolito', types: ['roca', 'mente'], base: [85, 80, 125, 100, 40], catch: 45, exp: 223,
    learn: plus(LS.guijin, [[28, 'confusion'], [32, 'barrera'], [38, 'psiquico']]),
    desc: 'Medita inmóvil durante siglos. Los cristales de su lomo vibran con energía psíquica.',
    look: { body: 'golem', c1: '#c8c0b8', c2: '#a8e8f8', c3: '#78d0f0', head: 'gem', backExtra: 'crystals', eyes: 'glow', eyeColor: '#80e8ff', size: 1, pattern: 'belly' } },
  // --- Umbrín ---
  { key: 'umbrin', name: 'Umbrín', types: ['sombra'], base: [40, 45, 35, 70, 60], catch: 190, exp: 62, learn: LS.umbrin,
    evo: { lv: 17, to: 'penumbro' }, desc: 'Vive en cuevas oscuras. Se esconde en las sombras de los viajeros para gastarles bromas.',
    look: { body: 'ghost', c1: '#7058a8', c2: '#c8b0f0', c3: '#a080e0', head: 'wisp', eyes: 'glow', eyeColor: '#f8f070', size: 0.66 } },
  { key: 'penumbro', name: 'Penumbro', types: ['sombra'], base: [60, 60, 50, 95, 85], catch: 90, exp: 142, learn: LS.umbrin,
    evo: { lv: 28, branch: { crit: 'time', a: 'eclipsor', b: 'lunargo' } }, desc: 'Su silueta cambia con la luz. Evoluciona de forma distinta según sea de día o de noche.',
    look: { body: 'ghost', c1: '#584090', c2: '#b8a0e8', c3: '#8a6ad0', head: 'spikes', eyes: 'glow', eyeColor: '#f8f070', size: 0.86 } },
  { key: 'eclipsor', name: 'Eclipsor', types: ['sombra', 'fuego'], base: [80, 90, 70, 115, 95], catch: 45, exp: 225,
    learn: plus(LS.umbrin, [[28, 'ascua'], [32, 'anillo_igneo'], [38, 'llamarada']]),
    desc: 'Nace bajo el sol. Una corona de fuego negro rodea su cuerpo como un eclipse.',
    look: { body: 'ghost', c1: '#382858', c2: '#8a70c0', c3: '#ff8040', head: 'crown', backExtra: 'flames', eyes: 'glow', eyeColor: '#ffb040', size: 1 } },
  { key: 'lunargo', name: 'Lunargo', types: ['sombra', 'mente'], base: [85, 70, 80, 120, 90], catch: 45, exp: 225,
    learn: plus(LS.umbrin, [[28, 'psicorrayo'], [32, 'onda_mental'], [38, 'psiquico']]),
    desc: 'Nace bajo la luna. Sus alas nocturnas proyectan visiones en la mente de quien lo mira.',
    look: { body: 'ghost', c1: '#3a3a7a', c2: '#d0d8ff', c3: '#c8d4ff', head: 'gem', wings: 'bat', eyes: 'glow', eyeColor: '#c0f0ff', size: 1 } },
  // --- Escamín ---
  { key: 'escamin', name: 'Escamín', types: ['agua'], base: [38, 45, 40, 40, 70], catch: 255, exp: 55, learn: LS.escamin,
    evo: { lv: 18, to: 'aleton' }, desc: 'Nada en bancos de cientos de ejemplares. Sus escamas reflejan el sol como espejos.',
    look: { body: 'fish', c1: '#f0a050', c2: '#fff0d0', c3: '#e86838', eyes: 'cute', size: 0.62, pattern: 'stripes' } },
  { key: 'aleton', name: 'Aletón', types: ['agua'], base: [60, 75, 60, 60, 85], catch: 90, exp: 140, learn: LS.escamin,
    evo: { lv: 28, branch: { crit: 'place', a: 'arrecifor', b: 'tifonar' } }, desc: 'Remonta ríos y cascadas. Dicen que cambia al evolucionar dentro de una cueva.',
    look: { body: 'fish', c1: '#e08440', c2: '#fff0d8', c3: '#c05028', eyes: 'fierce', size: 0.86, pattern: 'stripes' } },
  { key: 'tifonar', name: 'Tifonar', types: ['agua', 'viento'], base: [90, 95, 75, 90, 95], catch: 45, exp: 226,
    learn: plus(LS.escamin, [[28, 'rafaga'], [32, 'tornado'], [38, 'vendaval']]),
    desc: 'Una serpiente marina que provoca tifones al agitar sus aletas. Evolucionó a cielo abierto.',
    look: { body: 'serpent', c1: '#56a6d8', c2: '#e0f4ff', c3: '#eef4ff', head: 'crest', ears: 'fin', wings: 'fins', eyes: 'fierce', size: 1, pattern: 'belly' } },
  { key: 'arrecifor', name: 'Arrecifor', types: ['agua', 'roca'], base: [90, 100, 110, 70, 60], catch: 45, exp: 226,
    learn: plus(LS.escamin, [[28, 'lanzarrocas'], [32, 'avalancha'], [38, 'terremoto']]),
    desc: 'Evolucionó en la penumbra de una cueva. Corales vivos crecen sobre su lomo acorazado.',
    look: { body: 'fish', c1: '#3a78a8', c2: '#d8eef8', c3: '#f088a0', backExtra: 'crystals', eyes: 'fierce', size: 1, pattern: 'belly' } },
  // --- Psiqui (Mente) ---
  { key: 'psiqui', name: 'Psiqui', types: ['mente'], base: [40, 35, 40, 70, 60], catch: 190, exp: 62, learn: LS2.psiqui,
    evo: { lv: 16, to: 'mentalis' }, desc: 'Flota a pocos centímetros del suelo. La gema de su frente brilla cuando lee los pensamientos de alguien.',
    look: { body: 'round', c1: '#f0a6cc', c2: '#fff0f8', c3: '#9a70e8', head: 'gem', ears: 'pointy', tail: 'swirl', eyes: 'cute', size: 0.62, pattern: 'belly' } },
  { key: 'mentalis', name: 'Mentalis', types: ['mente'], base: [60, 45, 55, 95, 80], catch: 90, exp: 140, learn: LS2.psiqui,
    evo: { lv: 30, branch: { crit: 'style', a: 'kinesio', b: 'oniria' } }, desc: 'Mueve objetos con la mente. Su forma adulta refleja cómo canaliza su poder en combate.',
    look: { body: 'biped', c1: '#e690c0', c2: '#fff0f8', c3: '#8a60e0', head: 'gem', ears: 'pointy', tail: 'swirl', eyes: 'cute', size: 0.86, pattern: 'belly' } },
  { key: 'kinesio', name: 'Kinesio', types: ['mente', 'roca'], base: [80, 110, 100, 85, 65], catch: 45, exp: 225,
    learn: plus(LS2.psiqui, [[30, 'golpe_roca'], [34, 'carga_brutal'], [40, 'terremoto']]),
    desc: 'Envuelve su cuerpo en una armadura de piedra que mueve con telequinesis. Lucha cuerpo a cuerpo.',
    look: { body: 'golem', c1: '#c880b0', c2: '#e8d8c8', c3: '#8a7868', head: 'gem', backExtra: 'crystals', eyes: 'fierce', size: 1, pattern: 'belly' } },
  { key: 'oniria', name: 'Oniria', types: ['mente', 'sombra'], base: [75, 60, 70, 125, 100], catch: 45, exp: 225,
    learn: plus(LS2.psiqui, [[30, 'bola_sombra'], [34, 'pesadilla'], [40, 'velo']]),
    desc: 'Vaga entre el sueño y la vigilia. Ataca desde lejos con visiones que confunden a sus rivales.',
    look: { body: 'ghost', c1: '#9a70d0', c2: '#f0d8ff', c3: '#f0a6cc', head: 'crown', wings: 'bat', eyes: 'glow', eyeColor: '#ffb0e0', size: 1 } },
  // --- Hongui (Planta) ---
  { key: 'hongui', name: 'Hongui', types: ['planta'], base: [45, 50, 55, 50, 35], catch: 200, exp: 58, learn: LS2.hongui,
    evo: { lv: 14, to: 'setalon' }, desc: 'Vive en la humedad del bosque. Si lo sacudes, suelta esporas que dan mucho sueño.',
    look: { body: 'round', c1: '#f0e0c0', c2: '#fff8e8', c3: '#d84838', head: 'cap', eyes: 'cute', size: 0.62, pattern: 'none' } },
  { key: 'setalon', name: 'Setalón', types: ['planta'], base: [65, 70, 70, 65, 45], catch: 100, exp: 138, learn: LS2.hongui,
    evo: { lv: 27, branch: { crit: 'time', a: 'esporal', b: 'micelion' } }, desc: 'Su sombrero crece con la luz o con la oscuridad, según la hora a la que madure.',
    look: { body: 'biped', c1: '#e8d4b0', c2: '#fff4e0', c3: '#c83c30', head: 'cap', eyes: 'fierce', size: 0.86, pattern: 'belly' } },
  { key: 'esporal', name: 'Esporal', types: ['planta', 'bicho'], base: [85, 95, 85, 80, 75], catch: 45, exp: 220,
    learn: plus(LS2.hongui, [[27, 'zumbido'], [31, 'tijera'], [37, 'polvo_toxico']]),
    desc: 'Maduró bajo el sol. Pequeños insectos viven en simbiosis con él y lo defienden.',
    look: { body: 'biped', c1: '#d8c890', c2: '#fff8d8', c3: '#e8a020', head: 'cap', wings: 'insect', wingSpots: false, eyes: 'fierce', size: 1, pattern: 'belly' } },
  { key: 'micelion', name: 'Micelión', types: ['planta', 'sombra'], base: [90, 80, 80, 105, 65], catch: 45, exp: 220,
    learn: plus(LS2.hongui, [[27, 'pesadilla'], [31, 'bola_sombra'], [37, 'garra_umbria']]),
    desc: 'Maduró de noche. Su red de raíces se extiende bajo tierra y absorbe la energía de quien la pisa.',
    look: { body: 'biped', c1: '#5a4a68', c2: '#c8b8e0', c3: '#7058c0', head: 'cap', eyes: 'glow', eyeColor: '#a0ff90', size: 1, pattern: 'belly' } },
  // --- Brisín (Viento) ---
  { key: 'brisin', name: 'Brisín', types: ['viento'], base: [40, 40, 40, 60, 75], catch: 190, exp: 60, learn: LS2.brisin,
    evo: { lv: 18, to: 'nimbo' }, desc: 'Una nubecita viva que se deja llevar por la brisa. Cuando está triste, llovizna.',
    look: { body: 'ghost', c1: '#e8f4ff', c2: '#ffffff', c3: '#a8d0f0', head: 'wisp', eyes: 'cute', size: 0.62 } },
  { key: 'nimbo', name: 'Nimbo', types: ['viento'], base: [60, 60, 60, 80, 95], catch: 90, exp: 140, learn: LS2.brisin,
    evo: { lv: 30, branch: { crit: 'stat', a: 'granizor', b: 'nubaria' } }, desc: 'Cambia el tiempo a su alrededor. Si es más fuerte que resistente, se carga de granizo.',
    look: { body: 'ghost', c1: '#d4e4f4', c2: '#ffffff', c3: '#8aa8d0', head: 'wisp', backExtra: 'cloud', eyes: 'fierce', size: 0.86 } },
  { key: 'granizor', name: 'Granizor', types: ['viento', 'roca'], base: [85, 110, 95, 75, 75], catch: 45, exp: 222,
    learn: plus(LS2.brisin, [[30, 'pedrisco'], [34, 'avalancha'], [40, 'terremoto']]),
    desc: 'Una nube tormentosa cargada de piedras de hielo. Sus granizadas destrozan cosechas enteras.',
    look: { body: 'ghost', c1: '#8a98b0', c2: '#e0e8f4', c3: '#c8d8f0', head: 'spikes', backExtra: 'crystals', eyes: 'fierce', size: 1 } },
  { key: 'nubaria', name: 'Nubaria', types: ['viento', 'mente'], base: [80, 60, 80, 115, 105], catch: 45, exp: 222,
    learn: plus(LS2.brisin, [[30, 'psicorrayo'], [34, 'onda_mental'], [40, 'meditar']]),
    desc: 'Una nube serena que flota en lo alto. Dicen que quien la ve al amanecer tendrá un día feliz.',
    look: { body: 'ghost', c1: '#f8e8ff', c2: '#ffffff', c3: '#f0a8e0', head: 'crown', backExtra: 'cloud', eyes: 'glow', eyeColor: '#d080ff', size: 1 } },
  // --- Murcín (Sombra/Viento) ---
  { key: 'murcin', name: 'Murcín', types: ['sombra', 'viento'], base: [40, 50, 35, 45, 70], catch: 190, exp: 58, learn: LS2.murcin,
    evo: { lv: 17, to: 'noctalar' }, desc: 'Duerme colgado del techo de las cuevas. Se orienta con chillidos que nadie más puede oír.',
    look: { body: 'bird', c1: '#5a4a7a', c2: '#c8b8e0', c3: '#7a6aa0', ears: 'pointy', wings: 'bat', eyes: 'fierce', leg: '#5a4a7a', size: 0.62, pattern: 'belly' } },
  { key: 'noctalar', name: 'Noctalar', types: ['sombra', 'viento'], base: [65, 75, 55, 60, 90], catch: 90, exp: 138, learn: LS2.murcin,
    evo: { lv: 29, branch: { crit: 'bond', a: 'lunavela', b: 'vampirax' } }, desc: 'Vuela en silencio absoluto. Si se siente querido, su naturaleza oscura se suaviza.',
    look: { body: 'bird', c1: '#4a3a6a', c2: '#c0b0d8', c3: '#6a5a90', ears: 'pointy', wings: 'bat', eyes: 'fierce', leg: '#4a3a6a', size: 0.86, pattern: 'belly' } },
  { key: 'lunavela', name: 'Lunavela', types: ['sombra', 'mente'], base: [85, 70, 75, 110, 110], catch: 45, exp: 220,
    learn: plus(LS2.murcin, [[29, 'psicorrayo'], [33, 'onda_mental'], [39, 'psiquico']]),
    desc: 'Guardiana de los viajeros nocturnos. Sus alas reflejan la luz de la luna y guían a los perdidos.',
    look: { body: 'bird', c1: '#3a3a78', c2: '#e0e8ff', c3: '#c8d4ff', ears: 'pointy', head: 'gem', wings: 'bat', eyes: 'glow', eyeColor: '#c0f0ff', leg: '#3a3a78', size: 1, pattern: 'belly' } },
  { key: 'vampirax', name: 'Vampirax', types: ['sombra', 'bicho'], base: [85, 110, 70, 75, 105], catch: 45, exp: 220,
    learn: plus(LS2.murcin, [[29, 'aguijon'], [33, 'tijera'], [39, 'polvo_toxico']]),
    desc: 'Creció en soledad y se volvió feroz. Sus colmillos inyectan un veneno que debilita a sus presas.',
    look: { body: 'bird', c1: '#3a2030', c2: '#e05068', c3: '#802040', ears: 'pointy', head: 'spikes', wings: 'bat', eyes: 'glow', eyeColor: '#ff4060', leg: '#3a2030', size: 1, pattern: 'belly' } },
  // --- Guardianes legendarios ---
  { key: 'silvaneo', name: 'Silvaneo', types: ['planta', 'roca'], base: [100, 110, 115, 90, 80], catch: 25, exp: 290, legendary: true,
    learn: L([[1, 'tormenta_petalo'], [1, 'avalancha'], [1, 'bosque_ancestral'], [1, 'coraza'], [40, 'rayo_solar'], [45, 'terremoto']]),
    desc: 'Guardián legendario del bosque. Se dice que cada árbol de la región brotó de una huella suya.',
    look: { body: 'quad', c1: '#4a8a50', c2: '#e8dcb0', c3: '#d8c890', head: 'bighorn', backExtra: 'leaves', tail: 'leaf', ears: 'leafy', eyes: 'glow', eyeColor: '#c0ff80', size: 1, pattern: 'belly', halo: '#9ad860' } },
  { key: 'auroros', name: 'Auroros', types: ['fuego', 'mente'], base: [95, 100, 85, 120, 105], catch: 25, exp: 290, legendary: true,
    learn: L([[1, 'llamarada'], [1, 'psiquico'], [1, 'alba_solar'], [1, 'anillo_igneo'], [45, 'meditar']]),
    desc: 'Guardián legendario del sol naciente. Su melena arde con la luz del primer amanecer.',
    look: { body: 'quad', c1: '#f8c050', c2: '#fff4d0', c3: '#ff7040', head: 'crown', backExtra: 'mane', tail: 'flame', ears: 'pointy', eyes: 'glow', eyeColor: '#ffffff', size: 1, pattern: 'belly', halo: 'fire' } },
  { key: 'marealis', name: 'Marealis', types: ['agua', 'viento'], base: [105, 90, 100, 110, 95], catch: 25, exp: 290, legendary: true,
    learn: L([[1, 'hidrobomba'], [1, 'vendaval'], [1, 'maremoto'], [1, 'rocio'], [45, 'tornado']]),
    desc: 'Guardián legendario de las mareas. Cuando nada, el océano entero respira a su ritmo.',
    look: { body: 'serpent', c1: '#3aa0d0', c2: '#e8faff', c3: '#a0f0ff', head: 'crest', ears: 'fin', wings: 'fins', eyes: 'glow', eyeColor: '#ffffff', size: 1, pattern: 'belly', halo: '#60c8f0' } },
  { key: 'albora', name: 'Albora', types: ['normal', 'mente'], base: [110, 110, 110, 110, 110], catch: 20, exp: 320, legendary: true,
    learn: L([[1, 'destello_alba'], [1, 'rayo_total'], [1, 'psiquico'], [1, 'teletransporte'], [50, 'meditar']]),
    desc: 'El espíritu del alba. Solo se muestra ante quien ha ganado la confianza de los tres guardianes.',
    look: { body: 'biped', c1: '#fff4e0', c2: '#ffd0f0', c3: '#ffe080', head: 'crown', ears: 'leafy', tail: 'feather', wings: 'bigbird', eyes: 'glow', eyeColor: '#ff80c0', size: 1, pattern: 'belly', halo: '#ffb0e0' } },
];

const SPECIES = {}; // por id y por clave
SPECIES_LIST.forEach((s, i) => {
  s.id = i + 1;
  const [hp, atk, def, esp, vel] = s.base;
  s.stats = { hp, atk, def, esp, vel };
  SPECIES[s.id] = s; SPECIES[s.key] = s;
});
// etapa evolutiva y especie previa
SPECIES_LIST.forEach((s) => { s.stage = s.stage || 1; s.prev = s.prev || null; });
SPECIES_LIST.forEach((s) => {
  if (!s.evo) return;
  const targets = s.evo.to ? [s.evo.to] : [s.evo.branch.a, s.evo.branch.b];
  for (const t of targets) { SPECIES[t].prev = s.key; }
});
SPECIES_LIST.forEach((s) => { let n = 1, p = s.prev; while (p) { n++; p = SPECIES[p].prev; } s.stage = n; });

const CRIT_TEXT = {
  style: (e, a, b) => `Nv ${e.lv}: según su estilo de combate. ÍMPETU (más golpes cuerpo a cuerpo y cargas) → ${a}. TEMPLE (más ataques a distancia y esquivas perfectas) → ${b}.`,
  time: (e, a, b) => `Nv ${e.lv}: según la hora del día. De día (6:00-17:59) → ${a}. De noche → ${b}.`,
  item: (e, a, b) => `Usando un objeto: Núcleo Mente → ${a}. Núcleo Hierro → ${b}.`,
  stat: (e, a, b) => `Nv ${e.lv}: si su Ataque supera a su Defensa → ${a}. Si no → ${b}.`,
  bond: (e, a, b) => `Nv ${e.lv}: con vínculo alto (se gana luchando juntos y paseando) → ${a}. Con vínculo bajo → ${b}.`,
  place: (e, a, b) => `Nv ${e.lv}: si evoluciona dentro de una cueva → ${a}. En cualquier otro lugar → ${b}.`,
};
function evoText(sp) {
  const e = sp.evo; if (!e) return 'No evoluciona.';
  if (e.to) return `Evoluciona a ${SPECIES[e.to].name} al Nv ${e.lv}.`;
  return CRIT_TEXT[e.branch.crit](e, SPECIES[e.branch.a].name, SPECIES[e.branch.b].name);
}

// ---------- objetos ----------
const ITEMS = {
  pocion: { name: 'Poción', price: 200, desc: 'Restaura 20 PS a un ánima.', heal: 20, icon: 'potion', color: '#a868e0', target: 'party', battle: true },
  superpocion: { name: 'Superpoción', price: 600, desc: 'Restaura 60 PS a un ánima.', heal: 60, icon: 'potion', color: '#e05880', target: 'party', battle: true },
  hiperpocion: { name: 'Hiperpoción', price: 1200, desc: 'Restaura 150 PS a un ánima.', heal: 150, icon: 'potion', color: '#f0a030', target: 'party', battle: true },
  baya: { name: 'Baya Vigor', price: 80, desc: 'Fruta silvestre. Restaura 12 PS.', heal: 12, icon: 'berry', target: 'party', battle: true },
  revivir: { name: 'Revivir', price: 1500, desc: 'Reanima a un ánima debilitada con la mitad de PS.', revive: 0.5, icon: 'revive', target: 'party', battle: true },
  esfera: { name: 'Esfera', price: 200, desc: 'Esfera para capturar ánimas salvajes.', sphere: 'esfera', ball: 1, battle: true },
  superesfera: { name: 'Superesfera', price: 600, desc: 'Esfera mejorada. Más probabilidad de captura.', sphere: 'super', ball: 1.5, battle: true },
  ultraesfera: { name: 'Ultraesfera', price: 1200, desc: 'Esfera de alto rendimiento.', sphere: 'ultra', ball: 2, battle: true },
  repelente: { name: 'Repelente', price: 350, desc: 'Evita ánimas salvajes débiles durante 120 pasos.', repel: 120, icon: 'spray', target: 'field' },
  cuerda: { name: 'Cuerda Huida', price: 550, desc: 'Te saca de una cueva al instante.', escape: true, icon: 'rope', target: 'field' },
  caramelo: { name: 'Caramelo Raro', price: 0, desc: 'Sube un nivel a un ánima.', rare: true, icon: 'candy', target: 'party' },
  nucleo_mente: { name: 'Núcleo Mente', price: 2100, desc: 'Mineral que vibra con energía psíquica. Hace evolucionar a ciertas ánimas.', evoItem: true, icon: 'core', color: '#c080f0', target: 'party' },
  nucleo_hierro: { name: 'Núcleo Hierro', price: 2100, desc: 'Mineral pesado y magnético. Hace evolucionar a ciertas ánimas.', evoItem: true, icon: 'core', color: '#9aa4b4', target: 'party' },
  maestra: { name: 'Esfera Maestra', price: 0, desc: 'La esfera definitiva. Captura cualquier ánima sin fallar.', sphere: 'master', ball: 255, battle: true },
  hierba_olvido: { name: 'Hierba Olvido', price: 1000, desc: 'Hierba amarga. Reinicia los talentos de un ánima para repartirlos de nuevo.', resetTalents: true, icon: 'berry', target: 'party' },
  cinta_veloz: { name: 'Cinta Veloz', price: 1500, desc: 'Amuleto. El ánima que lo lleva se mueve un 12% más rápido.', held: true, speed: 1.12, icon: 'charm', color: '#60c8f0' },
  garra_afilada: { name: 'Garra Afilada', price: 1500, desc: 'Amuleto. Aumenta la probabilidad de golpe crítico.', held: true, critAdd: 0.1, icon: 'charm', color: '#e0e0e0' },
  escama_dura: { name: 'Escama Dura', price: 1500, desc: 'Amuleto. Reduce un 12% el daño recibido.', held: true, taken: 0.88, icon: 'charm', color: '#a08860' },
  lente_foco: { name: 'Lente Foco', price: 0, desc: 'Amuleto. Reduce un 10% el tiempo de recarga de los ataques.', held: true, cdMul: 0.9, icon: 'charm', color: '#f0e070' },
  piedra_sinergia: { name: 'Piedra Sinergia', price: 0, desc: 'Amuleto. La barra de Sinergia se llena un 35% más rápido.', held: true, synMul: 1.35, icon: 'charm', color: '#c070f0' },
  baya_auto: { name: 'Baya Auto', price: 0, desc: 'Amuleto. Cura un 30% de PS al bajar del 30%. Una vez por combate.', held: true, autoBerry: true, icon: 'charm', color: '#f06080' },
  ficha_puerto: { name: 'Pase Portuario', price: 0, desc: 'Permiso para acceder al muelle de Puerto Marea.', key: true, icon: 'key' },
};
const CHARM_NAMES = { normal: 'Común', fuego: 'Ígneo', agua: 'Marino', planta: 'Silvestre', electrico: 'Voltaico', roca: 'Pétreo', viento: 'Céfiro', bicho: 'Insecto', sombra: 'Umbrío', mente: 'Psíquico' };
for (const t in CHARM_NAMES) ITEMS['amuleto_' + t] = { name: 'Amuleto ' + CHARM_NAMES[t], price: 2500, desc: 'Amuleto. Potencia un 20% los ataques de tipo ' + TYPES[t].name + '.', held: true, boostType: t, icon: 'charm', color: TYPES[t].color };

// árbol de talentos: 3 ramas x 3 niveles (máx. 3 rangos cada uno)
const TALENTS = {
  impetu: { name: 'Ímpetu', color: '#e86040', list: [
    { key: 'fuerza', name: 'Fuerza', desc: '+6% de daño cuerpo a cuerpo y en cargas por rango.' },
    { key: 'ferocidad', name: 'Ferocidad', desc: '+5% de probabilidad de golpe crítico por rango.' },
    { key: 'furia', name: 'Furia', desc: 'Cada golpe cuerpo a cuerpo reduce 0.2 s las recargas de tus otros ataques por rango.' }] },
  temple: { name: 'Temple', color: '#4a90e0', list: [
    { key: 'punteria', name: 'Puntería', desc: '+6% de daño a distancia (proyectil, rayo, zona y onda) por rango.' },
    { key: 'celeridad', name: 'Celeridad', desc: '-6% de tiempo de recarga de todos los ataques por rango.' },
    { key: 'contra', name: 'Contraataque', desc: 'Tras una esquiva perfecta, +15% de daño durante 3 s por rango.' }] },
  vigor: { name: 'Vigor', color: '#48b058', list: [
    { key: 'vitalidad', name: 'Vitalidad', desc: '+6% de PS máximos por rango.' },
    { key: 'piel', name: 'Piel Dura', desc: '-5% de daño recibido por rango.' },
    { key: 'regen', name: 'Regeneración', desc: 'Recupera 0.6% de PS por segundo en combate por rango.' }] },
};
const TALENT_MAX = 3;
function talentPoints(c) { const spent = Object.values(c.talents || {}).reduce((a, b) => a + b, 0); return Math.max(0, Math.floor(c.lv / 2) - spent); }
function talentUnlocked(c, branch, idx) { if (idx === 0) return true; const prev = TALENTS[branch].list[idx - 1].key; return ((c.talents || {})[prev] || 0) >= 2; }

const SHOPS = {
  musgo: ['esfera', 'pocion', 'baya', 'repelente'],
  roca: ['esfera', 'superesfera', 'pocion', 'superpocion', 'revivir', 'repelente', 'cuerda', 'hierba_olvido', 'garra_afilada'],
  marea: ['esfera', 'superesfera', 'ultraesfera', 'superpocion', 'hiperpocion', 'revivir', 'repelente', 'cuerda', 'nucleo_mente', 'nucleo_hierro', 'hierba_olvido', 'cinta_veloz', 'escama_dura', 'amuleto_fuego', 'amuleto_electrico', 'amuleto_viento', 'amuleto_mente'],
};

const BADGES = [
  { name: 'Medalla Raíz', leader: 'Hiedra', city: 'Villa Musgo' },
  { name: 'Medalla Peña', leader: 'Bruna', city: 'Ciudad Roca' },
  { name: 'Medalla Oleaje', leader: 'Nerón', city: 'Puerto Marea' },
];
