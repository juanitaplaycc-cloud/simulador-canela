# Canela Pastelería · Simulador de pedidos

Proyecto de la **Pre-Entrega 10: APIs, Peticiones y Librerías** (Coderhouse · Full Stack Developer).

Simulador donde el usuario explora el menú de una pastelería, arma su pedido, aplica un cupón, elige domicilio o recogida y confirma la compra.

## Qué se implementó

| Requisito de la consigna | Dónde está |
| --- | --- |
| **fetch con async/await** a un JSON local | `cargarMenu()` pide `data/productos.json` y `data/config.json` |
| **fetch a APIs públicas** | `cargarInspiracion()` consulta TheMealDB (postres) y `enviarPedido()` hace un `POST` a JSONPlaceholder |
| **try / catch / finally** | `cargarMenu()`, `cargarInspiracion()` y `manejarPedido()`; el `finally` oculta el mensaje de carga y reactiva el botón pase lo que pase |
| **Feedback mientras carga** | Mensaje "Cargando el menú…" y tarjetas de carga (esqueletos) |
| **Feedback si hay error** | Panel de error con botón *Reintentar* y notificación de error con Toastify |
| **Librerías por CDN** | **Toastify** (avisos) y **SweetAlert2** (confirmar el pedido, ver detalle de un producto y vaciar el pedido) |
| **Renderizado en el DOM** | Menú, pedido e ideas de postres se generan desde los datos recibidos |
| **Sin alert / prompt / console.log** | Toda la comunicación con el usuario usa el DOM y las librerías |

### Manejo de errores

`pedirJSON()` centraliza las peticiones: usa `AbortController` (tiempo límite de 8 s), revisa `response.ok` y traduce los fallos (sin conexión, 404, JSON inválido, tiempo agotado) a mensajes claros para el usuario.

Para probarlo, marca la casilla **"Simular error de conexión"** y pulsa *Reintentar*: la petición apunta a un archivo inexistente y se obtiene un error 404 real.

### Funciones adicionales

- Stock por producto (disponible, últimas unidades, agotado) y límite de cantidad según el stock.
- Cupones y costo de domicilio leídos desde `data/config.json`.
- Búsqueda con retardo, filtros por categoría, orden y atajos de teclado (Ctrl/Cmd + K y Escape).
- Validación del formulario (celular colombiano, dirección, fecha con 24 h de anticipación).
- Aviso temporizado con `setTimeout` que ofrece un cupón de bienvenida.
- El pedido se conserva al recargar la página (`localStorage`).

## Estructura

```
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
├── data/
│   ├── productos.json
│   └── config.json
└── img/
    └── (fotografías de los productos)
```

## Cómo ejecutarlo

`fetch` no funciona al abrir `index.html` con doble clic (`file://`). Úsalo con un servidor local:

1. Abre la carpeta del proyecto en VS Code (la que contiene `index.html`).
2. Instala la extensión **Live Server**.
3. Clic derecho en `index.html` → **Open with Live Server**.

También funciona en GitHub Pages.

## Tecnologías

HTML5 · CSS3 · JavaScript (ES2020) · [Toastify JS](https://github.com/apvarun/toastify-js) · [SweetAlert2](https://sweetalert2.github.io/) · [TheMealDB](https://www.themealdb.com/api.php) · [JSONPlaceholder](https://jsonplaceholder.typicode.com/)

## Créditos de imágenes

Completa esta lista con las fotografías que uses (si no hay foto, se muestra una ilustración propia):

| Archivo | Autor | Fuente |
| --- | --- | --- |
| `hero.jpg
| `torta-chocolate.jpg
| `torta-red-velvet.jpg
| `torta-tres-leches.jpg
| `cupcakes-vainilla.jpg
| `cupcakes-chocolate.jpg
| `galletas-chips.jpg
| `galletas-avena.jpg
| `croissants.jpg
| `pan-chocolate.jpg
| `tartaleta-limon.jpg
| `cheesecake.jpg
| `macarons.jpg

> Los precios, productos y cupones son valores ilustrativos con fines académicos.
