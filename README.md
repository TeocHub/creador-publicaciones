# Láminas — Entre dos Mundos

Generador de carruseles para Instagram y TikTok (1080 × 1350) a partir de un archivo de texto.

## Cómo se usa

1. Crear un archivo en `publicaciones/`, por ejemplo `capitulo-04.txt`.
2. Escribir una lámina por bloque. La palabra después de `---` es el tipo:

```
--- portada
Título grande
Subtítulo

--- dato
Frase principal.
Frase secundaria, más pequeña.

--- cita
Una frase real del capítulo.
Entre dos Mundos · Cap. 4

--- cierre
Invitación a leer.
Capítulo 4 en Wattpad · Teoc679
```

3. Guardar y subir a GitHub. En unos dos minutos las imágenes aparecen en `salida/capitulo-04/`.

## Qué hace cada archivo

| Archivo | Para qué sirve |
|---|---|
| `plantilla/estilo.css` | Colores, tipografía y medidas. Cambiar la estética es tocar solo este archivo. |
| `plantilla/lamina.js` | Lee el texto y arma cada lámina, con trazos y sellos que varían un poco cada vez. |
| `plantilla/lamina.html` | El "papel": grano, viñeta, marco y pie. |
| `generar.py` | Abre la plantilla en un navegador invisible y saca una foto de cada lámina. |
| `.github/workflows/generar.yml` | Hace que GitHub ejecute `generar.py` solo cuando cambias una publicación. |

## Usarlo en el PC (opcional)

```
pip install playwright
python3 -m playwright install chromium
python3 generar.py publicaciones/capitulo-03.txt
```

La tipografía Lora tiene licencia libre (SIL Open Font License), así que puede ir dentro del repositorio.
