async function loadRecords() {
    const p = new URLSearchParams();
    const q = $('allQ').value.trim(),
        d = $('allDept').value.trim(),
        m = $('allMes').value,
        n = $('allNombre').value.trim();
    if (q) p.set('q', q);
    if (d) p.set('departamento', d);
    if (m) p.set('mes', m);
    if (n) p.set('nombre', n);
    const data = await api('/api/registros?' + p);
    const body = $('allRecordsBody');
    if (!data.registros.length) body.innerHTML = '<tr><td colspan="11" class="empty">No hay registros que coincidan con los filtros.</td></tr>';
    else body.innerHTML = data.registros.map(r => `<tr><td class="name-cell">${esc(r.nombres)} ${esc(r.apellidos)}</td><td>${esc(r.cedula)}</td><td>${esc(r.direccion)}</td><td>${esc(r.nombreSede)}</td><td>${esc(r.departamento)}</td><td>${esc(r.municipio)}</td><td>${esc(r.fecha)}</td><td>${fmt(r.ventaLt)}</td><td>${fmt(r.ventaGln)}</td><td class="money">${money(r.costoPagar)}</td><td class="points">+${fmt(r.puntos)}</td></tr>`).join('');
    $('allTableCount').textContent = `Mostrando ${data.total} registro(s)`;
}
['allQ', 'allDept', 'allMes', 'allNombre'].forEach(id => $(id).addEventListener('input', () => loadRecords().catch(console.error)));
$('allClear').addEventListener('click', () => {
    ['allQ', 'allDept', 'allMes', 'allNombre'].forEach(id => $(id).value = '');
    loadRecords().catch(console.error)
});
loadRecords().catch(console.error);