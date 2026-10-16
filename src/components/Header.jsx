import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const API = "http://localhost:5000";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/carros", label: "Carros" },
  { to: "/alugueis", label: "Aluguéis" },
  { to: "/clientes", label: "Clientes" },
  { to: "/funcionarios", label: "Funcionários", gerencia: true },
];

const AZUL = "#2a90b8";
const VERDE = "#247d4b";

function IconeCarro() {
  return (
    <svg width="26" height="26" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M2.52 3.515A2.5 2.5 0 0 1 4.82 2h6.362c1 0 1.904.596 2.298 1.515l.792 1.848c.075.175.21.319.38.404.5.25.855.715.965 1.262l.335 1.679q.05.242.049.49v.413c0 .814-.39 1.543-1 1.997V13.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1.338q-.36.058-.75.058h-5q-.39 0-.75-.058V13.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1.77c-.61-.454-1-1.183-1-1.997v-.413a3 3 0 0 1 .05-.49l.334-1.679c.11-.547.465-1.012.965-1.262a.8.8 0 0 0 .38-.404zM4.82 3a1.5 1.5 0 0 0-1.379.91l-.792 1.847a1.8 1.8 0 0 1-.853.904.8.8 0 0 0-.43.564L1.03 8.904a2 2 0 0 0-.034.318v.413c0 .81.65 1.466 1.45 1.466h11.108c.8 0 1.45-.656 1.45-1.466v-.413q0-.16-.034-.318l-.335-1.68a.8.8 0 0 0-.43-.563 1.8 1.8 0 0 1-.853-.904l-.792-1.848A1.5 1.5 0 0 0 11.18 3zM3.5 9.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2m9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2" />
    </svg>
  );
}

export default function Header() {
  const [aberto, setAberto] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const menuRef = useRef(null);
  const atual = window.location.pathname;

  function sair() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  useEffect(() => {
    axios
      .get(API + "/funcionarios/me", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      })
      .then((res) => setUsuario(res.data))
      .catch((error) => {
        if (error.response?.status === 401) sair();
      });
  }, []);

  useEffect(() => {
    function fora(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuUsuario(false);
      }
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  const links = LINKS.filter((l) => !l.gerencia || usuario?.cargo === "gerencia");
  const ehGerencia = usuario?.cargo === "gerencia";
  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark sticky-top shadow"
      style={{ backgroundColor: "#12263a", borderBottom: "3px solid " + AZUL }}
    >
      <div className="container">

        <a href="/dashboard" className="navbar-brand d-flex align-items-center gap-2 fw-semibold">
          <span
            className="d-inline-flex align-items-center justify-content-center rounded text-white"
            style={{
              width: 38,
              height: 38,
              background: `linear-gradient(135deg, ${AZUL}, ${VERDE})`,
            }}
          >
            <IconeCarro />
          </span>
          <span className="lh-1">
            Sistema Locadora
            <small className="d-block text-white-50 fw-normal" style={{ fontSize: 11 }}>
              Gestão de frota e aluguéis
            </small>
          </span>
        </a>
        <div className="dropdown ms-auto order-1 order-lg-3" ref={menuRef}>
          <button
            className="btn btn-link text-decoration-none text-white dropdown-toggle text-end p-0 d-flex flex-column align-items-end"
            type="button"
            onClick={() => setMenuUsuario(!menuUsuario)}
            aria-expanded={menuUsuario}
          >
            {usuario ? (
              <>
                <span
                  className="small fw-semibold text-truncate"
                  style={{ maxWidth: 160 }}
                  title={usuario.nome}
                >
                  {usuario.nome}
                </span>
                <span className="text-white-50 text-capitalize" style={{ fontSize: 11 }}>
                  {usuario.cargo}
                </span>
              </>
            ) : (
              <span className="placeholder-glow">
                <span className="placeholder rounded" style={{ width: 110 }} />
              </span>
            )}
          </button>

          <ul
            className={"dropdown-menu dropdown-menu-end shadow border-0 mt-2" + (menuUsuario ? " show" : "")}
            style={{ minWidth: 230 }}
          >
            {usuario && (
              <li className="px-3 py-2">
                <div className="fw-semibold">{usuario.nome}</div>
                <span className={"badge mt-1 text-capitalize " + (ehGerencia ? "bg-success" : "bg-secondary")}>
                  {usuario.cargo}
                </span>
              </li>
            )}
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <button className="dropdown-item text-danger" onClick={sair}>
                Sair do sistema
              </button>
            </li>
          </ul>
        </div>

        <button
          className="navbar-toggler border-0 order-2 order-lg-4 ms-2"
          type="button"
          onClick={() => setAberto(!aberto)}
          aria-label="Abrir menu"
          aria-expanded={aberto}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={"collapse navbar-collapse order-3 order-lg-2" + (aberto ? " show" : "")}>
          <ul className="navbar-nav nav-pills me-auto my-2 my-lg-0 gap-lg-1 ms-lg-4">
            {links.map((l) => (
              <li className="nav-item" key={l.to}>
                <a
                  href={l.to}
                  className={"nav-link px-3" + (atual === l.to ? " active" : "")}
                  style={atual === l.to ? { backgroundColor: AZUL } : undefined}
                  aria-current={atual === l.to ? "page" : undefined}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}