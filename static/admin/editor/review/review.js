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

let currentImageObjectUrl = null;


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
    loadReviewData(user);

  }
);


// ==========================================================
// FUNCIÓN PARA CARGAR DATOS DE LA REVISIÓN
// ==========================================================

async function loadReviewData(user) {

  // 📌 Si hay ?id= → modo administrador → cargar desde D1
  if (administrativeReview && articleId) {
    await loadArticleFromD1(user, articleId);
    return;
  }

  // 📌 Si no hay ?id= → modo colaborador → cargar desde sessionStorage
  loadArticleFromSessionStorage();

}

// ==========================================================
// CARGAR ARTÍCULO DESDE SESSION STORAGE (COLABORADOR)
// ==========================================================

function loadArticleFromSessionStorage() {

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
// CARGAR ARTÍCULO DESDE D1 (ADMINISTRADOR)
// ==========================================================

async function loadArticleFromD1(
  user,
  articleId
) {

  try {

    // ------------------------------------------------------
    // TOKEN FIREBASE
    // ------------------------------------------------------

    const token =
      await user.getIdToken(
        true
      );


    // ------------------------------------------------------
    // LLAMAR AL WORKER
    // ------------------------------------------------------

    const response =
      await fetch(
        `https://sanfrancisco-noticias.produccioncarprinter.workers.dev/api/admin/articles/${encodeURIComponent(articleId)}`,
        {

          method:
            "GET",

          headers: {

            "Authorization":
              `Bearer ${token}`

          }

        }
      );


    // ------------------------------------------------------
    // RESPUESTA JSON
    // ------------------------------------------------------

    let result;

    try {

      result =
        await response.json();

    } catch {

      throw new Error(
        "El servidor devolvió una respuesta no válida."
      );

    }


    // ------------------------------------------------------
    // ERROR
    // ------------------------------------------------------

    if (
      !response.ok ||
      !result.success
    ) {

      throw new Error(
        result.error ||
        "No se ha podido cargar el artículo."
      );

    }


    // ------------------------------------------------------
    // ARTÍCULO D1
    // ------------------------------------------------------

    const article =
      result.article;


    // ------------------------------------------------------
    // CONVERTIR FORMATO D1 → FORMATO REVIEW
    // ------------------------------------------------------

let category = "";
try {
  const categories = JSON.parse(article.categories || "[]");
  category = categories[0] || "";
} catch {
  category = article.categories || "";
}

let tags = [];
try {
  tags = JSON.parse(article.tags || "[]");
} catch {
  tags = [];
}

// CARGAR IMAGEN PRIVADA DESDE R2
let imageUrl = "";
if (article.image_key) {
  const imageResponse = await fetch(`https://sanfrancisco-noticias.produccioncarprinter.workers.dev/api/admin/articles/${encodeURIComponent(article.id)}/image`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (imageResponse.ok) {
    const imageBlob = await imageResponse.blob();
    
    // ✅ LIMPIAR URL ANTERIOR (si existe)
    if (currentImageObjectUrl) {
      URL.revokeObjectURL(currentImageObjectUrl);
    }

    // ✅ CREAR NUEVA URL
    currentImageObjectUrl = URL.createObjectURL(imageBlob);
    imageUrl = currentImageObjectUrl;
    
  } else {
    console.warn("No se ha podido cargar la imagen de R2.");
  }
}


const reviewData = {
  id: article.id,
  title: article.title,
  subtitle: article.subtitle,
  category,
  tags,
  publicationDate: article.publication_date,
  content: article.content,

  image: imageUrl,
  imageKey: article.image_key,

  highlight: Number(article.highlight) === 1,
  highlightDays: article.highlight_days,

  recurring: Boolean(article.recurrence_type),
  recurringType: article.recurrence_type,

  baseMonth: article.base_date ? article.base_date.split("/")[0] : "",
  baseDay: article.base_date ? article.base_date.split("/")[1] : "",
  annualDaysBefore: article.start_date,
  annualDaysAfter: article.end_date,

  liturgicalType: article.liturgical_type,
  daysBefore: article.days_before,
  daysAfter: article.days_after,

  status: article.status,
  authorEmail: article.author_email,
  submittedAt: article.submitted_at
};


    // ------------------------------------------------------
    // MOSTRAR
    // ------------------------------------------------------

    showReview(
      reviewData
    );

  } catch (error) {

    console.error(
      "Error cargando artículo:",
      error
    );


    alert(
      error.message ||
      "No se ha podido cargar el artículo."
    );


    window.location.href =
      "/admin/dashboard/";

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

  // Guardar los datos actuales de la revisión

  try {

    sessionStorage.setItem(
      "pending-review",
      JSON.stringify(data)
    );

  } catch (error) {

    console.error(
      "No se han podido guardar los datos de revisión:",
      error
    );

  }

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

modifyButton.addEventListener(
  "click",
  () => {

    const reviewData =
      sessionStorage.getItem(
        "pending-review"
      );


    if (!reviewData) {

      alert(
        "No se han encontrado los datos de la noticia."
      );

      return;

    }


    try {

      const data =
        JSON.parse(
          reviewData
        );


      // ----------------------------------------------------
      // Marcar si estamos modificando un artículo existente


      if (
        administrativeReview &&
        data.id
      ) {

        data.editingExistingArticle =
          true;

      }


      sessionStorage.setItem(
        "editing-article",
        JSON.stringify(
          data
        )
      );


      // ----------------------------------------------------
      // Ir al editor


      window.location.href =
        "/admin/editor/";

    } catch (error) {

      console.error(
        "Error preparando modificación:",
        error
      );


      alert(
        "No se ha podido preparar la noticia para modificarla."
      );

    }

  }
);


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


if (
  action !== "submit" &&
  action !== "approve"
) {

  alert(
    "No se ha podido determinar la acción."
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


// ======================================================
// ADMINISTRADOR / PREFERENTE → APROBAR
// ======================================================

if (
  action === "approve"
) {

  const confirmed =
    window.confirm(
      "¿Quieres aprobar este artículo?\n\nEl artículo quedará marcado como APROBADO y estará preparado para su publicación."
    );


  if (!confirmed) {

    return;

  }


  approveButton.disabled =
    true;

  approveButton.textContent =
    "Aprobando…";


  try {

    const user =
      auth.currentUser;


    if (!user) {

      throw new Error(
        "Tu sesión ha caducado. Vuelve a iniciar sesión."
      );

    }


    const idToken =
      await user.getIdToken(
        true
      );


    // ----------------------------------------------------
    // DISTINGUIR ENTRE:
    //
    // 1. Artículo existente
    //    → PUT + aprobar
    //
    // 2. Artículo nuevo creado por admin/preferente
    //    → POST /api/articles
    //    → recibir ID
    //    → aprobar
    // ----------------------------------------------------

    let articleId =
      reviewData.id || null;


    // ----------------------------------------------------
    // ARTÍCULO NUEVO
    // ----------------------------------------------------

    if (!articleId) {

      console.log(
        "🆕 Creando artículo nuevo antes de aprobar..."
      );


      const createResponse =
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


      let createResult;

      try {

        createResult =
          await createResponse.json();

      } catch {

        throw new Error(
          "El servidor devolvió una respuesta no válida al crear el artículo."
        );

      }


      if (
        !createResponse.ok ||
        !createResult.success ||
        !createResult.articleId
      ) {

        throw new Error(
          createResult.error ||
          "No se ha podido crear el artículo."
        );

      }


      // ID generado por el Worker
      articleId =
        createResult.articleId;


      // Conservar el ID para el resto del flujo
      reviewData.id =
        articleId;

      reviewData.editingExistingArticle =
        false;


      console.log(
        "✅ Artículo nuevo creado:",
        articleId
      );

    }


    // ----------------------------------------------------
    // ARTÍCULO EXISTENTE
    // ----------------------------------------------------

    else {

      console.log(
        "✏️ Actualizando artículo existente antes de aprobar:",
        articleId
      );


      const updateResponse =
        await fetch(
          `https://sanfrancisco-noticias.produccioncarprinter.workers.dev/api/admin/articles/${encodeURIComponent(articleId)}`,
          {

            method:
              "PUT",

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


      let updateResult;

      try {

        updateResult =
          await updateResponse.json();

      } catch {

        throw new Error(
          "El servidor devolvió una respuesta no válida al actualizar."
        );

      }


      if (
        !updateResponse.ok ||
        !updateResult.success
      ) {

        throw new Error(
          updateResult.error ||
          "No se han podido guardar los cambios."
        );

      }


      console.log(
        "✅ Artículo existente actualizado antes de aprobar."
      );

    }


    // ----------------------------------------------------
    // APROBAR EL ARTÍCULO
    // ----------------------------------------------------

    const response =
      await fetch(
        `https://sanfrancisco-noticias.produccioncarprinter.workers.dev/api/admin/articles/${encodeURIComponent(articleId)}/approve`,
        {

          method:
            "POST",

          headers: {

            "Authorization":
              `Bearer ${idToken}`

          }

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
        "No se ha podido aprobar el artículo."
      );

    }


    // ----------------------------------------------------
    // LIMPIAR DATOS TEMPORALES
    // ----------------------------------------------------

    sessionStorage.removeItem(
      "pending-review"
    );

    sessionStorage.removeItem(
      "editing-article"
    );


    alert(
      "✓ Artículo aprobado correctamente."
    );


    // ----------------------------------------------------
    // VOLVER AL DASHBOARD
    // ----------------------------------------------------

    window.location.href =
      "/admin/dashboard/";


    return;

  } catch (error) {

    console.error(
      "Error aprobando artículo:",
      error
    );


    alert(
      error.message ||
      "No se ha podido aprobar el artículo."
    );


    approveButton.disabled =
      false;

    approveButton.textContent =
      "Aprobar artículo →";


    return;

  }

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
