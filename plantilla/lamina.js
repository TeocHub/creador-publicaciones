// Arma una lámina a partir del texto de una publicación.
// Lo llama generar.py con: dibujar(texto, numeroDeLamina, semilla)

const PIE = 'Entre dos Mundos';

function leerLaminas(texto) {
  const laminas = [];
  let actual = null;
  for (const bruta of texto.split('\n')) {
    const linea = bruta.trim();
    if (linea.startsWith('#')) continue;
    if (linea.startsWith('---')) {
      actual = { tipo: linea.slice(3).trim(), lineas: [] };
      laminas.push(actual);
    } else if (actual && linea) {
      actual.lineas.push(linea);
    }
  }
  return laminas;
}

// Generador aleatorio con semilla: la misma publicación siempre sale igual.
function azar(semilla) {
  let s = semilla >>> 0;
  return (min, max) => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return min + (s / 4294967296) * (max - min);
  };
}

// Línea temblorosa, como hecha con pluma.
function trazo(r, x1, x2, y, grosor = 2.2) {
  const pts = [];
  for (let x = x1; x <= x2; x += r(14, 26)) pts.push(`${x.toFixed(1)},${(y + r(-1.6, 1.6)).toFixed(1)}`);
  return `<polyline points="${pts.join(' ')}" fill="none" stroke="var(--tinta)" stroke-width="${grosor}"
    stroke-linecap="round" stroke-linejoin="round" opacity=".75"/>`;
}

// Círculo irregular, como un sello de lacre.
function sello(r, cx, cy, radio) {
  const pts = [];
  for (let g = 0; g <= 360; g += 8) {
    const a = g * Math.PI / 180, rr = radio + r(-2.5, 2.5);
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polyline points="${pts.join(' ')}" fill="none" stroke="var(--lacre)" stroke-width="2.4" opacity=".8"/>`;
}

const DISENOS = {
  portada: (l, n, r) => `
    <div class="portada">
      <p class="volanta">Historia real · ficción</p>
      <h1 style="transform:rotate(${r(-1.2, 1.2).toFixed(2)}deg)">${l[0]}</h1>
      <svg class="raya" viewBox="0 0 600 20">${trazo(r, 10, 590, 10, 3)}</svg>
      <p class="bajada">${l[1] ?? ''}</p>
    </div>`,
  dato: (l, n, r) => `
    <div class="dato">
      <span class="numero">${String(n - 1).padStart(2, '0')}</span>
      <p class="principal">${l[0]}</p>
      <svg class="raya corta" viewBox="0 0 300 20">${trazo(r, 6, 294, 10)}</svg>
      <p class="secundario">${l.slice(1).join(' ')}</p>
    </div>`,
  cita: (l, n, r) => `
    <div class="cita" style="transform:rotate(${r(-.7, .7).toFixed(2)}deg)">
      <span class="comilla">«</span>
      <p class="frase">${l[0]}</p>
      <p class="firma">${l[1] ?? ''}</p>
    </div>`,
  cierre: (l, n, r) => `
    <div class="cierre">
      <svg class="sello" viewBox="0 0 200 200">${sello(r, 100, 100, 82)}${sello(r, 100, 100, 70)}</svg>
      <p class="principal">${l[0]}</p>
      <p class="secundario">${l[1] ?? ''}</p>
    </div>`,
};

function dibujar(texto, n, semilla) {
  const laminas = leerLaminas(texto);
  const lam = laminas[n - 1];
  const r = azar(semilla);
  const diseno = DISENOS[lam.tipo] ?? DISENOS.dato;
  document.querySelector('#ruido').setAttribute('seed', semilla % 1000);
  document.querySelector('.lienzo').innerHTML = diseno(lam.lineas, n, r);
  document.querySelector('.pie').innerHTML = `<span>${PIE}</span><span>${n} / ${laminas.length}</span>`;
  return laminas.length;
}

window.leerLaminas = leerLaminas;
window.dibujar = dibujar;
