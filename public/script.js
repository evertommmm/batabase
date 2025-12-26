// ============================================
// CONFIGURAÇÃO
// ============================================

const API_URL = 'http://localhost:3000';
let senhaAdmin = '';
let acoesConfirmacao = {};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    inicializarEventos();
    carregarDashboard();
    verificarSenhaAdmin();
});

// ============================================
// EVENTOS
// ============================================

function inicializarEventos() {
    // Menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            goToPage(page);
        });
    });
}

// ============================================
// NAVEGAÇÃO
// ============================================

function goToPage(page) {
    // Remover classe active de todos os pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });

    // Remover classe active de todos os menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });

    // Adicionar classe active ao page e menu item selecionados
    const pageElement = document.getElementById(`${page}-page`);
    if (pageElement) {
        pageElement.classList.add('active');
    }

    const menuItem = document.querySelector(`[data-page="${page}"]`);
    if (menuItem) {
        menuItem.classList.add('active');
    }

    // Atualizar título
    const titles = {
        'dashboard': 'Dashboard',
        'chaves': 'Gerenciar Chaves',
        'criar': 'Criar Nova Chave',
        'registros': 'Registros de Atividade',
        'configuracoes': 'Configurações'
    };

    document.getElementById('page-title').textContent = titles[page] || 'Dashboard';

    // Carregar dados específicos da página
    if (page === 'chaves') {
        atualizarChaves();
    } else if (page === 'registros') {
        atualizarRegistros();
    }
}

// ============================================
// DASHBOARD
// ============================================

function carregarDashboard() {
    atualizarEstatisticas();
    atualizarGraficos();
}

async function atualizarEstatisticas() {
    try {
        const response = await fetch(`${API_URL}/api/chaves/listar?senha_admin=${senhaAdmin}`);
        const data = await response.json();

        if (data.sucesso) {
            const chaves = data.chaves;
            const ativas = chaves.filter(c => c.status === 'ativa').length;
            const inativas = chaves.filter(c => c.status === 'inativa').length;
            const banidas = chaves.filter(c => c.status === 'banida').length;

            document.getElementById('total-chaves').textContent = chaves.length;
            document.getElementById('chaves-ativas').textContent = ativas;
            document.getElementById('chaves-inativas').textContent = inativas;
            document.getElementById('chaves-banidas').textContent = banidas;
        }
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

function atualizarGraficos() {
    // Gráfico de Status
    const ctxStatus = document.getElementById('chart-status');
    if (ctxStatus) {
        new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: ['Ativas', 'Inativas', 'Banidas'],
                datasets: [{
                    data: [
                        parseInt(document.getElementById('chaves-ativas').textContent),
                        parseInt(document.getElementById('chaves-inativas').textContent),
                        parseInt(document.getElementById('chaves-banidas').textContent)
                    ],
                    backgroundColor: [
                        '#4CAF50',
                        '#FFC107',
                        '#F44336'
                    ],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Gráfico de Autenticações
    const ctxAuth = document.getElementById('chart-auth');
    if (ctxAuth) {
        new Chart(ctxAuth, {
            type: 'line',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'],
                datasets: [{
                    label: 'Autenticações',
                    data: [12, 19, 8, 15, 22, 18, 10],
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// ============================================
// CHAVES
// ============================================

async function atualizarChaves() {
    try {
        const response = await fetch(`${API_URL}/api/chaves/listar?senha_admin=${senhaAdmin}`);
        const data = await response.json();

        if (data.sucesso) {
            const tbody = document.getElementById('chaves-table-body');
            tbody.innerHTML = '';

            data.chaves.forEach(chave => {
                const row = document.createElement('tr');
                const statusClass = `status-${chave.status}`;
                const statusText = chave.status.charAt(0).toUpperCase() + chave.status.slice(1);

                row.innerHTML = `
                    <td><code>${chave.chave.substring(0, 8)}...</code></td>
                    <td>${chave.id_usuario || '-'}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${chave.usos}${chave.max_usos !== -1 ? `/${chave.max_usos}` : ''}</td>
                    <td>${new Date(chave.criada_em).toLocaleDateString('pt-BR')}</td>
                    <td>
                        <button class="btn btn-secondary" onclick="editarChave('${chave.chave}')">✏️</button>
                        <button class="btn btn-danger" onclick="deletarChave('${chave.chave}')">🗑️</button>
                    </td>
                `;

                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar chaves:', error);
        mostrarToast('Erro ao carregar chaves', 'erro');
    }
}

async function criarChave(event) {
    event.preventDefault();

    const idUsuario = document.getElementById('form-id-usuario').value;
    const maxUsos = document.getElementById('form-max-usos').value || -1;
    const expiraDias = document.getElementById('form-expira-dias').value;
    const descricao = document.getElementById('form-descricao').value;
    const senhaAdminForm = document.getElementById('form-senha-admin').value;

    try {
        const response = await fetch(`${API_URL}/api/chaves/criar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                senha_admin: senhaAdminForm,
                id_usuario: idUsuario || null,
                max_usos: parseInt(maxUsos),
                expira_em_dias: expiraDias ? parseInt(expiraDias) : null,
                descricao: descricao
            })
        });

        const data = await response.json();

        if (data.sucesso) {
            mostrarToast('Chave criada com sucesso!', 'sucesso');
            document.querySelector('form').reset();
            setTimeout(() => {
                goToPage('chaves');
                atualizarChaves();
            }, 1000);
        } else {
            mostrarToast(data.mensagem, 'erro');
        }
    } catch (error) {
        console.error('Erro ao criar chave:', error);
        mostrarToast('Erro ao criar chave', 'erro');
    }
}

function deletarChave(chave) {
    acoesConfirmacao = {
        tipo: 'deletar',
        chave: chave
    };

    document.getElementById('modal-mensagem').textContent = 
        `Tem certeza que deseja deletar a chave ${chave.substring(0, 8)}...?`;
    
    abrirModal();
}

async function confirmarAcao() {
    if (acoesConfirmacao.tipo === 'deletar') {
        try {
            const response = await fetch(`${API_URL}/api/chaves/deletar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    senha_admin: senhaAdmin,
                    chave: acoesConfirmacao.chave
                })
            });

            const data = await response.json();

            if (data.sucesso) {
                mostrarToast('Chave deletada com sucesso!', 'sucesso');
                fecharModal();
                atualizarChaves();
            } else {
                mostrarToast(data.mensagem, 'erro');
            }
        } catch (error) {
            console.error('Erro ao deletar chave:', error);
            mostrarToast('Erro ao deletar chave', 'erro');
        }
    }
}

function editarChave(chave) {
    mostrarToast('Funcionalidade em desenvolvimento', 'sucesso');
}

// ============================================
// REGISTROS
// ============================================

async function atualizarRegistros() {
    try {
        const response = await fetch(`${API_URL}/api/registros?senha_admin=${senhaAdmin}&limite=50`);
        const data = await response.json();

        if (data.sucesso) {
            const tbody = document.getElementById('registros-table-body');
            tbody.innerHTML = '';

            data.registros.forEach(registro => {
                const row = document.createElement('tr');
                const statusClass = registro.status === 'sucesso' ? 'status-ativa' : 'status-inativa';
                const statusText = registro.status.charAt(0).toUpperCase() + registro.status.slice(1);

                row.innerHTML = `
                    <td>${registro.acao}</td>
                    <td><code>${registro.chave ? registro.chave.substring(0, 8) + '...' : '-'}</code></td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${registro.endereco_ip}</td>
                    <td>${new Date(registro.criada_em).toLocaleString('pt-BR')}</td>
                `;

                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar registros:', error);
        mostrarToast('Erro ao carregar registros', 'erro');
    }
}

// ============================================
// CONFIGURAÇÕES
// ============================================

function alterarSenha() {
    const novaSenha = document.getElementById('nova-senha').value;

    if (!novaSenha) {
        mostrarToast('Digite uma nova senha', 'erro');
        return;
    }

    senhaAdmin = novaSenha;
    localStorage.setItem('senhaAdmin', novaSenha);
    mostrarToast('Senha alterada com sucesso!', 'sucesso');
    document.getElementById('nova-senha').value = '';
}

function copiarUrl() {
    const url = document.getElementById('api-url').value;
    navigator.clipboard.writeText(url);
    mostrarToast('URL copiada para a área de transferência!', 'sucesso');
}

// ============================================
// MODAL
// ============================================

function abrirModal() {
    document.getElementById('modal-confirmacao').classList.add('active');
}

function fecharModal() {
    document.getElementById('modal-confirmacao').classList.remove('active');
}

// ============================================
// TOAST
// ============================================

function mostrarToast(mensagem, tipo = 'sucesso') {
    const toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.className = `toast show ${tipo}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// AUTENTICAÇÃO
// ============================================

function verificarSenhaAdmin() {
    const senhaArmazenada = localStorage.getItem('senhaAdmin');
    if (senhaArmazenada) {
        senhaAdmin = senhaArmazenada;
    } else {
        // Solicitar senha
        const senha = prompt('Digite a senha de admin:');
        if (senha) {
            senhaAdmin = senha;
            localStorage.setItem('senhaAdmin', senha);
        }
    }
}

function logout() {
    localStorage.removeItem('senhaAdmin');
    senhaAdmin = '';
    window.location.reload();
}

// ============================================
// BUSCA
// ============================================

document.getElementById('search-input')?.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const linhas = document.querySelectorAll('tbody tr');

    linhas.forEach(linha => {
        const texto = linha.textContent.toLowerCase();
        linha.style.display = texto.includes(termo) ? '' : 'none';
    });
});
