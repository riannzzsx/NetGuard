let latencyChart = null;


/*
====================================================
GRÁFICO
Inicializa o Chart.js.
====================================================
*/

export function initChart() {
    const canvas = document.getElementById("latencyChart");

    if (!canvas) {
        console.error("Canvas do gráfico não encontrado.");
        return;
    }

    const ctx = canvas.getContext("2d");

    latencyChart = new Chart(ctx, {
        type: "line",

        data: {
            labels: [],

            datasets: [
                {
                    label: "Latência (ms)",
                    data: [],
                    borderColor: "#06b6d4",
                    backgroundColor: "rgba(6, 182, 212, 0.1)",
                    fill: true,
                    tension: 0.3
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            scales: {
                y: {
                    beginAtZero: true,

                    grid: {
                        color: "rgba(255,255,255,0.05)"
                    }
                },

                x: {
                    grid: {
                        display: false
                    }
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


/*
====================================================
STATUS DO HOST
Descobre se o host está online e sua última latência.
====================================================
*/

function obterStatusHost(host, pings, icmps) {

    const hostPings = pings.filter(
        ping => ping.hostId === host.id
    );

    const lastPing =
        hostPings.length > 0
            ? hostPings[hostPings.length - 1]
            : null;

    if (!lastPing) {
        return {
            online: false,
            latency: null
        };
    }

    const pingIcmps = icmps.filter(
        icmp => icmp.pingId === lastPing.id
    );

    const lastIcmp =
        pingIcmps.length > 0
            ? pingIcmps[pingIcmps.length - 1]
            : null;

    if (lastIcmp && lastIcmp.time !== null) {
        return {
            online: true,
            latency: lastIcmp.time
        };
    }

    return {
        online: false,
        latency: null
    };
}


/*
====================================================
CRIAÇÃO MANUAL DE ELEMENTOS
====================================================
*/

function criarCelula(texto) {
    const td = document.createElement("td");

    td.textContent = texto;

    return td;
}


function criarCelulaStatus(isOnline) {

    const td = document.createElement("td");

    const badge = document.createElement("span");

    badge.classList.add("badge");

    if (isOnline) {
        badge.classList.add("badge-online");
        badge.textContent = "ONLINE";
    } else {
        badge.classList.add("badge-offline");
        badge.textContent = "OFFLINE";
    }

    td.appendChild(badge);

    return td;
}


function criarCelulaIp(ip) {

    const td = document.createElement("td");

    const span = document.createElement("span");

    span.classList.add("ip-code");

    span.textContent = ip;

    td.appendChild(span);

    return td;
}


/*
====================================================
BOTÕES DINÂMICOS
====================================================
*/

function criarCelulaAcoes(host, handlers) {

    const td = document.createElement("td");

    /*
    Botão Editar
    */

    const btnEditar = document.createElement("button");

    btnEditar.type = "button";
    btnEditar.textContent = "Editar";
    btnEditar.classList.add("btn-edit");

    btnEditar.addEventListener("click", () => {
        handlers.onEdit(host);
    });


    /*
    Botão Excluir
    */

    const btnExcluir = document.createElement("button");

    btnExcluir.type = "button";
    btnExcluir.textContent = "Excluir";
    btnExcluir.classList.add("btn-danger");

    btnExcluir.addEventListener("click", () => {
        handlers.onDelete(host.id);
    });


    td.appendChild(btnEditar);
    td.appendChild(btnExcluir);

    return td;
}


/*
====================================================
RENDERIZAÇÃO DA TABELA
====================================================
*/

export function renderDashboard(
    hosts,
    pings,
    icmps,
    handlers
) {

    const tbody =
        document.getElementById("hostsTableBody");

    tbody.textContent = "";

    let onlineCount = 0;
    let offlineCount = 0;

    let totalLatency = 0;
    let validLatencyCount = 0;


    hosts.forEach(host => {

        const status =
            obterStatusHost(
                host,
                pings,
                icmps
            );


        if (status.online) {

            onlineCount++;

            if (status.latency !== null) {
                totalLatency += status.latency;
                validLatencyCount++;
            }

        } else {
            offlineCount++;
        }


        /*
        Criação manual da linha da tabela.
        */

        const tr = document.createElement("tr");


        const tdStatus =
            criarCelulaStatus(status.online);


        const tdNome =
            criarCelula(host.name);


        const tdIp =
            criarCelulaIp(host.address);


        const tdLatency =
            criarCelula(
                status.latency !== null
                    ? `${status.latency} ms`
                    : "--"
            );


        const tdAcoes =
            criarCelulaAcoes(
                host,
                handlers
            );


        tr.appendChild(tdStatus);

        tr.appendChild(tdNome);

        tr.appendChild(tdIp);

        tr.appendChild(tdLatency);

        tr.appendChild(tdAcoes);


        tbody.appendChild(tr);
    });


    /*
    Atualização dos cards.
    */

    document.getElementById(
        "totalHosts"
    ).textContent = hosts.length;


    document.getElementById(
        "onlineHosts"
    ).textContent = onlineCount;


    document.getElementById(
        "offlineHosts"
    ).textContent = offlineCount;


    const media =
        validLatencyCount > 0
            ? Math.round(
                totalLatency /
                validLatencyCount
            )
            : null;


    document.getElementById(
        "avgLatency"
    ).textContent =
        media !== null
            ? `${media} ms`
            : "-- ms";


    atualizarGrafico(icmps);
}


/*
====================================================
ATUALIZAÇÃO DO GRÁFICO
====================================================
*/

function atualizarGrafico(icmps) {

    if (!latencyChart) {
        return;
    }

    const validIcmps =
        icmps
            .filter(
                icmp =>
                    icmp.time !== null
            )
            .slice(-10);


    latencyChart.data.labels =
        validIcmps.map(
            icmp => `Seq ${icmp.seq}`
        );


    latencyChart.data.datasets[0].data =
        validIcmps.map(
            icmp => icmp.time
        );


    latencyChart.update();
}


/*
====================================================
MODAL
====================================================
*/

export function openModal() {

    const modal =
        document.getElementById(
            "hostModal"
        );

    modal.style.display = "flex";
}


export function closeModal() {

    const modal =
        document.getElementById(
            "hostModal"
        );

    modal.style.display = "none";
}


/*
====================================================
PREPARA FORMULÁRIO PARA CADASTRO
====================================================
*/

export function prepararCadastro() {

    const form =
        document.getElementById(
            "hostForm"
        );


    form.dataset.editId = "";


    document.getElementById(
        "hostName"
    ).value = "";


    document.getElementById(
        "hostAddress"
    ).value = "";


    const titulo =
        document.querySelector(
            ".modal-header"
        );

    titulo.textContent =
        "Novo Host de Rede";


    const btnSalvar =
        document.querySelector(
            "#hostForm button[type='submit']"
        );

    btnSalvar.textContent =
        "Salvar Host";


    openModal();
}


/*
====================================================
PREPARA FORMULÁRIO PARA EDIÇÃO
====================================================
*/

export function prepararEdicao(host) {

    const form =
        document.getElementById(
            "hostForm"
        );


    form.dataset.editId =
        host.id;


    document.getElementById(
        "hostName"
    ).value = host.name;


    document.getElementById(
        "hostAddress"
    ).value = host.address;


    const titulo =
        document.querySelector(
            ".modal-header"
        );

    titulo.textContent =
        "Editar Host";


    const btnSalvar =
        document.querySelector(
            "#hostForm button[type='submit']"
        );

    btnSalvar.textContent =
        "Salvar Alterações";


    openModal();
}


/*
====================================================
MENSAGEM DE ERRO
====================================================
*/

export function mostrarErro(mensagem) {

    alert(mensagem);
}