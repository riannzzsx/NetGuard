import {
    getDashboardData,
    createHost,
    deleteHost
} from './api.js';

let latencyChart = null;


// ============================================
// GRÁFICO
// ============================================

function initChart() {
    const canvas = document.getElementById('latencyChart');

    if (!canvas) {
        console.error('Canvas latencyChart não encontrado.');
        return;
    }

    const ctx = canvas.getContext('2d');

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
                y: {
                    beginAtZero: true
                }
            },

            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}


// ============================================
// BUSCAR DADOS DA API
// ============================================

async function carregarDashboard() {

    try {

        const dados = await getDashboardData();

        const hosts = dados.hosts;
        const pings = dados.pings;
        const icmps = dados.icmps;

        renderDashboard(hosts, pings, icmps);

    } catch (erro) {

        console.error(
            'Erro ao carregar os dados do NetGuard:',
            erro
        );

        const tbody = document.getElementById('hostsTableBody');

        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    Erro ao conectar com a API.
                </td>
            </tr>
        `;
    }
}


// ============================================
// MOSTRAR DADOS NA TELA
// ============================================

function renderDashboard(hosts, pings, icmps) {

    const tbody =
        document.getElementById('hostsTableBody');

    tbody.innerHTML = '';

    let onlineCount = 0;
    let offlineCount = 0;

    let totalLatency = 0;
    let validLatencyCount = 0;


    hosts.forEach((host) => {

        // Procura os pings pertencentes ao host
        const hostPings = pings.filter(
            (ping) => ping.hostId === host.id
        );

        const lastPing =
            hostPings[hostPings.length - 1];


        let isOnline = false;
        let lastLatency = null;


        if (lastPing) {

            // Procura os ICMPs daquele ping
            const pingIcmps = icmps.filter(
                (icmp) => icmp.pingId === lastPing.id
            );

            const lastIcmp =
                pingIcmps[pingIcmps.length - 1];


            if (
                lastIcmp &&
                lastIcmp.time !== null
            ) {

                isOnline = true;

                lastLatency = lastIcmp.time;

                totalLatency += lastLatency;

                validLatencyCount++;
            }
        }


        if (isOnline) {
            onlineCount++;
        } else {
            offlineCount++;
        }


        // Cria a linha da tabela
        const tr = document.createElement('tr');


        tr.innerHTML = `
            <td>

                <span class="
                    badge
                    ${isOnline
                        ? 'badge-online'
                        : 'badge-offline'}
                ">

                    ${isOnline
                        ? 'ONLINE'
                        : 'OFFLINE'}

                </span>

            </td>

            <td>
                ${host.name}
            </td>

            <td>
                <span class="ip-code">
                    ${host.address}
                </span>
            </td>

            <td>
                ${
                    lastLatency !== null
                        ? `${lastLatency} ms`
                        : '--'
                }
            </td>

            <td>
                <button
                    type="button"
                    class="btn-danger"
                    data-id="${host.id}"
                >
                    Excluir
                </button>
            </td>
        `;


        tbody.appendChild(tr);
    });


    // ========================================
    // ATUALIZA OS CARDS
    // ========================================

    document.getElementById(
        'totalHosts'
    ).textContent = hosts.length;


    document.getElementById(
        'onlineHosts'
    ).textContent = onlineCount;


    document.getElementById(
        'offlineHosts'
    ).textContent = offlineCount;


    document.getElementById(
        'avgLatency'
    ).textContent =

        validLatencyCount > 0

            ? `${Math.round(
                totalLatency /
                validLatencyCount
            )} ms`

            : '-- ms';


    // ========================================
    // ATUALIZA O GRÁFICO
    // ========================================

    atualizarGrafico(icmps);


    // ========================================
    // BOTÕES EXCLUIR
    // ========================================

    const botoesExcluir =
        document.querySelectorAll('.btn-danger');


    botoesExcluir.forEach((botao) => {

        botao.addEventListener(
            'click',
            async () => {

                const id = botao.dataset.id;

                const confirmar =
                    confirm(
                        'Deseja excluir este host?'
                    );


                if (!confirmar) {
                    return;
                }


                try {

                    await deleteHost(id);

                    await carregarDashboard();

                } catch (erro) {

                    console.error(
                        'Erro ao excluir host:',
                        erro
                    );
                }
            }
        );
    });
}


// ============================================
// ATUALIZAR GRÁFICO
// ============================================

function atualizarGrafico(icmps) {

    if (!latencyChart) {
        return;
    }


    const validIcmps = icmps
        .filter(
            (icmp) => icmp.time !== null
        )
        .slice(-10);


    latencyChart.data.labels =
        validIcmps.map(
            (icmp) => `Seq ${icmp.seq}`
        );


    latencyChart.data.datasets[0].data =
        validIcmps.map(
            (icmp) => icmp.time
        );


    latencyChart.update();
}


// ============================================
// MODAL
// ============================================

function abrirModal() {

    const modal =
        document.getElementById('hostModal');

    modal.style.display = 'flex';
}


function fecharModal() {

    const modal =
        document.getElementById('hostModal');

    modal.style.display = 'none';


    document
        .getElementById('hostForm')
        .reset();
}


// ============================================
// BOTÃO CADASTRAR HOST
// ============================================

document
    .getElementById('btnCadastrarHost')
    .addEventListener(
        'click',
        abrirModal
    );


// ============================================
// BOTÃO CANCELAR
// ============================================

document
    .getElementById('btnCancelar')
    .addEventListener(
        'click',
        fecharModal
    );


// ============================================
// CADASTRAR NOVO HOST
// ============================================

document
    .getElementById('hostForm')
    .addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();


            const name =
                document
                    .getElementById('hostName')
                    .value
                    .trim();


            const address =
                document
                    .getElementById('hostAddress')
                    .value
                    .trim();


            if (!name || !address) {

                alert(
                    'Preencha o nome e o endereço do host.'
                );

                return;
            }


            try {

                await createHost({
                    name: name,
                    address: address
                });


                fecharModal();


                await carregarDashboard();


            } catch (erro) {

                console.error(
                    'Erro ao cadastrar host:',
                    erro
                );


                alert(
                    'Não foi possível cadastrar o host.'
                );
            }
        }
    );


// ============================================
// INICIALIZAÇÃO
// ============================================

initChart();

carregarDashboard();


// Atualiza os dados a cada 5 segundos
setInterval(
    carregarDashboard,
    5000
);