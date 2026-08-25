// ==========================================================
// EDITOR MARKDOWN
// ==========================================================
//
// Este archivo contiene exclusivamente la lógica del
// editor de contenido.
//
// No mezclar aquí lógica de imágenes, categorías,
// Firebase, autenticación, fechas, etc.
// ==========================================================


let markdownEditor = null;


// ==========================================================
// INICIALIZAR EDITOR
// ==========================================================

function initMarkdownEditor() {

  const textarea =
    document.getElementById(
      "post-content"
    );


  if (!textarea) {
    return;
  }


  markdownEditor =
    new EasyMDE({

      element: textarea,


      autofocus: false,


      spellChecker: true,


      nativeSpellcheck: true,


      minHeight: "400px",


      maxHeight: "650px",


      lineWrapping: true,


      sideBySideFullscreen: false,


      autoDownloadFontAwesome: false,


      toolbarTips: true,


      placeholder:
        "Escribe aquí el contenido de la noticia...",




      /*
       * Markdown limpio.
       */

      unorderedListStyle: "-",


      blockStyles: {

        bold: "**",

        italic: "*"

      },


      /*
       * Solamente mostramos las herramientas que
       * necesitamos para las noticias.
       */

      toolbar: [

        "bold",

        "italic",

        "|",

        "heading-2",

        "heading-3",

        "|",

        "unordered-list",

        "ordered-list",

        "|",

        "quote",

        "link",

        "|",

        "clean-block",

        "|",

        "undo",

        "redo",

        "|",

        "preview",

        "fullscreen"

      ],


      /*
       * No queremos imágenes insertadas desde el editor.
       *
       * La imagen principal se gestiona mediante nuestro
       * recortador y posteriormente Firebase Storage.
       */

      renderingConfig: {

        singleLineBreaks: true

      }

    });


  /*
   * Cuando cambia el contenido, actualizamos
   * nuestro contador.
   */

  markdownEditor.codemirror.on(
    "change",
    updateContentCounter
  );


  updateContentCounter();

}


// ==========================================================
// OBTENER MARKDOWN
// ==========================================================

function getMarkdownContent() {

  if (!markdownEditor) {
    return "";
  }


  return markdownEditor
    .value()
    .trim();

}


// ==========================================================
// OBTENER TEXTO SIN MARKDOWN
// ==========================================================
//
// Lo utilizaremos para contar los caracteres reales,
// sin que **negrita**, ## títulos, etc. falseen el contador.
// ==========================================================

function getPlainTextContent() {

  const markdown =
    getMarkdownContent();


  if (!markdown) {
    return "";
  }


  let text =
    markdown;


  /*
   * Imágenes Markdown
   */

  text =
    text.replace(
      /!\[.*?\]\(.*?\)/g,
      ""
    );


  /*
   * Enlaces:
   * [texto](url) -> texto
   */

  text =
    text.replace(
      /\[([^\]]+)\]\([^)]+\)/g,
      "$1"
    );


  /*
   * Encabezados
   */

  text =
    text.replace(
      /^\s*#{1,6}\s+/gm,
      ""
    );


  /*
   * Negrita y cursiva
   */

  text =
    text.replace(
      /(\*\*|__)(.*?)\1/g,
      "$2"
    );


  text =
    text.replace(
      /(\*|_)(.*?)\1/g,
      "$2"
    );


  /*
   * Citas
   */

  text =
    text.replace(
      /^\s*>\s?/gm,
      ""
    );


  /*
   * Listas

   */

  text =
    text.replace(
      /^\s*[-*+]\s+/gm,
      ""
    );


  text =
    text.replace(
      /^\s*\d+\.\s+/gm,
      ""
    );


  return text.trim();

}


// ==========================================================
// CONTADOR
// ==========================================================

function updateContentCounter() {

  const counter =
    document.getElementById(
      "content-counter"
    );


  if (!counter) {
    return;
  }


  const length =
    getPlainTextContent()
      .length;


  counter.textContent =
    `${length.toLocaleString("es-ES")} / 10.000 · mínimo 300`;


  if (length < 300) {

    counter.classList.add(
      "content-too-short"
    );

  } else {

    counter.classList.remove(
      "content-too-short"
    );

  }

}


// ==========================================================
// VALIDACIÓN
// ==========================================================

function validateMarkdownContent() {

  const content =
    getPlainTextContent();


  if (!content) {

    return {

      valid: false,

      message:
        "Escribe el contenido de la noticia."

    };

  }


  if (content.length < 300) {

    return {

      valid: false,

      message:
        `El contenido es demasiado breve. ` +
        `Tiene ${content.length} caracteres ` +
        `y necesita al menos 300.`

    };

  }


  if (content.length > 10000) {

    return {

      valid: false,

      message:
        "El contenido supera el máximo permitido " +
        "de 10.000 caracteres."

    };

  }


  return {

    valid: true,

    message: ""

  };

}


// ==========================================================
// INICIALIZACIÓN
// ==========================================================

document.addEventListener(
  "DOMContentLoaded",
  initMarkdownEditor
);