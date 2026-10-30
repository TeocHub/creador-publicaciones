// Editor de publicaciones: elige cuenta, escribe y mira las láminas en vivo.

const REPO = 'TeocHub/creador-publicaciones';
const $ = s => document.querySelector(s);

const EJEMPLO = `# Las líneas con # son notas y no aparecen en las láminas.

--- portada
Un título que haga detenerse
Una bajada que explique de qué va

--- dato
La idea principal, en una frase.
Un detalle o ejemplo que la acompaña.

--- cita
Una frase que valga la pena guardar.
Quién la dijo`;

// Códigos disponibles. Tocar uno lo inserta en el texto.
const PIEZAS_LAMINAS = [
  { codigo: '--- portada', desc: 'Título grande y una bajada. Va primero.', texto: '--- portada\nTítulo\nBajada' },
  { codigo: '--- dato', desc: 'Una idea numerada y un detalle más pequeño.', texto: '--- dato\nIdea principal.\nDetalle que la acompaña.' },
  { codigo: '--- cita', desc: 'Una frase destacada y quién la dijo.', texto: '--- cita\nLa frase.\nQuién la dijo' },
  { codigo: '--- cierre', desc: 'Invitación final y dónde seguir.', texto: '--- cierre\nInvitación.\nDónde encontrar más' },
  { codigo: '*palabra*', desc: 'Destaca una palabra con el color de la cuenta.', envolver: '*' },
  { codigo: '**negrita**', desc: 'Pone el texto en negrita.', envolver: '**' },
  { codigo: '_cursiva_', desc: 'Pone el texto en cursiva.', envolver: '_' },
  { codigo: '~tachado~', desc: 'Tacha el texto, como una corrección.', envolver: '~' },
  { codigo: '# nota', desc: 'Una nota para ti. No aparece en las láminas.', texto: '# ' },
];
const PIEZAS_AJUSTES = [
  { codigo: 'pie:', desc: 'Cambia el texto de abajo de cada lámina.', clave: 'pie', valor: 'Entre dos Mundos' },
  { codigo: 'volanta:', desc: 'Línea pequeña sobre el título de la portada.', clave: 'volanta', valor: 'Para pensar' },
  { codigo: 'final:', desc: 'Qué cuenta firma la lámina final, o "no" para quitarla.', clave: 'final', valor: 'no' },
];

let cuentas = [];
let cuenta = null;
let marcos = [];
let turno = 0;
window.CUENTAS_LOCALES = {};

// ---------- Utilidades ----------

const guardarLocal = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const leerLocal = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const avisar = t => { $('#estado').textContent = t; };
const limpiarId = t => (t || '').trim().replace(/^@/, '').toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9._-]+/g, '');

// El mismo crc32 que usa generar.py, para que la vista previa y las imágenes de GitHub coincidan.
const TABLA = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(texto) {
  let c = 0xFFFFFFFF;
  for (const b of new TextEncoder().encode(texto)) c = TABLA[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
const nombreArchivo = () =>
  ($('#nombre').value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')) || 'publicacion';

// ---------- Cuentas ----------

async function cargarCuentas() {
  try { Object.assign(window.CUENTAS_LOCALES, JSON.parse(leerLocal('cuentasLocales') || '{}')); } catch (e) {}
  const ids = await fetch('cuentas/cuentas.json', { cache: 'no-cache' }).then(r => r.json());
  const delRepo = await Promise.all(ids.map(async id => {
    const c = await fetch(`cuentas/${id}/cuenta.json`, { cache: 'no-cache' }).then(r => r.json());
    return { ...c, id, foto: c.perfil ? `cuentas/${id}/${c.perfil}` : null };
  }));
  // Si una cuenta del navegador ya se subió al repositorio, manda la del repositorio.
  for (const id of ids) delete window.CUENTAS_LOCALES[id];
  guardarLocal('cuentasLocales', JSON.stringify(window.CUENTAS_LOCALES));
  const locales = Object.entries(window.CUENTAS_LOCALES)
    .map(([id, l]) => ({ ...l.cuenta, id, foto: l.foto, local: true }));
  cuentas = [...delRepo, ...locales];
  pintarSelector();
  const ultima = leerLocal('cuenta');
  elegirCuenta(cuentas.some(c => c.id === ultima) ? ultima : cuentas[0].id);
}

function pintarSelector() {
  const caja = $('#cuentas');
  caja.innerHTML = '';
  for (const c of cuentas) {
    const b = document.createElement('button');
    b.className = 'cuenta-btn';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-label', '@' + c.usuario);
    b.title = '@' + c.usuario + (c.local ? ' (solo en este navegador)' : '');
    if (c.foto) b.style.backgroundImage = `url('${c.foto}')`;
    else b.textContent = c.usuario[0].toUpperCase();
    b.dataset.id = c.id;
    b.onclick = () => elegirCuenta(c.id);
    caja.append(b);
  }
  const mas = document.createElement('button');
  mas.className = 'agregar';
  mas.textContent = '+';
  mas.title = 'Agregar una cuenta';
  mas.setAttribute('aria-label', 'Agregar una cuenta');
  mas.onclick = abrirDialogo;
  caja.append(mas);
}

function elegirCuenta(id) {
  if (cuenta) guardarBorrador();
  cuenta = cuentas.find(c => c.id === id);
  guardarLocal('cuenta', id);
  document.querySelectorAll('.cuenta-btn').forEach(b => b.setAttribute('aria-checked', b.dataset.id === id));

  $('#nombreCuenta').textContent = '@' + cuenta.usuario;
  $('#redCuenta').textContent = (cuenta.red === 'tiktok' ? 'TikTok' : 'Instagram') + (cuenta.local ? ' · sin subir' : '');
  const foto = $('#fotoGrande');
  foto.style.backgroundImage = cuenta.foto ? `url('${cuenta.foto}')` : '';
  foto.textContent = cuenta.foto ? '' : cuenta.usuario[0].toUpperCase();

  $('#texto').value = leerLocal(`borrador:${id}`) ?? EJEMPLO;
  $('#nombre').value = leerLocal(`nombre:${id}`) ?? 'nueva-publicacion';
  $('#carrete').innerHTML = '';
  marcos = [];
  pintarFinal();
  redibujar().then(tomarColores);
}

function guardarBorrador() {
  guardarLocal(`borrador:${cuenta.id}`, $('#texto').value);
  guardarLocal(`nombre:${cuenta.id}`, $('#nombre').value);
}

// La página toma los colores y la letra de la cuenta elegida.
function tomarColores() {
  const f = marcos[0];
  if (!f) return;
  const css = f.contentWindow.getComputedStyle(f.contentDocument.documentElement);
  const v = n => css.getPropertyValue(n).trim();
  const raiz = document.documentElement.style;
  raiz.setProperty('--c-fondo', v('--fondo'));
  raiz.setProperty('--c-tinta', v('--tinta'));
  raiz.setProperty('--c-acento', v('--acento'));
  raiz.setProperty('--c-acento-2', v('--acento-2'));
  raiz.setProperty('--c-fuente', v('--fuente-titulo'));
  // Carga en la página la misma letra de la cuenta para el nombre de arriba.
  copiarFuentes(f.contentDocument);
}

function copiarFuentes(doc) {
  for (const hoja of doc.styleSheets) {
    let reglas;
    try { reglas = hoja.cssRules; } catch (e) { continue; }
    for (const r of reglas) {
      if (r.constructor.name !== 'CSSFontFaceRule') continue;
      const base = hoja.href || doc.baseURI;
      const src = r.style.getPropertyValue('src').replace(/url\(["']?([^"')]+)["']?\)/g,
        (_, u) => `url("${new URL(u, base).href}")`);
      const familia = r.style.getPropertyValue('font-family').replace(/["']/g, '');
      const clave = familia + src;
      if (copiarFuentes.hechas.has(clave)) continue;
      copiarFuentes.hechas.add(clave);
      const peso = r.style.getPropertyValue('font-weight') || 'normal';
      const estilo = r.style.getPropertyValue('font-style') || 'normal';
      const fuente = new FontFace(familia, src, { weight: peso, style: estilo });
      fuente.load().then(x => document.fonts.add(x)).catch(() => {});
    }
  }
}
copiarFuentes.hechas = new Set();

// ---------- Lámina final ----------

function leerFinal() {
  const m = $('#texto').value.match(/^\s*final\s*:\s*(.*)$/mi);
  return m ? m[1].trim().replace(/^@/, '') : '';
}

function pintarFinal() {
  const caja = $('#finalOpciones');
  caja.innerHTML = '';
  const opciones = [
    { valor: '', texto: '@' + cuenta.usuario },
    ...cuentas.filter(c => c.id !== cuenta.id && c.red === 'tiktok').map(c => ({ valor: c.id, texto: '@' + c.usuario + ' · TikTok' })),
    ...cuentas.filter(c => c.id !== cuenta.id && c.red !== 'tiktok').map(c => ({ valor: c.id, texto: '@' + c.usuario })),
    { valor: 'no', texto: 'Sin lámina final' },
  ];
  const actual = leerFinal();
  for (const o of opciones) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = o.texto;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', o.valor === actual || (o.valor === '' && !opciones.some(x => x.valor === actual)));
    b.onclick = () => { ponerAjuste('final', o.valor); pintarFinal(); redibujar(); };
    caja.append(b);
  }
}

// Escribe (o borra si el valor está vacío) un ajuste antes de la primera lámina.
function ponerAjuste(clave, valor) {
  const ta = $('#texto');
  const lineas = ta.value.split('\n');
  const re = new RegExp(`^\\s*${clave}\\s*:`, 'i');
  const primera = lineas.findIndex(l => l.trim().startsWith('---'));
  const limite = primera === -1 ? lineas.length : primera;
  const i = lineas.slice(0, limite).findIndex(l => re.test(l));
  if (i >= 0) {
    if (valor === '') lineas.splice(i, 1); else lineas[i] = `${clave}: ${valor}`;
  } else if (valor !== '') {
    // Después de las notas iniciales, antes de la primera lámina.
    let pos = 0;
    while (pos < limite && lineas[pos].trim().startsWith('#')) pos++;
    lineas.splice(pos, 0, `${clave}: ${valor}`);
  }
  ta.value = lineas.join('\n');
  guardarBorrador();
}

// ---------- Códigos ----------

function pintarPiezas() {
  const crear = (p, ajuste) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pieza' + (ajuste ? ' ajuste' : '');
    b.innerHTML = `<code></code><span></span>`;
    b.querySelector('code').textContent = p.codigo;
    b.querySelector('span').textContent = p.desc;
    b.onclick = () => ajuste ? usarAjuste(p) : insertar(p);
    return b;
  };
  PIEZAS_LAMINAS.forEach(p => $('#piezasLaminas').append(crear(p, false)));
  PIEZAS_AJUSTES.forEach(p => $('#piezasAjustes').append(crear(p, true)));
}

function insertar(p) {
  const ta = $('#texto');
  const { selectionStart: a, selectionEnd: z, value: v } = ta;
  let nuevo, cursor;
  if (p.envolver) {
    const m = p.envolver;
    const sel = v.slice(a, z) || 'palabra';
    nuevo = v.slice(0, a) + m + sel + m + v.slice(z);
    cursor = a + sel.length + m.length * 2;
  } else {
    const antes = v.slice(0, a);
    const sep = antes === '' || antes.endsWith('\n\n') ? '' : antes.endsWith('\n') ? '\n' : '\n\n';
    const bloque = sep + p.texto + (p.texto.endsWith(' ') ? '' : '\n');
    nuevo = antes + bloque + v.slice(z);
    cursor = antes.length + bloque.length;
  }
  ta.value = nuevo;
  ta.focus();
  ta.setSelectionRange(cursor, cursor);
  alCambiarTexto();
}

function usarAjuste(p) {
  const actual = $('#texto').value.match(new RegExp(`^\\s*${p.clave}\\s*:\\s*(.*)$`, 'mi'));
  ponerAjuste(p.clave, actual ? actual[1] || p.valor : p.valor);
  pintarFinal();
  redibujar();
}

// ---------- Vista previa ----------

const observador = new ResizeObserver(es => es.forEach(e => e.target.style.setProperty('--escala', e.target.clientWidth / 1080)));

function nuevoMarco(destino, id) {
  const caja = document.createElement('div');
  caja.className = 'marco-prev';
  const f = document.createElement('iframe');
  f.title = 'Lámina';
  f.src = `plantilla/lamina.html?cuenta=${encodeURIComponent(id)}&v=${window.VERSION || Date.now()}`;
  f.cargado = new Promise(res => f.addEventListener('load', res, { once: true }));
  caja.append(f);
  destino.append(caja);
  caja.style.setProperty('--escala', caja.clientWidth / 1080);
  observador.observe(caja);
  return f;
}

async function redibujar() {
  const mio = ++turno;
  const texto = $('#texto').value;
  const semilla = crc32(nombreArchivo() + '.txt');

  if (!marcos.length) marcos.push(nuevoMarco($('#carrete'), cuenta.id));
  await marcos[0].cargado;
  await marcos[0].contentWindow.listo;
  if (mio !== turno) return;
  const total = marcos[0].contentWindow.leerPublicacion(texto).laminas.length;

  while (marcos.length < total) marcos.push(nuevoMarco($('#carrete'), cuenta.id));
  while (marcos.length > total) marcos.pop().parentElement.remove();

  await Promise.all(marcos.map(async (f, i) => {
    await f.cargado;
    await f.contentWindow.listo;
    if (mio === turno) await f.contentWindow.dibujar(texto, i + 1, semilla + i + 1);
  }));
  actualizarContador();
}

function actualizarContador() {
  const c = $('#carrete');
  const ancho = c.firstElementChild ? c.firstElementChild.offsetWidth + 14 : 1;
  const actual = Math.min(marcos.length, Math.round(c.scrollLeft / ancho) + 1);
  $('#contador').textContent = marcos.length ? `${actual} / ${marcos.length}` : '';
}

// ---------- Guardar ----------

async function guardarImagenes() {
  const boton = $('#guardar');
  boton.disabled = true;
  avisar('Preparando las imágenes…');
  try {
    await redibujar();
    const archivos = await Promise.all(marcos.map(async (f, i) => {
      const blob = await f.contentWindow.capturar();
      return new File([blob], `${nombreArchivo()}-${String(i + 1).padStart(2, '0')}.png`, { type: 'image/png' });
    }));
    // En el teléfono se abre el menú de compartir: guardar en la galería o mandar directo a Instagram o TikTok.
    if (navigator.canShare && navigator.canShare({ files: archivos })) {
      await navigator.share({ files: archivos });
      avisar('Listo.');
    } else {
      const zip = new JSZip();
      archivos.forEach(a => zip.file(a.name, a));
      descargar(await zip.generateAsync({ type: 'blob' }), `${cuenta.id}-${nombreArchivo()}.zip`);
      avisar(`Descargadas ${archivos.length} imágenes en un .zip.`);
    }
  } catch (e) {
    avisar(e.name === 'AbortError' ? '' : 'No se pudieron crear las imágenes. Intenta de nuevo.');
    console.error(e);
  } finally {
    boton.disabled = false;
  }
}

function descargar(blob, nombre) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function subirAlRepositorio() {
  if (cuenta.local) {
    avisar('Esta cuenta aún no está en el repositorio. Toca + para descargar su carpeta y súbela primero a cuentas/.');
    return;
  }
  const url = `https://github.com/${REPO}/new/main/publicaciones/${encodeURIComponent(cuenta.id)}` +
    `?filename=${encodeURIComponent(nombreArchivo() + '.txt')}&value=${encodeURIComponent($('#texto').value)}`;
  window.open(url, '_blank', 'noopener');
}

// ---------- Cuenta nueva ----------

const FONDOS = {
  papel: { fondo: '#e9dcc3', fondo2: '#d6c29f', tinta: '#2a1d14', suave: '#5b4636', grano: .55, vineta: 'rgba(60, 35, 15, .45)', marco: 'rgba(42, 29, 20, .3)' },
  claro: { fondo: '#fbfbf9', fondo2: '#efeee9', tinta: '#141414', suave: '#6b6b6b', grano: .18, vineta: 'transparent', marco: 'transparent' },
  oscuro: { fondo: '#17171a', fondo2: '#0b0b0d', tinta: '#f4f4f2', suave: '#a3a3a8', grano: .12, vineta: 'rgba(0, 0, 0, .55)', marco: 'transparent' },
};
const LETRAS = {
  clasica: { caras: [['Lora', 'Lora-Variable.ttf', '400 700'], ['Lora', 'Lora-Italic-Variable.ttf', '400 700', 'italic']], titulo: 'Lora, serif', texto: 'Lora, serif', peso: 600 },
  escolar: { caras: [['Fjalla', 'FjallaOne-Regular.ttf', '400'], ['Nunito', 'Nunito-Variable.ttf', '300 900']], titulo: 'Fjalla, sans-serif', texto: 'Nunito, sans-serif', peso: 400 },
  moderna: { caras: [['Inter', 'Inter-Variable.ttf', '300 900']], titulo: 'Inter, sans-serif', texto: 'Inter, sans-serif', peso: 800 },
};

function temaCss(d, rutaFuentes) {
  const f = FONDOS[d.fondo], l = LETRAS[d.letra];
  const caras = l.caras.map(([fam, archivo, peso, estilo]) =>
    `@font-face { font-family: ${fam}; src: url('${rutaFuentes}${archivo}'); font-weight: ${peso};${estilo ? ` font-style: ${estilo};` : ''} }`).join('\n');
  return `/* @${d.usuario} — creado en el editor */
${caras}
:root {
  --fondo: ${f.fondo};
  --fondo-2: ${f.fondo2};
  --tinta: ${f.tinta};
  --tinta-suave: ${f.suave};
  --acento: ${d.acento};
  --acento-2: ${d.acento2};
  --fuente-titulo: ${l.titulo};
  --fuente-texto: ${l.texto};
  --peso-titulo: ${l.peso};
  --grano: ${f.grano};
  --vineta: ${f.vineta};
  --marco: ${f.marco};
}
${d.fondo === 'oscuro' ? '.grano { mix-blend-mode: screen; }\n' : ''}${d.letra !== 'clasica' ? '.portada h1, .dato .numero, .cita .comilla { font-style: normal; }\n' : ''}`;
}

let fotoNueva = null;

function datosFormulario() {
  const fd = new FormData($('#formCuenta'));
  const usuario = limpiarId(fd.get('usuario')) || 'nueva.cuenta';
  const crudo = (fd.get('nombre') || '').trim() || usuario;
  const nombre = crudo.includes('|') ? crudo.split('|').slice(0, 2) : [crudo];
  return {
    usuario, nombre, red: fd.get('red'), llamado: fd.get('llamado'),
    acento: fd.get('acento'), acento2: fd.get('acento2'), fondo: fd.get('fondo'), letra: fd.get('letra'),
  };
}

function cuentaDesdeFormulario() {
  const d = datosFormulario();
  return {
    id: d.usuario,
    cuenta: { usuario: d.usuario, red: d.red, nombre: d.nombre, llamado: d.llamado, pie: d.usuario, ...(fotoNueva ? { perfil: 'perfil.jpg' } : {}) },
    tema: temaCss(d, '../fuentes/'),
    temaRepo: temaCss(d, '../../fuentes/'),
    foto: fotoNueva,
  };
}

let esperaVista;
function vistaCuenta() {
  clearTimeout(esperaVista);
  esperaVista = setTimeout(async () => {
    const n = cuentaDesdeFormulario();
    window.CUENTAS_LOCALES.__vista__ = n;
    const caja = $('#vistaCuenta');
    caja.innerHTML = '';
    const f = nuevoMarco(caja, '__vista__');
    caja.replaceWith(f.parentElement);
    f.parentElement.id = 'vistaCuenta';
    await f.cargado;
    await f.contentWindow.listo;
    await f.contentWindow.dibujar('', 1, 7);
  }, 250);
}

function abrirDialogo() {
  $('#formCuenta').reset();
  fotoNueva = null;
  $('#dialogoCuenta').showModal();
  vistaCuenta();
}

// Recorta la foto en cuadrado y la achica, para guardarla en el navegador.
function leerFoto(archivo) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const lado = Math.min(img.width, img.height), tam = Math.min(600, lado);
      const c = document.createElement('canvas');
      c.width = c.height = tam;
      c.getContext('2d').drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, tam, tam);
      res(c.toDataURL('image/jpeg', .88));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(archivo);
  });
}

async function guardarCuenta(e) {
  e.preventDefault();
  const n = cuentaDesdeFormulario();
  if (cuentas.some(c => c.id === n.id && !c.local)) {
    alert(`Ya existe la cuenta @${n.id}.`);
    return;
  }
  delete window.CUENTAS_LOCALES.__vista__;
  window.CUENTAS_LOCALES[n.id] = n;
  guardarLocal('cuentasLocales', JSON.stringify(window.CUENTAS_LOCALES));
  cuentas = cuentas.filter(c => c.id !== n.id).concat({ ...n.cuenta, id: n.id, foto: n.foto, local: true });
  pintarSelector();
  $('#dialogoCuenta').close();
  elegirCuenta(n.id);
  avisar(`@${n.id} quedó guardada en este navegador. Para el repositorio, usa "Descargar carpeta".`);
}

async function descargarCarpeta() {
  const n = cuentaDesdeFormulario();
  const zip = new JSZip();
  const dir = zip.folder(n.id);
  dir.file('cuenta.json', JSON.stringify(n.cuenta, null, 2) + '\n');
  dir.file('tema.css', n.temaRepo);
  if (n.foto) dir.file('perfil.jpg', n.foto.split(',')[1], { base64: true });
  descargar(await zip.generateAsync({ type: 'blob' }), `cuenta-${n.id}.zip`);
}

// ---------- Inicio ----------

let espera;
function alCambiarTexto() {
  clearTimeout(espera);
  espera = setTimeout(() => { guardarBorrador(); pintarFinal(); redibujar(); }, 350);
}
$('#texto').addEventListener('input', alCambiarTexto);
$('#nombre').addEventListener('change', () => { guardarBorrador(); redibujar(); });
$('#carrete').addEventListener('scroll', actualizarContador, { passive: true });
$('#guardar').addEventListener('click', guardarImagenes);
$('#github').addEventListener('click', subirAlRepositorio);
$('#formCuenta').addEventListener('input', vistaCuenta);
$('#formCuenta').addEventListener('submit', guardarCuenta);
$('#cerrarCuenta').addEventListener('click', () => $('#dialogoCuenta').close());
$('#descargarCuenta').addEventListener('click', descargarCarpeta);
$('#formCuenta [name=foto]').addEventListener('change', async e => {
  const a = e.target.files[0];
  fotoNueva = a ? await leerFoto(a).catch(() => null) : null;
  vistaCuenta();
});

pintarPiezas();
cargarCuentas().catch(e => {
  avisar('No se pudieron cargar las cuentas.');
  console.error(e);
});
