// src/routes/agendamentoRoutes.js

const express = require('express');
const router = express.Router();

const agendamentoController = require('../controllers/agendamentoController');

// ==> Define as rotas da API para 'agendamentos'
// Rota para criar um novo agendamento (POST)
router.post('/agendamentos', agendamentoController.criarAgendamento);

// Rota para listar todos os agendamentos (GET)
router.get('/agendamentos', agendamentoController.listarAgendamentos);

router.get('/servicos', agendamentoController.listarServicos);

router.get('/agendamentos/buscar', agendamentoController.buscarAgendamentosPorTelefone);

router.get('/horarios-ocupados', agendamentoController.listarHorariosOcupados);

router.put('/agendamentos/:id', agendamentoController.atualizarStatusAgendamento);

// Rota para deletar um agendamento (DELETE)
router.delete('/agendamentos/:id', agendamentoController.deletarAgendamento);

module.exports = router;