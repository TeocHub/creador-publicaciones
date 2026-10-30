"""Convierte cada publicación en imágenes PNG listas para subir.

Uso:
  python3 generar.py publicaciones/capitulo-03.txt   (una publicación)
  python3 generar.py                                 (todas las de la carpeta)

Las imágenes quedan en salida/<nombre-de-la-publicación>/.
"""
import sys
import zlib
from pathlib import Path

from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).parent
PLANTILLA = (RAIZ / "plantilla" / "lamina.html").resolve().as_uri()


def generar(pagina, archivo):
    texto = archivo.read_text(encoding="utf-8")
    base = zlib.crc32(archivo.name.encode())  # semilla estable por publicación
    destino = RAIZ / "salida" / archivo.stem
    destino.mkdir(parents=True, exist_ok=True)

    pagina.goto(PLANTILLA)
    pagina.evaluate("document.fonts.ready")
    total = pagina.evaluate("t => leerLaminas(t).length", texto)
    for n in range(1, total + 1):
        pagina.evaluate("([t, n, s]) => dibujar(t, n, s)", [texto, n, base + n])
        pagina.wait_for_timeout(100)
        pagina.screenshot(path=str(destino / f"lamina-{n:02d}.png"))
    print(f"{archivo.name}: {total} láminas en salida/{archivo.stem}/")


def main():
    archivos = [Path(a) for a in sys.argv[1:]] or sorted((RAIZ / "publicaciones").glob("*.txt"))
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        pagina = navegador.new_page(viewport={"width": 1080, "height": 1350})
        for archivo in archivos:
            generar(pagina, archivo)
        navegador.close()


if __name__ == "__main__":
    main()
