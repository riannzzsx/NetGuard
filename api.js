const API_URL = 'http://localhost:3000';

async function request(url, options = {}) {
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(
                `Erro HTTP ${response.status}: ${response.statusText}`
            );
        }

        if (response.status === 204) {
            return null;
        }

        const contentType = response.headers.get('content-type');

        if (
            contentType &&
            contentType.includes('application/json')
        ) {
            return await response.json();
        }

        return null;

    } catch (error) {
        console.error(
            'Erro na comunicação com a API:',
            error
        );

        throw error;
    }
}


// GET - Buscar hosts

export function getHosts() {
    return request(`${API_URL}/hosts`);
}


// GET - Buscar pings

export function getPings() {
    return request(`${API_URL}/pings`);
}


// GET - Buscar ICMPs

export function getIcmps() {
    return request(`${API_URL}/icmps`);
}


// Buscar todos os dados do dashboard

export async function getDashboardData() {

    const [hosts, pings, icmps] =
        await Promise.all([
            getHosts(),
            getPings(),
            getIcmps()
        ]);

    return {
        hosts,
        pings,
        icmps
    };
}


// POST - Cadastrar novo host

export function createHost(host) {

    return request(
        `${API_URL}/hosts`,
        {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(host)
        }
    );
}


// PATCH - Atualizar host

export function updateHost(id, data) {

    return request(
        `${API_URL}/hosts/${id}`,
        {
            method: 'PATCH',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(data)
        }
    );
}


// DELETE - Excluir host

export function deleteHost(id) {

    return request(
        `${API_URL}/hosts/${id}`,
        {
            method: 'DELETE'
        }
    );
}