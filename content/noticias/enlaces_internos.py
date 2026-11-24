import os
import re
import sys
import tempfile
from collections import defaultdict
from pathlib import Path


# ============================================================
# CONFIGURACIÓN
# ============================================================

# Coloca este script en la carpeta raíz que contiene los posts
# oficiales. Se procesarán todos los .md de esa carpeta y sus
# subcarpetas.
CARPETA_POSTS = Path(__file__).resolve().parent

# Primera ejecución: deja False para ver qué cambiaría sin guardar.
# Cuando compruebes el resultado, cambia a True.
APLICAR_CAMBIOS = True

# Carpetas que no se deben recorrer (repositorios, compilaciones, etc.).
CARPETAS_EXCLUIDAS = {
    ".git",
    "public",
    "resources",
    "node_modules",
    "vendor",
    ".venv",
    "venv",
}


# Diccionario de enlaces internos.
# Formato: "expresión que puede aparecer en el texto": "URL"
#
# Puedes asignar VARIAS expresiones a la MISMA URL.
# El programa insertará como máximo UN enlace a cada URL por artículo.
#
# Ejemplo:
# "grupo de matrimonios" y "proyecto amor conyugal"
# apuntan a /grupomatrimonios.html. Solo se enlazará la primera
# expresión que aparezca en cada artículo.


ENLACES_INTERNOS = {
    "nuestra parroquia": "/fotos.html",
    ("donativo","donativos"): "/donativos.html",
    "despacho parroquial": "/contacto.html#features5-2t",
    ("contacta con la parroquia","contacto parroquial"): "/contacto.html",
    "horario de confesiones": "/index.html#horario-confesiones",
    ("horario de misa","horarios de Misas","horarios de Misa"): "/index.html#horario-misas",
    "Sacramentos": "/noticias/formacion/los-7-sacramentos/",
    "Eucaristía": "/comunion.html",
    "sacramento de la confirmación": "/confirmacion.html",
    "bautismo": "/bautismo.html",
    ("confesión", "sacramento de la reconciliación"): "/confesion.html",
    "orden sacerdotal": "/ordensacerdotal.html",
    "unción de enfermos": "/uncionenfermos.html",
    ("grupos parroquiales", "nuestros grupos"): "/grupos.html",
    ("exposición del Santísimo", "adoración Eucarística", "adoración al Santísimo"): "/exposicion-santisimo.html",
    "grupo de oración": "/grupodeoracion.html",
    "Cáritas": "/caritas.html",
    "grupo de limpieza": "/grupolimpieza.html",
    "escuela Caleb": "/grupo-caleb.html",
    "misión David": "/mision-david.html",
    ("grupo de matrimonios", "proyecto amor conyugal"): "/grupomatrimonios.html",
    "grupo Caná": "/grupo-cana.html",
    "grupo de manualidades": "/manualidades.html",
    "grupo de confirmación": "/grupoconfirmacion.html",
    "grupo de liturgia": "/grupo-liturgia.html",
    "monaguillo": "/monaguillos.html",
    ("coro de misa","nuestro coro"): "/corojoven.html",
    "adoración nocturna": "/ane.html",
    "oración del Padre Pío": "/grupo-padre-pio.html",
    ("oración de las madres", "oración de madres"): "/grupooracionmadres.html",
    "san Francisco de Asís": "/sanfrancisco.html",
    "santa Clara": "/santaclara.html",
    "tablón de anuncios": "/tablon/",
    "Dones del Espíritu Santo": "/noticias/formacion/7-dones/",
    "nuestro calendario": "/calendario/",

    "breviario": "/noticias/2026-10-19-san-francisco-y-santa-clara-dos-vidas-unidas-por-la-oracion/",
    "karma": "/noticias/2026-10-20-por-que-un-cristiano-no-debe-creer-en-el-karma/",
    ("Parábola del sembrador", "escuchar la Palabra de Dios"): "/noticias/escuchar-la-palabra-para-vivir-en-el-amor/",
    "espiritualidad de san Francisco": "/noticias/formacion/10-09-espiritualidad-san-francisco/",
    "el sufrimiento": "/noticias/formacion/2026-07-09-por-que-dios-permite-el/",
    ("amor al prójimo"): "/noticias/formacion/en-jesucristo-el-amor-de-dios-se-hace-entrega/",
    ("la santidad", "amistad con Jesús"): "/noticias/formacion/la-santidad-cotidiana-amistad-que-conduce-a-la-vida-eterna/",
    # "PALABRA CLAVE": "/noticias/formacion/tuvo-jesus-hermanos/",
    ("confianza en Dios","confiar en Dios","la incertidumbre"): "/noticias/gen/santa-clara-confiar-en-dios-desde-la-humildad/",
    ("Jubileo franciscano","año Jubilar Franciscano","jubileo 2026"): "/noticias/jubileo-franciscano/",
    "OCEO": "/noticias/oceo-noviembre/",
    "Vigilia del perdón de Asís": "/noticias/oraciones/07-30-vigilia-del-perdon-de-asis/",

    # oraciones\09-25-novena-sf-dia1.md
    # "PALABRA CLAVE": "/noticias/oraciones/09-25-novena-sf-dia1/",

    # oraciones\09-26-novena-sf-dia2.md
    # "PALABRA CLAVE": "/noticias/oraciones/09-26-novena-sf-dia2/",

    # oraciones\09-27-novena-sf-dia3.md
    # "PALABRA CLAVE": "/noticias/oraciones/09-27-novena-sf-dia3/",

    # oraciones\09-28-novena-sf-dia4.md
    # "PALABRA CLAVE": "/noticias/oraciones/09-28-novena-sf-dia4/",

    # oraciones\09-29-novena-sf-dia5.md
    # "PALABRA CLAVE": "/noticias/oraciones/09-29-novena-sf-dia5/",

    # oraciones\09-30-novena-sf-dia6.md
    # "PALABRA CLAVE": "/noticias/oraciones/09-30-novena-sf-dia6/",

    # oraciones\10-01-novena-sf-dia7.md
    # "PALABRA CLAVE": "/noticias/oraciones/10-01-novena-sf-dia7/",

    # oraciones\10-02-novena-sf-dia8.md
    # "PALABRA CLAVE": "/noticias/oraciones/10-02-novena-sf-dia8/",

    # oraciones\10-03-novena-sf-dia9.md
    # "PALABRA CLAVE": "/noticias/oraciones/10-03-novena-sf-dia9/",

    # oraciones\10-09-triduo-pilar-dia1.md
    # "PALABRA CLAVE": "/noticias/oraciones/10-09-triduo-pilar-dia1/",

    # oraciones\10-10-triduo-pilar-dia2.md
    # "PALABRA CLAVE": "/noticias/oraciones/10-10-triduo-pilar-dia2/",

    # oraciones\10-11-triduo-pilar-dia3.md
    # "PALABRA CLAVE": "/noticias/oraciones/10-11-triduo-pilar-dia3/",

    # oraciones\10-20-triduo-jp2-dia1.md
    # "PALABRA CLAVE": "/noticias/oraciones/10-20-triduo-jp2-dia1/",

    # oraciones\10-21-triduo-jp2-dia2.md
    # "PALABRA CLAVE": "/noticias/oraciones/10-21-triduo-jp2-dia2/",

    # oraciones\10-22-triduo-jp2-dia3.md
    # "PALABRA CLAVE": "/noticias/oraciones/10-22-triduo-jp2-dia3/",

    # oraciones\10-oracion-del-domund.md
    # "PALABRA CLAVE": "/noticias/oraciones/10-oracion-del-domund/",

    # oraciones\11-29-novena-inmaculada-1.md
    # "PALABRA CLAVE": "/noticias/oraciones/11-29-novena-inmaculada-1/",

    # oraciones\11-30-novena-inmaculada-2.md
    # "PALABRA CLAVE": "/noticias/oraciones/11-30-novena-inmaculada-2/",

    # oraciones\12-01-novena-inmaculada-3.md
    # "PALABRA CLAVE": "/noticias/oraciones/12-01-novena-inmaculada-3/",

    # oraciones\12-02-novena-inmaculada-4.md
    # "PALABRA CLAVE": "/noticias/oraciones/12-02-novena-inmaculada-4/",

    # oraciones\12-03-novena-inmaculada-5.md
    # "PALABRA CLAVE": "/noticias/oraciones/12-03-novena-inmaculada-5/",

    # oraciones\12-04-novena-inmaculada-6.md
    # "PALABRA CLAVE": "/noticias/oraciones/12-04-novena-inmaculada-6/",

    # oraciones\12-05-novena-inmaculada-7.md
    # "PALABRA CLAVE": "/noticias/oraciones/12-05-novena-inmaculada-7/",

    # oraciones\12-06-novena-inmaculada-8.md
    # "PALABRA CLAVE": "/noticias/oraciones/12-06-novena-inmaculada-8/",

    # oraciones\12-07-novena-inmaculada-9.md
    # "PALABRA CLAVE": "/noticias/oraciones/12-07-novena-inmaculada-9/",

    # oraciones\2026-08-01-guia-para-participar-en-la-santa-misa.md
    ("Santa Misa","misa"): "/noticias/oraciones/2026-08-01-guia-para-participar-en-la-santa-misa/",
    "corona franciscana": "/noticias/oraciones/corona-franciscana/",

    # oraciones\jornada-mundial-pobres.md
    # "PALABRA CLAVE": "/noticias/oraciones/jornada-mundial-pobres/",

    "oración a San Francisco de Asís": "/noticias/oraciones/oracion-jubileo/",

    "rosario": "/noticias/oraciones/rezar-el-rosario/",

    "operación Kilo": "/noticias/parroquia/11-09-operacion-kilo/",

    "novena a san Francisco": "/noticias/parroquia/24-09-Novena-San-Francisco/",

    # "PALABRA CLAVE": "/noticias/santoral/01-01-María madre de Dios/",

    # santoral\01-02-San-Basilio-Magno.md
    # "PALABRA CLAVE": "/noticias/santoral/01-02-San-Basilio-Magno/",

    # santoral\01-06-Epifanía-del-Señor.md
    # "PALABRA CLAVE": "/noticias/santoral/01-06-Epifanía-del-Señor/",

    # santoral\01-24-San-Francisco-de-Sales.md
    # "PALABRA CLAVE": "/noticias/santoral/01-24-San-Francisco-de-Sales/",

    # santoral\01-28-Santo-Tomas-de-Aquino.md
    # "PALABRA CLAVE": "/noticias/santoral/01-28-Santo-Tomas-de-Aquino/",

    # santoral\02-02-presentacion-del-señor.md
    # "PALABRA CLAVE": "/noticias/santoral/02-02-presentacion-del-señor/",

    # santoral\03-19-San-José-esposo-de-la-Virgen.md
    # "PALABRA CLAVE": "/noticias/santoral/03-19-San-José-esposo-de-la-Virgen/",

    # santoral\03-25-Anunciación-del-Señor.md
    # "PALABRA CLAVE": "/noticias/santoral/03-25-Anunciación-del-Señor/",

    # santoral\04-25-San-Marcos.md
    # "PALABRA CLAVE": "/noticias/santoral/04-25-San-Marcos/",

    # santoral\04-29-Santa-Catalina-de-Siena.md
    # "PALABRA CLAVE": "/noticias/santoral/04-29-Santa-Catalina-de-Siena/",

    # santoral\05-02-San-Atanasio.md
    # "PALABRA CLAVE": "/noticias/santoral/05-02-San-Atanasio/",

    # santoral\05-03-San-Felipe-apóstol.md
    # "PALABRA CLAVE": "/noticias/santoral/05-03-San-Felipe-apóstol/",

    # santoral\05-14-San-Matías.md
    # "PALABRA CLAVE": "/noticias/santoral/05-14-San-Matías/",

    "San Bernardino": "/noticias/santoral/05-20-san-bernardino-siena/",

    # santoral\05-22-Santa-Rita-de-Casia.md
    # "PALABRA CLAVE": "/noticias/santoral/05-22-Santa-Rita-de-Casia/",

    # santoral\06-11-San-Bernabé-Apóstol.md
    # "PALABRA CLAVE": "/noticias/santoral/06-11-San-Bernabé-Apóstol/",

    # santoral\06-13-San-Antonio-de-Padua.md
    # "PALABRA CLAVE": "/noticias/santoral/06-13-San-Antonio-de-Padua/",

    # santoral\06-24-Nacimiento-San-Juan-Bautista.md
    # "PALABRA CLAVE": "/noticias/santoral/06-24-Nacimiento-San-Juan-Bautista/",

    # santoral\06-28-San-Ireneo-de-Lyon.md
    # "PALABRA CLAVE": "/noticias/santoral/06-28-San-Ireneo-de-Lyon/",

    # santoral\06-29-San-Pedro-y-San-Pablo.md
    # "PALABRA CLAVE": "/noticias/santoral/06-29-San-Pedro-y-San-Pablo/",

    # santoral\07-03-Santo-Tomás-Apóstol.md
    # "PALABRA CLAVE": "/noticias/santoral/07-03-Santo-Tomás-Apóstol/",

    # santoral\07-11-San-Benito.md
    # "PALABRA CLAVE": "/noticias/santoral/07-11-San-Benito/",

    # santoral\07-15-San-Buenaventura.md
    # "PALABRA CLAVE": "/noticias/santoral/07-15-San-Buenaventura/",

    # santoral\07-22-Santa-María-Magdalena.md
    # "PALABRA CLAVE": "/noticias/santoral/07-22-Santa-María-Magdalena/",

    # santoral\07-25-San-Santiago-Apostol.md
    # "PALABRA CLAVE": "/noticias/santoral/07-25-San-Santiago-Apostol/",

    # santoral\07-26-San-Joaquín-y-Santa-Ana.md
    # "PALABRA CLAVE": "/noticias/santoral/07-26-San-Joaquín-y-Santa-Ana/",

    # santoral\07-31-San-Ignacio-de-Loyola.md
    # "PALABRA CLAVE": "/noticias/santoral/07-31-San-Ignacio-de-Loyola/",

    # santoral\08-08-Santo-Domingo-de-Guzmán.md
    # "PALABRA CLAVE": "/noticias/santoral/08-08-Santo-Domingo-de-Guzmán/",

    # santoral\08-11-Santa-Clara-de-Asís.md
    # "PALABRA CLAVE": "/noticias/santoral/08-11-Santa-Clara-de-Asís/",



    "la Asunción": "/noticias/santoral/08-15-la-asuncion-de-la-virgen/",
    "san Bartolomé": "/noticias/santoral/08-24-San-Bartolomé-Apóstol/",
    "san Agustín": "/noticias/santoral/08-28-San-Agustín/",
    "San Gregorio": "/noticias/santoral/09-03-san-gregorio-magno/",
    "Teresa de Calcuta": "/noticias/santoral/09-05-santa-teresa-de-calcuta/",
    ("natividad de la Virgen María","nacimiento de María"): "/noticias/santoral/09-08-natividad-de-la-virgen-maria/",
    "la Santa Cruz": "/noticias/santoral/09-14-Exaltacion-de-la-Santa-Cruz/",
    "san Mateo": "/noticias/santoral/09-21-San-Mateo/",
    "padre Pío": "/noticias/santoral/09-23-san-pío-de-pietrelcina/",
    "san Jerónimo": "/noticias/santoral/09-30-San-Jeronimo/",
    "santa Teresa del niño Jesús": "/noticias/santoral/10-01-Santa-Teresa-del-niño-Jesus/",

    # santoral\10-04-San-Francisco-de-Asís.md
    # "PALABRA CLAVE": "/noticias/santoral/10-04-San-Francisco-de-Asís/",

    "nuestra Señora del Rosario": "/noticias/santoral/10-07-ns-del-rosario/",
    "nuestra Señora del buen remedio": "/noticias/santoral/10-08-nuestra-senora-del-buen-remedio/",
    ("Virgen del Pilar","día del Pilar"): "/noticias/santoral/10-12-virgen-pilar/",
    "Santa Teresa de Jesús": "/noticias/santoral/10-15-Santa-Teresa-de-Jesús/",
    "san Ignacio de Antioquía": "/noticias/santoral/10-17-San-Ignacio-de-Antioquia/",
    "san Lucas": "/noticias/santoral/10-18-San-Lucas/",
    "Pedro Alcántara": "/noticias/santoral/10-19-san-pedro-alcantara/",
    "Juan Pablo II": "/noticias/santoral/10-22-San-Juan-Pablo-II/",
    "Juan Capistrano": "/noticias/santoral/10-23-san-juan-capistrano/",
    "día de todos los santos": "/noticias/santoral/11-01-Todos-los-Santos/",
    "Isabel de Hungría": "/noticias/santoral/11-17-santa-isabel-hungria/",
    "presentación de María": "/noticias/santoral/11-21-presentacion-maria/",
    "san Andrés": "/noticias/santoral/11-30-San-Andres/",
    "san Francisco Javier": "/noticias/santoral/12-03-San-Francisco-Javier/",

    # santoral\12-07-San-Ambrosio.md
    # "PALABRA CLAVE": "/noticias/santoral/12-07-San-Ambrosio/",

    # santoral\12-08-Inmaculada-Concepcion.md
    # "PALABRA CLAVE": "/noticias/santoral/12-08-Inmaculada-Concepcion/",

    # santoral\12-14-San-Juan-de-la-Cruz.md
    # "PALABRA CLAVE": "/noticias/santoral/12-14-San-Juan-de-la-Cruz/",

    # santoral\12-25-Navidad.md
    # "PALABRA CLAVE": "/noticias/santoral/12-25-Navidad/",

    # santoral\12-26-San-Esteban.md
    # "PALABRA CLAVE": "/noticias/santoral/12-26-San-Esteban/",

    # santoral\12-27-san-juan-evangelista.md
    # "PALABRA CLAVE": "/noticias/santoral/12-27-san-juan-evangelista/",

    # santoral\12-28-Los-Santos-Inocentes.md
    # "PALABRA CLAVE": "/noticias/santoral/12-28-Los-Santos-Inocentes/",

    # tiempo liturgico\01-Bautismo-del-Señor.md
    # "PALABRA CLAVE": "/noticias/tiempo-liturgico/01-Bautismo-del-Señor/",

    # tiempo liturgico\02-Miércoles-de-ceniza.md
    # "PALABRA CLAVE": "/noticias/tiempo-liturgico/02-Miércoles-de-ceniza/",

    # tiempo liturgico\03-Domingo-de-pascua.md
    # "PALABRA CLAVE": "/noticias/tiempo-liturgico/03-Domingo-de-pascua/",

    # tiempo liturgico\03-Domingo-de-ramos.md
    # "PALABRA CLAVE": "/noticias/tiempo-liturgico/03-Domingo-de-ramos/",

    # tiempo liturgico\03-Jueves-santo.md
    # "PALABRA CLAVE": "/noticias/tiempo-liturgico/03-Jueves-santo/",

    # tiempo liturgico\03-Pascua-de-resurreción.md
    # "PALABRA CLAVE": "/noticias/tiempo-liturgico/03-Pascua-de-resurreción/",

    # tiempo liturgico\03-Sábado-santo.md
    # "PALABRA CLAVE": "/noticias/tiempo-liturgico/03-Sábado-santo/",

    # tiempo liturgico\03-Viernes-santo.md
    # "PALABRA CLAVE": "/noticias/tiempo-liturgico/03-Viernes-santo/",

    # tiempo liturgico\05-Corpus-Christi.md
    # "PALABRA CLAVE": "/noticias/tiempo-liturgico/05-Corpus-Christi/",

    # tiempo liturgico\05-La-Ascensión-del-Señor.md
    # "PALABRA CLAVE": "/noticias/tiempo-liturgico/05-La-Ascensión-del-Señor/",

    # tiempo liturgico\05-La-Santísima-Trinidad.md
    # "PALABRA CLAVE": "/noticias/tiempo-liturgico/05-La-Santísima-Trinidad/",

    # tiempo liturgico\05-Pentecostés.md
    # "PALABRA CLAVE": "/noticias/tiempo-liturgico/05-Pentecostés/",

    # tiempo liturgico\06-Sagrado-Corazón-de-Jesús.md
    # "PALABRA CLAVE": "/noticias/tiempo-liturgico/06-Sagrado-Corazón-de-Jesús/",

    "Domund": "/noticias/tiempo-liturgico/10-Domund/",
    "Iglesia Diocesana": "/noticias/tiempo-liturgico/11-dia-iglesia-diocesana/",
    ("rey del universo", "Cristo Rey"): "/noticias/tiempo-liturgico/11-jesucristo-rey-del-universo/",
    "jornada mundial de los pobres": "/noticias/tiempo-liturgico/11-jornada-mundial-pobres/",
    "vigilia de Cristo Rey": "/noticias/tiempo-liturgico/11-vigilia-cristo-rey/",
    "Sagrada Familia": "/noticias/tiempo-liturgico/12-La-Sagrada-Familia/",

    # tiempo liturgico\Platilla-TL.md
    # "PALABRA CLAVE": "/noticias/tiempo-liturgico/Platilla-TL/",

    # vigilia-cristo-rey-2026.md
    # "PALABRA CLAVE": "/noticias/vigilia-cristo-rey-2026/",

    # vigilia-espigas.md
    # "PALABRA CLAVE": "/noticias/vigilia-espigas/",

    # visita-iesu-communio.md
    # "PALABRA CLAVE": "/noticias/visita-iesu-communio/",

    # visita-monjas.md
    # "PALABRA CLAVE": "/noticias/visita-monjas/",

    # visita-papa-leon.md
    # "PALABRA CLAVE": "/noticias/visita-papa-leon/",

    # visita-santamariacruz.md
    # "PALABRA CLAVE": "/noticias/visita-santamariacruz/",
    ("paciencia y esperanza","esperanza y paciencia","esperar en Dios","mantener la esperanza"): "/noticias/gen/esperanza-y-paciencia-aprender-a-esperar-en-dios/",
    ("providencia", "confiar cuando parece difícil"): "/noticias/gen/providencia-y-oracion-confiar-sin-quedarse-pasivos/",

}


# ============================================================
# PROTECCIÓN DEL CONTENIDO
# ============================================================

# Enlaces Markdown inline, imágenes, enlaces de referencia,
# comentarios HTML, etiquetas <a> completas, bloques HTML de código
# y código inline. Se protegen antes de buscar palabras clave.
PATRONES_PROTEGIDOS = [
    re.compile(r"<!--[\s\S]*?-->"),
    re.compile(r"<a\b[^>]*>[\s\S]*?</a\s*>", re.IGNORECASE),
    re.compile(
        r"<(script|style|pre|code)\b[^>]*>[\s\S]*?</\1\s*>",
        re.IGNORECASE,
    ),
    # Código inline primero: así no se protegen por separado enlaces
    # Markdown que aparezcan dentro de un fragmento de código.
    re.compile(r"(?<!`)(`+)(?!`).*?(?<!`)\1(?!`)", re.DOTALL),
    # Imágenes/enlaces Markdown, admitiendo anidamiento sencillo.
    re.compile(
        r"!?\[(?:\\.|[^\[\]]|\[(?:\\.|[^\[\]])*\])*\]"
        r"(?:\((?:\\.|[^()]|\([^()]*\))*\)|\s*\[[^\]]*\])",
        re.DOTALL,
    ),
    # Etiquetas HTML y autolinks: no se modifican sus atributos.
    re.compile(r"<[^>\n]+>"),
]


def proteger_bloques_especiales(texto):
    """
    Protege bloques cercados Markdown (``` o ~~~), incluso si ocupan
    varias líneas. Devuelve el texto con marcadores y los bloques.
    """
    lineas = texto.splitlines(keepends=True)
    salida = []
    bloques = {}
    dentro = False
    caracter = None
    longitud = 0
    acumulado = []

    for linea in lineas:
        if not dentro:
            apertura = re.match(r"^[ \t]{0,3}(`{3,}|~{3,})", linea)
            if apertura:
                marca = apertura.group(1)
                dentro = True
                caracter = marca[0]
                longitud = len(marca)
                acumulado = [linea]
            else:
                salida.append(linea)
        else:
            acumulado.append(linea)
            cierre = re.match(r"^[ \t]{0,3}(`+|~+)[ \t]*(?:\r?\n)?$", linea)
            if (
                cierre
                and cierre.group(1)[0] == caracter
                and len(cierre.group(1)) >= longitud
            ):
                marcador = f"\x00BLOQUE_PROTEGIDO_{len(bloques)}\x00"
                bloques[marcador] = "".join(acumulado)
                salida.append(marcador)
                dentro = False
                caracter = None
                longitud = 0
                acumulado = []

    if dentro:
        # Si el bloque quedó sin cierre, se protege hasta el final.
        marcador = f"\x00BLOQUE_PROTEGIDO_{len(bloques)}\x00"
        bloques[marcador] = "".join(acumulado)
        salida.append(marcador)

    return "".join(salida), bloques


def proteger_elementos_en_linea(texto):
    """Protege elementos Markdown/HTML que no deben recibir enlaces."""
    protegidos = {}

    for patron in PATRONES_PROTEGIDOS:
        def reemplazar(match):
            marcador = f"\x00ELEMENTO_PROTEGIDO_{len(protegidos)}\x00"
            protegidos[marcador] = match.group(0)
            return marcador

        texto = patron.sub(reemplazar, texto)

    return texto, protegidos


def restaurar_marcadores(texto, *diccionarios):
    """Restaura los bloques y elementos protegidos."""
    for diccionario in diccionarios:
        for marcador, contenido in diccionario.items():
            texto = texto.replace(marcador, contenido)
    return texto


# ============================================================
# CABECERA FRONT MATTER
# ============================================================

def separar_cabecera(texto):
    """
    Separa la cabecera de Hugo del cuerpo y la conserva literalmente.
    Admite delimitadores YAML (---), TOML (+++) y JSON (;;;).
    """
    lineas = texto.splitlines(keepends=True)

    if not lineas:
        return "", texto

    delimitador = lineas[0].strip()
    if delimitador not in {"---", "+++", ";;;"}:
        return "", texto

    for indice in range(1, len(lineas)):
        if lineas[indice].strip() == delimitador:
            return (
                "".join(lineas[:indice + 1]),
                "".join(lineas[indice + 1:]),
            )

    raise ValueError(
        f"Cabecera {delimitador} sin cierre. "
        "Se omite el archivo para evitar modificarlo."
    )


# ============================================================
# ENLACES INTERNOS
# ============================================================



def validar_diccionario():
    """
    Comprueba las expresiones y las URL del diccionario.

    Admite:
    - "matrimonio": "/matrimonio/"
    - ("monaguillo", "monaguillos"): "/monaguillos/"
    """

    normalizadas = {}

    for expresiones, url in ENLACES_INTERNOS.items():

        # Convertir expresiones individuales en tuplas
        if isinstance(expresiones, str):
            expresiones = (expresiones,)

        if not isinstance(expresiones, (tuple, list)):
            raise ValueError(
                f"Formato incorrecto en el diccionario: {expresiones}"
            )

        if not isinstance(url, str) or not url.strip():
            raise ValueError(
                f"URL vacía o no válida: {expresiones}"
            )

        if not expresiones:
            raise ValueError("Hay un grupo de expresiones vacío.")

        for expresion in expresiones:

            if not isinstance(expresion, str) or not expresion.strip():
                raise ValueError(
                    f"Expresión vacía o no válida: {expresiones}"
                )

            clave = expresion.casefold()

            if clave in normalizadas:
                raise ValueError(
                    f"Expresión duplicada: {expresion}"
                )

            normalizadas[clave] = url

    return normalizadas


def urls_ya_enlazadas(texto):
    """
    Detecta destinos que ya aparecen enlazados en el cuerpo.
    Ignora bloques de código, comentarios HTML y código inline.
    """
    encontradas = set()

    # Primero retiramos temporalmente los bloques que pueden contener
    # ejemplos de enlaces, pero que no son enlaces activos del artículo.
    texto_visible, _ = proteger_bloques_especiales(texto)

    for patron in (
        PATRONES_PROTEGIDOS[0],  # comentarios HTML
        PATRONES_PROTEGIDOS[2],  # bloques HTML pre/code/script/style
        PATRONES_PROTEGIDOS[3],  # código inline
    ):
        texto_visible = patron.sub(" ", texto_visible)

    # Enlaces Markdown inline: [texto](/ruta/) o [texto](<URL>)
    patron_markdown = re.compile(
        r"\]\(\s*<?([^)\s>]+)>?(?:\s+['\"][^'\"]*['\"])?\s*\)"
    )
    encontradas.update(patron_markdown.findall(texto_visible))

    # Enlaces HTML: <a href="/ruta/">...</a>
    patron_html = re.compile(
        r"""<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']""",
        re.IGNORECASE,
    )
    encontradas.update(patron_html.findall(texto_visible))

    # Definiciones Markdown: [referencia]: /ruta/
    patron_referencia = re.compile(
        r"(?m)^\s*\[[^\]]+\]:\s*<?(\S+?)>?(?:\s+['\"].*?['\"])?\s*$"
    )
    encontradas.update(patron_referencia.findall(texto_visible))

    return encontradas


def compilar_patron_enlaces():
    """
    Crea un único patrón con todas las expresiones.
    Las expresiones más largas tienen prioridad.
    Admite varias expresiones asociadas a una misma URL.
    """

    normalizadas = validar_diccionario()

    # Las claves ya están aplanadas: cada una es una expresión
    # individual, aunque originalmente estuviera dentro de una tupla.
    expresiones = sorted(
        normalizadas.keys(),
        key=len,
        reverse=True,
    )

    alternativas = "|".join(
        re.escape(expresion) for expresion in expresiones
    )

    patron = re.compile(
        rf"(?<!\w)(?P<expresion>{alternativas})(?!\w)",
        re.IGNORECASE,
    )

    return patron, normalizadas



def aplicar_enlaces(texto, archivo):
    """
    Inserta como máximo un enlace por URL y por archivo.
    Las apariciones posteriores de la misma expresión quedan intactas.
    """
    patron, normalizadas = compilar_patron_enlaces()
    urls_usadas = urls_ya_enlazadas(texto)
    enlaces_insertados = []

    texto_protegido, bloques = proteger_bloques_especiales(texto)
    texto_protegido, elementos = proteger_elementos_en_linea(
        texto_protegido
    )

    def reemplazar(match):
        expresion_original = match.group("expresion")
        url = normalizadas[expresion_original.casefold()]

        # Evitar enlaces hacia la propia página.
        if es_enlace_a_propia_pagina(archivo, url):
            return expresion_original

        # Una sola aparición por destino, aunque existan varios alias.
        if url in urls_usadas:
            return expresion_original

        urls_usadas.add(url)
        enlaces_insertados.append((expresion_original, url))

        # Se conserva exactamente la capitalización del texto original.
        return f"[{expresion_original}]({url})"

    texto_protegido = patron.sub(reemplazar, texto_protegido)

    texto_protegido = restaurar_marcadores(
        texto_protegido,
        elementos,
        bloques,
    )

    return texto_protegido, enlaces_insertados

# ============================================================
# COMPROBAR SI ES MISMA URL
# ============================================================

from urllib.parse import urlsplit, unquote

def es_enlace_a_propia_pagina(archivo, url):
    """Comprueba si la URL apunta al propio artículo."""

    nombre_archivo = archivo.stem.casefold()

    ruta_url = unquote(urlsplit(url).path).strip("/")
    ultimo_segmento = ruta_url.split("/")[-1].casefold()

    # Elimina posibles extensiones de la URL.
    if ultimo_segmento.endswith(".html"):
        ultimo_segmento = ultimo_segmento[:-5]

    return nombre_archivo == ultimo_segmento

# ============================================================
# ARCHIVOS Y GUARDADO
# ============================================================

def buscar_archivos_markdown():
    """Busca recursivamente todos los archivos .md y .MD."""
    archivos = []

    for ruta in CARPETA_POSTS.rglob("*"):
        if not ruta.is_file() or ruta.suffix.lower() != ".md":
            continue

        relativos = ruta.relative_to(CARPETA_POSTS)
        if any(parte in CARPETAS_EXCLUIDAS for parte in relativos.parts):
            continue

        archivos.append(ruta)

    return sorted(archivos)


def leer_archivo(ruta):
    """Lee UTF-8 conservando BOM y finales de línea originales."""
    datos = ruta.read_bytes()
    tiene_bom = datos.startswith(b"\xef\xbb\xbf")
    texto = datos.decode("utf-8-sig")
    return texto, tiene_bom


def guardar_archivo_seguro(ruta, contenido, tiene_bom):
    """Guarda mediante reemplazo atómico y conserva los permisos."""
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


def procesar_archivo(ruta):
    """Procesa un Markdown y devuelve el resultado del análisis."""
    original, tiene_bom = leer_archivo(ruta)
    cabecera, cuerpo = separar_cabecera(original)

    cuerpo_nuevo, enlaces = aplicar_enlaces(cuerpo, ruta)
    final = cabecera + cuerpo_nuevo

    cambiado = final != original

    if cambiado and APLICAR_CAMBIOS:
        guardar_archivo_seguro(ruta, final, tiene_bom)

    return cambiado, enlaces


# ============================================================
# PROGRAMA PRINCIPAL
# ============================================================

def main():
    print("\n==============================================")
    print("          ENLACES INTERNOS AUTOMÁTICOS")
    print("==============================================")
    print(f"Carpeta: {CARPETA_POSTS}")
    print(f"Modo: {'APLICAR CAMBIOS' if APLICAR_CAMBIOS else 'SIMULACIÓN'}")
    print("==============================================\n")

    try:
        validar_diccionario()
        archivos = buscar_archivos_markdown()

        if not archivos:
            print("No se han encontrado archivos Markdown.")
            return

        total_modificados = 0
        total_enlaces = 0
        total_errores = 0

        for ruta in archivos:
            try:
                cambiado, enlaces = procesar_archivo(ruta)

                if cambiado:
                    total_modificados += 1
                    estado = "ACTUALIZADO" if APLICAR_CAMBIOS else "CAMBIARÍA"
                    print(f"\n[{estado}] {ruta.relative_to(CARPETA_POSTS)}")

                    for expresion, url in enlaces:
                        print(f"  + {expresion} -> {url}")

                    total_enlaces += len(enlaces)

            except Exception as error:
                total_errores += 1
                print(
                    f"\n[ERROR] {ruta.relative_to(CARPETA_POSTS)}: {error}"
                )

        print("\n==============================================")
        print("                 RESUMEN")
        print("==============================================")
        print(f"Archivos examinados: {len(archivos)}")
        print(f"Archivos con cambios: {total_modificados}")
        print(f"Enlaces nuevos: {total_enlaces}")
        print(f"Errores: {total_errores}")

        if not APLICAR_CAMBIOS:
            print("\nSIMULACIÓN: no se ha modificado ningún archivo.")
            print("Si el resultado es correcto, cambia APLICAR_CAMBIOS = True.")
        else:
            print("\nProceso finalizado.")

        print("==============================================\n")

    except Exception as error:
        print(f"\nERROR GENERAL: {error}")
        sys.exit(1)


if __name__ == "__main__":
    main()
