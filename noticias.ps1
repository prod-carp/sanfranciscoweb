chcp 65001

# ==========================================
# Generar HTML
# ==========================================
# Ancho columna <div class="card-body p-0
# Espacio con la imagen

$htmlNoticias = @'

<style>
    /* Reset básico */
    

    .newscards-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      max-width: 800px;
      width: 100%;
      margin: 0 auto;
    }

    /* Tarjeta individual */
    .news-card {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      display: flex;
      flex-direction: column;
    }

    .news-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
    }

    /* Foto cuadrada (mantiene proporción 1:1) */
    .newscard-image {
      width: 100%;
      aspect-ratio: 1 / 1;
      object-fit: cover;
      display: block;
      background: #e9ecef;
    }

    .newscard-content {
      padding: 0.9rem 1rem 1.2rem;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      flex: 1;
    }

    .newscard-date {
      font-size: 0.75rem;
      font-weight: 500;
      color: #6c757d;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      margin-bottom: 0.15rem;
    }

    .newscard-title {
      font-size: 1rem;
      font-weight: 700;
      line-height: 1.3;
      color: #1e293b;
      margin: 0 0 0.2rem 0;
    }

    .newscard-subtitle {
      font-size: 0.95rem;
      line-height: 1.4;
      color: #334155;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      max-height: 3.8em;
    }

    /* Estado de carga y error */
    .loading, .error {
      text-align: center;
      padding: 2rem;
      font-size: 1.1rem;
      color: #6c757d;
      grid-column: 1 / -1;
    }

    .error {
      color: #dc3545;
    }

    /* Responsive */
    @media (max-width: 400px) {
      .newscards-grid {
        gap: 0.9rem;
      }
      .newscard-content {
        padding: 0.7rem 0.8rem 1rem;
      }
      .newscard-title {
        font-size: 0.9rem;
      }
      .newscard-subtitle {
        font-size: 0.85rem;
      }
    }

    @media (min-width: 600px) {
      .newscards-grid {
        grid-template-columns: 1fr 1fr 1fr 1fr;
        gap: 1.2rem;
        max-width: 1100px;
      }
      .newscard-subtitle {
        -webkit-line-clamp: 3;
        max-height: 3.8em;
      }
    }

    @media (min-width: 500px) and (max-width: 599px) {
      .newscards-grid {
        gap: 1rem;
      }
    }
  </style>

  <div class="newscards-grid" id="newsGrid">
    <!-- Mensaje de carga inicial -->
    <div class="loading">Cargando noticias...</div>
  </div>

  <div class="buttons-wrapper align-center">
    <a href="/noticias/" class="btn btn-primary">
        VER TODAS LAS NOTICIAS
    </a>
  </div>

  <script>
    (function() {
      const grid = document.getElementById('newsGrid');

      // Función para formatear fecha
      function formatDate(dateStr) {
        try {
          const date = new Date(dateStr);
          return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        } catch {
          return dateStr; // si falla, mostrar la fecha original
        }
      }

      // Función para crear una tarjeta
      function createCard(item) {
        const card = document.createElement('article');
        card.className = 'news-card';

        // Imagen
        const img = document.createElement('img');
        img.className = 'newscard-image';
        img.src = item.image;
        img.alt = item.title;
        img.loading = 'lazy';
        img.onerror = function() {
          this.style.background = '#d1d5db';
        };

        // Contenido
        const content = document.createElement('div');
        content.className = 'newscard-content';

        // Fecha
        const dateEl = document.createElement('p');
        dateEl.className = 'newscard-date';
        dateEl.textContent = formatDate(item.date);

        // Título
        const titleEl = document.createElement('h3');
        titleEl.className = 'newscard-title';
        titleEl.textContent = item.title;

        // Subtítulo (con límite de 130 caracteres)
        const subtitleEl = document.createElement('p');
        subtitleEl.className = 'newscard-subtitle';
        let subtitleText = item.subtitle || '';
        if (subtitleText.length > 130) {
          subtitleText = subtitleText.slice(0, 130) + '…';
        }
        subtitleEl.textContent = subtitleText;

        // Montar
        content.appendChild(dateEl);
        content.appendChild(titleEl);
        content.appendChild(subtitleEl);
        card.appendChild(img);
        card.appendChild(content);

        // Click para navegar
        card.addEventListener('click', function() {
          if (item.url) {
            window.location.href = item.url;
          }
        });
        card.style.cursor = 'pointer';

        return card;
      }

      // Función principal: cargar datos desde /index.json
      function loadNews() {
        // Mostrar estado de carga
        grid.innerHTML = '<div class="loading">Cargando noticias...</div>';

        fetch('/index.json')
          .then(response => {
            if (!response.ok) {
              throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            // Limpiar grid
            grid.innerHTML = '';

            // Verificar que data sea un array
            if (!Array.isArray(data) || data.length === 0) {
              grid.innerHTML = '<div class="error">No hay noticias disponibles</div>';
              return;
            }

            // Crear y agregar cada tarjeta
            data.forEach(item => {
              const card = createCard(item);
              grid.appendChild(card);
            });
          })
          .catch(error => {
            console.error('Error al cargar noticias:', error);
            grid.innerHTML = `<div class="error">❌ Error al cargar las noticias: ${error.message}</div>`;
          });
      }

      // Cargar noticias al iniciar
      loadNews();

      // (Opcional) Recargar automáticamente cada 60 segundos para reflejar cambios
      // setInterval(loadNews, 60000);
    })();
  </script>

'@

$htmlNoticias += "</div>"

# ==========================================
# Reemplazar marcador
# ==========================================


# Ruta del archivo
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$archivo = Join-Path $Root "static\index.html"

$index = [System.IO.File]::ReadAllText(
    $archivo,
    [System.Text.Encoding]::UTF8
)

$index = $index.Replace(
    "<!-- NOTICIAS_AUTOGENERADAS -->",
    $htmlNoticias
)

[System.IO.File]::WriteAllText(
    $archivo,
    $index,
    [System.Text.Encoding]::UTF8
)


