// Editor de publicaciones: elige cuenta, escribe y mira las láminas en vivo.

const REPO = 'TeocHub/creador-publicaciones';
const $ = s => document.querySelector(s);

const EJEMPLO = `# Las líneas con # son notas y no aparecen en las láminas.
volanta: Para pensar

--- portada
Un título que haga detenerse
Una bajada que explique de qué va

--- dato
La idea principal, en una frase.
Un detalle o ejemplo que la acompaña.

--- cita
Una frase que valga la pena guardar.
Quién la dijo

--- cierre
Una invitación a seguir leyendo.
Dónde encontrar más`;

let cuentas = [];
let cuenta = null;
let marcos = [];        // iframes de la vista previa
let turno = 0;          // evita que un dibujo viejo pise uno nuevo

// ---------- Utilidades ----------

const guardarLocal = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const leerLocal = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };

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

const avisar = t => { $('#estado').textContent = t; };

// ---------- Cuentas ----------

async function cargarCuentas() {
  const ids = await fetch('cuentas/cuentas.json').then(r => r.json());
  cuentas = await Promise.all(ids.map(async id => {
    const c = await fetch(`cuentas/${id}/cuenta.json`).then(r => r.json());
    c.id = id;
    if (c.perfil) {
      const url = `cuentas/${id}/${c.perfil}`;
      const ok = await fetch(url, { method: 'HEAD' }).then(r => r.ok).catch(() => false);
      c.foto = ok ? url : null;
    }
    return c;
  }));

  const caja = $('#cuentas');
  for (const c of cuentas) {
    const b = document.createElement('button');
    b.className = 'cuenta-btn';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-label', c.usuario);
    b.title = '@' + c.usuario;
    if (c.foto) b.style.backgroundImage = `url('${c.foto}')`;
    else b.textContent = c.usuario[0].toUpperCase();
    b.onclick = () => elegirCuenta(c.id);
    b.dataset.id = c.id;
    caja.append(b);
  }
  const ultima = leerLocal('cuenta');
  elegirCuenta(cuentas.some(c => c.id === ultima) ? ultima : cuentas[0].id);
}

function elegirCuenta(id) {
  if (cuenta) guardarBorrador();
  cuenta = cuentas.find(c => c.id === id);
  guardarLocal('cuenta', id);
  document.querySelectorAll('.cuenta-btn').forEach(b => b.setAttribute('aria-checked', b.dataset.id === id));
  $('#cuentaElegida').innerHTML = `Publicación para <b>@${cuenta.usuario}</b>`;
  $('#texto').value = leerLocal(`borrador:${id}`) ?? EJEMPLO;
  $('#nombre').value = leerLocal(`nombre:${id}`) ?? 'nueva-publicacion';
  $('#carrete').innerHTML = '';
  marcos = [];
  redibujar();
}

function guardarBorrador() {
  guardarLocal(`borrador:${cuenta.id}`, $('#texto').value);
  guardarLocal(`nombre:${cuenta.id}`, $('#nombre').value);
}

// ---------- Vista previa ----------

function nuevoMarco() {
  const caja = document.createElement('div');
  caja.className = 'marco-prev';
  const f = document.createElement('iframe');
  f.title = 'Lámina';
  f.src = `plantilla/lamina.html?cuenta=${encodeURIComponent(cuenta.id)}`;
  f.cargado = new Promise(res => f.addEventListener('load', res, { once: true }));
  caja.append(f);
  $('#carrete').append(caja);
  ajustarEscala(caja);
  return f;
}

const observador = new ResizeObserver(es => es.forEach(e => ajustarEscala(e.target)));
function ajustarEscala(caja) {
  caja.style.setProperty('--escala', caja.clientWidth / 1080);
  observador.observe(caja);
}

async function redibujar() {
  const mio = ++turno;
  const texto = $('#texto').value;
  const semilla = crc32(nombreArchivo() + '.txt');

  // Cuántas láminas hay: se calcula con la primera plantilla.
  if (!marcos.length) marcos.push(nuevoMarco());
  await marcos[0].cargado;
  await marcos[0].contentWindow.listo;
  if (mio !== turno) return;
  const total = marcos[0].contentWindow.leerPublicacion(texto).laminas.length;

  while (marcos.length < total) marcos.push(nuevoMarco());
  while (marcos.length > total) marcos.pop().parentElement.remove();

  await Promise.all(marcos.map(async (f, i) => {
    await f.cargado;
    await f.contentWindow.listo;
    if (mio === turno) f.contentWindow.dibujar(texto, i + 1, semilla + i + 1);
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

async function imagenes() {
  return Promise.all(marcos.map(async (f, i) => {
    const blob = await f.contentWindow.capturar();
    return new File([blob], `${nombreArchivo()}-${String(i + 1).padStart(2, '0')}.png`, { type: 'image/png' });
  }));
}

async function guardarImagenes() {
  const boton = $('#guardar');
  boton.disabled = true;
  avisar('Preparando las imágenes…');
  try {
    await redibujar();
    const archivos = await imagenes();
    // En el teléfono se abre el menú de compartir: guardar en la galería o mandar directo a Instagram.
    if (navigator.canShare && navigator.canShare({ files: archivos })) {
      await navigator.share({ files: archivos });
      avisar('Listo.');
    } else {
      const zip = new JSZip();
      archivos.forEach(a => zip.file(a.name, a));
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${cuenta.id}-${nombreArchivo()}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      avisar(`Descargadas ${archivos.length} imágenes en un .zip.`);
    }
  } catch (e) {
    avisar(e.name === 'AbortError' ? '' : 'No se pudieron crear las imágenes. Intenta de nuevo.');
    console.error(e);
  } finally {
    boton.disabled = false;
  }
}

// Abre GitHub con el archivo ya escrito: solo queda confirmar y GitHub genera las imágenes.
function subirAlRepositorio() {
  const url = `https://github.com/${REPO}/new/main/publicaciones/${encodeURIComponent(cuenta.id)}` +
    `?filename=${encodeURIComponent(nombreArchivo() + '.txt')}&value=${encodeURIComponent($('#texto').value)}`;
  window.open(url, '_blank', 'noopener');
}

// ---------- Inicio ----------

let espera;
$('#texto').addEventListener('input', () => {
  clearTimeout(espera);
  espera = setTimeout(() => { guardarBorrador(); redibujar(); }, 350);
});
$('#nombre').addEventListener('change', () => { guardarBorrador(); redibujar(); });
$('#carrete').addEventListener('scroll', actualizarContador, { passive: true });
$('#guardar').addEventListener('click', guardarImagenes);
$('#github').addEventListener('click', subirAlRepositorio);

cargarCuentas().catch(e => {
  avisar('No se pudieron cargar las cuentas.');
  console.error(e);
});
