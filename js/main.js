/* Canela Pastelería · Simulador de pedidos
  
   - fetch + async/await + try/catch/finally
   - Datos desde JSON local (./data) y desde APIs públicas
   - Toastify (avisos) y SweetAlert2 (confirmaciones) vía CDN */

"use strict";

/* Configuración */

const URL_PRODUCTOS = "./data/productos.json"; // JSON local: menú
const URL_CONFIG = "./data/config.json"; // JSON local: envío y cupones
const URL_INSPIRACION = "https://www.themealdb.com/api/json/v1/1/filter.php?c=Dessert"; // API pública: postres
const URL_INSPIRACION_ERROR = "https://www.themealdb.com/api/json/v1/1/filter.php?c=Inexistente"; // devuelve "meals": null
const URL_PEDIDOS = "https://jsonplaceholder.typicode.com/posts"; // API pública de pruebas (POST)
const URL_CON_ERROR = "./data/no-existe.json"; // para simular un error real (404)

const CLAVE_PEDIDO = "canela-pedido";
const COLOR_PRINCIPAL = "#b8316a";

const RETARDO_AVISO_MS = 6000;
const CARGA_MINIMA_MS = 900; // para que el mensaje "Cargando…" alcance a verse
const TIEMPO_LIMITE_FETCH_MS = 8000;
const RETARDO_BUSQUEDA_MS = 250;
const DURACION_TOAST_MS = 3500;
const CANTIDAD_IDEAS = 6;

/*  Clases  */

class Producto {
  constructor(datos) {
    Object.assign(this, datos);
    this.precio = Number(datos.precio);
    this.stock = Number.isFinite(Number(datos.stock)) ? Number(datos.stock) : 0;
    this.alergenos = Array.isArray(datos.alergenos) ? datos.alergenos : [];
  }

  get disponible() {
    return this.stock > 0;
  }
}

class ErrorValidacion extends Error {}

/* ---------- 3. Ilustraciones SVG (respaldo si falta la foto) ---------- */

const leerHex = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function mezclar(hex, destino, t) {
  const a = leerHex(hex);
  const b = leerHex(destino);
  return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

function macaron(x, y, color) {
  const oscuro = mezclar(color, "#000000", 0.12);
  return `<ellipse cx="${x}" cy="${y - 9}" rx="30" ry="12" fill="${color}"/>
    <rect x="${x - 28}" y="${y - 8}" width="56" height="7" rx="3.5" fill="#fffaf5"/>
    <ellipse cx="${x}" cy="${y + 2}" rx="30" ry="11" fill="${oscuro}"/>`;
}

const TIPOS_ILUSTRACION = ["torta", "cupcake", "galleta", "croissant", "tartaleta", "macaron"];

function crearIlustracion(tipo, color) {
  const c = color;
  const claro = mezclar(c, "#ffffff", 0.35);
  const oscuro = mezclar(c, "#000000", 0.25);

  const piezas = {
    torta: `
      <rect x="38" y="94" width="124" height="34" rx="9" fill="${oscuro}"/>
      <rect x="38" y="94" width="124" height="10" rx="5" fill="${claro}"/>
      <rect x="52" y="62" width="96" height="34" rx="9" fill="${c}"/>
      <path d="M52 66 H148 V74 Q142 88 136 74 Q130 84 124 74 Q118 90 112 74 Q106 84 100 74 Q94 88 88 74 Q82 84 76 74 Q70 88 64 74 L52 74 Z" fill="#fffaf5"/>
      <circle cx="100" cy="52" r="9" fill="#c8102e"/>
      <path d="M100 44 Q104 36 112 33" stroke="#3f6b3a" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    cupcake: `
      <path d="M60 84 L140 84 L130 126 L70 126 Z" fill="${oscuro}"/>
      <path d="M80 86 L84 125 M100 86 V125 M120 86 L116 125" stroke="rgba(255,255,255,0.35)" stroke-width="3"/>
      <ellipse cx="100" cy="82" rx="46" ry="14" fill="${c}"/>
      <ellipse cx="100" cy="66" rx="36" ry="13" fill="${claro}"/>
      <ellipse cx="100" cy="51" rx="25" ry="11" fill="${c}"/>
      <ellipse cx="100" cy="38" rx="13" ry="9" fill="${claro}"/>
      <circle cx="100" cy="28" r="6" fill="#c8102e"/>
      <rect x="78" y="62" width="6" height="3" rx="1.5" fill="#fff" transform="rotate(-20 81 63)"/>
      <rect x="112" y="70" width="6" height="3" rx="1.5" fill="#ffe29a" transform="rotate(25 115 71)"/>
      <rect x="92" y="52" width="6" height="3" rx="1.5" fill="#8fb996"/>`,
    galleta: `
      <circle cx="130" cy="78" r="36" fill="${oscuro}"/>
      <circle cx="84" cy="88" r="42" fill="${c}"/>
      <circle cx="84" cy="88" r="42" fill="none" stroke="${claro}" stroke-width="3"/>
      <circle cx="68" cy="74" r="6" fill="#3b2423"/><circle cx="96" cy="70" r="5" fill="#3b2423"/>
      <circle cx="82" cy="96" r="6.5" fill="#3b2423"/><circle cx="106" cy="98" r="5" fill="#3b2423"/>
      <circle cx="62" cy="100" r="4.5" fill="#3b2423"/><circle cx="130" cy="72" r="5" fill="#3b2423"/>
      <circle cx="140" cy="88" r="4" fill="#3b2423"/><circle cx="120" cy="86" r="4" fill="#3b2423"/>`,
    croissant: `
      <g fill="${c}" stroke="${oscuro}" stroke-width="2">
        <ellipse cx="44" cy="102" rx="18" ry="12" transform="rotate(-50 44 102)"/>
        <ellipse cx="156" cy="102" rx="18" ry="12" transform="rotate(50 156 102)"/>
        <ellipse cx="66" cy="84" rx="23" ry="16" transform="rotate(-30 66 84)"/>
        <ellipse cx="134" cy="84" rx="23" ry="16" transform="rotate(30 134 84)"/>
        <ellipse cx="100" cy="76" rx="29" ry="20"/>
      </g>
      <path d="M78 66 Q100 58 122 66 M70 84 Q74 76 82 72 M130 84 Q126 76 118 72" stroke="${claro}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    tartaleta: `
      <path d="M44 94 L156 94 L146 126 L54 126 Z" fill="#d9a35f"/>
      <path d="M62 100 V124 M82 100 V126 M100 100 V126 M118 100 V126 M138 100 V124" stroke="#b9823c" stroke-width="3"/>
      <ellipse cx="100" cy="94" rx="58" ry="13" fill="${c}"/>
      <circle cx="78" cy="86" r="11" fill="#fffaf5"/><circle cx="100" cy="80" r="13" fill="#fffaf5"/><circle cx="122" cy="86" r="11" fill="#fffaf5"/>
      <circle cx="100" cy="72" r="4" fill="#8fb996"/>`,
    macaron: `${macaron(62, 108, c)}${macaron(138, 108, claro)}${macaron(100, 84, mezclar(c, "#ffffff", 0.15))}`,
  };

  return `
  <svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="100" cy="132" rx="72" ry="9" fill="rgba(43,29,46,0.16)"/>
    ${piezas[tipo] || piezas.tartaleta}
  </svg>`;
}

// Foto real del producto (carpeta img/). Si el archivo falla, se usa la ilustración.
function crearImagenProducto(producto) {
  return `<img class="foto" src="${escaparHTML(producto.imagen)}" alt="${escaparHTML(producto.nombre)}" loading="lazy" width="800" height="600"
    data-tipo="${escaparHTML(producto.ilustracion)}" data-color="${escaparHTML(producto.color)}" />`;
}

// El evento "error" no se propaga, por eso se escucha en la fase de captura.
document.addEventListener(
  "error",
  (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.classList.contains("foto")) return;
    img.outerHTML = crearIlustracion(img.dataset.tipo, img.dataset.color);
  },
  true
);

/* Estado */

let productos = []; // array de instancias de Producto (llega por fetch)
let config = { envioGratisDesde: 120000, costoEnvio: 8000, cupones: [] }; // valores por defecto
let carrito = []; // [{ id, cantidad }]
let cuponAplicado = null;
let entrega = "domicilio";
let categoriaActiva = "Todos";
let textoBusqueda = "";
let soloDisponibles = false;
let temporizadorBusqueda = null;

/* Referencias al DOM  */

const $ = (id) => document.getElementById(id);

const el = {
  aviso: $("aviso-cupon"), 
  avisoCodigo: $("aviso-codigo"), 
  avisoPorcentaje: $("aviso-porcentaje"),
  avisoAplicar: $("aviso-aplicar"), 
  avisoCerrar: $("aviso-cerrar"),
  heroImagen: $("hero-imagen"), 
  statProductos: $("stat-productos"), 
  statEnvio: $("stat-envio"),
  buscar: $("buscar"), 
  orden: $("orden"), 
  filtros: $("filtros"), 
  soloDisponibles: $("solo-disponibles"),
  simularError: $("simular-error"), 
  contador: $("contador"),
  estadoCarga: $("estado-carga"), 
  errorCarga: $("error-carga"), 
  errorCargaTexto: $("error-carga-texto"), 
  reintentar: $("reintentar"),
  lista: $("lista-productos"), 
  sinResultados: $("sin-resultados"),
  pedidoVacio: $("pedido-vacio"), 
  listaPedido: $("lista-pedido"),
  formCupon: $("form-cupon"), 
  inputCupon: $("input-cupon"), 
  cuponEstado: $("cupon-estado"),
  subtotal: $("p-subtotal"), 
  filaDescuento: $("fila-descuento"), 
  descuento: $("p-descuento"),
  envio: $("p-envio"), 
  total: $("p-total"), 
  ayudaEnvio: $("p-ayuda-envio"),
  formPedido: $("form-pedido"), 
  nombre: $("input-nombre"), 
  telefono: $("input-telefono"),
  campoDireccion: $("campo-direccion"), 
  direccion: $("input-direccion"),
  fecha: $("input-fecha"), 
  dedicatoria: $("input-dedicatoria"),
  formError: $("form-error"), 
  btnConfirmar: $("btn-confirmar"), 
  btnVaciar: $("btn-vaciar"), 
  mensaje: $("mensaje"),
  estadoInspiracion: $("estado-inspiracion"), 
  errorInspiracion: $("error-inspiracion"),
  errorInspiracionTexto: $("error-inspiracion-texto"), 
  reintentarInspiracion: $("reintentar-inspiracion"),
  actualizarInspiracion: $("actualizar-inspiracion"), 
  listaInspiracion: $("lista-inspiracion"),
  toasts: $("toasts"),
};

/*  Utilidades  */

const formatoPesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const pesos = (valor) => formatoPesos.format(valor);
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const buscarProducto = (id) => productos.find((p) => p.id === id);

// Evita que texto externo (JSON, API, formulario) se interprete como HTML.
const escaparHTML = (texto) =>
  String(texto).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const normalizar = (texto) =>
  String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function fechaISO(diasDespues = 0) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasDespues);
  return fecha.toLocaleDateString("en-CA"); // AAAA-MM-DD en hora local
}

function describirStock(stock) {
  if (stock <= 0) return { texto: "Agotado", clase: "agotado" };
  if (stock <= 3) return { texto: `Últimas ${stock} unidades`, clase: "poco" };
  return { texto: `${stock} disponibles hoy`, clase: "ok" };
}

function mostrarMensaje(texto, tipo = "ok") {
  el.mensaje.textContent = texto;
  el.mensaje.className = `mensaje mensaje--${tipo}`;
  el.mensaje.hidden = false;
}

function ocultarMensaje() {
  el.mensaje.hidden = true;
  el.mensaje.textContent = "";
}

function mostrarErrorFormulario(texto) {
  el.formError.textContent = texto;
  el.formError.hidden = false;
}

function ocultarErrorFormulario() {
  el.formError.textContent = "";
  el.formError.hidden = true;
}

/*  Librerías: Toastify y SweetAlert2 */

// Notificación flotante con Toastify. Tipos: exito, error, aviso, info.
function notificar(texto, tipo = "info", duracion = DURACION_TOAST_MS) {
  if (typeof Toastify === "function") {
    Toastify({
      text: texto,
      duration: duracion,
      close: true,
      gravity: "bottom",
      position: "right",
      stopOnFocus: true,
      className: `toast-${tipo}`,
    }).showToast();
    return;
  }

  // Respaldo si la librería no cargó (por ejemplo, sin conexión a la CDN).
  const aviso = document.createElement("p");
  aviso.className = `toast toast--${tipo}`;
  aviso.textContent = texto;
  el.toasts.appendChild(aviso);
  setTimeout(() => aviso.remove(), duracion);
}

// Ventana de confirmación con SweetAlert2. Devuelve true si el usuario confirma.
async function confirmar({ titulo, html, textoConfirmar = "Confirmar", icono = "question" }) {
  if (typeof Swal === "undefined") return true; // sin la librería, se continúa
  const resultado = await Swal.fire({
    title: titulo,
    html,
    icon: icono,
    showCancelButton: true,
    confirmButtonText: textoConfirmar,
    cancelButtonText: "Cancelar",
    confirmButtonColor: COLOR_PRINCIPAL,
    reverseButtons: true,
    focusCancel: true,
  });
  return resultado.isConfirmed;
}

// Ventana informativa con SweetAlert2.
async function informar({ titulo, html, icono = "success" }) {
  if (typeof Swal === "undefined") {
    notificar(titulo, icono === "success" ? "exito" : "info");
    return;
  }
  await Swal.fire({ title: titulo, html, icon: icono, confirmButtonText: "Entendido", confirmButtonColor: COLOR_PRINCIPAL });
}

/* Capa de red: fetch + async/await */

// Traduce los errores técnicos a mensajes claros para el usuario.
function describirError(error) {
  if (error.name === "AbortError") return "La solicitud tardó demasiado en responder.";
  if (error.name === "SyntaxError") return "Los datos recibidos no tienen un formato válido.";
  if (error.name === "TypeError") {
    return "No hay conexión con el servidor. Si abriste el archivo directamente, usa Live Server.";
  }
  return error.message;
}

// Pide un recurso y devuelve su contenido en JSON. Lanza un Error si algo falla.
async function pedirJSON(url, opciones = {}) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_LIMITE_FETCH_MS);

  try {
    const respuesta = await fetch(url, { ...opciones, signal: controlador.signal });
    if (!respuesta.ok) {
      throw new Error(`El servidor respondió con el estado ${respuesta.status}.`);
    }
    return await respuesta.json();
  } catch (error) {
    throw new Error(describirError(error));
  } finally {
    clearTimeout(temporizador);
  }
}

function esProductoValido(p) {
  return Boolean(
    p &&
      Number.isInteger(p.id) &&
      typeof p.nombre === "string" &&
      typeof p.categoria === "string" &&
      Number(p.precio) > 0 &&
      TIPOS_ILUSTRACION.includes(p.ilustracion) &&
      /^#[0-9a-f]{6}$/i.test(p.color || "")
  );
}

function esConfigValida(c) {
  return Boolean(
    c &&
      Number.isFinite(c.envioGratisDesde) &&
      Number.isFinite(c.costoEnvio) &&
      Array.isArray(c.cupones) &&
      c.cupones.every((x) => typeof x.codigo === "string" && Number(x.descuento) > 0 && Number(x.descuento) < 1)
  );
}

/*  Carga del menú (JSON local) */

function mostrarCargando(cargando) {
  el.estadoCarga.hidden = !cargando;
  el.lista.setAttribute("aria-busy", String(cargando));
  if (cargando) {
    el.errorCarga.hidden = true;
    el.sinResultados.hidden = true;
    renderEsqueletos(6);
  }
}

function mostrarErrorCarga(mensaje) {
  el.lista.replaceChildren();
  el.contador.textContent = "";
  el.errorCargaTexto.textContent = `No pudimos cargar el menú. ${mensaje}`;
  el.errorCarga.hidden = false;
}

async function cargarMenu() {
  mostrarCargando(true);

  try {
    const urlProductos = el.simularError.checked ? URL_CON_ERROR : URL_PRODUCTOS;

    // Las peticiones se esperan en paralelo. Si la configuración falla, se usa la de por defecto.
    const [datosProductos, datosConfig] = await Promise.all([
      pedirJSON(urlProductos),
      pedirJSON(URL_CONFIG).catch(() => null),
      esperar(CARGA_MINIMA_MS),
    ]);

    if (!Array.isArray(datosProductos)) {
      throw new Error("El archivo del menú no tiene el formato esperado.");
    }
    const validos = datosProductos.filter(esProductoValido);
    if (validos.length === 0) {
      throw new Error("El menú está vacío.");
    }

    productos = validos.map((datos) => new Producto(datos));

    if (esConfigValida(datosConfig)) {
      config = datosConfig;
    } else {
      notificar("No pudimos leer la configuración de envíos; usamos los valores por defecto.", "aviso");
    }

    restaurarPedido();
    renderConfig();
    renderFiltros();
    renderMenu();
    renderPedido();

    const descartados = datosProductos.length - validos.length;
    notificar(`Menú cargado con éxito: ${productos.length} productos.`, "exito");
    if (descartados > 0) {
      notificar(`${descartados} producto(s) se omitieron por datos incompletos.`, "aviso");
    }
  } catch (error) {
    mostrarErrorCarga(error.message);
    notificar(`Error al cargar el menú: ${error.message}`, "error", 6000);
  } finally {
    // Se ejecuta siempre: oculta el mensaje de carga pase lo que pase.
    el.estadoCarga.hidden = true;
    el.lista.setAttribute("aria-busy", "false");
  }
}

/*  Inspiración (API pública TheMealDB) */

function esIdeaValida(idea) {
  return Boolean(
    idea &&
      typeof idea.idMeal === "string" &&
      typeof idea.strMeal === "string" &&
      typeof idea.strMealThumb === "string" &&
      idea.strMealThumb.startsWith("https://")
  );
}

function renderInspiracion(ideas) {
  el.listaInspiracion.innerHTML = ideas
    .map(
      (idea) => `
      <article class="idea">
        <div class="idea__imagen">
          <img class="foto" src="${escaparHTML(idea.strMealThumb)}/preview" alt="${escaparHTML(idea.strMeal)}" loading="lazy" width="250" height="250"
            data-tipo="tartaleta" data-color="#f4b6c8" />
        </div>
        <h3 class="idea__nombre">${escaparHTML(idea.strMeal)}</h3>
        <a class="idea__enlace" href="https://www.themealdb.com/meal/${encodeURIComponent(idea.idMeal)}" target="_blank" rel="noopener noreferrer">Ver receta</a>
      </article>`
    )
    .join("");
}

async function cargarInspiracion() {
  el.estadoInspiracion.hidden = false;
  el.errorInspiracion.hidden = true;
  el.listaInspiracion.replaceChildren();

  try {
    const url = el.simularError.checked ? URL_INSPIRACION_ERROR : URL_INSPIRACION;
    const datos = await pedirJSON(url);

    if (!datos || !Array.isArray(datos.meals)) {
      throw new Error("La API no devolvió ideas de postres.");
    }
    const ideas = datos.meals.filter(esIdeaValida);
    if (ideas.length === 0) {
      throw new Error("La API no devolvió ideas de postres.");
    }

    // Se eligen ideas al azar para que cada visita sea distinta.
    const elegidas = [...ideas].sort(() => Math.random() - 0.5).slice(0, CANTIDAD_IDEAS);
    renderInspiracion(elegidas);
  } catch (error) {
    el.errorInspiracionTexto.textContent = `No pudimos cargar las ideas de postres. ${error.message}`;
    el.errorInspiracion.hidden = false;
    notificar("No se pudieron cargar las ideas de postres.", "aviso", 5000);
  } finally {
    el.estadoInspiracion.hidden = true;
  }
}

/*  Persistencia del pedido: try/catch/finally sobre JSON  */

function guardarPedido() {
  try {
    localStorage.setItem(CLAVE_PEDIDO, JSON.stringify(carrito));
  } catch (error) {
    // Si el almacenamiento no está disponible, la app sigue funcionando sin guardar.
  }
}

function restaurarPedido() {
  let guardado = [];
  try {
    guardado = JSON.parse(localStorage.getItem(CLAVE_PEDIDO)) ?? [];
    if (!Array.isArray(guardado)) throw new TypeError("Formato inválido.");
  } catch (error) {
    guardado = [];
  } finally {
    // Solo quedan productos que existen y hay en stock; la cantidad no supera el stock.
    carrito = guardado
      .map((linea) => ({ id: Number(linea.id), cantidad: Math.floor(Number(linea.cantidad)) }))
      .filter((linea) => linea.cantidad > 0)
      .map((linea) => {
        const producto = buscarProducto(linea.id);
        return producto && producto.disponible ? { id: producto.id, cantidad: Math.min(linea.cantidad, producto.stock) } : null;
      })
      .filter(Boolean);
  }
}

/* Cálculo del pedido */

function calcularPedido() {
  const lineas = carrito
    .map(({ id, cantidad }) => ({ producto: buscarProducto(id), cantidad }))
    .filter((linea) => linea.producto);

  const subtotal = lineas.reduce((acumulado, l) => acumulado + l.producto.precio * l.cantidad, 0);
  const unidades = lineas.reduce((acumulado, l) => acumulado + l.cantidad, 0);
  const descuento = cuponAplicado ? Math.round(subtotal * cuponAplicado.descuento) : 0;
  const base = subtotal - descuento;
  const aplicaEnvio = lineas.length > 0 && entrega === "domicilio";
  const envio = aplicaEnvio && base < config.envioGratisDesde ? config.costoEnvio : 0;

  return { lineas, subtotal, unidades, descuento, base, envio, total: base + envio, aplicaEnvio };
}

/* Render: portada, filtros y menú */

function renderHero() {
  el.heroImagen.innerHTML = `<img class="foto" src="img/hero.jpg" alt="Tortas y postres de Canela Pastelería" width="1000" height="800"
    data-tipo="torta" data-color="#b8316a" />`;
}

function renderConfig() {
  el.statProductos.textContent = String(productos.length);
  el.statEnvio.textContent = pesos(config.envioGratisDesde);

  const cupon = config.cupones[0];
  if (cupon) {
    el.avisoCodigo.textContent = cupon.codigo;
    el.avisoPorcentaje.textContent = `${Math.round(cupon.descuento * 100)}%`;
  }
}

function renderEsqueletos(cantidad) {
  el.lista.replaceChildren();
  for (let i = 0; i < cantidad; i++) {
    const esqueleto = document.createElement("div");
    esqueleto.className = "esqueleto";
    esqueleto.setAttribute("aria-hidden", "true");
    esqueleto.innerHTML = '<div class="esqueleto__imagen"></div><div class="esqueleto__linea"></div><div class="esqueleto__linea esqueleto__linea--corta"></div>';
    el.lista.appendChild(esqueleto);
  }
}

function renderFiltros() {
  const categorias = ["Todos", ...new Set(productos.map((p) => p.categoria))];
  el.filtros.replaceChildren();
  categorias.forEach((categoria) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "filtro";
    boton.textContent = categoria;
    boton.dataset.categoria = categoria;
    boton.setAttribute("aria-pressed", String(categoria === categoriaActiva));
    el.filtros.appendChild(boton);
  });
}

function obtenerProductosVisibles() {
  const busqueda = normalizar(textoBusqueda.trim());
  const visibles = productos
    .filter((p) => categoriaActiva === "Todos" || p.categoria === categoriaActiva)
    .filter((p) => !soloDisponibles || p.disponible)
    .filter((p) => normalizar(`${p.nombre} ${p.descripcion} ${p.categoria}`).includes(busqueda));

  const criterios = {
    "precio-asc": (a, b) => a.precio - b.precio,
    "precio-desc": (a, b) => b.precio - a.precio,
    nombre: (a, b) => a.nombre.localeCompare(b.nombre, "es"),
  };
  const criterio = criterios[el.orden.value];
  return criterio ? visibles.sort(criterio) : visibles;
}

function renderMenu() {
  const visibles = obtenerProductosVisibles();
  el.lista.replaceChildren();
  el.sinResultados.hidden = visibles.length > 0 || productos.length === 0;
  el.contador.textContent = productos.length ? `${visibles.length} de ${productos.length} productos` : "";

  visibles.forEach((producto) => {
    const enPedido = carrito.find((l) => l.id === producto.id);
    const stock = describirStock(producto.stock);
    const fondo = `linear-gradient(160deg, ${mezclar(producto.color, "#ffffff", 0.9)}, ${mezclar(producto.color, "#ffffff", 0.72)})`;

    const tarjeta = document.createElement("article");
    tarjeta.className = `producto${producto.disponible ? "" : " producto--agotado"}`;
    tarjeta.dataset.id = producto.id;
    tarjeta.innerHTML = `
      <div class="producto__imagen" style="background: ${fondo}">
        ${crearImagenProducto(producto)}
        <span class="producto__etiqueta">${escaparHTML(producto.categoria)}</span>
        ${enPedido ? `<span class="producto__enpedido">${enPedido.cantidad} en tu pedido</span>` : ""}
      </div>
      <div class="producto__cuerpo">
        <h3 class="producto__nombre">${escaparHTML(producto.nombre)}</h3>
        <p class="producto__unidad">${escaparHTML(producto.unidad)}</p>
        <p class="producto__descripcion">${escaparHTML(producto.descripcion)}</p>
        <p class="producto__stock producto__stock--${stock.clase}">${stock.texto}</p>
        <p class="producto__precio">${pesos(producto.precio)}</p>
        <div class="producto__acciones">
          <button type="button" class="boton boton--borde" data-accion="detalle">Ver detalle</button>
          <button type="button" class="boton" data-accion="agregar" ${producto.disponible ? "" : "disabled"}>
            ${producto.disponible ? "Agregar" : "Agotado"}
          </button>
        </div>
      </div>`;
    el.lista.appendChild(tarjeta);
  });
}

/* Render: pedido */

function renderPedido() {
  const pedido = calcularPedido();
  const hayProductos = pedido.lineas.length > 0;

  el.listaPedido.innerHTML = pedido.lineas
    .map(
      ({ producto, cantidad }) => `
      <li class="linea" data-id="${producto.id}">
        <div class="linea__info">
          <span class="linea__nombre">${escaparHTML(producto.nombre)}</span>
          <span class="linea__unitario">${pesos(producto.precio)} c/u</span>
        </div>
        <div class="cantidad" role="group" aria-label="Cantidad de ${escaparHTML(producto.nombre)}">
          <button type="button" data-accion="menos" aria-label="Quitar una unidad">−</button>
          <span>${cantidad}</span>
          <button type="button" data-accion="mas" aria-label="Agregar una unidad" ${cantidad >= producto.stock ? "disabled" : ""}>+</button>
        </div>
        <span class="linea__total">${pesos(producto.precio * cantidad)}</span>
        <button type="button" class="linea__quitar" data-accion="quitar" aria-label="Quitar ${escaparHTML(producto.nombre)} del pedido">✕</button>
      </li>`
    )
    .join("");

  el.pedidoVacio.hidden = hayProductos;
  el.btnVaciar.disabled = !hayProductos;
  el.subtotal.textContent = pesos(pedido.subtotal);
  el.filaDescuento.hidden = !cuponAplicado;
  el.descuento.textContent = `- ${pesos(pedido.descuento)}`;
  el.envio.textContent = pedido.aplicaEnvio ? (pedido.envio === 0 ? "Gratis" : pesos(pedido.envio)) : "$0";
  el.total.textContent = pesos(pedido.total);

  if (!pedido.aplicaEnvio) {
    el.ayudaEnvio.textContent = hayProductos ? "Recogerás tu pedido en la tienda, sin costo de domicilio." : "";
  } else if (pedido.envio === 0) {
    el.ayudaEnvio.textContent = "¡Tu domicilio es gratis!";
  } else {
    el.ayudaEnvio.textContent = `Te faltan ${pesos(config.envioGratisDesde - pedido.base)} para el domicilio gratis.`;
  }
}

// Cada vez que el pedido cambia se guardan los datos y se vuelve a dibujar la interfaz.
function actualizarPedido() {
  guardarPedido();
  renderPedido();
  renderMenu();
}

function agregarProducto(id) {
  const producto = buscarProducto(id);
  if (!producto) return;
  if (!producto.disponible) {
    notificar(`${producto.nombre} está agotado por hoy.`, "aviso");
    return;
  }

  const linea = carrito.find((l) => l.id === id);
  if (linea && linea.cantidad >= producto.stock) {
    notificar(`Solo tenemos ${producto.stock} unidad(es) de ${producto.nombre} hoy.`, "aviso");
    return;
  }

  if (linea) linea.cantidad += 1;
  else carrito.push({ id, cantidad: 1 });

  actualizarPedido();
  notificar(`${producto.nombre} agregado a tu pedido.`, "exito");
}

function cambiarCantidad(id, cambio) {
  const linea = carrito.find((l) => l.id === id);
  const producto = buscarProducto(id);
  if (!linea || !producto) return;

  const nueva = linea.cantidad + cambio;
  if (nueva <= 0) {
    quitarProducto(id);
    return;
  }
  if (nueva > producto.stock) {
    notificar(`Solo tenemos ${producto.stock} unidad(es) de ${producto.nombre} hoy.`, "aviso");
    return;
  }
  linea.cantidad = nueva;
  actualizarPedido();
}

function quitarProducto(id) {
  const producto = buscarProducto(id);
  carrito = carrito.filter((l) => l.id !== id);
  actualizarPedido();
  if (producto) notificar(`${producto.nombre} se quitó de tu pedido.`, "info");
}

async function vaciarPedido() {
  const confirmado = await confirmar({
    titulo: "¿Vaciar tu pedido?",
    html: "Se quitarán todos los productos que agregaste.",
    textoConfirmar: "Sí, vaciar",
    icono: "warning",
  });
  if (!confirmado) return;

  carrito = [];
  cuponAplicado = null;
  el.cuponEstado.hidden = true;
  el.inputCupon.value = "";
  ocultarMensaje();
  actualizarPedido();
  notificar("Tu pedido quedó vacío.", "info");
}

async function verDetalle(id) {
  const p = buscarProducto(id);
  if (!p) return;

  const stock = describirStock(p.stock);
  const alergenos = p.alergenos.length ? p.alergenos.join(", ") : "ninguno declarado";
  await informar({
    titulo: p.nombre,
    html: `<div class="detalle-swal">
             <p>${escaparHTML(p.descripcion)}</p>
             <p><strong>Presentación:</strong> ${escaparHTML(p.unidad)}</p>
             <p><strong>Contiene:</strong> ${escaparHTML(alergenos)}</p>
             <p><strong>Disponibilidad:</strong> ${stock.texto}</p>
             <p><strong>Precio:</strong> ${pesos(p.precio)}</p>
           </div>`,
    icono: "info",
  });
}

/* Cupones */

function aplicarCupon(codigo) {
  const texto = codigo.trim().toUpperCase();
  if (!texto) {
    mostrarCuponEstado("Escribe un código de cupón.", "error");
    return;
  }
  if (cuponAplicado && cuponAplicado.codigo === texto) {
    mostrarCuponEstado(`El cupón ${texto} ya está aplicado.`, "info");
    return;
  }

  const cupon = config.cupones.find((c) => c.codigo.toUpperCase() === texto);
  if (!cupon) {
    mostrarCuponEstado("Ese cupón no existe o ya venció.", "error");
    notificar("Cupón no válido.", "aviso");
    return;
  }

  cuponAplicado = cupon;
  el.inputCupon.value = cupon.codigo;
  mostrarCuponEstado(`Cupón ${cupon.codigo} aplicado: ${Math.round(cupon.descuento * 100)}% de descuento.`, "ok");
  renderPedido();
  notificar(`Cupón ${cupon.codigo} aplicado.`, "exito");
}

function mostrarCuponEstado(texto, tipo) {
  el.cuponEstado.textContent = texto;
  el.cuponEstado.className = `cupon__estado cupon__estado--${tipo}`;
  el.cuponEstado.hidden = false;
}

/*  Temporizador: regalo de bienvenida */

function programarAviso() {
  setTimeout(() => {
    if (cuponAplicado || productos.length === 0 || config.cupones.length === 0) return;
    el.aviso.hidden = false;
  }, RETARDO_AVISO_MS);
}

/* Confirmar pedido: POST a una API + SweetAlert2 */

function validarPedido(datos) {
  if (datos.pedido.lineas.length === 0) throw new ErrorValidacion("Agrega al menos un producto a tu pedido.");
  if (datos.nombre.length < 3) throw new ErrorValidacion("Escribe tu nombre completo.");
  if (!/^3\d{9}$/.test(datos.telefono.replace(/[\s-]/g, ""))) {
    throw new ErrorValidacion("Escribe un celular válido de 10 dígitos que empiece por 3.");
  }
  if (datos.entrega === "domicilio" && datos.direccion.length < 6) {
    throw new ErrorValidacion("Escribe la dirección completa para el domicilio.");
  }
  if (!datos.fecha || datos.fecha < fechaISO(1)) {
    throw new ErrorValidacion("Elige una fecha desde mañana: necesitamos 24 horas para preparar tu pedido.");
  }
}

// Envía el pedido con fetch (método POST) a la API pública de pruebas JSONPlaceholder.
async function enviarPedido(pedido) {
  const respuesta = await pedirJSON(URL_PEDIDOS, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ title: `Pedido de ${pedido.nombre}`, body: JSON.stringify(pedido), userId: 1 }),
  });
  return { codigo: `CP-${respuesta.id}`, ...pedido };
}

function establecerEnviando(enviando) {
  el.btnConfirmar.disabled = enviando;
  el.btnConfirmar.textContent = enviando ? "Enviando pedido…" : "Confirmar pedido";
}

async function manejarPedido(evento) {
  evento.preventDefault();
  ocultarMensaje();
  ocultarErrorFormulario();

  try {
    const calculo = calcularPedido();
    const datos = {
      nombre: el.nombre.value.trim(),
      telefono: el.telefono.value.trim(),
      entrega,
      direccion: el.direccion.value.trim(),
      fecha: el.fecha.value,
      dedicatoria: el.dedicatoria.value.trim(),
      pedido: calculo,
    };
    validarPedido(datos);

    const resumen = calculo.lineas
      .map((l) => `<li>${l.cantidad} × ${escaparHTML(l.producto.nombre)}</li>`)
      .join("");
    const confirmado = await confirmar({
      titulo: "¿Confirmar tu pedido?",
      html: `<ul class="resumen-swal">${resumen}</ul>
             Entrega: <strong>${escaparHTML(datos.fecha)}</strong> (${datos.entrega === "domicilio" ? "domicilio" : "recoger en tienda"}).<br />
             Total a pagar: <strong>${pesos(calculo.total)}</strong>.`,
      textoConfirmar: "Sí, confirmar",
    });
    if (!confirmado) {
      notificar("Pedido cancelado. Puedes seguir editándolo.", "info");
      return;
    }

    establecerEnviando(true);
    const respuesta = await enviarPedido({
      nombre: datos.nombre,
      telefono: datos.telefono,
      entrega: datos.entrega,
      direccion: datos.direccion,
      fecha: datos.fecha,
      dedicatoria: datos.dedicatoria,
      productos: calculo.lineas.map((l) => ({ id: l.producto.id, nombre: l.producto.nombre, cantidad: l.cantidad })),
      cupon: cuponAplicado ? cuponAplicado.codigo : null,
      total: calculo.total,
    });

    await informar({
      titulo: "¡Pedido confirmado!",
      html: `Tu código es <strong>${escaparHTML(respuesta.codigo)}</strong>.<br />
             Te contactaremos al <strong>${escaparHTML(respuesta.telefono)}</strong> para coordinar el pago y la entrega del ${escaparHTML(respuesta.fecha)}.`,
      icono: "success",
    });
    mostrarMensaje(`Pedido ${respuesta.codigo} confirmado. ¡Gracias por elegir Canela Pastelería!`, "ok");

    carrito = [];
    cuponAplicado = null;
    el.cuponEstado.hidden = true;
    el.inputCupon.value = "";
    el.formPedido.reset();
    entrega = "domicilio";
    alternarDireccion();
    actualizarPedido();
  } catch (error) {
    if (error instanceof ErrorValidacion) {
      mostrarErrorFormulario(error.message);
      notificar(error.message, "aviso");
    } else {
      mostrarMensaje(`No pudimos enviar tu pedido. ${error.message}`, "error");
      notificar("No pudimos enviar el pedido. Inténtalo de nuevo en unos minutos.", "error", 5000);
    }
  } finally {
    establecerEnviando(false);
  }
}

function alternarDireccion() {
  el.campoDireccion.hidden = entrega !== "domicilio";
}

/* Eventos */

function registrarEventos() {
  // Botones de cada tarjeta del menú (delegación de eventos)
  el.lista.addEventListener("click", (e) => {
    const boton = e.target.closest("button[data-accion]");
    const tarjeta = e.target.closest(".producto");
    if (!boton || !tarjeta) return;
    const id = Number(tarjeta.dataset.id);
    if (boton.dataset.accion === "agregar") agregarProducto(id);
    if (boton.dataset.accion === "detalle") verDetalle(id);
  });

  // Botones del pedido (+, −, quitar)
  el.listaPedido.addEventListener("click", (e) => {
    const boton = e.target.closest("button[data-accion]");
    const linea = e.target.closest(".linea");
    if (!boton || !linea) return;
    const id = Number(linea.dataset.id);
    if (boton.dataset.accion === "mas") cambiarCantidad(id, 1);
    if (boton.dataset.accion === "menos") cambiarCantidad(id, -1);
    if (boton.dataset.accion === "quitar") quitarProducto(id);
  });

  // Filtros por categoría
  el.filtros.addEventListener("click", (e) => {
    const boton = e.target.closest("button[data-categoria]");
    if (!boton) return;
    categoriaActiva = boton.dataset.categoria;
    renderFiltros();
    renderMenu();
  });

  // Teclado: búsqueda con retardo (debounce con setTimeout) mientras se escribe
  el.buscar.addEventListener("input", () => {
    clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(() => {
      textoBusqueda = el.buscar.value;
      renderMenu();
    }, RETARDO_BUSQUEDA_MS);
  });

  // Teclado: atajo Ctrl/Cmd + K para buscar y Escape para limpiar
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      el.buscar.focus();
      el.buscar.select();
    }
    if (e.key === "Escape" && document.activeElement === el.buscar) {
      el.buscar.value = "";
      textoBusqueda = "";
      renderMenu();
    }
  });

  el.orden.addEventListener("change", renderMenu);
  el.soloDisponibles.addEventListener("change", () => {
    soloDisponibles = el.soloDisponibles.checked;
    renderMenu();
  });

  // Cupón y entrega
  el.formCupon.addEventListener("submit", (e) => {
    e.preventDefault();
    aplicarCupon(el.inputCupon.value);
  });
  el.formPedido.addEventListener("change", (e) => {
    if (e.target.name !== "entrega") return;
    entrega = e.target.value;
    alternarDireccion();
    renderPedido();
  });
  el.formPedido.addEventListener("input", ocultarErrorFormulario);

  el.formPedido.addEventListener("submit", manejarPedido);
  el.btnVaciar.addEventListener("click", vaciarPedido);

  // Reintentos
  el.reintentar.addEventListener("click", cargarMenu);
  el.reintentarInspiracion.addEventListener("click", cargarInspiracion);
  el.actualizarInspiracion.addEventListener("click", cargarInspiracion);

  // Aviso temporizado
  el.avisoAplicar.addEventListener("click", () => {
    if (config.cupones[0]) aplicarCupon(config.cupones[0].codigo);
    el.aviso.hidden = true;
  });
  el.avisoCerrar.addEventListener("click", () => {
    el.aviso.hidden = true;
  });
}

/* Inicio */

function iniciar() {
  // Los navegadores recuerdan lo escrito en los campos al recargar la página.
  // Se sincroniza el estado con lo que realmente muestran, para que el filtro y lo que se ve coincidan.
  textoBusqueda = el.buscar.value;
  soloDisponibles = el.soloDisponibles.checked;
  const radioEntrega = el.formPedido.querySelector('input[name="entrega"]:checked');
  entrega = radioEntrega ? radioEntrega.value : "domicilio";
  alternarDireccion();

  el.fecha.min = fechaISO(1);
  renderHero();
  registrarEventos();
  renderPedido();
  programarAviso();
  cargarMenu(); // JSON local
  cargarInspiracion(); // API pública (no bloquea el menú)
}

iniciar();