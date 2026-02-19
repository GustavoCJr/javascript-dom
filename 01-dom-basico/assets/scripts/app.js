const app = criarTaskFlow("Gustavo");
let filtroAtual = "todas";

const form = document.querySelector("#form-tarefa");
const lista = document.querySelector("#lista-tarefas");
const filtros = document.querySelector("#filtros");
const erroEl = document.querySelector("#erro");
const statsEl = document.querySelector("#stats");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  erroEl.textContent = "";

  const titulo = document.querySelector("#titulo").value;
  const descricao = document.querySelector("#descricao").value;
  const prioridade = document.querySelector("#prioridade").value;

  const tags = document
    .querySelector("#tags")
    .value.split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const res = app.criarTarefa({ titulo, descricao, prioridade, tags });

  if (!res.ok) {
    erroEl.textContent = res.mensagens.join(" | ");
    return;
  }

  form.reset();
  render();
});

lista.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.dataset.id;
  const acao = btn.dataset.acao;

  if (acao === "toggle") {
    app.toggleConcluida(id);
    render();
  }

  if (acao === "remover") {
    app.removerTarefa(id);
    render();
  }
});

filtros.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  filtroAtual = btn.dataset.filtro;

  document
    .querySelectorAll("#filtros button")
    .forEach((b) => b.classList.remove("ativo"));
  btn.classList.add("ativo");

  render();
});

function render() {
  lista.innerHTML = "";

  const prioridadePeso = { baixa: 1, media: 2, alta: 3 };

  let tarefas = app.listar();

  if (filtroAtual === "pendentes") {
    tarefas = tarefas.filter((t) => !t.concluida);
  } else if (filtroAtual === "concluidas") {
    tarefas = tarefas.filter((t) => t.concluida);
  }

  tarefas.sort(
    (a, b) => prioridadePeso[b.prioridade] - prioridadePeso[a.prioridade],
  );

  tarefas.forEach((t) => {
    const li = document.createElement("li");
    if (t.concluida) li.classList.add("concluida");

    li.innerHTML = `
      <div class="topo">
        <div>
          <strong>${escapeHtml(t.titulo)}</strong>
          <span class="prioridade ${t.prioridade}">${t.prioridade}</span>
        </div>

        <div class="acoes">
          <button data-acao="toggle" data-id="${t.id}">
            ${t.concluida ? "↩" : "✔"}
          </button>
          <button data-acao="remover" data-id="${t.id}">🗑</button>
        </div>
      </div>

      <small>${escapeHtml(t.descricao ?? "")}</small>

      <div class="tags">
        ${t.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
      </div>
    `;

    lista.appendChild(li);
    const s = app.estatisticas();

    statsEl.innerHTML = `
    <span class="pill">Total: <strong>${s.total}</strong></span>
    <span class="pill">Pendentes: <strong>${s.pendentes}</strong></span>
    <span class="pill">Concluídas: <strong>${s.concluidas}</strong></span>
    <span class="pill">Top tags: <strong>${(s.topTags ?? []).map(([tag, n]) => `${tag}(${n})`).join(", ") || "-"}</strong></span>
  `;
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
