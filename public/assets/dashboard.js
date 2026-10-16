async function loadStats() {
    const s = await api('/api/estadisticas');
    $('statRegistros').textContent = fmt(s.totalRegistros);
    $('statRecaudado').textContent = money(s.totalRecaudado);
    $('statPuntos').textContent = fmt(s.puntosGenerados);
    $('statLitros').textContent = fmt(s.totalLitros);
    $('statGalones').textContent = `${fmt(s.totalGalones)} galones vendidos`;
}
async function loadDashboardRecords() {
    const p = new URLSearchParams();
    const q = $('dashQ').value.trim(),
        d = $('dashDept').value.trim(),
        m = $('dashMes').value,
        n = $('dashNombre').value.trim();
    if (q) p.set('q', q);
    if (d) p.set('departamento', d);
    if (m) p.set('mes', m);
    if (n) p.set('nombre', n);
    const data = await api('/api/registros?' + p);
    const body = $('recordsBody');
    if (!data.registros.length) body.innerHTML = '<tr><td colspan="7" class="empty">No hay registros que coincidan con los filtros.</td></tr>';
    else body.innerHTML = data.registros.map(r => `<tr><td class="name-cell">${esc(r.nombres)} ${esc(r.apellidos)}<span class="sub-cell">${esc(r.municipio||'')}</span></td><td>${esc(r.cedula)}</td><td>${esc(r.nombreSede)}<span class="sub-cell">${esc(r.departamento)}</span></td><td>${esc(r.fecha)}</td><td>${r.ventaLt>0?fmt(r.ventaLt)+' Lt':fmt(r.ventaGln)+' Gln'}</td><td class="money">${money(r.costoPagar)}</td><td class="points">+${fmt(r.puntos)}</td></tr>`).join('');
    $('tableCount').textContent = `Mostrando ${data.total} registro(s)`;
}
['dashQ', 'dashDept', 'dashMes', 'dashNombre'].forEach(id => $(id).addEventListener('input', () => loadDashboardRecords().catch(console.error)));
$('clearFilters').addEventListener('click', () => {
    ['dashQ', 'dashDept', 'dashMes', 'dashNombre'].forEach(id => $(id).value = '');
    loadDashboardRecords().catch(console.error)
});
Promise.all([loadStats(), loadDashboardRecords()]).catch(e => console.error(e));