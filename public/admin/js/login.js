import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


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


const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login-button");
const errorMessage = document.getElementById("error-message");


/*
 * Si ya existe una sesión iniciada,
 * no mostramos nuevamente el formulario.
 */
onAuthStateChanged(auth, (user) => {

  if (user) {
    window.location.href = "/admin/editor/";
  }

});


/*
 * Inicio de sesión
 */
loginForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  errorMessage.style.display = "none";
  errorMessage.textContent = "";

  loginButton.disabled = true;
  loginButton.textContent = "Entrando...";

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    window.location.href = "/admin/dashboard/";

  } catch (error) {

    console.error(error);

    errorMessage.textContent =
      "El correo electrónico o la contraseña no son correctos.";

    errorMessage.style.display = "block";

    loginButton.disabled = false;
    loginButton.textContent = "Entrar";

  }

});