// ==========================================================
// EDITOR VISUAL → MARKDOWN
// ==========================================================

const editor =
  document.getElementById(
    "markdown-editor"
  );

const preview =
  document.getElementById(
    "markdown-preview"
  );

const tabs =
  document.querySelectorAll(
    ".text-editor-tab"
  );

const toolbarButtons =
  document.querySelectorAll(
    ".text-editor-toolbar button"
  );


// ----------------------------------------------------------
// EJECUTAR COMANDO
// ----------------------------------------------------------

toolbarButtons.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        const command =
          button.dataset.command;


        executeCommand(
          command
        );


        editor.focus();

      }
    );

  }
);


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


    case "underline":

      document.execCommand(
        "underline"
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


// ----------------------------------------------------------
// ENLACE
// ----------------------------------------------------------

function insertLink() {

  const url =
    window.prompt(
      "Introduce la dirección del enlace:"
    );


  if (!url) {
    return;
  }


  document.execCommand(
    "createLink",
    false,
    url
  );

}


// ----------------------------------------------------------
// HTML → MARKDOWN
// ----------------------------------------------------------

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


  return markdown
    .replace(/\n{3,}/g, "\n\n")
    .trim();

}


function convertNode(
  node
) {

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


    case "u":

      return `<u>${content}</u>`;


    case "h2":

      return `\n\n## ${content}\n\n`;


    case "h3":

      return `\n\n### ${content}\n\n`;


    case "blockquote":

      return (
        "\n\n" +
        content
          .split("\n")
          .map(
            line =>
              line.trim()
                ? `> ${line}`
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
            `- ${convertNode(li)}`
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
            `${index + 1}. ${convertNode(li)}`
        )
        .join("\n") +
        "\n\n"
      );


    case "li":

      return content;


    case "a":

      return `[${content}](${node.getAttribute("href") || ""})`;


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


// ----------------------------------------------------------
// API PÚBLICA DEL MÓDULO
// ----------------------------------------------------------

export function getMarkdown() {

  return htmlToMarkdown(
    editor
  );

}


export function getPlainText() {

  return editor.innerText
    .trim();

}


// ----------------------------------------------------------
// VISTA PREVIA
// ----------------------------------------------------------

tabs.forEach(
  tab => {

    tab.addEventListener(
      "click",
      () => {

        const selectedTab =
          tab.dataset.tab;


        tabs.forEach(
          item =>
            item.classList.toggle(
              "active",
              item === tab
            )
        );


        if (
          selectedTab ===
          "preview"
        ) {

          preview.innerHTML =
            markdownToPreview(
              getMarkdown()
            );


          editor.style.display =
            "none";

          preview.style.display =
            "block";

        } else {

          editor.style.display =
            "block";

          preview.style.display =
            "none";

        }

      }
    );

  }
);


// ----------------------------------------------------------
// CONVERSOR
// ----------------------------------------------------------

function markdownToPreview(
  markdown
) {

  let html =
    escapeHtml(
      markdown
    );


  html =
    html.replace(
      /^### (.+)$/gm,
      "<h3>$1</h3>"
    );


  html =
    html.replace(
      /^## (.+)$/gm,
      "<h2>$1</h2>"
    );


  html =
    html.replace(
      /\*\*(.+?)\*\*/g,
      "<strong>$1</strong>"
    );


  html =
    html.replace(
      /\*(.+?)\*/g,
      "<em>$1</em>"
    );


  html =
    html.replace(
      /<u>(.+?)<\/u>/g,
      "<u>$1</u>"
    );


  html =
    html.replace(
      /^> (.+)$/gm,
      "<blockquote>$1</blockquote>"
    );


  html =
    html.replace(
      /^- (.+)$/gm,
      "<li>$1</li>"
    );


  html =
    html.replace(
      /\n{2,}/g,
      "</p><p>"
    );


  html =
    `<p>${html}</p>`;


  html =
    html.replace(
      /<p><(h2|h3)>/g,
      "<$1>"
    );


  html =
    html.replace(
      /<\/(h2|h3)><\/p>/g,
      "</$1>"
    );


  return html;

}


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