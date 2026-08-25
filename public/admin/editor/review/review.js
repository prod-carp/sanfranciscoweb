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
// ENVIAR PARA APROBACIÓN
// ==========================================================

// approveButton.addEventListener("click", () => { alert("El envío para aprobación lo construiremos en la siguiente fase."); });