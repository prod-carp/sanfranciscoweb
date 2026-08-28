import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getUserRole,
  getPermissionsForRole,
  getRoleName,
  CATEGORY_DESCRIPTIONS
} from "./permissions.js";

import {
  getMarkdown,
  getPlainText,
  onContentChange
} from "../editor/text-editor.js";



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
// OBTENER ID DEL ARTÍCULO QUE ESTAMOS MODIFICANDO
// ==========================================================

function getEditingArticleId() {
  try {
    const data = JSON.parse(sessionStorage.getItem("editing-article") || "{}");
    return data.id || null;
  } catch (error) {
    console.warn("No se pudo obtener el ID del artículo:", error);
    return null;
  }
}

// CARGAR IMAGEN EXISTENTE DESDE R2
async function cargarImagenExistenteDesdeR2(user, imageKey) {
  const articleId = getEditingArticleId();
  if (!user || !imageKey || !articleId) {
    console.warn("Faltan datos para cargar la imagen de R2.");
    return null;
  }
  try {
    const token = await user.getIdToken(true);
    const response = await fetch(`https://sanfrancisco-noticias.produccioncarprinter.workers.dev/api/admin/articles/${encodeURIComponent(articleId)}/image`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    console.log("✅ Imagen obtenida desde R2:", blob.size, "bytes");
    return blob;
  } catch (error) {
    console.error("❌ Error cargando imagen desde R2:", error);
    return null;
  }
}


// ==========================================================
// RESTAURAR ARTÍCULO DESDE REVISIÓN
// ==========================================================

async function restaurarArticuloDesdeRevision(user) {
  
  // Buscar primero en editing-article (para cuando venimos de modificar)
  let datosGuardados = sessionStorage.getItem("editing-article");
  
  // Si no hay, buscar en pending-review (por si el usuario vuelve directamente)
  if (!datosGuardados) {
    datosGuardados = sessionStorage.getItem("pending-review");
  }
  
  if (!datosGuardados) {
    return false;
  }
  
  try {
    
    const data = JSON.parse(datosGuardados);
    console.log("📝 Restaurando artículo desde revisión:", data);
    
    // ======================================================
    // RESTAURAR TÍTULO
    // ======================================================
    
    if (titleInput && data.title) {
      titleInput.value = data.title;
      titleInput.dispatchEvent(new Event('input'));
    }
    
    // ======================================================
    // RESTAURAR SUBTÍTULO
    // ======================================================
    
    if (subtitleInput && data.subtitle) {
      subtitleInput.value = data.subtitle;
      subtitleInput.dispatchEvent(new Event('input'));
    }
    
    // ======================================================
    // RESTAURAR CATEGORÍA
    // ======================================================
    
    if (categorySelect && data.category) {
      
      const checkCategoryLoaded = () => {
        const optionExists = Array.from(categorySelect.options).some(
          option => option.value === data.category
        );
        
        if (optionExists) {
          categorySelect.value = data.category;
          categorySelect.dispatchEvent(new Event('change'));
          console.log("✅ Categoría restaurada:", data.category);
        } else {
          console.log("⏳ Esperando categorías...");
          setTimeout(checkCategoryLoaded, 100);
        }
      };
      
      checkCategoryLoaded();
    }
    
    // ======================================================
    // RESTAURAR FECHA DE PUBLICACIÓN
    // ======================================================
    
    if (postDate && data.publicationDate) {
      postDate.value = data.publicationDate;
    }
    
// ======================================================
// RESTAURAR DESTACADO
// ======================================================

if (
  highlightCheckbox &&
  typeof data.highlight === "boolean"
) {

  highlightCheckbox.checked =
    data.highlight;

  highlightDaysContainer.style.display =
    data.highlight
      ? "block"
      : "none";

}


if (
  data.highlightDays !== null &&
  data.highlightDays !== undefined
) {

  const highlightDays =
    document.getElementById(
      "highlight-days"
    );

  if (
    highlightDays
  ) {

    highlightDays.value =
      String(
        data.highlightDays
      );

  }

}


// ======================================================
// RESTAURAR RECURRENCIA
// ======================================================

if (
  recurringCheckbox &&
  typeof data.recurring === "boolean"
) {

  recurringCheckbox.checked =
    data.recurring;

  // Mostrar inmediatamente el selector de tipo
  recurringTypeContainer.style.display =
    data.recurring
      ? "block"
      : "none";

}


// ======================================================
// RESTAURAR TIPO DE RECURRENCIA
// ======================================================

if (
  data.recurringType
) {

  recurringType.value =
    data.recurringType;

}


// ======================================================
// RESTAURAR RECURRENCIA ANUAL
// ======================================================

if (
  data.recurring &&
  data.recurringType === "annual"
) {

  // Mostrar opciones anuales
  annualOptions.style.display =
    "block";

  liturgicalRecurringOptions.style.display =
    "none";


  // ----------------------------------------------------
  // Restaurar MES
  // ----------------------------------------------------

  if (
    data.baseMonth
  ) {

    baseMonth.value =
      String(
        data.baseMonth
      );

  }


  // ----------------------------------------------------
  // MUY IMPORTANTE:
  // Generar los días después de restaurar el mes
  // ----------------------------------------------------

  updateBaseDays();


  // ----------------------------------------------------
  // Ahora sí podemos restaurar el DÍA
  // ----------------------------------------------------

  if (
    data.baseDay
  ) {

    baseDay.value =
      String(
        data.baseDay
      );

  }


  // ----------------------------------------------------
  // Restaurar días antes
  // ----------------------------------------------------

  const annualDaysBefore =
    document.getElementById(
      "days-before"
    );


  if (
    annualDaysBefore &&
    data.annualDaysBefore !== null &&
    data.annualDaysBefore !== undefined
  ) {

    annualDaysBefore.value =
      String(
        data.annualDaysBefore
      );

  }


  // ----------------------------------------------------
  // Restaurar días después
  // ----------------------------------------------------

  const annualDaysAfter =
    document.getElementById(
      "days-after"
    );


  if (
    annualDaysAfter &&
    data.annualDaysAfter !== null &&
    data.annualDaysAfter !== undefined
  ) {

    annualDaysAfter.value =
      String(
        data.annualDaysAfter
      );

  }

}


// ======================================================
// RESTAURAR RECURRENCIA LITÚRGICA
// ======================================================

if (
  data.recurring &&
  data.recurringType === "liturgical"
) {

  annualOptions.style.display =
    "none";

  liturgicalRecurringOptions.style.display =
    "block";


  if (
    data.liturgicalType
  ) {

    liturgicalRecurringType.value =
      data.liturgicalType;

  }


  const liturgicalDaysBefore =
    document.getElementById(
      "liturgical-days-before"
    );


  const liturgicalDaysAfter =
    document.getElementById(
      "liturgical-days-after"
    );


  if (
    liturgicalDaysBefore &&
    data.daysBefore !== null &&
    data.daysBefore !== undefined
  ) {

    liturgicalDaysBefore.value =
      String(
        data.daysBefore
      );

  }


  if (
    liturgicalDaysAfter &&
    data.daysAfter !== null &&
    data.daysAfter !== undefined
  ) {

    liturgicalDaysAfter.value =
      String(
        data.daysAfter
      );

  }

}


    // ======================================================
    // RESTAURAR CONTENIDO
    // ======================================================
    
    if (data.content) {
      
      console.log("📝 Restaurando contenido...");
      
      const visualEditor = document.getElementById("visual-editor");
      const markdownEditor = document.getElementById("markdown-editor");
      
      // Guardar en la variable global
      if (typeof markdownContent !== 'undefined') {
        markdownContent = data.content;
      }
      
      // Actualizar textarea Markdown
      if (markdownEditor) {
        markdownEditor.value = data.content;
      }
      
      // Actualizar editor visual usando la función global
      if (visualEditor && typeof window.markdownToHtml === 'function') {
        visualEditor.innerHTML = window.markdownToHtml(data.content);
        console.log("✅ Editor visual restaurado");
      } else if (visualEditor) {
        // Fallback: mostrar el contenido en bruto
        visualEditor.innerHTML = data.content;
        console.warn("⚠️ markdownToHtml no disponible globalmente");
      }
      
      // Disparar eventos para actualizar contadores
      if (markdownEditor) markdownEditor.dispatchEvent(new Event('input'));
      if (visualEditor) visualEditor.dispatchEvent(new Event('input'));
      
      console.log("✅ Contenido restaurado, longitud:", data.content.length);
    }
    
// ======================================================
// RESTAURAR IMAGEN
// ======================================================

if (data.editingExistingArticle && data.imageKey) {
  // ARTÍCULO EXISTENTE: Cargar imagen directamente desde R2
  console.log("🖼️ Cargando imagen existente desde R2...");
  
  if (user) {
    const existingImageBlob = await cargarImagenExistenteDesdeR2(user, data.imageKey);
    if (existingImageBlob) {
      croppedImageBlob = existingImageBlob;
      const imageUrl = URL.createObjectURL(existingImageBlob);
      const previewImage = document.getElementById("preview-image");
      const imagePreview = document.getElementById("image-preview");
      if (previewImage) previewImage.src = imageUrl;
      if (imagePreview) imagePreview.style.display = "block";
      const cropResultMessage = document.getElementById("crop-result-message");
      if (cropResultMessage) {
        cropResultMessage.textContent = "✓ Imagen actual restaurada desde R2.";
        cropResultMessage.style.display = "block";
        cropResultMessage.style.color = "#2a5";
      }
      const cropApply = document.getElementById("crop-apply");
      if (cropApply) cropApply.textContent = "✓ Imagen actual";
      console.log("✅ Imagen existente preparada para envío.");
    } else {
      console.warn("⚠️ No se pudo recuperar la imagen desde R2.");
    }
  } else {
    console.warn("⚠️ No hay usuario autenticado para recuperar la imagen.");
  }
} else if (data.image) {
  // ARTÍCULO NORMAL: La imagen viene como Data URL
  console.log("🖼️ Restaurando imagen desde Data URL...");
  const previewImage = document.getElementById("preview-image");
  const imagePreview = document.getElementById("image-preview");
  if (previewImage && imagePreview) {
    previewImage.src = data.image;
    imagePreview.style.display = "block";
  }
  try {
    const blob = await convertirDataURLToBlob(data.image);
    if (blob) {
      croppedImageBlob = blob;
      console.log("✅ Imagen preparada para envío:", blob.size, "bytes");
    }
  } catch (error) {
    console.warn("⚠️ No se pudo restaurar la imagen como Blob:", error);
  }
}
    
    // ======================================================
    // MOSTRAR MENSAJE DE RESTAURACIÓN
    // ======================================================
    
    mostrarMensajeRestauracion();
    
    return true;
    
  } catch (error) {
    
    console.error("❌ Error al restaurar el artículo:", error);
    return false;
    
  }
}


// ==========================================================
// MOSTRAR MENSAJE DE RESTAURACIÓN
// ==========================================================

function mostrarMensajeRestauracion() {
  // Buscar si existe un contenedor para mensajes de restauración
  let mensajeContainer = document.getElementById("restore-message");
  
  if (!mensajeContainer) {
    // Crear el contenedor si no existe
    mensajeContainer = document.createElement("div");
    mensajeContainer.id = "restore-message";
    mensajeContainer.style.cssText = `
      background: #e8f5e9;
      color: #2e7d32;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 0.95rem;
      border-left: 4px solid #4caf50;
    `;
    
    // Insertar al principio de la tarjeta principal
    const firstCard = document.querySelector(".admin-card");
    if (firstCard) {
      firstCard.parentNode.insertBefore(mensajeContainer, firstCard);
    } else {
      document.querySelector(".admin-container")?.prepend(mensajeContainer);
    }
  }
  
  mensajeContainer.textContent = "📝 Artículo restaurado desde revisión. Puedes seguir editándolo.";
  mensajeContainer.style.display = "block";
  
  // Ocultar después de 5 segundos
  setTimeout(() => {
    if (mensajeContainer) {
      mensajeContainer.style.opacity = "0";
      mensajeContainer.style.transition = "opacity 0.5s ease";
      setTimeout(() => {
        if (mensajeContainer) {
          mensajeContainer.style.display = "none";
          mensajeContainer.style.opacity = "1";
        }
      }, 500);
    }
  }, 5000);
}


// ==========================================================
// ELEMENTOS
// ==========================================================

const userEmailElement =
  document.getElementById("user-email");

const userRoleElement =
  document.getElementById("user-role");

const logoutButton =
  document.getElementById("logout-button");

const categorySelect =
  document.getElementById("post-category");

const categoryDescription =
  document.getElementById("category-description");

const recurringType =
  document.getElementById(
    "recurring-type"
  );

const baseMonth =
  document.getElementById(
    "base-month"
  );

const baseDay =
  document.getElementById(
    "base-day"
  );

// const contentInput = document.getElementById("post-content");

const contentCounter =
  document.getElementById(
    "content-counter"
  );

const annualOptions =
  document.getElementById(
    "annual-options"
  );

const liturgicalRecurringOptions =
  document.getElementById(
    "liturgical-recurring-options"
  );

const liturgicalRecurringSelectorContainer =
  document.getElementById(
    "liturgical-recurring-selector-container"
  );

const liturgicalRecurringType =
  document.getElementById(
    "liturgical-recurring-type"
  );

const advancedOptions =
  document.getElementById("advanced-options");

const highlightCheckbox =
  document.getElementById("highlight-post");

const highlightDaysContainer =
  document.getElementById("highlight-days-container");

const recurringCheckbox =
  document.getElementById("recurring-post");

const recurringTypeContainer =
  document.getElementById("recurring-type-container");

const titleInput =
  document.getElementById("post-title");

const subtitleInput =
  document.getElementById("post-subtitle");

const titleCounter =
  document.getElementById("title-counter");

const subtitleCounter =
  document.getElementById("subtitle-counter");

const imageUpload =
  document.getElementById("image-upload");

const imageInput =
  document.getElementById("post-image");

const imageValidationMessage = 
  document.getElementById("image-validation-message");

const postDate =
  document.getElementById("post-date");

// ==========================================================
// CONTADOR DE CONTENIDO
// ==========================================================

const CONTENT_MIN =
  300;

const CONTENT_MAX =
  10000;


function updateContentCounter(
  text
) {

  const length =
    text.length;


  contentCounter.textContent =
    `${length.toLocaleString("es-ES")} / 10.000 · mínimo 300`;


  // --------------------------------------------------------
  // Color del contador
  // --------------------------------------------------------

  contentCounter.style.color =
    length > 0 && length < CONTENT_MIN
      ? "#a33"
      : "";


  // --------------------------------------------------------
  // Si supera el máximo
  // --------------------------------------------------------

  if (
    length > CONTENT_MAX
  ) {

    contentCounter.style.color =
      "#a33";

  }

}


// ==========================================================
// ESCUCHAR CAMBIOS DEL EDITOR
// ==========================================================

onContentChange(
  updateContentCounter
);


// ==========================================================
// RECORTADOR DE IMAGEN - ELEMENTOS
// ==========================================================

const cropper =
  document.getElementById(
    "image-cropper"
  );

const cropperContainer =
  document.getElementById(
    "cropper-container"
  );

const cropperCanvas =
  document.getElementById(
    "cropper-canvas"
  );

const cropApply =
  document.getElementById(
    "crop-apply"
  );

const cropReset =
  document.getElementById(
    "crop-reset"
  );

const cropResultMessage =
  document.getElementById(
    "crop-result-message"
  );

// Mostrar previa de imagen
const imagePreview = document.getElementById("image-preview");
const previewImage = document.getElementById("preview-image");

// ==========================================================
// RECORTADOR DE IMAGEN - VARIABLES DE ESTADO
// ==========================================================

const cropContext =
  cropperCanvas?.getContext(
    "2d"
  );

let cropImage = null;

let cropScale = 1;

let cropX = 0;

let cropY = 0;

let cropStartX = 0;

let cropStartY = 0;

let cropDragging = false;

let cropInitialScale = 1;

let croppedImageBlob = null;



// ==========================================================
// AUTENTICACIÓN
// ==========================================================

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.replace("/admin/login/");
    return;
  }

  const email = user.email || "";
  const role = getUserRole(email);
  const permissions = getPermissionsForRole(role);

  // ======================================================
  // RESTAURAR ARTÍCULO DESDE REVISIÓN (AHORA CON USER)
  // ======================================================

  await restaurarArticuloDesdeRevision(user);


  // --------------------------------------------------------
  // Mostrar usuario
  // --------------------------------------------------------

  userEmailElement.textContent = email;

  userRoleElement.textContent =
    getRoleName(role);


  // --------------------------------------------------------
  // Categorías
  // --------------------------------------------------------

  categorySelect.innerHTML = `
    <option value="">
      Selecciona una categoría
    </option>
  `;


  permissions.categories.forEach(category => {

    const option =
      document.createElement("option");

    option.value = category;

    option.textContent = category;

    categorySelect.appendChild(option);

  });


  // --------------------------------------------------------
  // Funciones avanzadas
  // --------------------------------------------------------

  if (
    permissions.canHighlight ||
    permissions.canRecurring
  ) {

    advancedOptions.classList.add("visible");

  }


  // Destacar

  if (!permissions.canHighlight) {

    highlightCheckbox.parentElement.style.display =
      "none";

    highlightDaysContainer.style.display =
      "none";

  }


  // Recurrente

  if (!permissions.canRecurring) {

    recurringCheckbox.parentElement.style.display =
      "none";

    recurringTypeContainer.style.display =
      "none";

  }

});


// ==========================================================
// DÍAS DE LA FECHA BASE
// ==========================================================

function updateBaseDays() {

  const month =
    parseInt(baseMonth.value, 10);


  baseDay.innerHTML = `
    <option value="">
      Día
    </option>
  `;


  if (!month) {
    return;
  }


  /*
   * Usamos 2024 porque es año bisiesto y permite
   * mostrar correctamente hasta el día 29 de febrero.
   */

  const daysInMonth =
    new Date(
      2024,
      month,
      0
    ).getDate();


  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const option =
      document.createElement("option");

    option.value =
      String(day).padStart(2, "0");

    option.textContent =
      day;

    baseDay.appendChild(option);

  }

}


baseMonth.addEventListener(
  "change",
  updateBaseDays
);



// ==========================================================
// CATEGORÍA
// ==========================================================

function updateCategoryDescription(category) {
  if (!category) {
    categoryDescription.style.display = "none";
    categoryDescription.textContent = "";
    return;
  }

  const description = CATEGORY_DESCRIPTIONS[category];
  
  if (description) {
    categoryDescription.textContent = description;
    categoryDescription.style.display = "block";
  } else {
    categoryDescription.style.display = "none";
    categoryDescription.textContent = "";
  }
}

categorySelect.addEventListener("change", () => {
  const category = categorySelect.value;
  updateCategoryDescription(category);
});


// ==========================================================
// CONTADORES
// ==========================================================

titleInput.addEventListener(
  "input",
  () => {

const length =
  titleInput.value.length;

titleCounter.textContent =
  `${length} / 60 · mínimo 20`;

titleCounter.style.color =
  length > 0 && length < 20
    ? "#a33"
    : "";

  }
);


subtitleInput.addEventListener(
  "input",
  () => {

const length =
  subtitleInput.value.length;

subtitleCounter.textContent =
  `${length} / 150 · mínimo 30`;

subtitleCounter.style.color =
  length > 0 && length < 30
    ? "#a33"
    : "";

  }
);


// ==========================================================
// DESTACAR NOTICIA
// ==========================================================

highlightCheckbox.addEventListener(
  "change",
  () => {

    highlightDaysContainer.style.display =
      highlightCheckbox.checked
        ? "block"
        : "none";

  }
);


// ==========================================================
// NOTICIA RECURRENTE
// ==========================================================

recurringCheckbox.addEventListener(
  "change",
  () => {

    recurringTypeContainer.style.display =
      recurringCheckbox.checked
        ? "block"
        : "none";


    if (!recurringCheckbox.checked) {

      recurringType.value = "";

      annualOptions.style.display =
        "none";

      liturgicalRecurringOptions.style.display =
        "none";

    }

  }
);


recurringType.addEventListener(
  "change",
  () => {

    annualOptions.style.display =
      "none";

    liturgicalRecurringOptions.style.display =
      "none";


    if (
      recurringType.value === "annual"
    ) {

      annualOptions.style.display =
        "block";

      return;

    }


    if (
      recurringType.value === "liturgical"
    ) {

      liturgicalRecurringOptions.style.display =
        "block";

    }

  }
);

// ==========================================================
// RESTAURAR ARTÍCULO DESDE REVISIÓN
// ==========================================================
//
// Todos los elementos y eventos del formulario ya están
// preparados. Ahora sí podemos restaurar correctamente
// el estado anterior.
//

restaurarArticuloDesdeRevision();


// ==========================================================
// IMAGEN
// ==========================================================

imageUpload.addEventListener(
  "click",
  (event) => {
    // Prevenir que otros elementos padre reciban el click
    event.stopPropagation();
    imageInput.click();
  }
);


// ==========================================================
// VALIDACIÓN DE IMAGEN
// ==========================================================

function loadImage(file) {

  return new Promise(
    (resolve, reject) => {

      const image =
        new Image();


      image.onload = () => {

        URL.revokeObjectURL(
          image.src
        );

        resolve(image);

      };


      image.onerror = () => {

        URL.revokeObjectURL(
          image.src
        );

        reject(
          new Error(
            "No se ha podido leer la imagen."
          )
        );

      };


      image.src =
        URL.createObjectURL(file);

    }
  );

}


async function validateImage(file) {

if (!file) { return { valid: false, message: "Es necesario subir una imagen." }; }


  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];


  if (
    !allowedTypes.includes(file.type)
  ) {

    return {
      valid: false,
      message:
        "El formato de la imagen no es válido. " +
        "Utiliza JPG, PNG o WebP."
    };

  }


  const maxFileSize =
    15 * 1024 * 1024;


  if (
    file.size > maxFileSize
  ) {

    return {
      valid: false,
      message:
        "La imagen es demasiado grande. " +
        "El tamaño máximo permitido es de 15 MB."
    };

  }


  const image =
    await loadImage(file);


  const smallestSide =
    Math.min(
      image.naturalWidth,
      image.naturalHeight
    );


  if (
    smallestSide < 637
  ) {

    return {
      valid: false,
      message:
        `La imagen es demasiado pequeña. ` +
        `El lado menor tiene ${smallestSide} píxeles ` +
        `y debe tener al menos 637 píxeles.`
    };

  }


  return {
    valid: true,
    image
  };

}


// ==========================================================
// RECORTADOR DE IMAGEN - FUNCIONES
// ==========================================================

function resizeCropCanvas() {

  if (!cropperContainer) return;

  const size =
    cropperContainer.clientWidth;


  if (cropperCanvas) {
    cropperCanvas.width = size;
    cropperCanvas.height = size;
  }


  drawCropper();

}


function drawCropper() {

  if (!cropImage || !cropContext || !cropperCanvas) {
    return;
  }


  const size =
    cropperCanvas.width;


  // Limpiar correctamente el canvas
  cropContext.clearRect(
    0,
    0,
    size,
    size
  );


  // Fondo negro para que se vea mejor el contraste
  cropContext.fillStyle = "#000";
  cropContext.fillRect(0, 0, size, size);


  const width =
    cropImage.naturalWidth *
    cropScale;

  const height =
    cropImage.naturalHeight *
    cropScale;


  cropContext.drawImage(
    cropImage,
    cropX,
    cropY,
    width,
    height
  );

}


function initializeCropper(image) {

  cropImage = image;

  cropper.style.display =
    "block";

  /*
   * Esperamos a que el navegador haya aplicado
   * display:block antes de calcular el tamaño.
   */

  requestAnimationFrame(() => {

    resizeCropCanvas();

    const size =
      cropperContainer.clientWidth;

    cropInitialScale =
      Math.max(
        size / image.naturalWidth,
        size / image.naturalHeight
      );

    cropScale =
      cropInitialScale;

    cropX =
      (
        size -
        image.naturalWidth *
        cropScale
      ) / 2;

    cropY =
      (
        size -
        image.naturalHeight *
        cropScale
      ) / 2;

    drawCropper();

  });
}


function constrainCrop() {

  if (!cropperCanvas || !cropImage) return;

  const size =
    cropperCanvas.width;


  const width =
    cropImage.naturalWidth *
    cropScale;

  const height =
    cropImage.naturalHeight *
    cropScale;


  if (width <= size) {

    cropX =
      (size - width) / 2;

  } else {

    cropX =
      Math.min(
        0,
        Math.max(
          size - width,
          cropX
        )
      );

  }


  if (height <= size) {

    cropY =
      (size - height) / 2;

  } else {

    cropY =
      Math.min(
        0,
        Math.max(
          size - height,
          cropY
        )
      );

  }

}


// ==========================================================
// RECORTADOR DE IMAGEN - EVENTOS
// ==========================================================

// Evento change del input de imagen
imageInput.addEventListener(
  "change",
  async () => {

    const file =
      imageInput.files[0];


    // Resetear estado del recortador
    croppedImageBlob = null;

   // Ocultar vista previa cuando cambie la imagen
    if (imagePreview) { imagePreview.style.display = "none"; }

    if (cropResultMessage) {
      cropResultMessage.style.display =
        "none";
    }

    if (cropApply) {
      cropApply.textContent =
        "✓ Aplicar recorte";
    }


    if (!file) {

      if (imageValidationMessage) {
        imageValidationMessage.style.display =
          "none";
      }

      if (cropper) {
        cropper.style.display =
          "none";
      }

      return;

    }


    if (imageValidationMessage) {
      imageValidationMessage.style.display =
        "block";

      imageValidationMessage.textContent =
        "Comprobando imagen...";

      imageValidationMessage.style.color =
        "#333";
    }


    try {

      const result =
        await validateImage(file);


      if (!result.valid) {

        if (imageValidationMessage) {
          imageValidationMessage.textContent =
            result.message;

          imageValidationMessage.style.color =
            "#a33";
        }


        imageInput.value =
          "";


        if (cropper) {
          cropper.style.display =
            "none";
        }


        return;

      }


      const image =
        result.image;


      if (imageValidationMessage) {
        imageValidationMessage.textContent =
          `Imagen válida: ${
            image.naturalWidth
          } × ${
            image.naturalHeight
          } píxeles.`;

        imageValidationMessage.style.color =
          "#2a5";
      }


      // Inicializar recortador
      initializeCropper(
        image
      );


      if (cropper) {
        cropper.style.display =
          "block";
      }


      // Resetear estado de recorte
      croppedImageBlob = null;
     // ocultar también la vista previa antigua
     if (imagePreview) { imagePreview.style.display = "none"; }

      if (cropApply) {
        cropApply.textContent =
          "✓ Aplicar recorte";
      }

      if (cropResultMessage) {
        cropResultMessage.style.display =
          "none";
      }

    } catch (error) {

      console.error(error);


      if (imageValidationMessage) {
        imageValidationMessage.textContent =
          "No se ha podido leer la imagen.";

        imageValidationMessage.style.color =
          "#a33";
      }


      imageInput.value =
        "";

    }

  }
);


// Event listener para el botón de aplicar recorte
if (cropApply) {
  cropApply.addEventListener(
    "click",
    (event) => {
      // Prevenir propagación
      event.stopPropagation();
      
      if (!cropImage) {

        alert(
          "Primero debes seleccionar una imagen."
        );

        return;

      }


      if (!cropperCanvas) {

        alert(
          "No se ha podido cargar el recortador."
        );

        return;

      }


      /*
       * El resultado final siempre será exactamente
       * 637 × 637 píxeles.
       */

      const outputCanvas =
        document.createElement(
          "canvas"
        );


      outputCanvas.width =
        637;

      outputCanvas.height =
        637;


      const outputContext =
        outputCanvas.getContext(
          "2d"
        );


      const canvasSize =
        cropperCanvas.width;

      const ratio =
        637 / canvasSize;


// Calcular las coordenadas REALES en la imagen original
const sourceX = -cropX / cropScale;
const sourceY = -cropY / cropScale;
const sourceWidth = cropperCanvas.width / cropScale;
const sourceHeight = cropperCanvas.height / cropScale;

// Dibujar el recorte correcto
outputContext.drawImage(
  cropImage,
  sourceX,          // Coordenada X real en la imagen original
  sourceY,          // Coordenada Y real en la imagen original
  sourceWidth,      // Ancho real en la imagen original
  sourceHeight,     // Alto real en la imagen original
  0,                // Destino X (siempre 0)
  0,                // Destino Y (siempre 0)
  637,              // Ancho de salida
  637               // Alto de salida
);


outputCanvas.toBlob(
  blob => {

    if (!blob) {

      if (cropResultMessage) {

        cropResultMessage.textContent =
          "No se ha podido preparar la imagen.";

        cropResultMessage.style.display =
          "block";

        cropResultMessage.style.color =
          "#a33";

      }

      return;

    }


    // ======================================================
    // GUARDAR LA IMAGEN FINAL
    // ======================================================

    /*
     * Este Blob es ya la imagen definitiva:
     *
     * 637 × 637 píxeles
     * WebP
     * Calidad 80 %
     */

    croppedImageBlob =
      blob;

// Ocultar el recortador al finalizar
if (cropper) {
  cropper.style.display =
    "none";
}


    // ======================================================
    // MOSTRAR LA IMAGEN FINAL
    // ======================================================

    if (
      previewImage &&
      imagePreview
    ) {

      /*
       * Liberar previamente la URL anterior,
       * si existiera.
       */

      if (
        previewImage.dataset.objectUrl
      ) {

        URL.revokeObjectURL(
          previewImage.dataset.objectUrl
        );

      }


      const objectUrl =
        URL.createObjectURL(
          blob
        );


      previewImage.src =
        objectUrl;


      previewImage.dataset.objectUrl =
        objectUrl;


      imagePreview.style.display =
        "block";

    }


// ======================================================
// MENSAJE DE ÉXITO
// ======================================================

if (imageValidationMessage) {

  imageValidationMessage.textContent =
    "✓ Imagen preparada: WebP · 637 × 637 px · calidad 80 %.";

  imageValidationMessage.style.display =
    "block";

  imageValidationMessage.style.color =
    "#2a5";

}


    if (cropApply) {

      cropApply.textContent =
        "✓ Recorte aplicado";

    }

  },
  "image/webp",
  0.80
);

    }
  );
}


// Todos los eventos del canvas previenen propagación
if (cropperCanvas) {

  // Prevenir que el click del canvas abra el selector de archivos
  cropperCanvas.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();
    }
  );

  cropperCanvas.addEventListener(
    "pointerdown",
    (event) => {
      // Prevenir propagación
      event.stopPropagation();
      
      cropDragging =
        true;


      if (event.pointerId !== undefined) {
        cropperCanvas.setPointerCapture(
          event.pointerId
        );
      }


      cropStartX =
        event.clientX -
        cropX;

      cropStartY =
        event.clientY -
        cropY;


      cropperCanvas.style.cursor =
        "grabbing";

    }
  );


  cropperCanvas.addEventListener(
    "pointermove",
    (event) => {
      // Prevenir propagación
      event.stopPropagation();

      if (!cropDragging) {
        return;
      }


      cropX =
        event.clientX -
        cropStartX;

      cropY =
        event.clientY -
        cropStartY;


      constrainCrop();


      drawCropper();


      // Resetear estado de recorte al mover
      croppedImageBlob =
        null;

      if (cropApply) {
        cropApply.textContent =
          "✓ Aplicar recorte";
      }

      if (cropResultMessage) {
        cropResultMessage.style.display =
          "none";
      }

    }
  );


  cropperCanvas.addEventListener(
    "pointerup",
    (event) => {
      // Prevenir propagación
      event.stopPropagation();

      cropDragging =
        false;


      if (event.pointerId !== undefined) {
        cropperCanvas.releasePointerCapture(
          event.pointerId
        );
      }


      cropperCanvas.style.cursor =
        "grab";


      // Resetear estado de recorte al soltar
      croppedImageBlob =
        null;

      if (cropApply) {
        cropApply.textContent =
          "✓ Aplicar recorte";
      }

      if (cropResultMessage) {
        cropResultMessage.style.display =
          "none";
      }

    }
  );


  cropperCanvas.addEventListener(
    "pointercancel",
    (event) => {
      // Prevenir propagación
      event.stopPropagation();
      cropDragging =
        false;

    }
  );


  // Zoom con la rueda del ratón
// ==========================================================
// ZOOM CON LA RUEDA DEL RATÓN
// ==========================================================

// Zoom con la rueda del ratón
cropperCanvas.addEventListener(
  "wheel",
  (event) => {
    // Prevenir propagación
    event.preventDefault();
    event.stopPropagation();

    const zoom =
      event.deltaY < 0
        ? 1.05
        : 0.95;

    const oldScale =
      cropScale;

    cropScale *=
      zoom;

    /*
     * No permitimos reducir la imagen por debajo
     * del tamaño necesario para cubrir el cuadrado.
     */
    cropScale =
      Math.max(
        cropInitialScale,
        cropScale
      );

    /*
     * Limitar el zoom máximo para evitar pixelación
     * El zoom máximo será cuando el lado más pequeño de la imagen
     * alcance 637 píxeles en el canvas (tamaño de salida)
     */
    const canvasSize = cropperCanvas.width;
    const imageSmallestSide = Math.min(
      cropImage.naturalWidth,
      cropImage.naturalHeight
    );
    
    // La escala máxima es cuando el lado menor de la imagen = 637px
    const maxScale = (canvasSize / imageSmallestSide) * (637 / canvasSize);
    
    // Asegurarnos de que maxScale sea al menos cropInitialScale
    const effectiveMaxScale = Math.max(maxScale, cropInitialScale * 1.5);
    
    cropScale = Math.min(
      effectiveMaxScale,
      cropScale
    );

    const rect =
      cropperCanvas.getBoundingClientRect();

    const mouseX =
      event.clientX -
      rect.left;

    const mouseY =
      event.clientY -
      rect.top;

    /*
     * Mantiene como punto de referencia
     * la posición del cursor.
     */
    const scaleRatio =
      cropScale /
      oldScale;

    cropX =
      mouseX -
      (
        mouseX -
        cropX
      ) *
      scaleRatio;

    cropY =
      mouseY -
      (
        mouseY -
        cropY
      ) *
      scaleRatio;

    constrainCrop();

    drawCropper();

    // Resetear estado de recorte al hacer zoom
    croppedImageBlob = null;

    if (cropApply) {
      cropApply.textContent =
        "✓ Aplicar recorte";
    }

    if (cropResultMessage) {
      cropResultMessage.style.display =
        "none";
    }

  },
  {
    passive:false
  }
);

}


// Restablecer recorte
if (cropReset) {
  cropReset.addEventListener(
    "click",
    (event) => {
      // Prevenir propagación
      event.stopPropagation();

      if (!cropImage) {
        return;
      }


      initializeCropper(
        cropImage
      );


      if (cropResultMessage) {
        cropResultMessage.style.display =
          "none";
      }


      // Resetear estado de recorte
      croppedImageBlob =
        null;

      if (cropApply) {
        cropApply.textContent =
          "✓ Aplicar recorte";
      }

    }
  );
}


// Redimensionar el canvas cuando cambie el tamaño de la ventana
window.addEventListener(
  "resize",
  () => {

    if (cropImage) {
      resizeCropCanvas();
    }

  }
);


// ==========================================================
// VISTA PREVIA
// ==========================================================

document
  .getElementById("preview-button")
  .addEventListener(
    "click",
    () => {

      const title =
        titleInput.value.trim();

      const subtitle =
        subtitleInput.value.trim();

      const category =
        categorySelect.value;

      const content =
        document
          .getElementById("post-content")
          .value.trim();


      if (!title || !content) {

        alert(
          "Necesitas escribir al menos el título y el contenido."
        );

        return;

      }


      alert(
        "La vista previa completa la construiremos en el siguiente paso."
      );

    }
  );


// ==========================================================
// ENVIAR PARA REVISION
// ==========================================================

document.getElementById("submit-button").addEventListener("click", async () => {
  // Obtener todos los valores una sola vez
  const title = titleInput.value.trim();
  const subtitle = subtitleInput.value.trim();
  const category = categorySelect.value;
  const publicationDate = postDate.value;
//  const content = contentInput.value.trim();

 
  // Validar título
  if (!title) {
    alert("Escribe un título para la noticia.");
    titleInput.focus();
    return;
  }
  
  if (title.length < 20) {
    alert("El título es demasiado corto. Debe tener al menos 20 caracteres.");
    titleInput.focus();
    return;
  }
  
  // Validar subtítulo
  if (!subtitle) {
    alert("Escribe un subtítulo para la noticia.");
    subtitleInput.focus();
    return;
  }
  
  if (subtitle.length < 30) {
    alert("El subtítulo es demasiado corto. Debe tener al menos 30 caracteres.");
    subtitleInput.focus();
    return;
  }
  
  // Validar categoría
  if (!category) {
    alert("Selecciona una categoría.");
    categorySelect.focus();
    return;
  }

  // Validar fecha de publicacion
  if (!publicationDate) {
    alert("Debes introducir una fecha de publicación.");
    postDate.focus();
    return;
  }

// ======================================================
// COMPROBAR QUE EXISTE UNA IMAGEN PARA ENVIAR
// ======================================================

const imageFile =
  imageInput.files[0];


// ------------------------------------------------------
// CASO 1: No hay imagen original ni WebP preparado
// ------------------------------------------------------

if (
  !imageFile &&
  !croppedImageBlob
) {

  alert(
    "Es necesario subir una imagen para poder enviar la noticia."
  );

  imageInput.focus();

  return;

}


// ------------------------------------------------------
// CASO 2: Hay una imagen nueva seleccionada
// ------------------------------------------------------

if (imageFile) {

  const imageResult =
    await validateImage(
      imageFile
    );


  if (!imageResult.valid) {

    alert(
      imageResult.message
    );

    return;

  }

}


// ------------------------------------------------------
// CASO 3: Hay imagen, pero todavía no se ha aplicado
// el recorte
// ------------------------------------------------------

if (!croppedImageBlob) {

  alert(
    "Debes seleccionar el encuadre de la imagen " +
    "y pulsar «Aplicar recorte» antes de enviar la noticia."
  );

  cropApply?.focus();

  return;

}


// Validar contenido
const contentText = getPlainText();

if (!contentText) return alert("Escribe el contenido de la noticia.");
if (contentText.length < 300) return alert("El contenido es demasiado breve. La noticia debe tener al menos 300 caracteres.");
if (contentText.length > 10000) return alert("El contenido supera el máximo permitido de 10.000 caracteres.");


  // Validar recurrencia anual
  if (
    recurringCheckbox.checked &&
    recurringType.value === "annual"
  ) {
    if (!baseMonth.value || !baseDay.value) {
      alert(
        "Para una noticia recurrente anual debes " +
        "indicar la fecha base."
      );
      baseMonth.focus();
      return;
    }
  }

  // Validar recurrencia litúrgica
  if (
    recurringCheckbox.checked &&
    recurringType.value === "liturgical"
  ) {
    if (!liturgicalRecurringType.value) {
      alert(
        "Selecciona la celebración litúrgica " +
        "que determinará la recurrencia."
      );
      liturgicalRecurringType.focus();
      return;
    }
  }

 // ========================================================
  // PREPARAR IMAGEN PARA LA REVISIÓN
  // ========================================================

  const imagePreview =
    croppedImageBlob
      ? await blobToDataURL(
          croppedImageBlob
        )
      : null;


  // ========================================================
  // PREPARAR DATOS PARA LA REVISIÓN
  // ========================================================

const reviewData = {

  // DATOS BÁSICOS
  title: title,
  subtitle: subtitle,
  category: category,
  publicationDate: publicationDate,
  content: getMarkdown(),

  // IMAGEN
  image: imagePreview,

  // DESTACADO
  highlight: highlightCheckbox.checked,
  highlightDays: highlightCheckbox.checked && highlightDaysContainer
    ? (document.getElementById("highlight-days")?.value || null)
    : null,

  // TAGS - Si está destacado, añadir etiqueta "importante"
  tags: highlightCheckbox.checked ? ["importante"] : [],

  // RECURRENCIA
  recurring: recurringCheckbox.checked,
  recurringType: recurringCheckbox.checked ? recurringType.value || null : null,

  // RECURRENCIA ANUAL
  baseMonth: recurringCheckbox.checked && recurringType.value === "annual" ? baseMonth.value || null : null,
  baseDay: recurringCheckbox.checked && recurringType.value === "annual" ? baseDay.value || null : null,
  annualDaysBefore: recurringCheckbox.checked && recurringType.value === "annual" ? (document.getElementById("days-before")?.value || 0) : null,
  annualDaysAfter: recurringCheckbox.checked && recurringType.value === "annual" ? (document.getElementById("days-after")?.value || 0) : null,

  // RECURRENCIA LITÚRGICA
  liturgicalType: recurringCheckbox.checked && recurringType.value === "liturgical" ? liturgicalRecurringType.value || null : null,
  daysBefore: recurringCheckbox.checked && recurringType.value === "liturgical" ? (document.getElementById("liturgical-days-before")?.value || 0) : null,
  daysAfter: recurringCheckbox.checked && recurringType.value === "liturgical" ? (document.getElementById("liturgical-days-after")?.value || 0) : null,

  // HUGO
  weight: 0

};


  // ========================================================
  // GUARDAR TEMPORALMENTE LA NOTICIA
  // ========================================================

// TEMPORAL PRUEBA
console.log(
  "DATOS PARA REVISIÓN:",
  reviewData
);

sessionStorage.setItem(
  "pending-review",
  JSON.stringify(
    reviewData
  )
);

// TEMPORAL PRUEBA
window.location.href =
  "/admin/editor/review/";


  // ========================================================
  // IR A LA PÁGINA DE REVISIÓN
  // ========================================================

  window.location.href =
    "/admin/editor/review/";

});

// ==========================================================
// CONVERTIR BLOB A DATA URL
// ==========================================================

function blobToDataURL(
  blob
) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload =
        () => {

          resolve(
            reader.result
          );

        };


      reader.onerror =
        reject;


      reader.readAsDataURL(
        blob
      );

    }
  );

}

// ==========================================================
// CONVERTIR DATA URL A BLOB
// ==========================================================

function convertirDataURLToBlob(dataURL) {
  
  return new Promise((resolve, reject) => {
    
    try {
      
      // Separar el tipo MIME y los datos
      const [header, base64Data] = dataURL.split(',');
      const mimeType = header.match(/:(.*?);/)[1];
      
      // Decodificar base64
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      resolve(blob);
      
    } catch (error) {
      
      console.error("Error al convertir DataURL a Blob:", error);
      reject(error);
      
    }
    
  });
  
}




// ==========================================================
// CERRAR SESIÓN
// ==========================================================

logoutButton.addEventListener(
  "click",
  async () => {

    try {

      await signOut(auth);

      window.location.replace(
        "/admin/login/"
      );

    } catch (error) {

      console.error(
        "Error al cerrar sesión:",
        error
      );

    }

  }
);