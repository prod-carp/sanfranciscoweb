+++
title = 'Post 1 - parroquia. Sí, merece la pena usar uno cómodo (te ahorra mucho tiempo). Te dejo opciones simples y gratuitas'
date = '2026-05-05T12:29:54+02:00'
draft = false
categories = ["parroquia"]
tags = []
weight = 0
image = "/assets/images/mbr-874x1920.jpg"
+++

# Contenido del post 1
¡Buen avance! 🙌 Ya lo tienes funcionando, que es lo importante.

Vamos a tus dos dudas:

---

# 📝 1. Editor sencillo para `.md` en Windows

Sí, merece la pena usar uno cómodo (te ahorra mucho tiempo). Te dejo opciones simples y gratuitas:



![111.webp](/assets/images/fe5b3b2186fce851d21bf1a3df7caac99eab73ce.webp)

### 🟢 Muy recomendable (equilibrio perfecto)

- Typora  
  👉 Escribir como si fuera Word, sin código visible  
  👉 Ves directamente el resultado final

---

### 🟡 Alternativa muy popular

- Visual Studio Code  
  👉 Gratis y muy potente  
  👉 Tiene vista previa Markdown (Ctrl + Shift + V)

---

### 🔵 Súper simple

- Notepad++  
  👉 Ligero, pero menos visual

---

👉 Si quieres algo tipo “Word”: usa **Typora**  
👉 Si vas a seguir con Hugo a largo plazo: **VS Code**

---

# 🖼️ 2. Cómo meter imágenes en tus posts

Aquí es donde Hugo tiene varias formas. Te explico la más sencilla primero:

---

## ✅ OPCIÓN 1 (la más fácil): usar `static/images`

### 📁 Guarda la imagen en:

```plaintext
static/images/mi-foto.jpg
```

---

### ✍️ En tu `.md`:

```markdown
![Descripción de la imagen](/images/mi-foto.jpg)
```

👉 Y ya funciona. Sin tocar nada más.

---

## 🧠 Importante

No necesitas modificar `single.html` para esto.

👉 Hugo mete automáticamente:

```html
{{ .Content }}
```

Y dentro va todo:

- texto

- imágenes

- HTML

---

## ✅ OPCIÓN 2 (más avanzada): carpeta del post (Page Bundles)

Esto es más ordenado si tienes muchas imágenes.

### 📁 Estructura:

```plaintext
content/posts/post-1/
  index.md
  imagen.jpg
```

---

### ✍️ En el `.md`:

```markdown
![Descripción](imagen.jpg)
```

👉 Sin rutas largas, todo más limpio.

---

## 🧱 ¿Cuándo usar cada una?

- 🟢 Web simple → `static/images`

- 🔵 Blog más cuidado → “page bundles”

---

# 💡 Extra (muy útil con Mobirise)

Si quieres controlar el tamaño o estilos:

```markdown
<img src="/images/mi-foto.jpg" style="max-width:100%;">
```

👉 Puedes usar HTML dentro del `.md` sin problema.

---

# 🧠 Resumen claro

- ✔ No necesitas tocar `single.html` para imágenes

- ✔ Las metes directamente en el `.md`

- ✔ Ruta típica: `/images/...`

- ⭐ Mejor editor: Typora o VS Code

---

Si quieres, el siguiente paso te puede venir muy bien:

👉 hacer que los posts tengan **imagen destacada tipo “blog bonito” (como Mobirise)**  
con tarjeta, preview, etc.
