import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getUserRole,
  getRoleName
} from "../../js/permissions.js";

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";


// ==========================================================
// DETECTAR MODO: ADMINISTRATIVO O COLABORADOR
// ==========================================================

const urlParams = new URLSearchParams(window.location.search);
const articleId = urlParams.get("id");
const administrativeReview = Boolean(articleId);

console.log("Modo de revisión:", administrativeReview ? "Administrativo" : "Colaborador");
console.log("ID del artículo:", articleId || "N/A");


// ==========================================================
// FIREBASE
// ==========================================================

const firebaseConfig = {
  apiKey: "AIzaSyDjdSGRbYmQhAFNEuvl99dIqwd_MiWJ7UU",
  authDomain: "sanfranciscoyclara-d34c2.firebaseapp.com",
  projectId: "sanfranciscoyclara-d34c2",
  storageBucket: "sanfranciscoyclara-d34c2.firebasestorage.app",
  messagingSenderId: "752378732662",
  appId: "1:752378732662:web:7399bfb7aab75f6b2e7f57",
  measurementId: "G-JLZCDHMBVT"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

// ==========================================================
// COMPROBAR AUTENTICACIÓN Y ROL
// ==========================================================

onAuthStateChanged(
  auth,
  (user) => {

    // ------------------------------------------------------
    // SIN SESIÓN
    // ------------------------------------------------------

    if (!user) {
      window.location.href = "/admin/login/";
      return;
    }

    // ------------------------------------------------------
    // USUARIO AUTENTICADO → Mostrar página y cargar datos
    // ------------------------------------------------------

    const email = user.email || "";
    const role = getUserRole(email);
    const roleName = getRoleName(role);

    console.log("Usuario autenticado:", email);
    console.log("Rol:", roleName);

    // ✅ Mostrar la página
    document.getElementById("review-page").style.display = "block";

    // ✅ Configurar botón según rol
    configureReviewButton(role);

    // ✅ Cargar datos de la revisión
    loadReviewData();

  }
);


// ==========================================================
// FUNCIÓN PARA CARGAR DATOS DE LA REVISIÓN
// ==========================================================

function loadReviewData() {

  const reviewData = sessionStorage.getItem("pending-review");

  if (!reviewData) {
    alert("No hay ninguna noticia pendiente de revisión.");
    window.location.href = "/admin/editor/";
    return;
  }

  try {
    const data = JSON.parse(reviewData);
    showReview(data);
  } catch {
    alert("No se ha podido cargar la noticia.");
    window.location.href = "/admin/editor/";
  }

}


// ==========================================================
// PÁGINA DE REVISIÓN - Referencias a elementos
// ==========================================================

const reviewTitle = document.getElementById("review-title");
const reviewSubtitle = document.getElementById("review-subtitle");
const reviewImage = document.getElementById("review-image");
const reviewContent = document.getElementById("review-content");
const reviewMeta = document.getElementById("review-meta");
const modifyButton = document.getElementById("modify-button");
const approveButton = document.getElementById("approve-submit-button");


// ==========================================================
// MOSTRAR NOTICIA
// ==========================================================

function showReview(data) {

  reviewTitle.textContent = data.title || "";

  reviewSubtitle.textContent = data.subtitle || "";

  // Imagen
  if (data.image) {
    reviewImage.src = data.image;
    reviewImage.alt = data.title || "Imagen de la noticia";
    reviewImage.style.display = "block";
  }

  // Contenido
  reviewContent.innerHTML = markdownToHtml(data.content);

  // Información
  let meta = "";

  if (data.category) {
    meta += `<strong>Categoría:</strong> ${escapeHtml(data.category)}`;
  }

  if (data.publicationDate) {
    meta += `<br><strong>Fecha de publicación:</strong> ${escapeHtml(data.publicationDate)}`;
  }

  reviewMeta.innerHTML = meta;

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

modifyButton.addEventListener("click", () => {
  const reviewData = sessionStorage.getItem("pending-review");
  if (reviewData) {
    sessionStorage.setItem("editing-article", reviewData);
  }
  window.location.href = "/admin/editor/";
});


// ==========================================================
// CONFIGURAR BOTÓN SEGÚN EL ROL
// ==========================================================

function configureReviewButton(role) {

  const button = document.getElementById("approve-submit-button");

  if (!button) return;

  if (role === "group") {
    button.textContent = "Enviar para aprobación →";
    button.dataset.action = "submit";
    return;
  }

  if (role === "preferred" || role === "admin") {
    button.textContent = "Aprobar artículo →";
    button.dataset.action = "approve";
    return;
  }

}

// ==========================================================
// ENVIAR / APROBAR
// ==========================================================

approveButton.addEventListener(
  "click",
  async () => {

    const action =
      approveButton.dataset.action;


    // ======================================================
    // FASE 1
    // ======================================================
    //
    // En esta fase solo implementamos:
    //
    // COLABORADOR
    //     ↓
    // ENVIAR PARA APROBACIÓN
    //     ↓
    // WORKER
    //     ↓
    // D1 + R2
    //
    // La aprobación del Administrador/Preferente
    // la construiremos después.
    // ======================================================

    if (
      action !== "submit"
    ) {

      alert(
        "La aprobación de artículos se implementará en la siguiente fase."
      );

      return;

    }


    // ------------------------------------------------------
    // Obtener datos
    // ------------------------------------------------------

    const reviewDataString =
      sessionStorage.getItem(
        "pending-review"
      );


    if (!reviewDataString) {

      alert(
        "No se han encontrado los datos de la noticia."
      );

      return;

    }


    let reviewData;

    try {

      reviewData =
        JSON.parse(
          reviewDataString
        );

    } catch {

      alert(
        "No se han podido leer los datos de la noticia."
      );

      return;

    }


    // ------------------------------------------------------
    // Confirmación
    // ------------------------------------------------------

    const confirmed =
      window.confirm(
        "¿Quieres enviar esta noticia para su aprobación?"
      );


    if (!confirmed) {

      return;

    }


    // ------------------------------------------------------
    // Desactivar botón
    // ------------------------------------------------------

    approveButton.disabled =
      true;

    approveButton.textContent =
      "Enviando…";


    try {

      // ----------------------------------------------------
      // Usuario Firebase
      // ----------------------------------------------------

      const user =
        auth.currentUser;


      if (!user) {

        throw new Error(
          "Tu sesión ha caducado. Vuelve a iniciar sesión."
        );

      }


      // ----------------------------------------------------
      // Obtener Firebase ID Token
      // ----------------------------------------------------

      const idToken =
        await user.getIdToken(
          true
        );


      // ----------------------------------------------------
      // Enviar al Worker
      // ----------------------------------------------------

      const response =
        await fetch(
          "https://sanfrancisco-noticias.produccioncarprinter.workers.dev/api/articles",
          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json",

              "Authorization":
                `Bearer ${idToken}`

            },

            body:
              JSON.stringify(
                reviewData
              )

          }
        );


      let result;

      try {

        result =
          await response.json();

      } catch {

        throw new Error(
          "El servidor devolvió una respuesta no válida."
        );

      }


      if (
        !response.ok ||
        !result.success
      ) {

        throw new Error(
          result.error ||
          "No se ha podido enviar la noticia."
        );

      }


      // ----------------------------------------------------
      // ÉXITO
      // ----------------------------------------------------

      console.log(
        "✅ Artículo enviado:",
        result
      );


      // Limpiar la revisión temporal

      sessionStorage.removeItem(
        "pending-review"
      );

      sessionStorage.removeItem(
        "editing-article"
      );


      alert(
        "✅ La noticia se ha enviado correctamente para su aprobación."
      );


      // Por ahora volvemos al editor.
      // Posteriormente iremos al panel del colaborador.

      window.location.href =
        "/admin/editor/";

    } catch (error) {

      console.error(
        "❌ Error enviando artículo:",
        error
      );


      alert(
        "No se ha podido enviar la noticia.\n\n" +
        error.message
      );


      // Restaurar botón

      approveButton.disabled =
        false;

      approveButton.textContent =
        "Enviar para aprobación →";

    }

  }
);