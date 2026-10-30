"""Arma el historial de publicaciones que muestra el editor.

- Borra de salida/ las publicaciones cuyo .txt ya no existe (así, borrar el .txt
  en GitHub también la quita del historial).
- Crea una miniatura de la portada de cada publicación.
- Escribe salida/indice.json con título, fecha y número de láminas por cuenta.

GitHub Actions lo ejecuta después de generar las imágenes.
"""
import json
import re
import shutil
import subprocess
import zlib
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "salida"
PUBLICACIONES = RAIZ / "publicaciones"


def fecha_de(ruta):
    # Fecha del último cambio del texto según git; si no hay historial, la del archivo.
    try:
        r = subprocess.run(["git", "log", "-1", "--format=%cI", "--", str(ruta)],
                           cwd=RAIZ, capture_output=True, text=True, check=True)
        if r.stdout.strip():
            from datetime import datetime, timezone
            return datetime.fromisoformat(r.stdout.strip()).astimezone(timezone.utc).isoformat()
    except Exception:
        pass
    from datetime import datetime, timezone
    return datetime.fromtimestamp(ruta.stat().st_mtime, timezone.utc).isoformat()


def titulo_de(texto, respaldo):
    lineas = texto.splitlines()
    for i, l in enumerate(lineas):
        if l.strip().lower().startswith("---"):
            for siguiente in lineas[i + 1:]:
                s = siguiente.strip()
                if s and not s.startswith("#"):
                    return re.sub(r"[*_~]", "", s)
            break
    return respaldo


def main():
    indice = {}
    if not SALIDA.exists():
        SALIDA.mkdir()
    for dir_cuenta in sorted(d for d in SALIDA.iterdir() if d.is_dir()):
        cuenta = dir_cuenta.name
        items = []
        for dir_pub in sorted(d for d in dir_cuenta.iterdir() if d.is_dir()):
            txt = PUBLICACIONES / cuenta / f"{dir_pub.name}.txt"
            if not txt.exists():
                shutil.rmtree(dir_pub)
                print(f"{cuenta}/{dir_pub.name}: sin texto, se quita del historial")
                continue
            laminas = sorted(dir_pub.glob("lamina-*.png"))
            if not laminas:
                continue
            mini = dir_pub / "miniatura.jpg"
            portada = Image.open(laminas[0]).convert("RGB")
            portada.thumbnail((360, 450))
            portada.save(mini, quality=82)
            texto = txt.read_text(encoding="utf-8")
            items.append({
                "nombre": dir_pub.name,
                "titulo": titulo_de(texto, dir_pub.name),
                "fecha": fecha_de(txt),
                "laminas": len(laminas),
                # Huella del texto: el editor la usa para saber si ya hay imágenes de lo que estás viendo.
                "huella": zlib.crc32(texto.strip().encode()),
            })
        if not any(dir_cuenta.iterdir()):
            dir_cuenta.rmdir()
            continue
        items.sort(key=lambda x: x["fecha"], reverse=True)
        indice[cuenta] = items
    (SALIDA / "indice.json").write_text(json.dumps(indice, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("historial:", {k: len(v) for k, v in indice.items()})


if __name__ == "__main__":
    main()
