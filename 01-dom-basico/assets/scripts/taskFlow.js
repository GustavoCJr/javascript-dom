function criarTaskFlow(dono) {
  return {
    dono,
    tarefas: [],
    _seq: 1,

    criarTarefa(dados) {
      const result = validarDados(dados);
      if (!result.errosValidados) {
        return { ok: false, mensagens: result.mensagens };
      }

      const tags = Array.isArray(dados.tags) ? dados.tags : [];
      const tagsFormatadas = [
        ...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean)),
      ];

      const novaTarefa = {
        id: "t" + this._seq++,
        titulo: dados.titulo.trim(),
        descricao: (dados.descricao ?? "").trim(),
        prioridade: dados.prioridade,
        tags: tagsFormatadas,
        concluida: false,
        criadaEm: pegarData(),
        atualizadaEm: pegarData(),
      };

      this.tarefas.push(novaTarefa);
      return { ok: true, tarefa: novaTarefa };
    },

    editarTarefa(id, patch) {
      const index = this.buscarTarefa(id);
      if (index === -1)
        return { ok: false, mensagens: ["Tarefa não encontrada"] };

      const atual = this.tarefas[index];

      const tags =
        patch.tags !== undefined
          ? [
              ...new Set(
                patch.tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
              ),
            ]
          : atual.tags;

      const atualizado = {
        ...atual,
        ...patch,
        titulo: patch.titulo !== undefined ? patch.titulo.trim() : atual.titulo,
        descricao:
          patch.descricao !== undefined
            ? patch.descricao.trim()
            : atual.descricao,
        tags,
        atualizadaEm: pegarData(),
      };

      const result = validarDados(atualizado);
      if (!result.errosValidados)
        return { ok: false, mensagens: result.mensagens };

      this.tarefas[index] = atualizado;
      return { ok: true, tarefa: atualizado };
    },

    toggleConcluida(id) {
      const index = this.buscarTarefa(id);
      if (index === -1)
        return { ok: false, mensagens: ["Tarefa não encontrada"] };

      this.tarefas[index] = {
        ...this.tarefas[index],
        concluida: !this.tarefas[index].concluida,
        atualizadaEm: pegarData(),
      };

      return { ok: true, tarefa: this.tarefas[index] };
    },

    removerTarefa(id) {
      const index = this.buscarTarefa(id);
      if (index === -1) return false;
      this.tarefas.splice(index, 1);
      return true;
    },

    listar() {
      return structuredClone(this.tarefas);
    },

    buscar(texto) {
      const termo = (texto ?? "").toLowerCase();
      return this.tarefas.filter(
        (t) =>
          t.titulo.toLowerCase().includes(termo) ||
          t.descricao.toLowerCase().includes(termo),
      );
    },

    filtrar({ concluida, prioridade, tag } = {}) {
      const tagNorm = tag ? tag.toLowerCase() : null;

      return this.tarefas.filter((t) => {
        if (concluida !== undefined && t.concluida !== concluida) return false;
        if (prioridade && t.prioridade !== prioridade) return false;
        if (tagNorm && !t.tags.includes(tagNorm)) return false;
        return true;
      });
    },

    estatisticas() {
      const stats = this.tarefas.reduce(
        (acc, t) => {
          acc.total++;
          t.concluida ? acc.concluidas++ : acc.pendentes++;
          acc.porPrioridade[t.prioridade]++;

          t.tags.forEach((tag) => {
            acc._tempTags[tag] = (acc._tempTags[tag] || 0) + 1;
          });

          return acc;
        },
        {
          total: 0,
          concluidas: 0,
          pendentes: 0,
          porPrioridade: { baixa: 0, media: 0, alta: 0 },
          _tempTags: {},
        },
      );

      stats.topTags = Object.entries(stats._tempTags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      delete stats._tempTags;
      return stats;
    },

    exportar() {
      return JSON.stringify(this.tarefas);
    },

    importar(jsonString) {
      try {
        const dadosImportados = JSON.parse(jsonString);
        if (!Array.isArray(dadosImportados)) return 0;

        this.tarefas = structuredClone(dadosImportados);

        const maiorId = this.tarefas.reduce((max, t) => {
          const n = Number(String(t.id).replace("t", ""));
          return Number.isFinite(n) && n > max ? n : max;
        }, 0);

        this._seq = maiorId + 1;
        return this.tarefas.length;
      } catch {
        return 0;
      }
    },

    buscarTarefa(id) {
      return this.tarefas.findIndex((t) => t.id === id);
    },
  };
}

function validarDados(dado) {
  const erros = [];

  if (!dado?.titulo || !dado.titulo.trim()) erros.push("Título vazio");

  if (
    dado?.prioridade !== "baixa" &&
    dado?.prioridade !== "media" &&
    dado?.prioridade !== "alta"
  ) {
    erros.push("Prioridade inválida");
  }

  const tags = Array.isArray(dado?.tags) ? dado.tags : [];
  const norm = tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
  if (new Set(norm).size !== norm.length) erros.push("Há tags duplicadas");

  return {
    errosValidados: erros.length === 0,
    mensagens: erros,
  };
}

function pegarData() {
  return new Date().toISOString().slice(0, 10);
}

// expõe pro app.js
window.criarTaskFlow = criarTaskFlow;
