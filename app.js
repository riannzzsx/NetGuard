app.js




const API_URL = 'http://localhost:3000';
let latencyChart = null;

// Configuração Inicial do Gráfico
function initChart() {
    const ctx = document.getElementById('latencyChart').getContext('2d');
    latencyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Latência (ms)',
                data: [],
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// Método GET - Consome os recursos da API
async function fetchDashboardData() {
    try {
        const [hostsRes, pingsRes, icmpsRes] = await Promise.all([
            fetch(${API_URL}/hosts),
            fetch(${API_URL}/pings),
            fetch(${API_URL}/icmps)
        ]);

        const hosts = await hostsRes.json();
        const pings = await pingsRes.json();
        const icmps = await icmpsRes.json();

        renderDashboard(hosts, pings, icmps);
    } catch (err) {
        console.error("Erro ao conectar à API REST:", err);
    }
}

// Manipulação e Renderização dos Dados no DOM
function renderDashboard(hosts, pings, icmps) {
    let onlineCount = 0;
    let offlineCount = 0;
    let totalLatency = 0;
    let validLatencyCount = 0;

    const tbody = document.getElementById('hostsTableBody');
    tbody.innerHTML = '';

    hosts.forEach(host => {
        // Relacionamento Host -> Pings -> ICMPs
        const hostPings = pings.filter(p => p.hostId === host.id);
        const lastPing = hostPings[hostPings.length - 1];

        let isOnline = false;
        let lastLatency = null;

        if (lastPing) {
            const pingIcmps = icmps.filter(i => i.pingId === lastPing.id);
            const lastIcmp = pingIcmps[pingIcmps.length - 1];

            if (lastIcmp && lastIcmp.time !== null) {
                isOnline = true;
                lastLatency = lastIcmp.time;
                totalLatency += lastLatency;
                validLatencyCount++;
            }
        }

        if (isOnline) onlineCount++; else offlineCount++;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <span class="badge ${isOnline ? 'badge-online' : 'badge-offline'}">
                    ${isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
            </td>
            <td>${host.name}</td>
            <td><span class="ip-code">${host.address}</span></td>
            <td>${lastLatency !== null ? lastLatency + ' ms' : '--'}</td>
            <td>
                <button class="btn-danger" onclick="deleteHost(${host.id})">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Atualização de Métricas Físicas
    document.getElementById('totalHosts').innerText = hosts.length;
    document.getElementById('onlineHosts').innerText = onlineCount;
    document.getElementById('offlineHosts').innerText = offlineCount;
    document.getElementById('avgLatency').innerText = validLatencyCount > 0 
        ? Math.round(totalLatency / validLatencyCount) + ' ms' 
        : '-- ms';

    // Atualização dos dados do Gráfico
    const validIcmps = icmps.filter(i => i.time !== null).slice(-10);
    latencyChart.data.labels = validIcmps.map(i => Seq ${i.seq});
    latencyChart.data.datasets[0].data = validIcmps.map(i => i.time);
    latencyChart.update();
}

// Método POST - Formulário para Criar Ativo
document.getElementById('hostForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('hostName').value;
    const address = document.getElementById('hostAddress').value;

    await fetch(${API_URL}/hosts, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address })
    });

    closeModal();
    document.getElementById('hostForm').reset();
    fetchDashboardData();
});

// Método DELETE - Exclusão de Ativo
async function deleteHost(id) {
    if (confirm("Deseja remover este host do monitoramento?")) {
        await fetch(${API_URL}/hosts/${id}, { method: 'DELETE' });
        fetchDashboardData();
    }
}

// Funções do Modal
function openModal() { document.getElementById('hostModal').style.display = 'flex'; }
function closeModal() { document.getElementById('hostModal').style.display = 'none'; }

// Inicialização da Aplicação
window.onload = () => {
    initChart();
    fetchDashboardData();
    setInterval(fetchDashboardData, 5000); // Polling a cada 5 segundos
};