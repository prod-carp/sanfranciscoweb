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

const contentInput =
  document.getElementById(
    "post-content"
  );

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

// const previewImage =
//  document.getElementById("preview-image");

const imageValidationMessage = 
  document.getElementById("image-validation-message");

const postDate =
  document.getElementById("post-date");


// ==========================================================
// AUTENTICACIÓN
// ==========================================================

onAuthStateChanged(auth, (user) => {

  if (!user) {

    window.location.replace("/admin/login/");

    return;

  }


  const email = user.email || "";

  const role = getUserRole(email);

  const permissions =
    getPermissionsForRole(role);


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
// CONTADOR DEL CONTENIDO
// ==========================================================

contentInput.addEventListener(
  "input",
  () => {

    const length =
      contentInput.value.length;


    contentCounter.textContent =
      `${length.toLocaleString("es-ES")} / 10.000 · mínimo 300`;


    if (
      length > 0 &&
      length < 300
    ) {

      contentCounter.style.color =
        "#a33";

    } else {

      contentCounter.style.color =
        "";

    }

  }
);


// ==========================================================
// CATEGORÍA
// ==========================================================

// 1. Definir la función fuera del event listener
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

// 2. Event listener correcto
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


      /*
       * Si la categoría ya es Tiempo Litúrgico,
       * utilizamos la celebración seleccionada
       * arriba y no mostramos otro selector.
       */

      if (
        categorySelect.value ===
        "Tiempo Litúrgico"
      ) {

        liturgicalRecurringSelectorContainer.style.display =
          "none";

        liturgicalRecurringType.value =
          liturgicalCategory.value;

      } else {

        liturgicalRecurringSelectorContainer.style.display =
          "block";

      }

    }

  }
);


// ==========================================================
// IMAGEN
// ==========================================================

imageUpload.addEventListener(
  "click",
  () => {

    imageInput.click();

  }
);

// ==========================================================
// VALIDACIÓN DE IMAGEN
// ==========================================================

async function validateImage(file) {

  if (!file) {

    return {
      valid: false,
      message:
        "Es necesario subir una imagen."
    };

  }


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

// FUNCION PARA LEER LA IMAGEN

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

// COMPROBAR LA IMAGEN SELECCIONADA

imageInput.addEventListener(
  "change",
  async () => {

    const file =
      imageInput.files[0];

croppedImageBlob =
  null;

cropResultMessage.style.display =
  "none";

cropApply.textContent =
  "✓ Aplicar recorte";


    imageValidationMessage.style.display =
      "block";


    imageValidationMessage.textContent =
      "Comprobando imagen...";


    try {

      const result =
        await validateImage(file);


      if (!result.valid) {

        imageValidationMessage.textContent =
          result.message;

        imageValidationMessage.style.color =
          "#a33";


        imageInput.value =
          "";


       // imagePreviewContainer.style.display = "none";


        return;

      }


      const image =
        result.image;


      imageValidationMessage.textContent =
        `Imagen válida: ${
          image.naturalWidth
        } × ${
          image.naturalHeight
        } píxeles.`;

      imageValidationMessage.style.color =
        "";

initializeCropper(
  image
);


cropper.style.display =
  "block";

// BOTON PARA APLICAR RECORTE

cropApply.addEventListener(
  "click",
  () => {

    if (!cropImage) {
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


    const ratio =
      637 /
      cropperCanvas.width;


    outputContext.drawImage(
      cropImage,

      -cropX * ratio,
      -cropY * ratio,

      cropImage.naturalWidth *
        cropScale *
        ratio,

      cropImage.naturalHeight *
        cropScale *
        ratio
    );


    outputCanvas.toBlob(
      blob => {

        if (!blob) {

          cropResultMessage.textContent =
            "No se ha podido preparar la imagen.";

          cropResultMessage.style.display =
            "block";

          return;

        }


        /*
         * Guardamos el resultado para utilizarlo
         * posteriormente al enviar el post.
         */

        croppedImageBlob =
          blob;


        cropResultMessage.textContent =
          "✓ Recorte aplicado. La imagen está preparada en formato WebP 637 × 637 px.";

        cropResultMessage.style.display =
          "block";


        cropResultMessage.style.color =
          "";


        cropApply.textContent =
          "✓ Recorte aplicado";

      },
      "image/webp",
      0.85
    );

  }
);

// FIN BOTON APLICAR RECORTE



    } catch (error) {

      console.error(error);


      imageValidationMessage.textContent =
        "No se ha podido leer la imagen.";


      imageValidationMessage.style.color =
        "#a33";


      imageInput.value =
        "";


    }

  }
);


// ==========================================================
// RECORTADOR DE IMAGEN
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


const cropContext =
  cropperCanvas.getContext(
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

// PREPARAR CANVAS

function resizeCropCanvas() {

  const size =
    cropperContainer.clientWidth;


  cropperCanvas.width =
    size;

  cropperCanvas.height =
    size;


  drawCropper();

}


function drawCropper() {

  if (!cropImage) {
    return;
  }


  const size =
    cropperCanvas.width;


  cropContext.clearRect(
    0,
    0,
    size,
    size
  );


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

// PREPARAR ENCUADRE

function initializeCropper(
  image
) {

  cropImage =
    image;


  resizeCropCanvas();


  const canvasSize =
    cropperCanvas.width;


  /*
   * La escala inicial hace que el lado menor
   * de la fotografía cubra todo el cuadrado.
   */

  cropInitialScale =
    Math.max(
      canvasSize /
        image.naturalWidth,

      canvasSize /
        image.naturalHeight
    );


  cropScale =
    cropInitialScale;


  cropX =
    (
      canvasSize -
      image.naturalWidth *
      cropScale
    ) / 2;


  cropY =
    (
      canvasSize -
      image.naturalHeight *
      cropScale
    ) / 2;


  drawCropper();

}

// ARRASTRAR FOTOGRAFIA

cropperCanvas.addEventListener(
  "pointerdown",
  event => {

    cropDragging =
      true;


    cropperCanvas.setPointerCapture(
      event.pointerId
    );


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
  event => {

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

croppedImageBlob =
  null;

cropApply.textContent =
  "✓ Aplicar recorte";

cropResultMessage.style.display =
  "none";

  }
);


cropperCanvas.addEventListener(
  "pointerup",
  event => {

    cropDragging =
      false;


    cropperCanvas.releasePointerCapture(
      event.pointerId
    );


    cropperCanvas.style.cursor =
      "grab";

  }
);


cropperCanvas.addEventListener(
  "pointercancel",
  () => {

    cropDragging =
      false;

  }
);

// IMPEDIR QUE APAREZCAN HUECOS NEGROS

function constrainCrop() {

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

// ZOOM CON LA RUEDA DE RATON

cropperCanvas.addEventListener(
  "wheel",
  event => {

    event.preventDefault();


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

  },
  {
    passive:false
  }
);

// RESTABLECER

cropReset.addEventListener(
  "click",
  () => {

    if (!cropImage) {
      return;
    }


    initializeCropper(
      cropImage
    );

    cropResultMessage.style.display =
      "none";

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
// ENVIAR
// ==========================================================

document.getElementById("submit-button").addEventListener("click", async () => {
  // Obtener todos los valores una sola vez
  const title = titleInput.value.trim();
  const subtitle = subtitleInput.value.trim();
  const category = categorySelect.value;
  const content = contentInput.value.trim();
  const publicationDate = postDate.value;

 
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

// COMPROBAR QUE EXISTE UNA IMAGEN PARA ENVIAR

const imageFile =
  imageInput.files[0];


if (!imageFile) {

  alert(
    "Es necesario subir una imagen para poder enviar la noticia."
  );

  imageInput.focus();

  return;

}


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
  
if (!croppedImageBlob) {

  alert(
    "Debes seleccionar el encuadre de la imagen " +
    "y pulsar «Aplicar recorte» antes de enviar la noticia."
  );

  cropApply.focus();

  return;

}


  // Validar contenido
  if (!content) {
    alert("Escribe el contenido de la noticia.");
    contentInput.focus();
    return;
  }
  
  if (content.length < 300) {
    alert("El contenido es demasiado breve. La noticia debe tener al menos 300 caracteres.");
    contentInput.focus();
    return;
  }
  
  if (content.length > 10000) {
    alert("El contenido supera el máximo permitido de 10.000 caracteres.");
    contentInput.focus();
    return;
  }
  


  // Resto de validaciones...
  alert("La validación y el envío a Firebase los construiremos en el siguiente paso.");

});

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