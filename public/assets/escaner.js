let stream = null,
    scanFields = {};
$('documentFile').addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return showNotice($('scanNotice'), 'Selecciona un archivo de imagen.', 'error');
    $('preview').src = URL.createObjectURL(f);
    $('preview').style.display = 'block';
    showNotice($('scanNotice'), 'Imagen cargada. Para extraer texto automáticamente se necesita integrar un motor OCR.', 'ok')
});
$('startCamera').addEventListener('click', async() => {
    try {
        if (!navigator.mediaDevices ? .getUserMedia) throw new Error('La cámara no está disponible. Abre el sitio en localhost o mediante HTTPS.');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        $('camera').srcObject = stream;
        $('camera').style.display = 'block';
        $('takePhoto').style.display = 'inline-block';
        $('stopCamera').style.display = 'inline-block';
        $('startCamera').style.display = 'none'
    } catch (e) { showNotice($('scanNotice'), e.message, 'error') }
});

function stopCamera() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
    $('camera').srcObject = null;
    $('camera').style.display = 'none';
    $('takePhoto').style.display = 'none';
    $('stopCamera').style.display = 'none';
    $('startCamera').style.display = 'inline-block'
}
$('stopCamera').addEventListener('click', stopCamera);
$('takePhoto').addEventListener('click', () => {
    const v = $('camera'),
        c = $('canvas');
    if (!v.videoWidth) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    $('preview').src = c.toDataURL('image/png');
    $('preview').style.display = 'block';
    showNotice($('scanNotice'), 'Foto capturada. Pega el texto reconocido por un OCR para intentar detectar los campos.', 'ok');
    stopCamera()
});
$('parseText').addEventListener('click', () => {
    const text = $('scanText').value.trim();
    if (!text) return showNotice($('scanNotice'), 'Pega primero el texto reconocido por un OCR.', 'error');
    const ced = (text.match(/\b\d{3}-\d{6}-\d{4}[A-Za-z]\b/) || text.match(/\b\d{13}[A-Za-z]\b/) || [])[0] || '';
    const lines = text.split(/\n+/).map(x => x.trim()).filter(Boolean);
    const deps = ['Boaco', 'Carazo', 'Chinandega', 'Chontales', 'Estelí', 'Granada', 'Jinotega', 'León', 'Madriz', 'Managua', 'Masaya', 'Matagalpa', 'Nueva Segovia', 'Río San Juan', 'Rivas'];
    const dep = deps.find(d => text.toLowerCase().includes(d.toLowerCase())) || '';
    const candidate = lines.find(l => l !== ced && !deps.some(d => l.toLowerCase() === d.toLowerCase()) && /[a-záéíóúñ]{2,}/i.test(l)) || '';
    const parts = candidate.split(/\s+/);
    scanFields = { cedula: ced, nombres: parts.length > 1 ? parts.slice(0, Math.ceil(parts.length / 2)).join(' ') : candidate, apellidos: parts.length > 1 ? parts.slice(Math.ceil(parts.length / 2)).join(' ') : '', departamento: dep };
    showNotice($('scanNotice'), `Detección aproximada: cédula ${ced || 'no identificada'}, departamento ${dep || 'no identificado'}. Revisa los datos antes de usarlos.`, 'ok')
});
$('goForm').addEventListener('click', () => {
    localStorage.setItem('scanFields', JSON.stringify(scanFields));
    location.href = 'nueva-venta.html'
});