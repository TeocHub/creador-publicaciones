# Creador de publicaciones

Carruseles para Instagram y TikTok (1080 × 1350) a partir de texto, con el estilo de cada cuenta.

**Editor:** https://teochub.github.io/creador-publicaciones/

## Usarlo desde el editor

1. Toca la foto de la cuenta. La página toma sus colores y su letra.
2. Elige la **lámina final**: la de la misma cuenta, la de TikTok, la de otra cuenta o ninguna.
3. Escribe la publicación, o toca los **códigos** de abajo para insertarlos. La vista previa se actualiza sola y el borrador queda guardado en el navegador.
4. **Guardar imágenes:** en el teléfono abre el menú de compartir (galería, Instagram o TikTok). En el computador descarga un `.zip`.
5. **Subir al repositorio** (opcional): abre GitHub con el archivo ya escrito. Al confirmar, GitHub genera también las imágenes en `salida/<cuenta>/<nombre>/`.

## Códigos

| Código | Qué hace |
|---|---|
| `--- portada` | Título grande y una bajada. |
| `--- dato` | Una idea numerada y un detalle más pequeño. |
| `--- cita` | Una frase destacada y quién la dijo. |
| `--- cierre` | Invitación final y dónde seguir. |
| `*palabra*` | Destaca una palabra con el color de la cuenta. |
| `# nota` | Nota personal; no aparece en las láminas. |
| `pie: texto` | Cambia el texto de abajo de cada lámina. |
| `volanta: texto` | Línea pequeña sobre el título de la portada. |
| `final: cuenta` | Qué cuenta firma la lámina final (`final: tiktok`), o `final: no` para quitarla. |

Los ajustes (`pie:`, `volanta:`, `final:`) van antes de la primera lámina.

## Cuentas

Cada cuenta tiene su carpeta en `cuentas/<cuenta>/` con `cuenta.json` (usuario, red, nombre en dos colores, frase final), `tema.css` (colores y letras) y `perfil.jpg`.

**Cambiar una foto de perfil:** sube la imagen a la carpeta de la cuenta con cualquier nombre. GitHub la recorta en cuadrado, la renombra a `perfil.jpg` y borra la anterior.

**Agregar una cuenta:** en el editor toca **+**, completa el formulario y mira la vista previa. "Guardar cuenta" la deja lista en tu navegador. "Descargar carpeta" baja un `.zip`: descomprímelo y sube la carpeta a `cuentas/` en GitHub. La lista de cuentas se actualiza sola.

**TikTok:** la cuenta `tiktok` sirve como lámina final para cualquier publicación. Cambia `"usuario"` y `"nombre"` en `cuentas/tiktok/cuenta.json` por tu usuario real y sube tu foto a esa carpeta.

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html`, `editor/` | El editor (GitHub Pages). |
| `plantilla/` | El diseño de las láminas: `lamina.html`, `base.css` y `lamina.js`. |
| `publicaciones/<cuenta>/` | Los textos de cada publicación. |
| `salida/<cuenta>/` | Las imágenes que genera GitHub Actions. |
| `generar.py` | Genera las imágenes con un navegador invisible (lo usa GitHub Actions). |
| `scripts/ordenar_cuentas.py` | Renombra fotos de perfil y actualiza la lista de cuentas. |
| `fuentes/`, `vendor/` | Tipografías libres (SIL OFL) y librerías para exportar imágenes. |

## En el PC (opcional)

```
pip install playwright
python3 -m playwright install chromium
python3 generar.py
```
