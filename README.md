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

El editor guarda un borrador de noticia nueva por cuenta de Firebase. Los campos se guardan en D1 y la imagen recortada, si existe, en R2. El arranque local aplica `sanfrancisco-noticias/migrations/0001_editor_drafts.sql`. Antes de publicar esta funcionalidad, aplica esa migración a D1 de producción y actualiza el Worker antes de publicar el panel web.
