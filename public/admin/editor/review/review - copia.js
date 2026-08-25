// ==========================================================
// PÁGINA DE REVISIÓN
// ==========================================================


const reviewTitle =
  document.getElementById(
    "review-title"
  );


const reviewSubtitle =
  document.getElementById(
    "review-subtitle"
  );


const reviewImage =
  document.getElementById(
    "review-image"
  );


const reviewContent =
  document.getElementById(
    "review-content"
  );


const reviewMeta =
  document.getElementById(
    "review-meta"
  );


const modifyButton =
  document.getElementById(
    "modify-button"
  );


const approveButton =
  document.getElementById(
    "approve-submit-button"
  );


// ==========================================================
// RECUPERAR DATOS
// ==========================================================
//
// Por ahora utilizaremos sessionStorage.
//
// Esto NO es todavía el sistema definitivo de borradores.
// En la siguiente fase lo sustituiremos por Firebase.
// ==========================================================



const reviewData =
  sessionStorage.getItem(
    "pending-review"
  );


if (!reviewData) {

  alert(
    "No hay ninguna noticia pendiente de revisión."
  );

  window.location.href =
    "/admin/editor/";

} else {

  try {

    const data =
      JSON.parse(
        reviewData
      );

    showReview(
      data
    );

  } catch {

    alert(
      "No se ha podido cargar la noticia."
    );

    window.location.href =
      "/admin/editor/";

  }

}


// ==========================================================
// MOSTRAR NOTICIA
// ==========================================================

function showReview(
  data
) {

  reviewTitle.textContent =
    data.title || "";


  reviewSubtitle.textContent =
    data.subtitle || "";


  // --------------------------------------------------------
  // Imagen
  // --------------------------------------------------------

  if (
    data.image
  ) {

    reviewImage.src =
      data.image;

    reviewImage.alt =
      data.title || "Imagen de la noticia";

    reviewImage.style.display =
      "block";

  }


  // --------------------------------------------------------
  // Contenido
  // --------------------------------------------------------

  reviewContent.innerHTML =
    markdownToHtml(
      data.content
    );


  // --------------------------------------------------------
  // Información
  // --------------------------------------------------------

  let meta = "";


  if (
    data.category
  ) {

    meta +=
      `<strong>Categoría:</strong> ${escapeHtml(data.category)}`;

  }


  if (
    data.publicationDate
  ) {

    meta +=
      `<br><strong>Fecha de publicación:</strong> ${escapeHtml(data.publicationDate)}`;

  }


  reviewMeta.innerHTML =
    meta;

}


// ==========================================================
// MARKDOWN → HTML
// ==========================================================

function markdownToHtml(
  markdown
) {

  let source =
    markdown || "";


  // --------------------------------------------------------
  // Escapar HTML
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
    convertLists(
      source
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
          /^<(h2|h3|blockquote|ul|ol)>/i
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
// LISTAS
// ==========================================================

function convertLists(
  source
) {

  const lines =
    source.split("\n");


  const output = [];


  let unorderedOpen =
    false;


  let orderedOpen =
    false;


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

          orderedOpen =
            false;

        }


        if (
          !unorderedOpen
        ) {

          output.push(
            "<ul>"
          );

          unorderedOpen =
            true;

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

          unorderedOpen =
            false;

        }


        if (
          !orderedOpen
        ) {

          output.push(
            "<ol>"
          );

          orderedOpen =
            true;

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

        unorderedOpen =
          false;

      }


      if (
        orderedOpen
      ) {

        output.push(
          "</ol>"
        );

        orderedOpen =
          false;

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
// MODIFICAR
// ==========================================================

modifyButton.addEventListener(
  "click",
  () => {

    window.location.href =
      "/admin/editor/";

  }
);


// ==========================================================
// ENVIAR PARA APROBACIÓN
// ==========================================================

approveButton.addEventListener(
  "click",
  () => {

    alert(
      "El envío para aprobación lo construiremos en la siguiente fase."
    );

  }
);