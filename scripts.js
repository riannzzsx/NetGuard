javascript
// ==========================================
// CONFIGURAÇÃO DA API
// ==========================================

const API_URL = "http://localhost:3000";

let latencyChart = null;


// ==========================================
// CARREGAR DADOS DO JSON SERVER
// ==========================================

async function carregarDashboard() {

    try {

        // ------------------------------------------
        // REQUESTS HTTP - GET
        // ------------------------------------------

        const respostaHosts = await fetch(`${API_URL}/hosts`);
        const respostaPings = await fetch(`${API_URL}/pings`);
        const respostaIcmps = await fetch(`${API_URL}/icmps`);


        // Verifica se ocorreu algum erro HTTP

        if (
            !respostaHosts.ok ||
            !respostaPings.ok ||
            !respostaIcmps.ok
        ) {
            throw new Error("Erro ao buscar dados da API");
        }


        // ------------------------------------------
        // CONVERTER AS RESPOSTAS PARA JSON
        // ------------------------------------------

        const hosts = await respostaHosts.json();
        const pings = await respostaPings.json();
        const icmps = await respostaIcmps.json();


        console.log("HOSTS:", hosts);
        console.log("PINGS:", pings);
        console.log("ICMPS:", icmps);


        // ------------------------------------------
        // RELACIONAR HOSTS, PINGS E ICMPS
        // ------------------------------------------

        const dispositivos = hosts.map(host => {

            // Procura o ping pertencente ao host

            const ping = pings.find(
                p => Number(p.hostId) === Number(host.id)
            );


            // Procura os ICMPs pertencentes ao ping

            const respostas = ping
                ? icmps.filter(
                    icmp =>
                        Number(icmp.pingId) === Number(ping.id)
                )
                : [];


            // Pega somente tempos válidos.
            // time = null significa que não houve resposta.

            const temposValidos = respostas
                .map(resposta => resposta.time)
                .filter(tempo => tempo !== null);


            // Se tiver pelo menos uma resposta,
            // consideramos o dispositivo online.

            const online = temposValidos.length > 0;


            // --------------------------------------
            // CALCULAR LATÊNCIA MÉDIA DO HOST
            // --------------------------------------

            let latencia = null;

            if (online) {

                const soma = temposValidos.reduce(
                    (total, tempo) => total + tempo,
                    0
                );

                latencia = Math.round(
                    soma / temposValidos.length
                );
            }


            // Retorna um objeto contendo todas
            // as informações do dispositivo.

            return {
                ...host,
                ping,
                respostas,
                online,
                latencia
            };

        });


        console.log(
            "DISPOSITIVOS PROCESSADOS:",
            dispositivos
        );


        // ------------------------------------------
        // ATUALIZAR DASHBOARD
        // ------------------------------------------

        atualizarMetricas(dispositivos);

        atualizarTabela(dispositivos);


        // ------------------------------------------
        // GRÁFICO DO DNS GOOGLE
        // ------------------------------------------

        const dnsGoogle = dispositivos.find(
            dispositivo =>
                dispositivo.address === "8.8.8.8"
        );


        if (dnsGoogle) {

            atualizarGrafico(
                dnsGoogle.respostas
            );

        }


        // Esconde mensagem de erro caso a API
        // esteja funcionando normalmente.

        const errorMessage =
            document.getElementById("errorMessage");

        if (errorMessage) {
            errorMessage.style.display = "none";
        }


    } catch (erro) {

        console.error(
            "Erro ao carregar Dashboard:",
            erro
        );


        const errorMessage =
            document.getElementById("errorMessage");


        if (errorMessage) {

            errorMessage.style.display = "block";

        }

    }

}


// ==========================================
// ATUALIZAR MÉTRICAS
// ==========================================

function atualizarMetricas(dispositivos) {

    // Quantidade total

    const total = dispositivos.length;


    // Quantidade online

    const online = dispositivos.filter(
        dispositivo => dispositivo.online
    ).length;


    // Quantidade offline

    const offline = total - online;


    // ------------------------------------------
    // CALCULAR LATÊNCIA MÉDIA GERAL
    // ------------------------------------------

    const latencias = dispositivos
        .filter(dispositivo => dispositivo.online)
        .map(dispositivo => dispositivo.latencia);


    let media = 0;


    if (latencias.length > 0) {

        const soma = latencias.reduce(
            (total, valor) => total + valor,
            0
        );


        media = Math.round(
            soma / latencias.length
        );

    }


    // ------------------------------------------
    // MOSTRAR VALORES NO HTML
    // ------------------------------------------

    document
        .getElementById("totalDevices")
        .textContent = total;


    document
        .getElementById("onlineDevices")
        .textContent = online;


    document
        .getElementById("offlineDevices")
        .textContent = offline;


    document
        .getElementById("averageLatency")
        .textContent = `${media} ms`;

}


// ==========================================
// CRIAR TABELA DE DISPOSITIVOS
// ==========================================

function atualizarTabela(dispositivos) {

    const tabela =
        document.getElementById("devicesTable");


    // Limpa a tabela antes de recriar as linhas

    tabela.innerHTML = "";


    dispositivos.forEach(dispositivo => {


        // Cria uma nova linha

        const linha =
            document.createElement("tr");


        // --------------------------------------
        // STATUS
        // --------------------------------------

        const statusClasse =
            dispositivo.online
                ? "status-online"
                : "status-offline";


        const statusTexto =
            dispositivo.online
                ? "Online"
                : "Offline";


        // --------------------------------------
        // LATÊNCIA
        // --------------------------------------

        const latencia =
            dispositivo.online
                ? `${dispositivo.latencia} ms`
                : "--";


        // --------------------------------------
        // ÚLTIMA CHECAGEM
        // --------------------------------------

        let ultimaChecagem = "--";


        if (dispositivo.ping) {

            const data =
                new Date(
                    dispositivo.ping.createdAt
                );


            ultimaChecagem =
                data.toLocaleString(
                    "pt-BR"
                );

        }


        // --------------------------------------
        // HTML DA LINHA
        // --------------------------------------

        linha.innerHTML = `

            <td>
                <span
                    class="status-dot ${statusClasse}">
                </span>

                ${statusTexto}
            </td>


            <td>
                ${dispositivo.name}
            </td>


            <td>
                <span class="tag">
                    ${dispositivo.address}
                </span>
            </td>


            <td>
                ${latencia}
            </td>


            <td>
                ${ultimaChecagem}
            </td>

        `;


        // Adiciona a linha na tabela

        tabela.appendChild(linha);

    });

}


// ==========================================
// CRIAR GRÁFICO
// ==========================================

function atualizarGrafico(respostas) {

    // ------------------------------------------
    // LABELS DO GRÁFICO
    // ------------------------------------------

    const labels = respostas.map(
        resposta =>
            `Seq ${resposta.seq}`
    );


    // ------------------------------------------
    // VALORES DE LATÊNCIA
    // ------------------------------------------

    const valores = respostas.map(
        resposta =>
            resposta.time
    );


    // Canvas onde o gráfico será criado

    const ctx =
        document
            .getElementById("latencyChart")
            .getContext("2d");


    // Se já existir um gráfico,
    // destrói antes de criar outro.

    if (latencyChart) {

        latencyChart.destroy();

    }


    // ------------------------------------------
    // CHART.JS
    // ------------------------------------------

    latencyChart = new Chart(
        ctx,
        {

            type: "line",


            data: {

                labels: labels,


                datasets: [

                    {

                        label: "Latência (ms)",

                        data: valores,

                        borderColor: "#3b82f6",

                        backgroundColor:
                            "rgba(59, 130, 246, 0.1)",

                        fill: true,

                        tension: 0.3

                    }

                ]

            },


            options: {

                responsive: true,


                scales: {

                    y: {

                        beginAtZero: true,

                        grid: {

                            color: "#334155"

                        },

                        ticks: {

                            color: "#94a3b8"

                        }

                    },


                    x: {

                        grid: {

                            color: "#334155"

                        },

                        ticks: {

                            color: "#94a3b8"

                        }

                    }

                },


                plugins: {

                    legend: {

                        display: false

                    }

                }

            }

        }
    );

}


// ==========================================
// INICIAR DASHBOARD
// ==========================================

// Quando a página terminar de carregar,
// executa a função carregarDashboard().

document.addEventListener(
    "DOMContentLoaded",
    carregarDashboard
);
