import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "./Header";
import "../styles/Dashboard.css";

const URL_LISTAR = "http://localhost:5000/clientes/listar"; 
const URL_CRIAR = "http://localhost:5000/clientes/criar"; 
const URL_BUSCAR = "http://localhost:5000/clientes/listar"; 
const URL_DELETAR = "http://localhost:5000/clientes/deletar"; 

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

const FORM_VAZIO = {
  nome: "",
  cpf: "",
  cnh: "",
  senha: "",
  confirmarSenha: "",
};

const apenasNumeros = (v) => v.replace(/\D/g, "");

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [filtro, setFiltro] = useState("");
  const [detalhe, setDetalhe] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  async function carregar() {
    try {
      const json = await requisicao(URL_LISTAR);
      setClientes(Array.isArray(json[0]) ? json[0] : Array.isArray(json) ? json : []);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function avisar(tipo, msg) {
    setErro(tipo === "erro" ? msg : "");
    setSucesso(tipo === "ok" ? msg : "");
  }

  function alterar(e) {
    const { name, value } = e.target;
    const v = name === "cpf" || name === "cnh" ? apenasNumeros(value) : value;
    setForm({ ...form, [name]: v });
  }

  function validar() {
    if (form.nome.trim().length < 3) return "O nome precisa ter pelo menos 3 caracteres.";
    if (form.cpf.length !== 11) return "O CPF precisa ter 11 dígitos.";
    if (form.cnh.length !== 11) return "A CNH precisa ter 11 dígitos.";
    if (form.senha.length < 5) return "A senha precisa ter pelo menos 5 caracteres.";
    if (form.senha !== form.confirmarSenha) return "As senhas não coincidem.";
    return "";
  }

  const senhasDiferem =
    form.confirmarSenha.length > 0 && form.senha !== form.confirmarSenha;

  async function cadastrar() {
    const problema = validar();
    if (problema) {
      avisar("erro", problema);
      return;
    }
    setEnviando(true);
    try {
      const json = await requisicao(URL_CRIAR, "POST", {
        nome: form.nome.trim(),
        cpf: form.cpf,
        cnh: form.cnh,
        senha: form.senha, 
      });
      avisar("ok", json.message);
      setForm(FORM_VAZIO);
      await carregar();
    } catch (e) {
      avisar("erro", e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function verDetalhes(cpf) {
    try {
      const json = await requisicao(URL_BUSCAR + "/" + encodeURIComponent(cpf));
      setDetalhe(Array.isArray(json) ? json[0] || null : json);
    } catch (e) {
      avisar("erro", e.message);
    }
  }
  async function confirmarExcluir() {
    setEnviando(true);
    try {
      await requisicao(URL_DELETAR + "/" + encodeURIComponent(excluindo.cpf), "DELETE");
      avisar("ok", "Cliente excluído com sucesso!");
      setExcluindo(null);
      await carregar();
    } catch (e) {
      avisar("erro", e.message);
      setExcluindo(null);
    } finally {
      setEnviando(false);
    }
  }

  const filtrados = clientes.filter((c) =>
    (c.nome + " " + c.cpf + " " + c.cnh).toLowerCase().includes(filtro.toLowerCase())
  );

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
          <h1 className="h3 mb-4 text-white">Clientes</h1>

          {erro && <div className="alert alert-danger">{erro}</div>}
          {sucesso && <div className="alert alert-success">{sucesso}</div>}
          <div className="bg-white rounded p-3 mb-4">
            <h2 className="h5 mb-3">Novo cliente</h2>
            <div className="row g-2">
              <div className="col-md-4">
                <input
                  className="form-control"
                  name="nome"
                  placeholder="Nome completo"
                  value={form.nome}
                  onChange={alterar}
                />
              </div>
              <div className="col-md-4">
                <input
                  className="form-control"
                  name="cpf"
                  placeholder="CPF (11 dígitos)"
                  maxLength={11}
                  inputMode="numeric"
                  value={form.cpf}
                  onChange={alterar}
                />
              </div>
              <div className="col-md-4">
                <input
                  className="form-control"
                  name="cnh"
                  placeholder="CNH (11 dígitos)"
                  maxLength={11}
                  inputMode="numeric"
                  value={form.cnh}
                  onChange={alterar}
                />
              </div>
              <div className="col-md-4">
                <input
                  type={"password"}
                  className="form-control"
                  name="senha"
                  placeholder="Senha (mín. 5 caracteres)"
                  value={form.senha}
                  onChange={alterar}
                />
              </div>
              <div className="col-md-4">
                <input
                  type={"password"}
                  className={"form-control" + (senhasDiferem ? " is-invalid" : "")}
                  name="confirmarSenha"
                  placeholder="Confirmar senha"
                  value={form.confirmarSenha}
                  onChange={alterar}
                />
                {senhasDiferem && (
                  <div className="invalid-feedback">As senhas não coincidem.</div>
                )}
              </div>
              <div className="col-md-4 d-flex align-items-start gap-2">
                <button
                  className="btn btn-primary flex-grow-1"
                  onClick={cadastrar}
                  disabled={enviando}
                >
                  {enviando ? "Salvando..." : "Cadastrar cliente"}
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white rounded p-3">
            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
              <h2 className="h5 mb-0">Lista de clientes ({filtrados.length})</h2>
              <input
                className="form-control w-auto"
                placeholder="Filtrar por nome, CPF ou CNH..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>

            <div className="table-responsive">
              <table className="table table-striped table-hover align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>CNH</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted">
                        Nenhum cliente encontrado.
                      </td>
                    </tr>
                  )}
                  {filtrados.map((c, i) => (
                    <tr key={c.cpf ?? i}>
                      <td>{c.nome}</td>
                      <td>{c.cpf}</td>
                      <td>{c.cnh}</td>
                      <td className="text-end text-nowrap">
                        <button
                          className="btn btn-outline-primary btn-sm me-2"
                          onClick={() => verDetalhes(c.cpf)}
                        >
                          Detalhes
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => setExcluindo(c)}
                        >
                          Excluir
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
                <h5 className="modal-title">{detalhe.nome}</h5>
                <button className="btn-close" onClick={() => setDetalhe(null)} />
              </div>
              <div className="modal-body">
                <p className="mb-1"><strong>CPF:</strong> {detalhe.cpf}</p>
                <p className="mb-0"><strong>CNH:</strong> {detalhe.cnh}</p>
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
      {excluindo && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Excluir cliente</h5>
                <button className="btn-close" onClick={() => setExcluindo(null)} />
              </div>
              <div className="modal-body">
                <p className="mb-2">
                  Deseja excluir <strong>{excluindo.nome}</strong> (CPF {excluindo.cpf})?
                </p>
                <p className="text-muted small mb-0">
                  Clientes com aluguéis vinculados podem não ser excluídos.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setExcluindo(null)}>
                  Cancelar
                </button>
                <button
                  className="btn btn-danger"
                  onClick={confirmarExcluir}
                  disabled={enviando}
                >
                  {enviando ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}