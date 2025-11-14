document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:5000/api';
    const tbody = document.getElementById('tabela-agendamentos-corpo');
    const adminFeedback = document.getElementById('admin-feedback');

    async function carregarAgendamentos() {
        try {
            tbody.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';
            const response = await fetch(`${API_URL}/agendamentos`);
            if (!response.ok) throw new Error('Falha ao carregar dados');
            
            const agendamentos = await response.json();
            renderizarTabela(agendamentos);
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="5" style="color: red;">${error.message}</td></tr>`;
        }
    }

    function renderizarTabela(agendamentos) {
        tbody.innerHTML = '';
        if (agendamentos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">Nenhum agendamento encontrado.</td></tr>';
            return;
        }

        agendamentos.forEach(agendamento => {
            const tr = document.createElement('tr');
            
            const dataFormatada = new Date(agendamento.horario).toLocaleString('pt-BR');
            const statusClass = agendamento.status === 'concluido' ? 'status-concluido' : '';

            tr.innerHTML = `
                <td>${agendamento.cliente_nome}</td>
                <td>${agendamento.servico_nome}</td>
                <td>${dataFormatada}</td>
                <td class="${statusClass}">${agendamento.status}</td>
                <td>
                    <button class="action-btn concluir-btn" data-id="${agendamento.id}" ${agendamento.status === 'concluido' ? 'disabled' : ''}>Concluir</button>
                    <button class="action-btn cancelar-btn" data-id="${agendamento.id}">Cancelar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    async function handleAcao(id, method, body = null) {
        try {
            const options = {
                method,
                headers: body ? { 'Content-Type': 'application/json' } : {},
                body: body ? JSON.stringify(body) : null,
            };
            const response = await fetch(`${API_URL}/agendamentos/${id}`, options);
            const resultado = await response.json();

            adminFeedback.textContent = resultado.message;
            adminFeedback.className = response.ok ? 'sucesso' : 'erro';
            
            if (response.ok) {
                carregarAgendamentos(); // Recarrega a tabela para mostrar o resultado
            }
        } catch (error) {
            adminFeedback.textContent = 'Erro de comunicação com o servidor.';
            adminFeedback.className = 'erro';
        }
    }
    
    // Usando delegação de eventos para performance
    tbody.addEventListener('click', (event) => {
        const target = event.target;
        const id = target.dataset.id;

        if (target.classList.contains('cancelar-btn')) {
            if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
                handleAcao(id, 'DELETE');
            }
        }

        if (target.classList.contains('concluir-btn')) {
            handleAcao(id, 'PUT', { status: 'concluido' });
        }
    });

    carregarAgendamentos();
});