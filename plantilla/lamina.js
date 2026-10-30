// Dibuja una lámina. Se abre como plantilla/lamina.html?cuenta=<cuenta>
// y luego se llama a dibujar(texto, numero, semilla). Lo usan el editor y generar.py.

const RAIZ_CUENTAS = '../cuentas/';
const cuentaId = new URLSearchParams(location.search).get('cuenta') || 'teoc.books';
let CUENTA = null;
const cache = {};

// Cuentas creadas en el editor que aún no están en el repositorio.
const locales = () => { try { return parent.CUENTAS_LOCALES || {}; } catch (e) { return {}; } };

// Lee la configuración de una cuenta (del repositorio o del editor).
async function cargarCuenta(id) {
  if (cache[id]) return cache[id];
  const local = locales()[id];
  let c;
  if (local) {
    c = { ...local.cuenta, fotoUrl: local.foto || null, temaCss: local.tema };
  } else {
    c = await fetch(`${RAIZ_CUENTAS}${id}/cuenta.json`).then(r => r.json());
    c.fotoUrl = c.perfil ? `${RAIZ_CUENTAS}${id}/${c.perfil}` : null;
  }
  c.id = id;
  return (cache[id] = c);
}

// Carga la cuenta y su tema antes de dibujar.
window.listo = (async () => {
  CUENTA = await cargarCuenta(cuentaId);
  const link = document.querySelector('#tema');
  if (CUENTA.temaCss) {
    const st = document.createElement('style');
    st.textContent = CUENTA.temaCss;
    document.head.append(st);
  } else {
    await new Promise(res => {
      link.onload = res; link.onerror = res;
      link.href = `${RAIZ_CUENTAS}${cuentaId}/tema.css`;
    });
  }
  await document.fonts.ready;
  return CUENTA;
})();

// ---------- Lectura del texto ----------

function leerPublicacion(texto) {
  const ajustes = {}, laminas = [];
  let actual = null;
  for (const bruta of texto.split('\n')) {
    const linea = bruta.trim();
    if (!linea || linea.startsWith('#')) continue;
    if (linea.startsWith('---')) {
      actual = { tipo: linea.slice(3).trim().toLowerCase() || 'dato', lineas: [] };
      laminas.push(actual);
    } else if (actual) {
      actual.lineas.push(linea);
    } else {
      const m = linea.match(/^([\wáéíóúñ-]+)\s*:\s*(.*)$/i);
      if (m) ajustes[m[1].toLowerCase()] = m[2];
    }
  }
  const final = (ajustes.final || '').trim().replace(/^@/, '');
  if (!['no', 'false', 'sin', 'ninguna'].includes(final.toLowerCase())) {
    laminas.push({ tipo: 'cuenta', lineas: [], cuenta: final || null });
  }
  return { ajustes, laminas };
}

// Escapa el HTML y permite *cursiva* para destacar palabras.
function limpio(t = '') {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

// ---------- Trazos a mano ----------

function azar(semilla) {
  let s = semilla >>> 0;
  return (min, max) => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return min + (s / 4294967296) * (max - min);
  };
}

function trazo(r, x1, x2, y, grosor = 2.2) {
  const pts = [];
  for (let x = x1; x < x2; x += r(14, 26)) pts.push(`${x.toFixed(1)},${(y + r(-1.6, 1.6)).toFixed(1)}`);
  pts.push(`${x2},${(y + r(-1.6, 1.6)).toFixed(1)}`);
  return `<polyline points="${pts.join(' ')}" fill="none" stroke="var(--tinta)" stroke-width="${grosor}"
    stroke-linecap="round" stroke-linejoin="round" opacity=".75"/>`;
}

function sello(r, cx, cy, radio) {
  const pts = [];
  for (let g = 0; g <= 360; g += 8) {
    const a = g * Math.PI / 180, rr = radio + r(-2.5, 2.5);
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polyline points="${pts.join(' ')}" fill="none" stroke="var(--acento)" stroke-width="2.4" opacity=".8"/>`;
}

// Íconos dibujados a mano alzada: Instagram (corazón, comentario, enviar, guardar)
// o TikTok (corazón, comentario, guardar, compartir).
function iconos(r, red) {
  if (red === 'tiktok') return iconosTiktok(r);
  const j = () => r(-1.5, 1.5).toFixed(1);
  const t = `fill="none" stroke="var(--tinta)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`;
  return `
    <svg viewBox="0 0 128 116"><path ${t} d="M64 104 C${30 + +j()} 78 8 60 10 36 C12 16 30 8 44 10 C54 12 60 18 64 26 C68 18 74 12 84 10 C98 8 116 16 118 36 C120 60 ${98 + +j()} 78 64 104 Z"/></svg>
    <svg viewBox="0 0 128 116"><path ${t} d="M16 ${14 + +j()} H112 Q118 14 118 22 V74 Q118 82 110 82 H82 L86 106 L62 82 H18 Q10 82 10 74 V22 Q10 14 16 14 Z"/></svg>
    <svg viewBox="0 0 128 116"><path ${t} d="M8 ${16 + +j()} L120 16 L64 106 L58 52 Z M58 52 L120 16"/></svg>
    <svg viewBox="0 0 128 116"><path ${t} d="M28 ${8 + +j()} H100 V108 L64 80 L28 108 Z"/></svg>`;
}

function iconosTiktok(r) {
  const j = () => r(-1.5, 1.5).toFixed(1);
  const t = `fill="none" stroke="var(--tinta)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`;
  return `
    <svg viewBox="0 0 128 116"><path ${t} d="M64 104 C${30 + +j()} 78 8 60 10 36 C12 16 30 8 44 10 C54 12 60 18 64 26 C68 18 74 12 84 10 C98 8 116 16 118 36 C120 60 ${98 + +j()} 78 64 104 Z"/></svg>
    <svg viewBox="0 0 128 116"><path ${t} d="M64 ${12 + +j()} C98 12 118 30 118 54 C118 78 98 96 64 96 C56 96 48 95 42 92 L18 104 L24 82 C14 74 10 64 10 54 C10 30 30 12 64 12 Z"/>
      <circle cx="42" cy="54" r="5" fill="var(--tinta)"/><circle cx="64" cy="54" r="5" fill="var(--tinta)"/><circle cx="86" cy="54" r="5" fill="var(--tinta)"/></svg>
    <svg viewBox="0 0 128 116"><path ${t} d="M28 ${8 + +j()} H100 V108 L64 80 L28 108 Z"/></svg>
    <svg viewBox="0 0 128 116"><path ${t} d="M74 ${14 + +j()} L118 54 L74 94 V72 C44 70 24 80 10 102 C14 66 36 40 74 36 Z"/></svg>`;
}

function romano(n) {
  return [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
    .reduce((t, [v, r]) => { while (n >= v) { t += r; n -= v; } return t; }, '');
}

// ---------- Diseños por tipo ----------

const DISENOS = {
  portada: (l, n, r, a) => `
    <div class="portada">
      ${a.volanta ? `<p class="volanta">${limpio(a.volanta)}</p>` : ''}
      <h1 style="transform:rotate(${r(-1.2, 1.2).toFixed(2)}deg)">${limpio(l[0])}</h1>
      <svg class="raya" viewBox="0 0 600 20" preserveAspectRatio="none">${trazo(r, 10, 590, 10, 3)}</svg>
      <p class="bajada">${limpio(l[1])}</p>
    </div>`,
  dato: (l, n, r, a, nDato) => `
    <div class="dato">
      <span class="numero" data-romano="${romano(nDato)}" data-n="${nDato}">${String(nDato).padStart(2, '0')}</span>
      <p class="principal">${limpio(l[0])}</p>
      ${l.length > 1 ? `<svg class="raya corta" viewBox="0 0 300 20" preserveAspectRatio="none">${trazo(r, 6, 294, 10)}</svg>
      <p class="secundario">${limpio(l.slice(1).join(' '))}</p>` : ''}
    </div>`,
  cita: (l, n, r) => `
    <div class="cita" style="transform:rotate(${r(-.7, .7).toFixed(2)}deg)">
      <span class="comilla">«</span>
      <p class="frase">${limpio(l[0])}</p>
      <p class="firma">${limpio(l[1])}</p>
    </div>`,
  cierre: (l, n, r) => `
    <div class="cierre">
      <svg class="sello" viewBox="0 0 200 200">${sello(r, 100, 100, 82)}${sello(r, 100, 100, 70)}</svg>
      <p class="principal">${limpio(l[0])}</p>
      <p class="secundario">${limpio(l[1])}</p>
    </div>`,
  cuenta: (l, n, r, a, nDato, c = CUENTA) => {
    const [p1, p2 = ''] = c.nombre || [c.usuario];
    const foto = c.fotoUrl
      ? `<div class="foto" style="background-image:url('${c.fotoUrl}')"></div>`
      : `<div class="foto">${(c.usuario || '?')[0].toUpperCase()}</div>`;
    return `
    <div class="cuenta">
      ${foto}
      <p class="usuario"><span class="p1">${limpio(p1)}</span><span class="p2">${limpio(p2)}</span></p>
      <div class="iconos">${iconos(r, c.red)}</div>
      <p class="llamado">${limpio(c.llamado || '')}</p>
    </div>`;
  },
};

async function dibujar(texto, n, semilla = 1) {
  await window.listo;
  const { ajustes, laminas } = leerPublicacion(texto);
  const lam = laminas[n - 1];
  if (!lam) return laminas.length;
  // La lámina final puede ser de otra cuenta, por ejemplo TikTok.
  let otra = CUENTA;
  if (lam.tipo === 'cuenta' && lam.cuenta && lam.cuenta !== CUENTA.id) {
    otra = await cargarCuenta(lam.cuenta).catch(() => CUENTA);
  }
  const r = azar(semilla);
  const nDato = laminas.slice(0, n).filter(x => x.tipo === 'dato').length;
  const diseno = DISENOS[lam.tipo] || DISENOS.dato;
  const esCuenta = lam.tipo === 'cuenta';

  document.querySelector('#ruido').setAttribute('seed', semilla % 1000);
  const lienzo = document.querySelector('.lienzo');
  lienzo.classList.toggle('lleno', esCuenta);
  lienzo.innerHTML = diseno(lam.lineas, n, r, ajustes, nDato, otra);
  document.querySelector('.marco').style.display = esCuenta ? 'none' : '';
  document.querySelector('.pie').innerHTML = esCuenta ? '' :
    `<span>${limpio(ajustes.pie || CUENTA.pie || CUENTA.usuario)}</span><span>${n} / ${laminas.length}</span>`;
  return laminas.length;
}

// Imagen PNG de la lámina actual (la usa el editor para descargar).
async function capturar() {
  await document.fonts.ready;
  return modernScreenshot.domToBlob(document.querySelector('.lamina'), {
    width: 1080, height: 1350, scale: 1, type: 'image/png',
  });
}

Object.assign(window, { leerPublicacion, dibujar, capturar });
