import { Activity, ChartNoAxesCombined } from "lucide-react";
import { Summary } from "./features/Summary";

export function App() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Ir para o conteúdo
      </a>
      <aside className="sidebar">
        <div className="brand">
          <Activity size={30} aria-hidden="true" />
          <span>
            vita<strong>bem-estar</strong>
          </span>
        </div>
        <nav aria-label="Navegação principal">
          <a href="#main-content" aria-current="page">
            <ChartNoAxesCombined size={20} aria-hidden="true" /> Resumo
          </a>
        </nav>
        <p className="sidebar-description">Satisfação começa com escuta.</p>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>Vita Bem-Estar</span>
          <span>Customer Experience</span>
        </header>
        <main id="main-content" tabIndex={-1}>
          <Summary />
        </main>
        <footer>Mini CX · Vita Bem-Estar</footer>
      </div>
    </div>
  );
}
