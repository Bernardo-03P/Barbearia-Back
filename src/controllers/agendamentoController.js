const db = require('../config/db');



exports.listarServicos = async (req, res) => {
  try {
    const response = await db.query('SELECT * FROM servicos ORDER BY nome ASC');
    res.status(200).send(response.rows);
  } catch (error) {
    console.error('Erro ao listar serviços:', error);
    res.status(500).send({ message: 'Erro interno do servidor.' });
  }
};

// ==> Método para CRIAR um novo agendamento
exports.criarAgendamento = async (req, res) => {
  const { cliente_nome, cliente_telefone, servico_id, horario } = req.body;

  // Validação simples dos dados recebidos
  if (!cliente_nome || !cliente_telefone || !servico_id || !horario) {
    return res.status(400).send({ message: 'Todos os campos são obrigatórios!' });
  }

  try {
    // 1. VERIFICAR CONFLITO DE HORÁRIO
    const conflito = await db.query('SELECT id FROM agendamentos WHERE horario = $1', [horario]);
    if (conflito.rows.length > 0) {
      return res.status(409).send({ message: 'Este horário já está ocupado.' });
    }

    // 2. ENCONTRAR OU CRIAR O CLIENTE
    let cliente = await db.query('SELECT id FROM clientes WHERE telefone = $1', [cliente_telefone]);
    let clienteId;

    if (cliente.rows.length > 0) {
      // Cliente já existe, pegamos seu ID
      clienteId = cliente.rows[0].id;
    } else {
      // Cliente não existe, vamos criá-lo e obter o ID
      const novoCliente = await db.query(
        'INSERT INTO clientes (nome, telefone) VALUES ($1, $2) RETURNING id',
        [cliente_nome, cliente_telefone]
      );
      clienteId = novoCliente.rows[0].id;
    }

    // 3. INSERIR O AGENDAMENTO no banco de dados
    const novoAgendamento = await db.query(
      'INSERT INTO agendamentos (cliente_id, servico_id, horario) VALUES ($1, $2, $3) RETURNING *',
      [clienteId, servico_id, horario]
    );

    res.status(201).send({
      message: 'Agendamento criado com sucesso!',
      body: {
        agendamento: novoAgendamento.rows[0],
      },
    });

  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).send({ message: 'Erro interno do servidor.' });
  }
};


// ==> Método para LISTAR todos os agendamentos (Desafio Extra)
exports.listarAgendamentos = async (req, res) => {
  try {
    // Usamos JOIN para trazer informações mais completas na resposta
    const response = await db.query(`
      SELECT
        a.id,
        a.horario,
        c.nome AS cliente_nome,
        c.telefone AS cliente_telefone,
        s.nome AS servico_nome,
        s.preco
      FROM agendamentos a
      JOIN clientes c ON a.cliente_id = c.id
      JOIN servicos s ON a.servico_id = s.id
      ORDER BY a.horario ASC
    `);
    res.status(200).send(response.rows);
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    res.status(500).send({ message: 'Erro interno do servidor.' });
  }
};

exports.atualizarStatusAgendamento = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Esperamos receber o novo status no corpo da requisição

  if (!status) {
    return res.status(400).send({ message: 'O novo status é obrigatório.' });
  }

  try {
    const { rowCount } = await db.query(
      "UPDATE agendamentos SET status = $1 WHERE id = $2",
      [status, id]
    );

    if (rowCount === 0) {
      return res.status(404).send({ message: "Agendamento não encontrado." });
    }

    res.status(200).send({ message: "Status do agendamento atualizado com sucesso!" });
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).send({ message: "Erro interno do servidor." });
  }
};

// ==> Método para DELETAR um agendamento por ID
exports.deletarAgendamento = async (req, res) => {
  const { id } = req.params;

  try {
    const { rowCount } = await db.query("DELETE FROM agendamentos WHERE id = $1", [id]);

    if (rowCount === 0) {
      return res.status(404).send({ message: "Agendamento não encontrado." });
    }

    res.status(200).send({ message: "Agendamento deletado com sucesso!" });
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    res.status(500).send({ message: "Erro interno do servidor." });
  }
};

exports.buscarAgendamentosPorTelefone = async (req, res) => {
  const { telefone } = req.query; // Pega o telefone da URL (ex: /buscar?telefone=123)

  if (!telefone) {
    return res.status(400).send({ message: 'O número de telefone é obrigatório.' });
  }

  try {
    const response = await db.query(`
      SELECT
        a.id, a.horario, a.status, s.nome AS servico_nome
      FROM agendamentos a
      JOIN clientes c ON a.cliente_id = c.id
      JOIN servicos s ON a.servico_id = s.id
      WHERE c.telefone = $1
      ORDER BY a.horario DESC
    `, [telefone]);

    res.status(200).send(response.rows);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).send({ message: 'Erro interno do servidor.' });
  }
};
exports.listarHorariosOcupados = async (req, res) => {
  try {
    // Selecionamos apenas a coluna 'horario' e a convertemos para o formato de texto ISO 8601
    const response = await db.query("SELECT to_char(horario, 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') as horario FROM agendamentos");
    
    // Mapeamos o resultado para um array simples de strings
    const horarios = response.rows.map(row => row.horario);
    
    res.status(200).send(horarios);
  } catch (error) {
    console.error('Erro ao listar horários ocupados:', error);
    res.status(500).send({ message: 'Erro interno do servidor.' });
  }
};
