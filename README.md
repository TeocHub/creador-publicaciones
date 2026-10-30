# Creador de publicaciones

Carruseles para Instagram y TikTok (1080 × 1350) a partir de texto, con el estilo de cada cuenta.

**Editor:** https://teochub.github.io/creador-publicaciones/

## Usarlo desde el editor

1. Toca la foto de la cuenta: teoc.books, intentodocente o cabsamot.
2. Escribe la publicación. La vista previa se actualiza sola y el borrador queda guardado en el navegador.
3. **Guardar imágenes:** en el teléfono abre el menú de compartir (guardar en la galería o mandar directo a Instagram). En el computador descarga un `.zip`.
4. **Subir al repositorio** (opcional): abre GitHub con el archivo ya escrito. Al confirmar, GitHub genera también las imágenes en `salida/<cuenta>/<nombre>/`.

## Cómo se escribe

```
pie: Entre dos Mundos
volanta: Historia real · ficción

--- portada
Título grande
Subtítulo

--- dato
Frase principal.
Frase secundaria, más pequeña.

--- cita
Una frase real.
Quién la dijo

--- cierre
Invitación a leer.
Dónde encontrarlo
```

Los ajustes antes de la primera lámina son opcionales: `pie:` cambia el texto inferior, `volanta:` pone una línea pequeña sobre el título y `final: no` quita la lámina de la cuenta. Las líneas con `#` son notas. Una palabra entre `*asteriscos*` sale destacada.

Al final de cada carrusel se agrega sola la lámina de la cuenta: foto de perfil, nombre y botones.

## Cuentas

Cada cuenta tiene su carpeta en `cuentas/<cuenta>/`:

| Archivo | Para qué sirve |
|---|---|
| `perfil.png` | Foto de perfil original, cuadrada o no. Se recorta en círculo automáticamente. |
| `cuenta.json` | Usuario, cómo se parte el nombre en dos colores, frase final y pie por defecto. |
| `tema.css` | Colores y tipografías de la cuenta. |

Para cambiar la foto, sube la imagen a la carpeta de la cuenta con el nombre `perfil.png`. Si es `.jpg`, cambia `"perfil"` en `cuenta.json`. Mientras no haya foto se muestra la inicial.

Para agregar una cuenta nueva, copia una carpeta existente, cambia sus archivos y suma su nombre a `cuentas/cuentas.json`.

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html`, `editor/` | El editor (GitHub Pages). |
| `plantilla/` | El diseño de las láminas: `lamina.html`, `base.css` y `lamina.js`. |
| `publicaciones/<cuenta>/` | Los textos de cada publicación. |
| `salida/<cuenta>/` | Las imágenes que genera GitHub Actions. |
| `generar.py` | Genera las imágenes con un navegador invisible (lo usa GitHub Actions). |
| `fuentes/`, `vendor/` | Tipografías libres (SIL OFL) y librerías para exportar imágenes. |

## En el PC (opcional)

```
pip install playwright
python3 -m playwright install chromium
python3 generar.py
```
