"""Convierte las publicaciones en imágenes PNG listas para subir.

Cada publicación vive en publicaciones/<cuenta>/<nombre>.txt
y sus imágenes quedan en salida/<cuenta>/<nombre>/.

Uso:
  python3 generar.py                                          (todas)
  python3 generar.py publicaciones/teoc.books/capitulo-03.txt (una)
"""
import functools
import http.server
import sys
import threading
import zlib
from pathlib import Path

from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).parent.resolve()


def servidor():
    # La plantilla lee archivos con fetch, así que se sirve por http y no como file://
    class Silencioso(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

    manejador = functools.partial(Silencioso, directory=str(RAIZ))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), manejador)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def generar(pagina, puerto, archivo):
    cuenta = archivo.parent.name
    if not (RAIZ / "cuentas" / cuenta / "cuenta.json").exists():
        print(f"{cuenta}/{archivo.name}: la cuenta no existe en cuentas/, se omite")
        return
    texto = archivo.read_text(encoding="utf-8")
    base = zlib.crc32(archivo.name.encode())
    destino = RAIZ / "salida" / cuenta / archivo.stem
    destino.mkdir(parents=True, exist_ok=True)
    for viejo in destino.glob("lamina-*.png"):
        viejo.unlink()

    pagina.goto(f"http://127.0.0.1:{puerto}/plantilla/lamina.html?cuenta={cuenta}")
    pagina.evaluate("window.listo")
    total = pagina.evaluate("t => leerPublicacion(t).laminas.length", texto)
    lamina = pagina.locator(".lamina")
    for n in range(1, total + 1):
        pagina.evaluate("([t, n, s]) => dibujar(t, n, s)", [texto, n, base + n])
        pagina.wait_for_timeout(120)
        lamina.screenshot(path=str(destino / f"lamina-{n:02d}.png"), omit_background=True)
    print(f"{cuenta}/{archivo.name}: {total} láminas")


def main():
    archivos = [Path(a).resolve() for a in sys.argv[1:]] or sorted((RAIZ / "publicaciones").glob("*/*.txt"))
    srv = servidor()
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        pagina = navegador.new_page(viewport={"width": 1080, "height": 1350})
        for archivo in archivos:
            generar(pagina, srv.server_port, archivo)
        navegador.close()
    srv.shutdown()


if __name__ == "__main__":
    main()
