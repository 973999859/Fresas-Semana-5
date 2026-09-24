# Mango Vision

Analizador web de mangos conectado al modelo de Teachable Machine.

## Uso local

Abre `index.html` con un servidor local. La cámara requiere `localhost` o HTTPS.

```bash
npx serve .
```

Después visita la URL que muestre el comando. También puedes subir una imagen desde el botón **Subir imagen**.

## Publicar en GitHub Pages

1. Crea un repositorio vacío en GitHub, por ejemplo `mango-vision`.
2. Desde esta carpeta ejecuta:

```bash
git init
git add .
git commit -m "Crear analizador de mangos con IA"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/mango-vision.git
git push -u origin main
```

3. En GitHub abre **Settings > Pages** y selecciona **GitHub Actions** como fuente.
4. El workflow de `.github/workflows/deploy-pages.yml` publicará la página automáticamente después del `push`.

El modelo se carga desde la URL pública de Teachable Machine incluida en `app.js`.