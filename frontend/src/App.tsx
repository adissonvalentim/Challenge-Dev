import { useState } from "react";
import { Activity, ChartNoAxesCombined, Users } from "lucide-react";
import { Summary } from "./features/Summary";
import { Contacts } from "./features/Contacts";

export function App() {
  const [view, setView] = useState<"summary" | "contacts">("summary");
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
          <button
            aria-current={view === "summary" ? "page" : undefined}
            onClick={() => setView("summary")}
          >
            <ChartNoAxesCombined size={20} aria-hidden="true" />
            Resumo
          </button>
          <button
            aria-current={view === "contacts" ? "page" : undefined}
            onClick={() => setView("contacts")}
          >
            <Users size={20} aria-hidden="true" />
            Contatos
          </button>
        </nav>
        <p className="sidebar-description">Satisfação começa com escuta.</p>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>Vita Bem-Estar</span>
          <span>Customer Experience</span>
        </header>
        <main id="main-content" tabIndex={-1}>
          <div hidden={view !== "summary"}>
            <Summary />
          </div>
          <div hidden={view !== "contacts"}>
            <Contacts />
          </div>
        </main>
        <footer>Mini CX · Vita Bem-Estar</footer>
      </div>
    </div>
  );
}
