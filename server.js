const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data", "registros.json");
const POINTS_PER_CORDOBA = Number(process.env.POINTS_PER_CORDOBA) || 0.1;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const premios = [
  { id: "parlante", nombre: "Parlante Bluetooth", icono: "🔊", puntos: 250, descripcion: "Audio portátil" },
  { id: "audifonos", nombre: "Audífonos inalámbricos", icono: "🎧", puntos: 180, descripcion: "Escucha tu música" },
  { id: "termo", nombre: "Termo reutilizable", icono: "🥤", puntos: 120, descripcion: "Para tus bebidas" },
  { id: "mochila", nombre: "Mochila", icono: "🎒", puntos: 350, descripcion: "Ideal para el día a día" },
  { id: "sombrilla", nombre: "Sombrilla", icono: "🌂", puntos: 100, descripcion: "Protección para lluvia o sol" },
  { id: "taza", nombre: "Taza térmica", icono: "☕", puntos: 160, descripcion: "Mantén tu bebida a mano" }
];

function ensureStore() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ registros: [], canjes: [] }, null, 2));
}
function readStore() {
  ensureStore();
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return { registros: Array.isArray(data.registros) ? data.registros : [], canjes: Array.isArray(data.canjes) ? data.canjes : [] };
  } catch {
    throw new Error("El archivo de datos no contiene JSON válido. Haz una copia y revisa registros.json.");
  }
}
function writeStore(data) {
  ensureStore();
  const temp = `${DATA_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), { mode: 0o600 });
  fs.renameSync(temp, DATA_FILE);
}
function clean(value) { return String(value ?? "").trim(); }
function number(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}
function monthOf(date) { return date.slice(0, 7); }
function pointsFor(cordobas) { return Math.floor(cordobas * POINTS_PER_CORDOBA); }
function clientKey(reg) { return clean(reg.cedula).toLowerCase(); }
function pointsBalance(store, cedula) {
  const key = clean(cedula).toLowerCase();
  const earned = store.registros.filter(r => clientKey(r) === key).reduce((sum, r) => sum + r.puntos, 0);
  const spent = store.canjes.filter(c => clean(c.cedula).toLowerCase() === key).reduce((sum, c) => sum + c.puntos, 0);
  return { acumulados: earned, canjeados: spent, disponibles: earned - spent };
}
function validateText(fields, required) {
  for (const field of required) {
    if (!clean(fields[field])) return `El campo "${field}" es obligatorio.`;
  }
  return null;
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/api/premios", (_req, res) => res.json(premios));

app.get("/api/registros", (req, res) => {
  const store = readStore();
  const q = clean(req.query.q).toLowerCase();
  const cedula = clean(req.query.cedula).toLowerCase();
  const nombre = clean(req.query.nombre).toLowerCase();
  const departamento = clean(req.query.departamento).toLowerCase();
  const mes = clean(req.query.mes);
  const registros = store.registros.filter(r => {
    const nombreCompleto = `${r.nombres} ${r.apellidos}`.toLowerCase();
    return (!q || [r.cedula, nombreCompleto, r.departamento, r.nombreSede].some(v => String(v || "").toLowerCase().includes(q))) &&
      (!cedula || r.cedula.toLowerCase().includes(cedula)) &&
      (!nombre || nombreCompleto.includes(nombre)) &&
      (!departamento || r.departamento.toLowerCase().includes(departamento)) &&
      (!mes || r.mes === mes);
  }).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creadoEn.localeCompare(a.creadoEn));
  res.json({ registros, total: registros.length });
});

app.get("/api/estadisticas", (_req, res) => {
  const store = readStore();
  const registros = store.registros;
  res.json({
    totalRegistros: registros.length,
    totalLitros: redondear(registros.reduce((s, r) => s + r.ventaLt, 0)),
    totalGalones: redondear(registros.reduce((s, r) => s + r.ventaGln, 0)),
    totalRecaudado: redondear(registros.reduce((s, r) => s + r.costoPagar, 0)),
    puntosGenerados: registros.reduce((s, r) => s + r.puntos, 0),
    clientes: new Set(registros.map(clientKey)).size
  });
});
function redondear(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

app.get("/api/clientes/:cedula/puntos", (req, res) => {
  const store = readStore();
  res.json({ cedula: clean(req.params.cedula), ...pointsBalance(store, req.params.cedula) });
});

app.post("/api/registros", (req, res) => {
  const b = req.body || {};
  const required = ["cedula", "nombres", "apellidos", "direccion", "nombreSede", "departamento", "municipio", "fecha"];
  const error = validateText(b, required);
  if (error) return res.status(400).json({ error });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean(b.fecha)) || Number.isNaN(Date.parse(`${b.fecha}T00:00:00`))) {
    return res.status(400).json({ error: "La fecha no es válida." });
  }
  const ventaLt = number(b.ventaLt), ventaGln = number(b.ventaGln);
  const costoLt = number(b.costoLt), costoGln = number(b.costoGln);
  if ([ventaLt, ventaGln, costoLt, costoGln].some(n => !Number.isFinite(n) || n < 0)) {
    return res.status(400).json({ error: "Las ventas y los costos deben ser números válidos mayores o iguales a cero." });
  }
  if (ventaLt === 0 && ventaGln === 0) return res.status(400).json({ error: "Ingresa una venta en litros o galones." });
  if (ventaLt > 0 && ventaGln > 0) return res.status(400).json({ error: "Ingresa la venta en litros o en galones, no en ambas unidades a la vez." });

  const store = readStore();
  const fecha = clean(b.fecha);
  const ventaBase = ventaLt > 0 ? ventaLt * costoLt : ventaGln * costoGln;
  const costoPagar = redondear(ventaBase);
  const registro = {
    id: crypto.randomUUID(),
    cedula: clean(b.cedula),
    nombres: clean(b.nombres),
    apellidos: clean(b.apellidos),
    direccion: clean(b.direccion),
    nombreSede: clean(b.nombreSede),
    departamento: clean(b.departamento),
    municipio: clean(b.municipio),
    ventaLt: redondear(ventaLt),
    ventaGln: redondear(ventaGln),
    costoLt: redondear(costoLt),
    costoGln: redondear(costoGln),
    fecha,
    mes: monthOf(fecha),
    costoPagar,
    puntos: pointsFor(costoPagar),
    creadoEn: new Date().toISOString()
  };
  store.registros.push(registro);
  writeStore(store);
  res.status(201).json({ registro, puntos: pointsBalance(store, registro.cedula), mensaje: "Registro guardado correctamente." });
});

app.post("/api/canjes", (req, res) => {
  const cedula = clean(req.body?.cedula);
  const premioId = clean(req.body?.premioId);
  if (!cedula || !premioId) return res.status(400).json({ error: "Indica la cédula y el premio." });
  const premio = premios.find(p => p.id === premioId);
  if (!premio) return res.status(404).json({ error: "El premio solicitado no existe." });
  const store = readStore();
  const existe = store.registros.some(r => clientKey(r) === cedula.toLowerCase());
  if (!existe) return res.status(404).json({ error: "No hay registros para esta cédula." });
  const balance = pointsBalance(store, cedula);
  if (balance.disponibles < premio.puntos) {
    return res.status(400).json({ error: `Puntos insuficientes. Necesitas ${premio.puntos} y tienes ${balance.disponibles}.` });
  }
  const canje = { id: crypto.randomUUID(), cedula, premioId, premio: premio.nombre, puntos: premio.puntos, fecha: new Date().toISOString() };
  store.canjes.push(canje);
  writeStore(store);
  res.status(201).json({ canje, puntos: pointsBalance(store, cedula), mensaje: "Canje registrado correctamente." });
});

app.get("/api/clientes/:cedula", (req, res) => {
  const store = readStore();
  const key = clean(req.params.cedula).toLowerCase();
  const registros = store.registros.filter(r => clientKey(r) === key);
  if (!registros.length) return res.status(404).json({ error: "No se encontró esa cédula." });
  const latest = registros[registros.length - 1];
  res.json({ cedula: latest.cedula, nombres: latest.nombres, apellidos: latest.apellidos, departamento: latest.departamento, ...pointsBalance(store, latest.cedula) });
});

app.use("/api", (_req, res) => res.status(404).json({ error: "Ruta API no encontrada." }));
app.listen(PORT, "0.0.0.0", () => {
  ensureStore();
  console.log(`Gestión de Ventas y Recompensas disponible en http://localhost:${PORT}`);
});
