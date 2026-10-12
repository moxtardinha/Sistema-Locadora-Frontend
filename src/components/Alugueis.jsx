import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "./Header";
import "../styles/Dashboard.css";

const URL_ALUGUEIS = "http://localhost:5000/alugueis/listar";
const URL_CARROS = "http://localhost:5000/carros/listar"; 
const URL_CLIENTES = "http://localhost:5000/clientes/listar";
const URL_CRIAR = "http://localhost:5000/alugueis/cadastrar"; 
const URL_DESATIVAR = "http://localhost:5000/alugueis/inativar"; 

async function requisicao(url, method = "GET", body) {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const texto = await res.text();
  let json = {};
  try {
    json = texto ? JSON.parse(texto) : {};
  } catch {
    throw new Error(
      "Resposta inválida do servidor (" + res.status + ") em " + method + " " + url
    );
  }

  if (!res.ok) throw new Error(json.message || "Erro " + res.status);
  return json;
}

const moeda = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const data = (d) => (d ? new Date(d).toLocaleDateString("pt-BR") : "-");

const hoje = () => new Date().toISOString().split("T")[0];

const FORM_VAZIO = {
  id_cliente: "",
  id_carro: "",
  data_inicio: "",
  data_fim: "",
  valor_diaria: "",
  senha_cliente: "",
};
function calcularDias(inicio, fim) {
  if (!inicio || !fim) return 0;
  const diff = (new Date(fim) - new Date(inicio)) / 86400000;
  return diff < 0 ? 0 : Math.max(1, Math.round(diff));
}

export default function Alugueis() {
  const [alugueis, setAlugueis] = useState([]);
  const [carros, setCarros] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [filtro, setFiltro] = useState("");
  const [status, setStatus] = useState("todos");
  const [detalhe, setDetalhe] = useState(null);
  const [desativando, setDesativando] = useState(null);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  async function carregarTudo() {
    try {
      const [a, c, cl] = await Promise.all([
        requisicao(URL_ALUGUEIS),
        requisicao(URL_CARROS),
        requisicao(URL_CLIENTES),
      ]);
      setAlugueis(Array.isArray(a) ? a : []);
      setCarros(c.query || []);
      setClientes(Array.isArray(cl[0]) ? cl[0] : Array.isArray(cl) ? cl : []);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  function avisar(tipo, msg) {
    setErro(tipo === "erro" ? msg : "");
    setSucesso(tipo === "ok" ? msg : "");
  }

  function alterar(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  const carrosDisponiveis = carros.filter(
    (c) => !alugueis.some((a) => a.ativo && a.placa === c.placa)
  );
  function idDoCliente(a) {
    return a.id_cliente ?? clientes.find((c) => c.cpf === a.cliente_cpf)?.id;
  }
  const dias = calcularDias(form.data_inicio, form.data_fim);
  const valorTotal = dias * Number(form.valor_diaria || 0);
  const datasInvalidas =
    form.data_inicio && form.data_fim && form.data_fim < form.data_inicio;

  const formCompleto =
    form.id_cliente &&
    form.id_carro &&
    dias > 0 &&
    Number(form.valor_diaria) > 0 &&
    form.senha_cliente;
  async function cadastrar() {
    setEnviando(true);
    try {
      const json = await requisicao(URL_CRIAR, "POST", {
        id_cliente: String(form.id_cliente),
        id_carro: String(form.id_carro),
        data_inicio: form.data_inicio,
        data_fim: form.data_fim,
        valor_diaria: Number(form.valor_diaria).toFixed(2),
        valor_total: valorTotal.toFixed(2),
        senha_cliente: form.senha_cliente,
      });
      avisar("ok", json.message);
      setForm(FORM_VAZIO);
      await carregarTudo();
    } catch (e) {
      avisar("erro", e.message);
    } finally {
      setEnviando(false);
    }
  }
  async function confirmarDesativar() {
    const id_cliente = idDoCliente(desativando);
    if (!id_cliente) {
      avisar("erro", "Não foi possível identificar o cliente deste aluguel.");
      setDesativando(null);
      return;
    }
    setEnviando(true);
    try {
      const json = await requisicao(URL_DESATIVAR, "DELETE", {
        id_aluguel: desativando.aluguel_id,
        id_cliente,
        senha_cliente: senha,
      });
      avisar("ok", json.message);
      setDesativando(null);
      setSenha("");
      await carregarTudo();
    } catch (e) {
      avisar("erro", e.message);
    } finally {
      setEnviando(false);
    }
  }

  const filtrados = alugueis.filter((a) => {
    if (status === "ativos" && !a.ativo) return false;
    if (status === "encerrados" && a.ativo) return false;
    const texto = [a.cliente_nome, a.cliente_cpf, a.placa, a.modelo]
      .join(" ")
      .toLowerCase();
    return texto.includes(filtro.toLowerCase());
  });

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="dashboard min-vh-100">
        <div className="container py-4">
          <h1 className="h3 mb-4 text-white">Aluguéis</h1>

          {erro && <div className="alert alert-danger">{erro}</div>}
          {sucesso && <div className="alert alert-success">{sucesso}</div>}
          <div className="bg-white rounded p-3 mb-4">
            <h2 className="h5 mb-3">Novo aluguel</h2>
            <div className="row g-2">
              <div className="col-md-6">
                <label className="form-label small mb-1">Cliente</label>
                <select
                  className="form-select"
                  name="id_cliente"
                  value={form.id_cliente}
                  onChange={alterar}
                >
                  <option value="">Selecione o cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id ?? c.cpf} value={c.id}>
                      {c.nome} — CPF {c.cpf}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label small mb-1">
                  Carro ({carrosDisponiveis.length} disponível(is))
                </label>
                <select
                  className="form-select"
                  name="id_carro"
                  value={form.id_carro}
                  onChange={alterar}
                >
                  <option value="">Selecione o carro...</option>
                  {carrosDisponiveis.map((c) => (
                    <option key={c.id_carro} value={c.id_carro}>
                      {c.modelo} — {c.placa} ({c.categoria})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small mb-1">Início</label>
                <input
                  type="date"
                  className="form-control"
                  name="data_inicio"
                  min={hoje()}
                  value={form.data_inicio}
                  onChange={alterar}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small mb-1">Fim</label>
                <input
                  type="date"
                  className={"form-control" + (datasInvalidas ? " is-invalid" : "")}
                  name="data_fim"
                  min={form.data_inicio || hoje()}
                  value={form.data_fim}
                  onChange={alterar}
                />
                {datasInvalidas && (
                  <div className="invalid-feedback">
                    A data final não pode ser antes da inicial.
                  </div>
                )}
              </div>
              <div className="col-md-3">
                <label className="form-label small mb-1">Diária (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  name="valor_diaria"
                  value={form.valor_diaria}
                  onChange={alterar}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small mb-1">Senha do cliente</label>
                <input
                  type="password"
                  className="form-control"
                  name="senha_cliente"
                  value={form.senha_cliente}
                  onChange={alterar}
                />
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-muted">
                {dias} dia(s) &times; {moeda(form.valor_diaria)} ={" "}
                <strong>{moeda(valorTotal)}</strong>
              </span>
              <button
                className="btn btn-primary"
                onClick={cadastrar}
                disabled={enviando || !formCompleto}
              >
                {enviando ? "Salvando..." : "Registrar aluguel"}
              </button>
            </div>
          </div>
          <div className="bg-white rounded p-3">
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
              <h2 className="h5 mb-0">Lista de aluguéis ({filtrados.length})</h2>
              <div className="d-flex gap-2">
                <select
                  className="form-select w-auto"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  <option value="ativos">Ativos</option>
                  <option value="encerrados">Encerrados</option>
                </select>
                <input
                  className="form-control w-auto"
                  placeholder="Cliente, CPF, placa..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-striped table-hover align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Carro</th>
                    <th>Placa</th>
                    <th>Início</th>
                    <th>Fim</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center text-muted">
                        Nenhum aluguel encontrado.
                      </td>
                    </tr>
                  )}
                  {filtrados.map((a) => (
                    <tr key={a.aluguel_id}>
                      <td>{a.aluguel_id}</td>
                      <td>{a.cliente_nome}</td>
                      <td>{a.modelo ?? "-"}</td>
                      <td>{a.placa ?? "-"}</td>
                      <td>{data(a.data_inicio)}</td>
                      <td>{data(a.data_fim)}</td>
                      <td>{moeda(a.valor_total)}</td>
                      <td>
                        <span
                          className={"badge " + (a.ativo ? "bg-success" : "bg-secondary")}
                        >
                          {a.ativo ? "Ativo" : "Encerrado"}
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        <button
                          className="btn btn-outline-primary btn-sm me-2"
                          onClick={() => setDetalhe(a)}
                        >
                          Detalhes
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          disabled={!a.ativo}
                          onClick={() => {
                            setDesativando(a);
                            setSenha("");
                          }}
                        >
                          Desativar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {detalhe && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Aluguel #{detalhe.aluguel_id}</h5>
                <button className="btn-close" onClick={() => setDetalhe(null)} />
              </div>
              <div className="modal-body">
                <p className="mb-1"><strong>Cliente:</strong> {detalhe.cliente_nome}</p>
                <p className="mb-1"><strong>CPF:</strong> {detalhe.cliente_cpf}</p>
                <p className="mb-1"><strong>CNH:</strong> {detalhe.cliente_cnh}</p>
                <hr />
                <p className="mb-1"><strong>Carro:</strong> {detalhe.modelo ?? "-"} ({detalhe.categoria ?? "-"})</p>
                <p className="mb-1"><strong>Placa:</strong> {detalhe.placa ?? "-"}</p>
                <p className="mb-1"><strong>Complementos:</strong> {detalhe.complementos ?? "-"}</p>
                <hr />
                <p className="mb-1"><strong>Período:</strong> {data(detalhe.data_inicio)} a {data(detalhe.data_fim)}</p>
                <p className="mb-1"><strong>Diária:</strong> {moeda(detalhe.valor_diaria)}</p>
                <p className="mb-0"><strong>Total:</strong> {moeda(detalhe.valor_total)}</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setDetalhe(null)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {desativando && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Desativar aluguel #{desativando.aluguel_id}</h5>
                <button className="btn-close" onClick={() => setDesativando(null)} />
              </div>
              <div className="modal-body">
                <p>
                  Cliente: <strong>{desativando.cliente_nome}</strong>
                  <br />
                  Carro: <strong>{desativando.modelo ?? "-"} ({desativando.placa ?? "-"})</strong>
                </p>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Senha do cliente"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setDesativando(null)}>
                  Cancelar
                </button>
                <button
                  className="btn btn-danger"
                  onClick={confirmarDesativar}
                  disabled={enviando || !senha}
                >
                  {enviando ? "Desativando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}