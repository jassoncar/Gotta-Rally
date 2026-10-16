# Gestión de Ventas y Recompensas

Aplicación web desarrollada con Node.js, Express, HTML, CSS y JavaScript. Los registros se guardan en un archivo JSON persistente.

## Páginas independientes

- `public/index.html`: dashboard y resumen de ventas.
- `public/registros.html`: historial completo, filtros y búsqueda.
- `public/nueva-venta.html`: formulario para registrar ventas y calcular mes, costo a pagar y puntos.
- `public/escaner.html`: carga de imagen, captura con cámara y detección aproximada desde texto OCR pegado.
- `public/premios.html`: consulta de puntos y canje de recompensas.
- `public/reutilizacion.html`: información educativa sobre reutilización y manejo responsable del aceite.

Los estilos compartidos están en `public/assets/styles.css`; las funciones comunes están en `public/assets/common.js`, y cada página funcional tiene su propio archivo JavaScript en `public/assets/`.

## Ejecutar con Docker

Desde la carpeta del proyecto:

```bash
docker compose up --build -d
```

Luego abre http://localhost:3000. Si el comando de compilación falla al descargar `node:22-alpine` por un timeout TLS, es un problema de conexión entre Docker y Docker Hub; prueba `docker pull node:22-alpine` y vuelve a compilar.

Los datos se conservan en el volumen `ventas_data`. No elimines ese volumen si necesitas conservar los registros.

## Ejecutar sin Docker

Requiere Node.js 22 o compatible:

```bash
npm install
npm start
```

Abre http://localhost:3000.

## Configuración

- `PORT`: puerto HTTP (predeterminado `3000`).
- `DATA_FILE`: ubicación del JSON de datos (predeterminado `data/registros.json`).
- `POINTS_PER_CORDOBA`: puntos por córdoba (predeterminado `0.1`, equivalente a 1 punto por cada C$10).

## Nota sobre el escáner

La página permite cargar imágenes o tomar una fotografía. La extracción automática de texto requiere integrar un motor OCR; en esta versión, el usuario pega el texto OCR y el sistema intenta identificar algunos campos. Revise los datos manualmente antes de guardar.


## Identidad visual GOTTA
- Logotipo integrado en la navegación: `public/assets/logo.png`.
- Paleta de marca: verde profundo del logotipo, dorado `#d9a441`, verde oliva `#869d57` y verde claro `#d7e8b5`.
- La interfaz utiliza la familia `BudokanRounded` si se agrega el archivo de fuente en `public/assets/fonts/budokan_rounded.woff2`. El archivo de la tipografía no venía adjunto; sin él, el navegador utilizará la fuente redondeada de respaldo. Asegúrate de tener permiso/licencia para usar y distribuir esa fuente.
