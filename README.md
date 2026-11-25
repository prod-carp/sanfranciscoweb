# sanfranciscoweb
sitio web parroquia san francisco y santa clara

## Panel de administración en local

En PowerShell, ejecuta `.\iniciar-desarrollo.ps1` desde la raíz. Abre el panel en `http://localhost:1313/admin/dashboard/`. El Worker se ejecuta en `http://127.0.0.1:8787`. El indicador del dashboard consulta `/api/status` cada diez segundos.

Para usar el inicio de sesión habitual y probar operaciones autenticadas, pasa la **clave web pública** del mismo proyecto Firebase, la que utiliza el SDK del panel. El dominio `localhost` debe estar autorizado en Firebase para los métodos de acceso que lo requieran.

```powershell
.\iniciar-desarrollo.ps1 -FirebaseWebApiKey '<clave web pública de Firebase>'
```

El script inicializa D1 con `sanfrancisco-noticias/desarrollo/schema.sql` y conserva D1 y R2 en `sanfrancisco-noticias/.wrangler/state-desarrollo/`. Al aprobar un artículo se simulan la rama, los archivos y el pull request de GitHub. Para comprobar también la confirmación de publicación y la limpieza de R2, toma el `prNumber` de la respuesta de aprobación y envía una confirmación al Worker local.

```powershell
Invoke-RestMethod http://127.0.0.1:8787/api/internal/publication-confirmed `
  -Method Post -Headers @{ Authorization = 'Bearer simulacion-local' } `
  -ContentType 'application/json' `
  -Body (@{ prNumber = 123; mergeCommit = 'a' * 40 } | ConvertTo-Json)
```

El esquema de arranque reproduce la estructura de D1 de producción. Si ya existe una tabla local creada con un esquema anterior, el arranque añade los índices que falten y conserva la definición de sus columnas. Para aplicar las restricciones nuevas a una base existente, hace falta migrarla. Si prefieres partir de una base vacía, puedes detener ambos servidores y renombrar la carpeta de estado para conservar una copia. El siguiente arranque creará D1 y R2 de cero.

Pulsa Ctrl+C para detener ambos servidores.

Si Wrangler quedó abierto y el puerto 8787 sigue ocupado, ejecuta `.\iniciar-desarrollo.ps1 -ReiniciarWorker`. El script solo intenta detener el proceso si comprueba que es el Worker de este proyecto. Los datos locales de D1 y R2 se conservan.

## Imágenes del editor de noticias

En `/admin/editor/`, **Subir imagen** permite recortar y preparar una portada WebP de 637 × 637 px. **Usar imagen existente** acepta una ruta desde la raíz o una dirección HTTPS de la parroquia. El texto alternativo es opcional en ambas modalidades. Si está vacío, las tarjetas y la página individual utilizan el título.

El editor envía la dirección a `POST /api/editor/internal-image` con la sesión habitual. El Worker normaliza la ruta, comprueba la respuesta HTTP, el tipo MIME y la firma JPEG, PNG o WebP. El navegador decodifica la imagen antes de mostrarla. Modificar la dirección invalida la comprobación. Guardar el borrador, enviar la noticia y aprobar vuelven a comprobar el recurso.

En desarrollo, el Worker utiliza el puerto del origen Hugo autorizado y su dirección de loopback IPv4. La vista previa usa la ruta en el Hugo que tiene abierto el navegador. En producción, el Worker consulta exclusivamente `https://sanfranciscoysantaclara.es`. La dirección con `sanfranciscoysantaclaradeasis.es` del formulario también se admite como entrada. El prefijo `/images/noticias/` se interpreta como `/assets/images/blog/`. El resto de las carpetas conserva su ruta. Las comprobaciones rechazan redirecciones, consultas y fragmentos.

### Persistencia y publicación

- `articles.image_source` vale `upload` para registros anteriores y nuevas subidas. Una reutilización guarda `internal` y la ruta en `image_url`. En ese caso `image_key` contiene la cadena vacía porque la columna original es `NOT NULL`. `image_alt` guarda el texto alternativo.
- El borrador personal conserva los campos en `editor_drafts.form_json`. Una imagen interna deja `editor_drafts.image_key` a `NULL`. El control de revisión protege los cambios guardados desde otra pestaña.
- El PR de una imagen reutilizada contiene únicamente el Markdown. El campo Hugo sigue siendo `image` y `image_alt` aparece cuando tiene valor. GitHub Actions lee el front matter y comprueba la imagen en el commit concreto antes y después de fusionar el PR.
- La sustitución o el descarte de una subida registra su clave anterior en `image_cleanup` dentro de la operación D1. Si R2 falla, la clave sigue disponible para el reintento. Solo se eliminan claves temporales gestionadas por el editor. Una URL pública nunca ocupa ese campo.
- La confirmación retira el registro completo de `articles` y conserva en `publication_receipts` el número de PR, el identificador editorial y el commit. Así se puede repetir una confirmación. Los artículos históricos permanecen intactos durante la migración.
- Durante la creación del PR, el artículo pasa temporalmente a `publishing`. Si se interrumpe el Worker en ese punto, comprueba la rama y el PR asociados al ID editorial antes de recuperar el estado en D1. Una publicación que ya tiene PR requiere reconciliar su número y URL.

### Pruebas locales

1. Arranca el entorno con el procedimiento anterior. La configuración de Wrangler de `desarrollo/` apunta a las migraciones de `../migrations/`. El iniciador ejecuta `d1 migrations apply DB --local` en el almacenamiento persistente habitual.
2. Con Hugo disponible, ejecuta `node sanfrancisco-noticias/test/internal-images.cjs` desde la raíz. La prueba usa el runtime de Wrangler con D1 y R2 temporales propios, autenticación simulada y la simulación editorial de GitHub. Un error D1 con el texto «fallo simulado» forma parte de la comprobación de recuperación.
3. Para la comprobación manual, abre el editor, selecciona la modalidad interna, pega `/assets/images/nuevaportadaoct2026.webp` y pulsa **Comprobar imagen**. Repite con una URL absoluta y un cartel de `/carteles/`. Edita un carácter después de ver la imagen y comprueba que desaparece la vista previa.
4. Guarda y vuelve a abrir un borrador. Alterna una subida recortada y una ruta existente, guarda cada variante y revisa la vista previa. Prueba también una ruta inexistente y una URL externa.
5. Aprueba una noticia de cada modalidad en el panel local. La respuesta debe indicar `simulated: true`. El campo `imagePath` del PR simulado es nulo para una reutilización. Repite la confirmación local del ejemplo anterior con el mismo número y commit.

### Archivos y despliegue posterior

El repositorio de la web contiene el formulario `layouts/admin/editor.html`, sus controles en `static/admin/js/editor.js` y `static/admin/editor/editor.css`, la revisión en `static/admin/editor/review/review.js` y los mensajes del panel en `static/admin/js/admin-dashboard.js`. Las vistas públicas afectadas son `layouts/partials/imagen-articulo.html`, `layouts/index.html`, `layouts/index.json.json` y `layouts/datos/destacada.json`. La confirmación en GitHub está en `.github/workflows/merge-noticias.yml`.

El Worker es un repositorio Git independiente bajo `sanfrancisco-noticias/`. Los cambios están en `src/worker.js`, `src/internal-image.js`, el esquema de referencia `src/d1-schema-produccion.sql`, las migraciones `0002_internal_images.sql` y `0003_editorial_cleanup.sql`, `desarrollo/wrangler.jsonc` y la prueba `test/internal-images.cjs`. El iniciador local `iniciar-desarrollo.ps1` está excluido de Git en este proyecto. El esquema base local se completa mediante las migraciones.

Cuando se autorice el despliegue, desde el repositorio del Worker revisa las migraciones pendientes con `npx wrangler d1 migrations list DB --remote` y aplícalas con `npx wrangler d1 migrations apply DB --remote`. La primera migración crea la tabla de borradores de manera idempotente. Despliega después el Worker con `npx wrangler deploy` y publica los cambios de la web y del flujo de GitHub Actions en la misma entrega. Comprueba una noticia de cada modalidad antes de continuar con la operación editorial habitual.

La futura biblioteca podrá entregar una ruta al mismo endpoint de comprobación y utilizar `imageSource: "internal"`, `imageUrl` e `imageAlt`. La normalización y la comprobación de recursos se concentran en `src/internal-image.js`.
