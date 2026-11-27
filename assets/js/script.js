const API_URL = 'http://localhost:3000/tasks';

// ELEMENTOS HTML
const form = document.querySelector('#task-form');
const taskList = document.querySelector('#task-list');
const refreshButton = document.querySelector('#refresh-button');
const message = document.querySelector('#message');
const editModal = document.querySelector('#edit-modal');
const editForm = document.querySelector('#edit-task-form');
const cancelEditButton = document.querySelector('#cancel-edit');

// COMUNICAÇÃO COM A API

async function requisicaoAPI(url, options = {}) {
  const resposta = await fetch(url, options);

  const conteudo = await resposta.text();

  let dados = null;

  if (conteudo) {
    try {
      dados = JSON.parse(conteudo);
    } catch {
      dados = conteudo;
    }
  }

  if (!resposta.ok) {
    const detalhe = dados?.message || 'Erro na comunicação com a API';
    throw new Error(detalhe);
  }

  return dados;
}

// UTILITÁRIOS

function mostrarMensagem(texto) {
  message.textContent = texto;
}

function validarTarefa(descricao, inicio, fim) {
  if (!descricao.trim()) {
    mostrarMensagem('Informe a descrição da tarefa.');
    return false;
  }

  if (!Number.isFinite(inicio) || !Number.isFinite(fim)) {
    mostrarMensagem('Informe valores válidos para o intervalo.');
    return false;
  }

  if (inicio > fim) {
    mostrarMensagem('O início deve ser menor ou igual ao fim.');
    return false;
  }

  return true;
}

function criarBotao(texto, classe, acao, desabilitado = false) {
  const botao = document.createElement('button');

  botao.type = 'button';
  botao.textContent = texto;
  botao.className = classe;
  botao.disabled = desabilitado;

  botao.addEventListener('click', acao);

  return botao;
}

// LISTAR TAREFAS

async function carregarTarefas() {
  try {
    const tarefas = await requisicaoAPI(API_URL);

    taskList.innerHTML = '';

    if (!tarefas || tarefas.length === 0) {
      const vazio = document.createElement('p');
      vazio.textContent = 'Nenhuma tarefa cadastrada.';
      taskList.appendChild(vazio);
      return;
    }

    tarefas.forEach((tarefa) => {
      const elemento = document.createElement('div');
      elemento.className = 'task';

      // Descrição
      const titulo = document.createElement('h3');
      titulo.textContent = tarefa.descricao;

      // Intervalo
      const intervalo = document.createElement('p');
      intervalo.textContent =
        `Intervalo: ${tarefa.inicio} até ${tarefa.fim}`;

      // Status
      const status = document.createElement('p');
      status.textContent = `Status: ${tarefa.status}`;

      // Botão editar
      const botaoEditar = criarBotao(
        'Editar',
        'btn-editar',
        () => abrirEdicao(tarefa)
      );

      // Botão processando
      const botaoProcessando = criarBotao(
        'Marcar como processando',
        'btn-processando',
        () => atualizarStatus(tarefa.id, 'PROCESSANDO'),
        tarefa.status === 'PROCESSANDO'
      );

      // Botão concluída
      const botaoConcluida = criarBotao(
        'Marcar como concluída',
        'btn-concluida',
        () => atualizarStatus(tarefa.id, 'CONCLUIDA'),
        tarefa.status === 'CONCLUIDA'
      );

      // Botão excluir
      const botaoExcluir = criarBotao(
        'Excluir',
        'btn-excluir',
        () => excluirTarefa(tarefa.id)
      );

      // Montagem do elemento
      elemento.append(
        titulo,
        intervalo,
        status,
        botaoEditar,
        botaoProcessando,
        botaoConcluida,
        botaoExcluir
      );

      taskList.appendChild(elemento);
    });

  } catch (erro) {
    mostrarMensagem('Não foi possível carregar as tarefas.');
    console.error(erro);
  }
}

// CADASTRAR TAREFA

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const descricao = document.querySelector('#descricao').value.trim();
  const inicio = Number(document.querySelector('#inicio').value);
  const fim = Number(document.querySelector('#fim').value);

  if (!validarTarefa(descricao, inicio, fim)) {
    return;
  }

  const novaTarefa = {
    descricao,
    inicio,
    fim,
  };

  try {
    await requisicaoAPI(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(novaTarefa),
    });

    mostrarMensagem('Tarefa cadastrada com sucesso!');

    form.reset();

    await carregarTarefas();

  } catch (erro) {
    mostrarMensagem('Não foi possível cadastrar a tarefa.');
    console.error(erro);
  }
});

// ATUALIZAR STATUS

async function atualizarStatus(id, status) {
  try {
    await requisicaoAPI(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    mostrarMensagem(`Status atualizado para ${status}.`);

    await carregarTarefas();

  } catch (erro) {
    mostrarMensagem('Erro ao atualizar o status.');
    console.error(erro);
  }
}

// EXCLUIR TAREFA

async function excluirTarefa(id) {
  const confirmar = confirm(
    'Deseja realmente excluir esta tarefa?'
  );

  if (!confirmar) {
    return;
  }

  try {
    await requisicaoAPI(`${API_URL}/${id}`, {
      method: 'DELETE',
    });

    mostrarMensagem('Tarefa excluída com sucesso!');

    await carregarTarefas();

  } catch (erro) {
    mostrarMensagem('Não foi possível excluir a tarefa.');
    console.error(erro);
  }
}

// EDITAR TAREFA

function abrirEdicao(tarefa) {
  document.querySelector('#edit-id').value = tarefa.id;
  document.querySelector('#edit-descricao').value = tarefa.descricao;
  document.querySelector('#edit-inicio').value = tarefa.inicio;
  document.querySelector('#edit-fim').value = tarefa.fim;

  editModal.style.display = 'flex';
}

function fecharEdicao() {
  editModal.style.display = 'none';
  editForm.reset();
}

editForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const id = document.querySelector('#edit-id').value;
  const descricao = document.querySelector('#edit-descricao').value.trim();
  const inicio = Number(document.querySelector('#edit-inicio').value);
  const fim = Number(document.querySelector('#edit-fim').value);

  if (!validarTarefa(descricao, inicio, fim)) {
    return;
  }

  const tarefaAtualizada = {
    descricao,
    inicio,
    fim,
  };

  try {
    await requisicaoAPI(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tarefaAtualizada),
    });

    fecharEdicao();

    mostrarMensagem('Tarefa atualizada com sucesso!');

    await carregarTarefas();

  } catch (erro) {
    mostrarMensagem('Não foi possível atualizar a tarefa.');
    console.error(erro);
  }
});

// EVENTOS DOS BOTÕES

refreshButton.addEventListener('click', carregarTarefas);

cancelEditButton.addEventListener('click', fecharEdicao);

// Fechar modal clicando fora do formulário
editModal.addEventListener('click', (event) => {
  if (event.target === editModal) {
    fecharEdicao();
  }
});

// Fechar modal pressionando ESC
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && editModal.style.display === 'flex') {
    fecharEdicao();
  }
});

// INICIALIZAÇÃO

carregarTarefas();
