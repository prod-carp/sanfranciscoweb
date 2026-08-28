chcp 65001

# ==========================================
# Generar HTML de noticia destacada
# ==========================================

$htmlDestacada = @'

<style>

  .featured-news-banner {
    position: relative;
    width: 100%;
    min-height: 420px;
    margin: 2rem 0;
    border-radius: 1rem;
    overflow: hidden;
    background-size: cover;
    background-position: center;
  }

  .featured-news-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.78) 0%,
      rgba(0, 0, 0, 0.55) 50%,
      rgba(0, 0, 0, 0.10) 100%
    );
  }

  .featured-news-content {
    max-width: 750px;
    padding: 3rem;
    color: white;
  }

  .featured-news-label {
    display: inline-block;
    margin-bottom: 1rem;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .featured-news-title {
    margin: 0 0 1rem;
    font-size: 2.7rem;
    line-height: 1.15;
    color: white;
  }

  .featured-news-subtitle {
    margin: 0 0 1.8rem;
    font-size: 1.15rem;
    line-height: 1.5;
    color: white;
  }

  .featured-news-button {
    display: inline-block;
    padding: 0.8rem 1.5rem;
    border-radius: 0.5rem;
    background: white;
    color: #1e293b;
    text-decoration: none;
    font-weight: 600;
    transition: transform 0.2s ease;
  }

  .featured-news-button:hover {
    transform: translateY(-2px);
  }

  @media (max-width: 600px) {

    .featured-news-banner {
      min-height: 480px;
    }

    .featured-news-overlay {
      align-items: flex-end;

      background: linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.15) 0%,
        rgba(0, 0, 0, 0.75) 60%,
        rgba(0, 0, 0, 0.92) 100%
      );
    }

    .featured-news-content {
      padding: 2rem 1.5rem;
    }

    .featured-news-title {
      font-size: 2rem;
    }

    .featured-news-subtitle {
      font-size: 1rem;
    }

  }

</style>

<div id="featuredNews">
  <div class="loading">Cargando noticia destacada...</div>
</div>

<script>
(function() {

  const container = document.getElementById('featuredNews');

  fetch('/datos/destacada.json')
    .then(response => {

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return response.json();

    })
    .then(data => {

      if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = '';
        return;
      }

      const item = data[0];

      const banner = document.createElement('article');
      banner.className = 'featured-news-banner';

      banner.style.backgroundImage =
        `url("${item.image}")`;

      const overlay = document.createElement('div');
      overlay.className = 'featured-news-overlay';

      const content = document.createElement('div');
      content.className = 'featured-news-content';

      const label = document.createElement('div');
      label.className = 'featured-news-label';
      label.textContent = 'Información destacada';

      const title = document.createElement('h2');
      title.className = 'featured-news-title';
      title.textContent = item.title;

      const subtitle = document.createElement('p');
      subtitle.className = 'featured-news-subtitle';
      subtitle.textContent = item.subtitle || '';

      const button = document.createElement('a');
      button.className = 'featured-news-button';
      button.href = item.url;
      button.textContent = 'VER TODA LA INFORMACIÓN';

      content.appendChild(label);
      content.appendChild(title);
      content.appendChild(subtitle);
      content.appendChild(button);

      overlay.appendChild(content);
      banner.appendChild(overlay);

      container.innerHTML = '';
      container.appendChild(banner);

    })
    .catch(error => {

      console.error('Error al cargar noticia destacada:', error);
      container.innerHTML = '';

    });

})();
</script>

'@

# ==========================================
# Reemplazar marcador
# ==========================================

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$archivo = Join-Path $Root "static\index.html"

$index = [System.IO.File]::ReadAllText(
    $archivo,
    [System.Text.Encoding]::UTF8
)

$index = $index.Replace(
    "<!-- NOTICIA_DESTACADA_AUTOGENERADA -->",
    $htmlDestacada
)

[System.IO.File]::WriteAllText(
    $archivo,
    $index,
    [System.Text.Encoding]::UTF8
)