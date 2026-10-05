/*
====================================================
IMPORTAÇÃO DOS MÓDULOS
====================================================
*/

import {
    getDashboardData,
    createHost,
    updateHost,
    deleteHost
} from "./api.js";


import {
    initChart,
    renderDashboard,
    prepararCadastro,
    prepararEdicao,
    closeModal,
    mostrarErro
} from "./ui.js";


/*
====================================================
CARREGAMENTO DO DASHBOARD
====================================================
*/

async function carregarDashboard() {

    try {

        const {
            hosts,
            pings,
            icmps
        } = await getDashboardData();


        renderDashboard(
            hosts,
            pings,
            icmps,
            {
                onEdit: editarHost,
                onDelete: excluirHost
            }
        );


    } catch (error) {

        console.error(
            "Erro ao carregar dashboard:",
            error
        );


        mostrarErro(
            "Não foi possível carregar os dados. Verifique se o JSON Server está funcionando."
        );
    }
}


/*
====================================================
EVENTO - CADASTRAR HOST
====================================================
*/

const btnCadastrar =
    document.getElementById(
        "btnCadastrarHost"
    );


if (btnCadastrar) {

    btnCadastrar.addEventListener(
        "click",
        () => {

            prepararCadastro();

        }
    );
}


/*
====================================================
EVENTO - CANCELAR MODAL
====================================================
*/

const btnCancelar =
    document.getElementById(
        "btnCancelar"
    );


if (btnCancelar) {

    btnCancelar.addEventListener(
        "click",
        () => {

            closeModal();

        }
    );
}


/*
====================================================
EVENTO - SUBMIT DO FORMULÁRIO
POST OU PATCH
====================================================
*/

const hostForm =
    document.getElementById(
        "hostForm"
    );


hostForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const name =
            document
                .getElementById(
                    "hostName"
                )
                .value
                .trim();


        const address =
            document
                .getElementById(
                    "hostAddress"
                )
                .value
                .trim();


        if (
            name === "" ||
            address === ""
        ) {

            mostrarErro(
                "Preencha todos os campos."
            );

            return;
        }


        const editId =
            hostForm.dataset.editId;


        try {

            /*
            Se existe editId,
            fazemos PATCH.
            */

            if (editId) {

                await updateHost(
                    editId,
                    {
                        name,
                        address
                    }
                );

            } else {

                /*
                Caso contrário,
                fazemos POST.
                */

                await createHost({
                    name,
                    address
                });
            }


            hostForm.reset();

            hostForm.dataset.editId = "";

            closeModal();

            await carregarDashboard();


        } catch (error) {

            console.error(
                "Erro ao salvar host:",
                error
            );


            mostrarErro(
                "Não foi possível salvar o host."
            );
        }
    }
);


/*
====================================================
EDIÇÃO
====================================================
*/

function editarHost(host) {

    prepararEdicao(host);

}


/*
====================================================
EXCLUSÃO
====================================================
*/

async function excluirHost(id) {

    const confirmar =
        confirm(
            "Deseja remover este host do monitoramento?"
        );


    if (!confirmar) {
        return;
    }


    try {

        await deleteHost(id);

        await carregarDashboard();


    } catch (error) {

        console.error(
            "Erro ao excluir host:",
            error
        );


        mostrarErro(
            "Não foi possível excluir o host."
        );
    }
}


/*
====================================================
INICIALIZAÇÃO
====================================================
*/

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initChart();

        carregarDashboard();


        /*
        Atualização automática
        a cada 5 segundos.
        */

        setInterval(
            carregarDashboard,
            5000
        );
    }
);
