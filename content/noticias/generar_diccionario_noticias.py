
import re
from pathlib import Path

# ============================================================
# CONFIGURACIÓN
# ============================================================

# Carpeta donde está este script (raíz de /noticias).
CARPETA_NOTICIAS = Path(__file__).resolve().parent

# Archivo de texto que se generará con las URL encontradas.
ARCHIVO_SALIDA = CARPETA_NOTICIAS / "diccionario_articulos.txt"

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
# FUNCIONES
# ============================================================

def obtener_front_matter(texto):
    """Extrae el front matter del artículo, si existe."""

    lineas = texto.splitlines()

    if not lineas or lineas[0].strip() not in {"---", "+++", ";;;"}:
        return ""

    delimitador = lineas[0].strip()

    for i in range(1, len(lineas)):
        if lineas[i].strip() == delimitador:
            return "\n".join(lineas[1:i])

    return ""


def obtener_valor_front_matter(cabecera, campo):
    """Obtiene un campo sencillo del front matter YAML o TOML."""

    patron = rf'(?m)^{re.escape(campo)}\s*:\s*["\']?([^"\'\r\n]+?)["\']?\s*$'
    coincidencia = re.search(patron, cabecera)

    return coincidencia.group(1).strip() if coincidencia else None


def obtener_url(archivo):
    """Construye la URL pública del artículo."""

    relativo = archivo.relative_to(CARPETA_NOTICIAS)

    try:
        texto = archivo.read_text(encoding="utf-8-sig")
    except (OSError, UnicodeError) as error:
        print(f"[ERROR] No se pudo leer {archivo}: {error}")
        return None

    cabecera = obtener_front_matter(texto)

    # Si Hugo tiene una URL personalizada, respetarla.
    url_personalizada = obtener_valor_front_matter(cabecera, "url")

    if url_personalizada:
        return url_personalizada

    # index.md representa la URL de su carpeta.
    if archivo.stem.casefold() == "index":
        partes = relativo.parent.parts

    else:
        partes = relativo.parent.parts + (
            obtener_valor_front_matter(cabecera, "slug") or archivo.stem,
        )

    ruta = "/".join(partes)

    if ruta:
        return f"/noticias/{ruta.strip('/')}/"

    return "/noticias/"


def buscar_articulos():
    """Busca recursivamente los artículos Markdown."""

    archivos = []

    for archivo in CARPETA_NOTICIAS.rglob("*"):

        if not archivo.is_file():
            continue

        if archivo.suffix.lower() != ".md":
            continue

        relativos = archivo.relative_to(CARPETA_NOTICIAS)

        if any(parte in CARPETAS_EXCLUIDAS for parte in relativos.parts):
            continue

        # Los _index.md son páginas de sección, no artículos.
        if archivo.stem.casefold() == "_index":
            continue

        archivos.append(archivo)

    return sorted(archivos)


# ============================================================
# PROGRAMA PRINCIPAL
# ============================================================

def main():

    print("\n==============================================")
    print("       GENERADOR DE URL DE NOTICIAS")
    print("==============================================\n")

    articulos = buscar_articulos()
    entradas = []

    for archivo in articulos:

        url = obtener_url(archivo)

        if not url:
            continue

        # Nombre del archivo para identificar el artículo.
        nombre = archivo.relative_to(CARPETA_NOTICIAS)

        entradas.append((nombre, url))

    # Orden alfabético por URL.
    entradas.sort(key=lambda x: x[1].casefold())

    # Generar texto preparado para completar el diccionario.
    lineas = []

    for nombre, url in entradas:
        lineas.append(f"    # {nombre}")
        lineas.append(f'    # "PALABRA CLAVE": "{url}",')
        lineas.append("")

    contenido = "\n".join(lineas)

    ARCHIVO_SALIDA.write_text(contenido, encoding="utf-8")

    print(f"Artículos encontrados: {len(entradas)}")
    print(f"Archivo generado: {ARCHIVO_SALIDA}")
    print("\nProceso finalizado.\n")


if __name__ == "__main__":
    main()
