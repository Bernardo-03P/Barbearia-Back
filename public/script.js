// public/script.js - VERSÃO FINAL COM CALENDÁRIO INTELIGENTE

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:5000/api';

    // --- SELETORES DE ELEMENTOS DO DOM ---
    const formAgendamento = document.getElementById('form-agendamento');
    const selectServico = document.getElementById('servico');
    const listaServicosDiv = document.getElementById('lista-servicos');
    const mensagemFeedback = document.getElementById('mensagem-feedback');
    const btnAgendar = document.getElementById('btn-agendar');
    const formBusca = document.getElementById('form-busca');
    const inputBuscaTelefone = document.getElementById('busca-telefone');
    const resultadosBuscaDiv = document.getElementById('resultados-busca');

    // -----------------------------------------------------------------
    // --- LÓGICA DO CALENDÁRIO FLATPCIKR ---
    // -----------------------------------------------------------------
    async function inicializarCalendario() {
        try {
            const response = await fetch(`${API_URL}/horarios-ocupados`);
            if (!response.ok) throw new Error('Falha ao buscar horários.');
            const horariosOcupados = await response.json();

            flatpickr("#horario", {
                enableTime: true,
                dateFormat: "Y-m-d H:i",
                minDate: "today",
                minTime: "07:00",
                maxTime: "20:00",
                minuteIncrement: 30, // Altere para 60 se os agendamentos forem de hora em hora
                disable: [
                    (date) => (date.getDay() === 0), // Desabilita Domingos
                    ...horariosOcupados
                ],
                locale: {
                    firstDayOfWeek: 1,
                    weekdays: { shorthand: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"], longhand: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] },
                    months: { shorthand: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"], longhand: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"] },
                }
            });
        } catch (error) {
            console.error("Falha ao inicializar o calendário:", error);
            document.getElementById('error-horario').textContent = 'Não foi possível carregar os horários. Recarregue a página.';
        }
    }

    // -----------------------------------------------------------------
    // --- LÓGICA GERAL DA PÁGINA ---
    // -----------------------------------------------------------------

    async function carregarServicos() {
        try {
            listaServicosDiv.innerHTML = '<p>Carregando serviços...</p>';
            const response = await fetch(`${API_URL}/servicos`);
            if (!response.ok) throw new Error('Falha ao carregar serviços.');
            const servicos = await response.json();
            selectServico.innerHTML = '<option value="">Selecione um serviço</option>';
            listaServicosDiv.innerHTML = '';
            servicos.forEach(servico => {
                const option = document.createElement('option');
                option.value = servico.id;
                option.textContent = `${servico.nome} - R$ ${servico.preco}`;
                selectServico.appendChild(option);
                const servicoItem = document.createElement('div');
                servicoItem.className = 'servico-item';
                servicoItem.innerHTML = `<span>${servico.nome}</span><strong>R$ ${servico.preco}</strong>`;
                listaServicosDiv.appendChild(servicoItem);
            });
        } catch (error) {
            console.error('Erro ao carregar serviços:', error);
            listaServicosDiv.innerHTML = '<p class="erro">Não foi possível carregar os serviços.</p>';
        }
    }

    function limparErros() {
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        mensagemFeedback.textContent = '';
        mensagemFeedback.className = '';
    }

    function validarFormulario() {
        limparErros();
        let isValid = true;
        if (!document.getElementById('nome').value.trim()) { isValid = false; document.getElementById('error-nome').textContent = 'O campo nome é obrigatório.'; }
        const telNumeros = document.getElementById('telefone').value.replace(/\D/g, '');
        if (telNumeros.length < 10 || telNumeros.length > 11) { isValid = false; document.getElementById('error-telefone').textContent = 'Insira um telefone válido (com DDD).'; }
        if (!document.getElementById('servico').value) { isValid = false; document.getElementById('error-servico').textContent = 'Selecione um serviço.'; }
        if (!document.getElementById('horario').value) { isValid = false; document.getElementById('error-horario').textContent = 'Escolha uma data e hora.'; }
        return isValid;
    }

    formAgendamento.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!validarFormulario()) return;
        btnAgendar.disabled = true;
        btnAgendar.textContent = 'Agendando...';
        try {
            const response = await fetch(`${API_URL}/agendamentos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cliente_nome: document.getElementById('nome').value,
                    cliente_telefone: document.getElementById('telefone').value,
                    servico_id: selectServico.value,
                    horario: new Date(document.getElementById('horario').value).toISOString(),
                }),
            });
            const resultado = await response.json();
            mensagemFeedback.textContent = resultado.message;
            if (response.ok) {
                mensagemFeedback.className = 'sucesso';
                formAgendamento.reset();
                // Recarrega o calendário para desabilitar o novo horário agendado
                inicializarCalendario();
            } else {
                mensagemFeedback.className = 'erro';
            }
        } catch (error) {
            mensagemFeedback.textContent = 'Erro de comunicação com o servidor.';
            mensagemFeedback.className = 'erro';
        } finally {
            btnAgendar.disabled = false;
            btnAgendar.textContent = 'Agendar Agora';
        }
    });

    formBusca.addEventListener('submit', async (e) => {
        e.preventDefault();
        const telefone = inputBuscaTelefone.value.trim().replace(/\D/g, '');
        if (!telefone) return;
        resultadosBuscaDiv.innerHTML = '<p>Buscando...</p>';
        try {
            const response = await fetch(`${API_URL}/agendamentos/buscar?telefone=${telefone}`);
            if (!response.ok) throw new Error('Falha ao buscar agendamentos.');
            const agendamentos = await response.json();
            renderizarResultadosBusca(agendamentos);
        } catch (error) {
            resultadosBuscaDiv.innerHTML = `<p class="erro">${error.message}</p>`;
        }
    });

    function renderizarResultadosBusca(agendamentos) {
        if (agendamentos.length === 0) {
            resultadosBuscaDiv.innerHTML = '<p>Nenhum agendamento futuro encontrado.</p>';
            return;
        }
        resultadosBuscaDiv.innerHTML = agendamentos.map(ag => {
            const dataFormatada = new Date(ag.horario).toLocaleString('pt-BR');
            const podeCancelar = new Date(ag.horario) > new Date() && ag.status !== 'concluido';
            return `<div class="agendamento-encontrado">
                        <div class="info"><strong>${ag.servico_nome}</strong><br><span>${dataFormatada}</span></div>
                        ${podeCancelar ? `<button class="cancelar-btn-cliente" data-id="${ag.id}">Cancelar</button>` : `<span>${ag.status || 'Finalizado'}</span>`}
                    </div>`;
        }).join('');
    }

    resultadosBuscaDiv.addEventListener('click', async (e) => {
        if (e.target.classList.contains('cancelar-btn-cliente')) {
            const id = e.target.dataset.id;
            if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
                try {
                    const response = await fetch(`${API_URL}/agendamentos/${id}`, { method: 'DELETE' });
                    const resultado = await response.json();
                    if (!response.ok) throw new Error(resultado.message);
                    formBusca.dispatchEvent(new Event('submit', { cancelable: true }));
                } catch (error) {
                    alert(error.message);
                }
            }
        }
    });

    // --- CARREGAMENTO INICIAL ---
    carregarServicos();
    inicializarCalendario();
});