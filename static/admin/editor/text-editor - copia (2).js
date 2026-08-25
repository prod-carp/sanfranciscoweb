// ==========================================================
// EDITOR DE CONTENIDO
//
// Markdown = fuente única de verdad
//
// Modos:
//   1. Vista previa → editor visual
//   2. Markdown     → editor de código Markdown
// ==========================================================


const visualEditor =
  document.getElementById(
    "visual-editor"
  );


const markdownEditor =
  document.getElementById(
    "markdown-editor"
  );


const toolbarButtons =
  document.querySelectorAll(
    ".text-editor-toolbar button"
  );


const tabs =
  document.querySelectorAll(
    ".text-editor-tab"
  );


let markdownContent = "";

let currentMode = "visual";


// ==========================================================
// INICIALIZACIÓN
// ==========================================================

initializeEditor();


function initializeEditor() {

  markdownContent = "";

  markdownEditor.value = "";

  visualEditor.innerHTML = "";

  switchMode("visual");

  updateToolbarState();

}


// ==========================================================
// CAMBIO DE MODO
// ==========================================================

tabs.forEach(
  tab => {

    tab.addEventListener(
      "click",
      () => {

        const mode =
          tab.dataset.tab;

        switchMode(mode);

      }
    );

  }
);


function switchMode(mode) {

  // --------------------------------------------------------
  // Antes de cambiar de modo, guardamos el contenido actual
  // --------------------------------------------------------

  if (
    currentMode === "visual"
  ) {

    markdownContent =
      htmlToMarkdown(
        visualEditor
      );

  }


  if (
    currentMode === "markdown"
  ) {

    markdownContent =
      cleanMarkdown(
        markdownEditor.value
      );

  }


  currentMode = mode;


  // --------------------------------------------------------
  // Actualizamos la interfaz
  // --------------------------------------------------------

  tabs.forEach(
    tab => {

      tab.classList.toggle(
        "active",
        tab.dataset.tab === mode
      );

    }
  );


  // --------------------------------------------------------
  // MODO VISUAL
  // --------------------------------------------------------

  if (
    mode === "visual"
  ) {

    visualEditor.innerHTML =
      markdownToHtml(
        markdownContent
      );


    visualEditor.style.display =
      "block";

    markdownEditor.style.display =
      "none";


    updateToolbarState();

    visualEditor.focus();

    return;

  }


  // --------------------------------------------------------
  // MODO MARKDOWN
  // --------------------------------------------------------

  markdownEditor.value =
    markdownContent;


  visualEditor.style.display =
    "none";

  markdownEditor.style.display =
    "block";


  markdownEditor.focus();

}


// ==========================================================
// BOTONES DE FORMATO
// ==========================================================

toolbarButtons.forEach(
  button => {

    button.addEventListener(
      "mousedown",
      event => {

        // Evita que el editor pierda la selección
        event.preventDefault();

      }
    );


    button.addEventListener(
      "click",
      () => {

        const command =
          button.dataset.command;


        executeCommand(
          command
        );


        visualEditor.focus();

        updateToolbarState();

      }
    );

  }
);


// ==========================================================
// EJECUTAR COMANDO
// ==========================================================

function executeCommand(
  command
) {

  switch (command) {

    case "bold":

      document.execCommand(
        "bold"
      );

      break;


    case "italic":

      document.execCommand(
        "italic"
      );

      break;


    case "h2":

      document.execCommand(
        "formatBlock",
        false,
        "h2"
      );

      break;


    case "h3":

      document.execCommand(
        "formatBlock",
        false,
        "h3"
      );

      break;


    case "unordered-list":

      document.execCommand(
        "insertUnorderedList"
      );

      break;


    case "ordered-list":

      document.execCommand(
        "insertOrderedList"
      );

      break;

    case "horizontal-rule":

      document.execCommand(
      "insertHorizontalRule"
      );

    break;

    case "quote":

      document.execCommand(
        "formatBlock",
        false,
        "blockquote"
      );

      break;


    case "undo":

      document.execCommand(
        "undo"
      );

      break;


    case "redo":

      document.execCommand(
        "redo"
      );

      break;


    case "clear":

      document.execCommand(
        "removeFormat"
      );

      break;


    case "link":

      insertLink();

      break;

  }

}


// ==========================================================
// INSERTAR ENLACE
// ==========================================================

function insertLink() {

  const url =
    window.prompt(
      "Introduce la dirección del enlace:"
    );


  if (!url) {

    return;

  }


  // --------------------------------------------------------
  // Comprobamos que sea una URL válida
  // --------------------------------------------------------

  let parsedUrl;

  try {

    parsedUrl =
      new URL(
        url
      );

  } catch {

    alert(
      "Introduce una dirección válida, por ejemplo:\nhttps://www.google.es"
    );

    return;

  }


  if (
    parsedUrl.protocol !== "http:" &&
    parsedUrl.protocol !== "https:"
  ) {

    alert(
      "El enlace debe comenzar por http:// o https://"
    );

    return;

  }


  document.execCommand(
    "createLink",
    false,
    parsedUrl.href
  );

}


// ==========================================================
// ESTADO DE LOS BOTONES
// ==========================================================

function updateToolbarState() {

  if (
    currentMode !== "visual"
  ) {

    return;

  }


  const boldActive =
    document.queryCommandState(
      "bold"
    );


  const italicActive =
    document.queryCommandState(
      "italic"
    );


  const block =
    document.queryCommandValue(
      "formatBlock"
    )
    .toLowerCase();


  toolbarButtons.forEach(
    button => {

      const command =
        button.dataset.command;


      let active = false;


      if (
        command === "bold"
      ) {

        active =
          boldActive;

      }


      if (
        command === "italic"
      ) {

        active =
          italicActive;

      }


      if (
        command === "h2"
      ) {

        active =
          block === "h2";

      }


      if (
        command === "h3"
      ) {

        active =
          block === "h3";

      }


      button.classList.toggle(
        "active",
        active
      );

    }
  );

}


// ==========================================================
// ACTUALIZAR ESTADO AL MOVER EL CURSOR
// ==========================================================

visualEditor.addEventListener(
  "keyup",
  updateToolbarState
);


visualEditor.addEventListener(
  "mouseup",
  updateToolbarState
);


visualEditor.addEventListener(
  "input",
  updateToolbarState
);


document.addEventListener(
  "selectionchange",
  () => {

    if (
      document.activeElement ===
      visualEditor
    ) {

      updateToolbarState();

    }

  }
);


// ==========================================================
// HTML → MARKDOWN
// ==========================================================

function htmlToMarkdown(
  root
) {

  let markdown = "";


  root.childNodes.forEach(
    node => {

      markdown +=
        convertNode(
          node
        );

    }
  );


  return cleanMarkdown(
    markdown
  );

}


function convertNode(
  node
) {

  // --------------------------------------------------------
  // Texto normal
  // --------------------------------------------------------

  if (
    node.nodeType ===
    Node.TEXT_NODE
  ) {

    return node.textContent;

  }


  if (
    node.nodeType !==
    Node.ELEMENT_NODE
  ) {

    return "";

  }


  const tag =
    node.tagName.toLowerCase();


  const content =
    Array.from(
      node.childNodes
    )
    .map(
      child =>
        convertNode(child)
    )
    .join("");


  switch (tag) {

    case "strong":

    case "b":

      return `**${content}**`;


    case "em":

    case "i":

      return `*${content}*`;


    case "h2":

      return `\n\n## ${content.trim()}\n\n`;


    case "h3":

      return `\n\n### ${content.trim()}\n\n`;


    case "hr":

    return "\n\n---\n\n";


    case "blockquote":

      return (
        "\n\n" +
        content
          .trim()
          .split("\n")
          .map(
            line =>
              line.trim()
                ? `> ${line.trim()}`
                : ">"
          )
          .join("\n") +
        "\n\n"
      );


    case "ul":

      return (
        "\n\n" +
        Array.from(
          node.children
        )
        .map(
          li =>
            `- ${convertNode(li).trim()}`
        )
        .join("\n") +
        "\n\n"
      );


    case "ol":

      return (
        "\n\n" +
        Array.from(
          node.children
        )
        .map(
          (li, index) =>
            `${index + 1}. ${convertNode(li).trim()}`
        )
        .join("\n") +
        "\n\n"
      );


    case "li":

      return content;


    case "a": {

      const href =
        node.getAttribute(
          "href"
        ) || "";


      return `[${content}](${href})`;

    }


    case "br":

      return "\n";


    case "p":

      return `\n\n${content}\n\n`;


    case "div":

      return `\n\n${content}\n\n`;


    default:

      return content;

  }

}


// ==========================================================
// MARKDOWN → HTML
//
// Solo procesamos las estructuras que hemos decidido
// admitir en nuestro editor.
// ==========================================================

function markdownToHtml(
  markdown
) {

  let source =
    cleanMarkdown(
      markdown
    );


  if (!source) {

    return "";

  }


  // --------------------------------------------------------
  // Escapamos HTML para evitar HTML arbitrario
  // --------------------------------------------------------

  source =
    escapeHtml(
      source
    );


  // --------------------------------------------------------
  // Enlaces
  // --------------------------------------------------------

  source =
    source.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>'
    );


  // --------------------------------------------------------
  // Negrita
  // --------------------------------------------------------

  source =
    source.replace(
      /\*\*(.+?)\*\*/g,
      "<strong>$1</strong>"
    );


  // --------------------------------------------------------
  // Cursiva
  // --------------------------------------------------------

  source =
    source.replace(
      /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
      "<em>$1</em>"
    );


  // --------------------------------------------------------
  // H3
  // --------------------------------------------------------

  source =
    source.replace(
      /^### (.+)$/gm,
      "<h3>$1</h3>"
    );


  // --------------------------------------------------------
  // H2
  // --------------------------------------------------------

  source =
    source.replace(
      /^## (.+)$/gm,
      "<h2>$1</h2>"
    );


// --------------------------------------------------------
// Citas
// --------------------------------------------------------


  source =
    source.replace(
      /^> (.+)$/gm,
      "<blockquote>$1</blockquote>"
    );


  // --------------------------------------------------------
  // Listas
  // --------------------------------------------------------

  source =
    convertListsToHtml(
      source
    );

// --------------------------------------------------------
// Separador horizontal
// --------------------------------------------------------

source =
  source.replace(
    /^---$/gm,
    "<hr>"
  );

  // --------------------------------------------------------
  // Párrafos
  // --------------------------------------------------------

  const blocks =
    source
      .split(/\n{2,}/)
      .map(
        block =>
          block.trim()
      )
      .filter(
        block =>
          block !== ""
      );



  return blocks
    .map(
      block => {

if (
  /^<(h2|h3|blockquote|ul|ol|hr)>/i
    .test(block)
) {

  return block;

}


        return `<p>${block.replace(/\n/g, "<br>")}</p>`;

      }
    )
    .join("");

}


// ==========================================================
// LISTAS MARKDOWN → HTML
// ==========================================================

function convertListsToHtml(
  source
) {

  const lines =
    source.split("\n");


  let output = [];

  let unorderedOpen = false;

  let orderedOpen = false;


  lines.forEach(
    line => {

      const unordered =
        line.match(
          /^- (.+)$/
        );


      const ordered =
        line.match(
          /^\d+\. (.+)$/
        );


      if (unordered) {

        if (
          orderedOpen
        ) {

          output.push(
            "</ol>"
          );

          orderedOpen = false;

        }


        if (
          !unorderedOpen
        ) {

          output.push(
            "<ul>"
          );

          unorderedOpen = true;

        }


        output.push(
          `<li>${unordered[1]}</li>`
        );

        return;

      }


      if (ordered) {

        if (
          unorderedOpen
        ) {

          output.push(
            "</ul>"
          );

          unorderedOpen = false;

        }


        if (
          !orderedOpen
        ) {

          output.push(
            "<ol>"
          );

          orderedOpen = true;

        }


        output.push(
          `<li>${ordered[1]}</li>`
        );

        return;

      }


      if (
        unorderedOpen
      ) {

        output.push(
          "</ul>"
        );

        unorderedOpen = false;

      }


      if (
        orderedOpen
      ) {

        output.push(
          "</ol>"
        );

        orderedOpen = false;

      }


      output.push(
        line
      );

    }
  );


  if (
    unorderedOpen
  ) {

    output.push(
      "</ul>"
    );

  }


  if (
    orderedOpen
  ) {

    output.push(
      "</ol>"
    );

  }


  return output.join("\n");

}


// ==========================================================
// LIMPIAR MARKDOWN
// ==========================================================

function cleanMarkdown(
  markdown
) {

  let result =
    markdown
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");


  // --------------------------------------------------------
  // Eliminar front matter de Hugo si alguien pega un .md
  // completo.
  // --------------------------------------------------------

  result =
    result.replace(
      /^---\s*\n[\s\S]*?\n---\s*\n?/,
      ""
    );


  // --------------------------------------------------------
  // Evitar excesivos saltos de línea
  // --------------------------------------------------------

  result =
    result
      .replace(
        /\n{3,}/g,
        "\n\n"
      )
      .trim();


  return result;

}


// ==========================================================
// ESCAPAR HTML
// ==========================================================

function escapeHtml(
  text
) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    text;


  return div.innerHTML;

}


// ==========================================================
// TEXTO PLANO
//
// Lo utilizaremos después para el contador y validación.
// ==========================================================

export function getPlainText() {

  if (
    currentMode === "visual"
  ) {

    return visualEditor.innerText
      .trim();

  }


  return markdownToPlainText(
    markdownEditor.value
  );

}


function markdownToPlainText(
  markdown
) {

  return markdown
    .replace(
      /^#{1,6}\s+/gm,
      ""
    )
    .replace(
      /\*\*(.*?)\*\*/g,
      "$1"
    )
    .replace(
      /\*(.*?)\*/g,
      "$1"
    )
    .replace(
      /\[([^\]]+)\]\([^)]+\)/g,
      "$1"
    )
    .replace(
      /^>\s?/gm,
      ""
    )
    .replace(
      /^[-*+]\s+/gm,
      ""
    )
    .replace(
      /^\d+\.\s+/gm,
      ""
    )
    .trim();

}


// ==========================================================
// API PÚBLICA
// ==========================================================

export function getMarkdown() {

  if (
    currentMode === "visual"
  ) {

    markdownContent =
      htmlToMarkdown(
        visualEditor
      );

  }


  if (
    currentMode === "markdown"
  ) {

    markdownContent =
      cleanMarkdown(
        markdownEditor.value
      );

  }


  return markdownContent;

}

// AÑADE ESTAS EXPORTACIONES:
export { 
  markdownToHtml,
  htmlToMarkdown
};

// ==========================================================
// PARA EL CONTADOR DE CARACTERES
// ==========================================================

export function onContentChange(callback) {

  function notify() {

    callback(
      getPlainText()
    );

  }


  visualEditor.addEventListener(
    "input",
    notify
  );


  markdownEditor.addEventListener(
    "input",
    notify
  );


  tabs.forEach(
    tab => {

      tab.addEventListener(
        "click",
        notify
      );

    }
  );


  // Estado inicial

  notify();

}