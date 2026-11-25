
import os
import re
import tempfile
from pathlib import Path

# ============================================================
# CONFIGURACIÓN
# ============================================================

# Carpeta desde la que se ejecuta el script y sus subcarpetas.
CARPETA_POSTS = Path(__file__).resolve().parent

# Primera ejecución: False para simular.
# Cuando compruebes el resultado, cambia a True.
APLICAR_CAMBIOS = False

# Carpetas que no se deben recorrer.
CARPETAS_EXCLUIDAS = {
    ".git",
    "public",
    "resources",
    "node_modules",
    "vendor",
    ".venv",
    "venv",
}

# ============================================================
# REEMPLAZOS
# ============================================================

# Escribe aquí las URL antiguas y sus nuevas direcciones.
# Puedes incluir tantos reemplazos como necesites.

REEMPLAZOS_URL = {
    #"/ruta-antigua/": "/ruta-nueva/",
    "avenida de San [Juan Pablo II](/noticias/santoral/10-22-San-Juan-Pablo-II/)": "avenida de San Juan Pablo II",
    "[nuestra parroquia](/fotos.html) de San Francisco y [Santa Clara](/santaclara.html)":"nuestra parroquia de San Francisco y Santa Clara",
    "parroquia de San Francisco y [Santa Clara](/santaclara.html)": "parroquia de San Francisco y Santa Clara",
    "parroquia San Francisco y [Santa Clara](/santaclara.html)": "parroquia San Francisco y Santa Clara",
}

# ============================================================
# FUNCIONES
# ============================================================

def buscar_archivos_markdown():
    """Busca todos los Markdown, incluidas las subcarpetas."""

    archivos = []

    for archivo in CARPETA_POSTS.rglob("*"):

        if not archivo.is_file():
            continue

        if archivo.suffix.lower() != ".md":
            continue

        relativos = archivo.relative_to(CARPETA_POSTS)

        if any(parte in CARPETAS_EXCLUIDAS for parte in relativos.parts):
            continue

        archivos.append(archivo)

    return sorted(archivos)


def validar_reemplazos():
    """Comprueba que el diccionario de reemplazos sea válido."""

    if not REEMPLAZOS_URL:
        raise ValueError("No has definido ningún reemplazo.")

    for antigua, nueva in REEMPLAZOS_URL.items():

        if not isinstance(antigua, str) or not antigua.strip():
            raise ValueError(f"URL antigua no válida: {antigua}")

        if not isinstance(nueva, str) or not nueva.strip():
            raise ValueError(f"URL nueva no válida: {nueva}")

        if antigua == nueva:
            raise ValueError(f"La URL antigua y nueva son iguales: {antigua}")


def reemplazar_urls(texto):
    """Sustituye las URL antiguas por las nuevas en una sola pasada."""

    patron = re.compile(
        "|".join(
            re.escape(url)
            for url in sorted(REEMPLAZOS_URL, key=len, reverse=True)
        )
    )

    encontrados = {}

    def reemplazar(match):
        antigua = match.group(0)
        nueva = REEMPLAZOS_URL[antigua]

        encontrados[antigua] = encontrados.get(antigua, 0) + 1

        return nueva

    texto_nuevo = patron.sub(reemplazar, texto)

    return texto_nuevo, encontrados


def guardar_archivo(ruta, contenido, tiene_bom):
    """Guarda el archivo conservando su codificación UTF-8."""

    codificacion = "utf-8-sig" if tiene_bom else "utf-8"
    datos = contenido.encode(codificacion)
    permisos = ruta.stat().st_mode

    temporal = None

    try:
        with tempfile.NamedTemporaryFile(
            mode="wb",
            dir=ruta.parent,
            prefix=f".{ruta.name}.",
            suffix=".tmp",
            delete=False,
        ) as archivo:

            temporal = Path(archivo.name)
            archivo.write(datos)

        os.chmod(temporal, permisos)
        os.replace(temporal, ruta)

    finally:
        if temporal and temporal.exists():
            temporal.unlink()


# ============================================================
# PROGRAMA PRINCIPAL
# ============================================================

def main():

    print("\n==============================================")
    print("             CORRECTOR DE ENLACES")
    print("==============================================")

    print(f"Carpeta: {CARPETA_POSTS}")
    print(f"Modo: {'APLICAR CAMBIOS' if APLICAR_CAMBIOS else 'SIMULACIÓN'}")

    validar_reemplazos()

    archivos = buscar_archivos_markdown()

    total_archivos = 0
    total_reemplazos = 0

    print("\nReemplazos configurados:")

    for antigua, nueva in REEMPLAZOS_URL.items():
        print(f"  {antigua} -> {nueva}")

    for ruta in archivos:

        datos = ruta.read_bytes()
        tiene_bom = datos.startswith(b"\xef\xbb\xbf")
        texto = datos.decode("utf-8-sig")

        texto_nuevo, encontrados = reemplazar_urls(texto)

        if texto_nuevo == texto:
            continue

        total_archivos += 1
        total_reemplazos += sum(encontrados.values())

        print(f"\n[{ 'ACTUALIZADO' if APLICAR_CAMBIOS else 'CAMBIARÍA' }] "
              f"{ruta.relative_to(CARPETA_POSTS)}")

        for antigua, cantidad in encontrados.items():
            print(f"  {cantidad} aparición(es): {antigua} -> "
                  f"{REEMPLAZOS_URL[antigua]}")

        if APLICAR_CAMBIOS:
            guardar_archivo(ruta, texto_nuevo, tiene_bom)

    print("\n==============================================")
    print("                  RESUMEN")
    print("==============================================")
    print(f"Archivos examinados: {len(archivos)}")
    print(f"Archivos afectados: {total_archivos}")
    print(f"Reemplazos encontrados: {total_reemplazos}")

    if not APLICAR_CAMBIOS:
        print("\nSIMULACIÓN: no se ha modificado ningún archivo.")
        print("Si el resultado es correcto, cambia APLICAR_CAMBIOS = True.")
    else:
        print("\nProceso finalizado.")

    print("==============================================\n")


if __name__ == "__main__":
    main()
