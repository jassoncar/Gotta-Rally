const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
$('fecha').value = todayStr;

function calcPreview() {
    const date = $('fecha').value,
        lt = Number($('ventaLt').value) || 0,
        gln = Number($('ventaGln').value) || 0,
        cl = Number($('costoLt').value) || 0,
        cg = Number($('costoGln').value) || 0,
        total = lt > 0 ? lt * cl : gln * cg;
    $('mesPreview').value = date ? date.slice(0, 7) : '';
    $('costoPreview').value = money(total);
    $('puntosPreview').value = `${Math.floor(total*1)} puntos`;
}
['fecha', 'ventaLt', 'ventaGln', 'costoLt', 'costoGln'].forEach(id => $(id).addEventListener('input', calcPreview));
$('ventaLt').addEventListener('input', () => {
    if (Number($('ventaLt').value) > 0) $('ventaGln').value = 0;
    calcPreview()
});
$('ventaGln').addEventListener('input', () => {
    if (Number($('ventaGln').value) > 0) $('ventaLt').value = 0;
    calcPreview()
});
calcPreview();
$('resetForm').addEventListener('click', () => setTimeout(() => {
    $('fecha').value = todayStr;
    $('ventaLt').value = 0;
    $('ventaGln').value = 0;
    $('costoLt').value = 10;
    $('costoGln').value = 37.85;
    calcPreview();
    hideNotice($('formNotice'));
}, 0));
$('saleForm').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('saveBtn');
    btn.disabled = true;
    btn.textContent = 'Guardando...';
    hideNotice($('formNotice'));
    const body = Object.fromEntries(new FormData(e.target).entries());
    try {
        const r = await api('/api/registros', { method: 'POST', body: JSON.stringify(body) });
        showNotice($('formNotice'), `${r.mensaje} Se generaron ${r.registro.puntos} puntos.`);
        e.target.reset();
        $('fecha').value = todayStr;
        $('ventaLt').value = 0;
        $('ventaGln').value = 0;
        $('costoLt').value = 10;
        $('costoGln').value = 37.85;
        calcPreview();
    } catch (err) { showNotice($('formNotice'), err.message, 'error') } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar Compra';
    }
});
try {
    const detected = JSON.parse(localStorage.getItem('scanFields') || '{}');
    Object.entries(detected).forEach(([k, v]) => { if (v && $(k)) $(k).value = v });
    localStorage.removeItem('scanFields')
} catch {}
calcPreview();