import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/carros", label: "Carros" },
  { to: "/alugueis", label: "Aluguéis" },
  { to: "/clientes", label: "Clientes" },
];

export default function Header() {
  const [aberto, setAberto] = useState(false);
  const atual = window.location.pathname;

  function sair() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <span className="navbar-brand">Sistema Locadora</span>

        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setAberto(!aberto)}
          aria-label="Abrir menu"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={"collapse navbar-collapse" + (aberto ? " show" : "")}>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {LINKS.map((l) => (
              <li className="nav-item" key={l.to}>
                <a
                  href={l.to}
                  className={"nav-link" + (atual === l.to ? " active" : "")}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <button className="btn btn-danger btn-sm" onClick={sair}>
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}