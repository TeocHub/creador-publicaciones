"""Ordena la carpeta cuentas/ para que agregar o cambiar algo sea solo subir archivos.

- Si en la carpeta de una cuenta hay una imagen con cualquier nombre, la convierte
  en perfil.jpg (cuadrada, 800 px) y borra el archivo original.
- Si una carpeta no tiene cuenta.json, crea uno básico con el nombre de la carpeta.
- Reescribe cuentas/cuentas.json con todas las cuentas que existen.

GitHub Actions lo ejecuta solo cada vez que cambia algo en cuentas/.
"""
import json
from pathlib import Path

from PIL import Image, ImageOps

CUENTAS = Path(__file__).resolve().parent.parent / "cuentas"
IMAGENES = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".bmp"}


def ordenar_foto(carpeta):
    imagenes = [f for f in carpeta.iterdir() if f.suffix.lower() in IMAGENES]
    nuevas = [f for f in imagenes if f.name != "perfil.jpg"]
    if not nuevas:
        return False
    # Si hay varias, la más reciente es la que vale.
    elegida = max(nuevas, key=lambda f: f.stat().st_mtime)
    foto = ImageOps.exif_transpose(Image.open(elegida)).convert("RGB")
    lado = min(foto.size)
    foto = ImageOps.fit(foto, (lado, lado), centering=(0.5, 0.5))
    if lado > 800:
        foto = foto.resize((800, 800), Image.LANCZOS)
    foto.save(carpeta / "perfil.jpg", quality=90)
    for f in nuevas:
        f.unlink()
    return True


def ordenar_config(carpeta):
    ruta = carpeta / "cuenta.json"
    config = json.loads(ruta.read_text(encoding="utf-8")) if ruta.exists() else {}
    usuario = config.get("usuario") or carpeta.name
    nuevo = {
        "usuario": usuario,
        "red": config.get("red", "instagram"),
        "nombre": config.get("nombre", [usuario]),
        "perfil": "perfil.jpg" if (carpeta / "perfil.jpg").exists() else config.get("perfil"),
        "llamado": config.get("llamado", "like, comenta, comparte y guarda"),
        "pie": config.get("pie", usuario),
    }
    nuevo.update({k: v for k, v in config.items() if k not in nuevo})
    if nuevo["perfil"] is None:
        del nuevo["perfil"]
    if nuevo != config:
        ruta.write_text(json.dumps(nuevo, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    lista_ruta = CUENTAS / "cuentas.json"
    previas = json.loads(lista_ruta.read_text(encoding="utf-8")) if lista_ruta.exists() else []
    carpetas = sorted(c for c in CUENTAS.iterdir() if c.is_dir() and not c.name.startswith("."))
    for c in carpetas:
        if ordenar_foto(c):
            print(f"{c.name}: foto renombrada a perfil.jpg")
        ordenar_config(c)
    nombres = [c.name for c in carpetas]
    lista = [n for n in previas if n in nombres] + [n for n in nombres if n not in previas]
    lista_ruta.write_text(json.dumps(lista, ensure_ascii=False) + "\n", encoding="utf-8")
    print("cuentas:", ", ".join(lista))


if __name__ == "__main__":
    main()
