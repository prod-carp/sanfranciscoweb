
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getUserRole,
  getRoleName
} from "./permissions.js";


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
// ELEMENTOS DEL DOM
// ==========================================================

const dashboardPage = document.getElementById("dashboard-page");
const userEmailElement = document.getElementById("user-email");
const userRoleElement = document.getElementById("user-role");
const logoutButton = document.getElementById("logout-button");
const articlesList = document.getElementById("articles-list");


// ==========================================================
// FORMATO DE FECHA
// ==========================================================

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}


// ==========================================================
// ESCAPAR HTML
// ==========================================================

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}


// ==========================================================
// CARGAR ARTÍCULOS PENDIENTES
// ==========================================================

async function loadPendingArticles(user) {
  articlesList.innerHTML = `
    <div class="empty-message">
      Cargando artículos...
    </div>
  `;

  try {
    const idToken = await user.getIdToken(true);

    const response = await fetch(
      "https://api.sanfranciscoysantaclara.es/api/admin/articles",
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${idToken}`
        }
      }
    );

    let result;

    try {
      result = await response.json();
    } catch {
      throw new Error(
        "El servidor devolvió una respuesta no válida."
      );
    }

    if (!response.ok || !result.success) {
      throw new Error(
        result.error ||
        "No se han podido cargar los artículos."
      );
    }

    renderArticles(result.articles || []);

  } catch (error) {
    console.error("Error cargando artículos:", error);

    articlesList.innerHTML = `
      <div class="error-message">
        ${escapeHtml(error.message)}
      </div>
    `;
  }
}


// ==========================================================
// MOSTRAR ARTÍCULOS
// ==========================================================

function renderArticles(articles) {
  if (!articles.length) {
    articlesList.innerHTML = `
      <div class="empty-message">
        No hay artículos pendientes de revisión.
      </div>
    `;
    return;
  }

  articlesList.innerHTML = articles.map(article => {
    let categories = "";

    try {
      const parsed = JSON.parse(
        article.categories || "[]"
      );

      categories = Array.isArray(parsed)
        ? parsed.join(", ")
        : String(parsed);

    } catch {
      categories = article.categories || "";
    }

    const highlighted =
      Number(article.highlight) === 1
        ? " · ⭐ Destacada"
        : "";

    return `
      <article class="article-card">

        <h3 class="article-title">
          ${escapeHtml(article.title)}
        </h3>

        <div class="article-meta">
          <strong>Categoría:</strong>
          ${escapeHtml(categories)}
          ${highlighted}

          <br>

          <strong>Autor:</strong>
          ${escapeHtml(article.author_email)}

          <br>

          <strong>Enviado:</strong>
          ${escapeHtml(formatDate(article.submitted_at))}
        </div>

        <span class="article-status">
          🟠 Pendiente
        </span>

        <div class="article-actions">

          <button
            class="review-button"
            data-id="${escapeHtml(article.id)}"
            type="button"
          >
            Revisar
          </button>

          <button
            class="delete-button"
            data-id="${escapeHtml(article.id)}"
            data-title="${escapeHtml(article.title)}"
            type="button"
          >
            Eliminar
          </button>

        </div>

      </article>
    `;
  }).join("");


  // --------------------------------------------------------
  // BOTÓN REVISAR
  // --------------------------------------------------------

  document.querySelectorAll(".review-button").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;

      window.location.href =
        "/admin/editor/review/?id=" +
        encodeURIComponent(id);
    });
  });


  // --------------------------------------------------------
  // BOTÓN ELIMINAR
  // --------------------------------------------------------

  document.querySelectorAll(".delete-button").forEach(button => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;
      const title = button.dataset.title || "este artículo";

      const confirmed = confirm(
        `¿Seguro que quieres eliminar «${title}»?\n\n` +
        "Se borrará el registro de D1 y su imagen temporal " +
        "de R2. Esta acción no se puede deshacer."
      );

      if (!confirmed) {
        return;
      }

      const originalText = button.textContent;

      button.disabled = true;
      button.textContent = "Eliminando…";

      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          throw new Error(
            "La sesión ha caducado. Vuelve a iniciar sesión."
          );
        }

        const idToken = await currentUser.getIdToken(true);

        const response = await fetch(
          "https://api.sanfranciscoysantaclara.es/api/admin/articles/" +
          encodeURIComponent(id),
          {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${idToken}`
            }
          }
        );

        let result;

        try {
          result = await response.json();
        } catch {
          throw new Error(
            "El servidor devolvió una respuesta no válida."
          );
        }

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ||
            "No se ha podido eliminar el artículo."
          );
        }

        alert(
          "Artículo eliminado correctamente de D1 y su imagen temporal de R2."
        );

        // Recargar la lista tras el borrado.
        if (auth.currentUser) {
          await loadPendingArticles(auth.currentUser);
        }

      } catch (error) {
        console.error("Error eliminando artículo:", error);

        alert(
          error.message ||
          "Ha ocurrido un error al eliminar el artículo."
        );

        button.disabled = false;
        button.textContent = originalText;
      }
    });
  });
}


// ==========================================================
// AUTENTICACIÓN Y CONTROL DE ACCESO
// ==========================================================

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.replace("/admin/login/");
    return;
  }

  const email = (user.email || "")
    .trim()
    .toLowerCase();

  const role = getUserRole(email);
  const roleName = getRoleName(role);


  // --------------------------------------------------------
  // SOLO ADMINISTRADOR O PREFERENTE
  // --------------------------------------------------------

  if (role !== "admin" && role !== "preferred") {
    alert(
      "No tienes permisos para acceder al panel de administración."
    );

    window.location.replace("/admin/editor/");
    return;
  }

  userEmailElement.textContent = email;
  userRoleElement.textContent = roleName;
  dashboardPage.style.display = "block";

  await loadPendingArticles(user);
});


// ==========================================================
// CERRAR SESIÓN
// ==========================================================

logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);

    window.location.href = "/admin/login/";

  } catch (error) {
    console.error("Error cerrando sesión:", error);

    alert("No se ha podido cerrar la sesión.");
  }
});
