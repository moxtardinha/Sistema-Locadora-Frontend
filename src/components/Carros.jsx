import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Header from "./Header";
import "../styles/Dashboard.css";

const URL_LISTAR = "http://localhost:5000/carros/listar";
const URL_INSERIR = "http://localhost:5000/carros/cadastrar";
const URL_BUSCAR = "http://localhost:5000/carros/listar";
const URL_DELETAR = "http://localhost:5000/carros/deletar";

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
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Erro na requisição");
    return json;
}

const FORM_VAZIO = { modelo: "", categoria: "", complementos: "", placa: "" };

export default function Carros() {
    const [carros, setCarros] = useState([]);
    const [form, setForm] = useState(FORM_VAZIO);
    const [filtro, setFiltro] = useState("");
    const [detalhe, setDetalhe] = useState(null);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);

    async function carregar() {
        try {
            const json = await requisicao(URL_LISTAR);
            setCarros(json.query || []);
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
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function cadastrar(e) {
        e.preventDefault();
        setEnviando(true);
        try {
            const json = await requisicao(URL_INSERIR, "POST", {
                ...form,
                placa: form.placa.toUpperCase(),
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

    async function verDetalhes(placa) {
        try {
            const json = await requisicao(URL_BUSCAR + "/" + encodeURIComponent(placa));
            setDetalhe(json.query?.[0] || null);
        } catch (e) {
            avisar("erro", e.message);
        }
    }
    async function excluir(placa) {
        if (!window.confirm("Excluir o carro de placa " + placa + "?")) return;
        try {
            const json = await requisicao(URL_DELETAR + "/" + encodeURIComponent(placa), "DELETE");
            avisar("ok", json.message);
            await carregar();
        } catch (e) {
            avisar("erro", e.message);
        }
    }

    const filtrados = carros.filter((c) =>
        (c.placa + " " + c.modelo + " " + c.categoria)
            .toLowerCase()
            .includes(filtro.toLowerCase())
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
                    <h1 className="h3 mb-4 text-white">Carros</h1>

                    {erro && <div className="alert alert-danger">{erro}</div>}
                    {sucesso && <div className="alert alert-success">{sucesso}</div>}
                    <div className="bg-white rounded p-3 mb-4">
                        <h2 className="h5 mb-3">Novo carro</h2>
                        <div className="row g-2">
                            <div className="col-md-3">
                                <input
                                    className="form-control"
                                    name="modelo"
                                    placeholder="Modelo"
                                    value={form.modelo}
                                    onChange={alterar}
                                    required
                                />
                            </div>
                            <div className="col-md-3">
                                <input
                                    className="form-control"
                                    name="categoria"
                                    placeholder="Categoria"
                                    value={form.categoria}
                                    onChange={alterar}
                                    required
                                />
                            </div>
                            <div className="col-md-3">
                                <input
                                    className="form-control"
                                    name="complementos"
                                    placeholder="Complementos"
                                    value={form.complementos}
                                    onChange={alterar}
                                    required
                                />
                            </div>
                            <div className="col-md-2">
                                <input
                                    className="form-control text-uppercase"
                                    name="placa"
                                    placeholder="Placa"
                                    maxLength={7}
                                    value={form.placa}
                                    onChange={alterar}
                                    required
                                />
                            </div>
                            <div className="col-md-1 d-grid">
                                <button
                                    className="btn btn-primary"
                                    onClick={cadastrar}
                                    disabled={enviando}
                                >
                                    {enviando ? "..." : "Salvar"}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded p-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h2 className="h5 mb-0">Lista de carros ({filtrados.length})</h2>
                            <input
                                className="form-control w-auto"
                                placeholder="Filtrar por placa, modelo..."
                                value={filtro}
                                onChange={(e) => setFiltro(e.target.value)}
                            />
                        </div>

                        <div className="table-responsive">
                            <table className="table table-striped table-hover align-middle mb-0">
                                <thead className="table-dark">
                                    <tr>
                                        <th>Modelo</th>
                                        <th>Categoria</th>
                                        <th>Complementos</th>
                                        <th>Placa</th>
                                        <th className="text-end">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtrados.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center text-muted">
                                                Nenhum carro encontrado.
                                            </td>
                                        </tr>
                                    )}
                                    {filtrados.map((c, i) => (
                                        <tr key={c.id_carro ?? i}>
                                            <td>{c.modelo}</td>
                                            <td>{c.categoria}</td>
                                            <td>{c.complementos}</td>
                                            <td>{c.placa}</td>
                                            <td className="text-end">
                                                <button
                                                    className="btn btn-outline-primary btn-sm me-2"
                                                    onClick={() => verDetalhes(c.placa)}
                                                >
                                                    Detalhes
                                                </button>
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => excluir(c.placa)}
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
                                <h5 className="modal-title">{detalhe.modelo}</h5>
                                <button className="btn-close" onClick={() => setDetalhe(null)} />
                            </div>
                            <div className="modal-body">
                                <p className="mb-1"><strong>Placa:</strong> {detalhe.placa}</p>
                                <p className="mb-1"><strong>Categoria:</strong> {detalhe.categoria}</p>
                                <p className="mb-0"><strong>Complementos:</strong> {detalhe.complementos}</p>
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
        </>
    );
}