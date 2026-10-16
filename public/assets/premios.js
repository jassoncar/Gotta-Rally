let currentRewards = [];
async function loadPrizes() { currentRewards = await api('/api/premios');
    $('prizeCatalog').innerHTML = currentRewards.map(p => `<article class="prize"><div class="prize-icon">${p.icono}</div><h3>${esc(p.nombre)}</h3><p>${esc(p.descripcion)}</p><div class="prize-bottom"><strong>${fmt(p.puntos)} puntos</strong><button class="secondary redeem" data-prize="${esc(p.id)}">Canjear</button></div></article>`).join('');
    document.querySelectorAll('.redeem').forEach(b => b.addEventListener('click', () => redeem(b.dataset.prize))) }
async function checkBalance() { const cedula = $('rewardCedula').value.trim(); if (!cedula) return showNotice($('rewardNotice'), 'Escribe la cédula del cliente.', 'error'); try { const p = await api(`/api/clientes/${encodeURIComponent(cedula)}/puntos`);
        $('clientBalance').textContent = fmt(p.disponibles);
        $('balanceCaption').textContent = `${p.acumulados} acumulados · ${p.canjeados} canjeados · Cédula ${p.cedula}`;
        hideNotice($('rewardNotice')) } catch (e) { $('clientBalance').textContent = '—';
        $('balanceCaption').textContent = 'No se pudo consultar el saldo.';
        showNotice($('rewardNotice'), e.message, 'error') } }
$('checkBalance').addEventListener('click', checkBalance);
async function redeem(id) { const cedula = $('rewardCedula').value.trim(); if (!cedula) return showNotice($('rewardNotice'), 'Primero escribe la cédula y consulta el saldo.', 'error'); const p = currentRewards.find(x => x.id === id); if (!confirm(`¿Confirmas canjear "${p.nombre}" por ${p.puntos} puntos para ${cedula}?`)) return; try { const r = await api('/api/canjes', { method: 'POST', body: JSON.stringify({ cedula, premioId: id }) });
        showNotice($('rewardNotice'), `${r.mensaje} Saldo disponible: ${r.puntos.disponibles} puntos.`);
        await checkBalance() } catch (e) { showNotice($('rewardNotice'), e.message, 'error') } }
loadPrizes().catch(e => showNotice($('rewardNotice'), e.message, 'error'));