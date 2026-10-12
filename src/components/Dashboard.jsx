import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "./Header";
import '../styles/Dashboard.css'
const URL_CARROS = "http://localhost:5000/carros/listar";
const URL_ALUGUEIS = "http://localhost:5000/alugueis/listar";
const URL_CLIENTES = "http://localhost:5000/clientes/listar";

async function buscar(url) {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: "Bearer " + token },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Erro ao buscar " + url);
  return json;
}

const moeda = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const data = (d) => (d ? new Date(d).toLocaleDateString("pt-BR") : "-");

export default function Dashboard() {
  const [carros, setCarros] = useState([]);
  const [alugueis, setAlugueis] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const [c, a, cl] = await Promise.all([
          buscar(URL_CARROS),
          buscar(URL_ALUGUEIS),
          buscar(URL_CLIENTES),
        ]);
        setCarros(c.query || []);
        setAlugueis(Array.isArray(a) ? a : []); 
        setClientes(Array.isArray(cl[0]) ? cl[0] : cl);
      } catch (e) {
        setErro(e.message);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  const ativos = alugueis.filter((a) => a.ativo);
  const receita = ativos.reduce((soma, a) => soma + Number(a.valor_total || 0), 0);

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
    <div className="container py-4 min-vh-100">
      <h1 className="h3 mb-4">Dashboard</h1>

      {erro && <div className="alert alert-danger">{erro}</div>}
      <div className="row g-3 mb-4">
        <Card titulo="Carros" valor={carros.length} cor="primary" />
        <Card titulo="Clientes" valor={clientes.length} cor="success" />
        <Card titulo="Aluguéis ativos" valor={ativos.length} cor="warning" />
        <Card titulo="Receita (ativos)" valor={moeda(receita)} cor="info" />
      </div>
      <h2 className="h5">Aluguéis</h2>
      <div className="table-responsive mb-4">
        <table className="table table-striped table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Carro</th>
              <th>Placa</th>
              <th>Início</th>
              <th>Fim</th>
              <th>Diária</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {alugueis.length === 0 && <Vazio colunas={9} />}
            {alugueis.slice(0, 5).map((a) => (
              <tr key={a.aluguel_id}>
                <td>{a.aluguel_id}</td>
                <td>{a.cliente_nome}</td>
                <td>{a.modelo}</td>
                <td>{a.placa}</td>
                <td>{data(a.data_inicio)}</td>
                <td>{data(a.data_fim)}</td>
                <td>{moeda(a.valor_diaria)}</td>
                <td>{moeda(a.valor_total)}</td>
                <td>
                  <span className={"badge " + (a.ativo ? "bg-success" : "bg-secondary")}>
                    {a.ativo ? "Ativo" : "Encerrado"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <h2 className="h5">Carros</h2>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Modelo</th>
                  <th>Categoria</th>
                  <th>Complementos</th>
                  <th>Placa</th>
                </tr>
              </thead>
              <tbody>
                {carros.length === 0 && <Vazio colunas={4} />}
                {carros.slice(0,6).map((c, i) => (
                  <tr key={c.id_carro ?? i}>
                    <td>{c.modelo}</td>
                    <td>{c.categoria}</td>
                    <td>{c.complementos}</td>
                    <td>{c.placa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-lg-5">
          <h2 className="h5">Clientes</h2>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>CNH</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 && <Vazio colunas={3} />}
                {clientes.slice(0,6).map((c, i) => (
                  <tr key={c.cpf ?? i}>
                    <td>{c.nome}</td>
                    <td>{c.cpf}</td>
                    <td>{c.cnh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </div>
    </>
  );
}

function Card({ titulo, valor, cor }) {
  return (
    <div className="col-6 col-lg-3">
      <div className={"card border-" + cor + " h-100"}>
        <div className="card-body">
          <div className="text-muted small">{titulo}</div>
          <div className="fs-3 fw-semibold">{valor}</div>
        </div>
      </div>
    </div>
  );
}

function Vazio({ colunas }) {
  return (
    <tr>
      <td colSpan={colunas} className="text-center text-muted">
        Nenhum registro encontrado.
      </td>
    </tr>
  );
}