const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware para permitir que o backend entenda JSON
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rota de teste inicial
app.get('/', (req, res) => {
  res.send('API da Barbearia Corte Fino está no ar!');
});

// ==> AQUI: Registra as rotas de agendamento na aplicação
const agendamentoRoutes = require('./src/routes/agendamentoRoutes');
app.use('/api', agendamentoRoutes); // Todas as rotas de agendamento começarão com /api

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});