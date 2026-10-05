import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { api } from "../api/client";
import { Feedback } from "../components/Feedback";

export function Contacts() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedSearch(search);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  const query = useQuery({
    queryKey: ["contacts", appliedSearch, page],
    queryFn: ({ signal }) => api.contacts(appliedSearch, page, 20, signal),
  });
  const data = query.data;
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / 20));
  return (
    <section aria-labelledby="contacts-title">
      <div className="page-heading">
        <div>
          <h1 id="contacts-title">Contatos</h1>
          <p>Encontre os alunos da Vita Bem-Estar.</p>
        </div>
      </div>
      <div className="contact-list">
        <div className="search-row">
          <label className="search-field">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Buscar por nome ou e-mail</span>
            <input
              type="search"
              placeholder="Buscar por nome ou e-mail"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <span role="status">
            {query.isFetching ? "Buscando…" : `${data?.total ?? 0} ${(data?.total ?? 0) === 1 ? "contato" : "contatos"}`}
          </span>
        </div>
        {query.isPending && <Feedback message="Carregando contatos…" />}
        {query.isError && (
          <Feedback
            message={query.error.message}
            retry={() => void query.refetch()}
          />
        )}
        {data && data.items.length === 0 && (
          <Feedback
            message={
              appliedSearch
                ? "Nenhum contato encontrado. Tente outro nome ou e-mail."
                : "Ainda não há contatos cadastrados."
            }
          />
        )}
        {data && data.items.length > 0 && (
          <div className="table-scroll">
            <table>
              <caption className="sr-only">
                Contatos ativos, página {page}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">E-mail</th>
                  <th scope="col">Segmento</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((contact) => (
                  <tr key={contact.id}>
                    <td className="contact-name">{contact.name}</td>
                    <td>{contact.email}</td>
                    <td>
                      {contact.segment ? (
                        <span className="segment">{contact.segment}</span>
                      ) : (
                        "Sem segmento"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && (
          <div className="pagination">
            <span>
              Página {page} de {pages}
            </span>
            <div>
              <button
                className="button secondary"
                aria-label="Página anterior"
                disabled={page === 1 || query.isFetching}
                onClick={() => setPage((value) => value - 1)}
              >
                <ChevronLeft size={18} aria-hidden="true" />
                Anterior
              </button>
              <button
                className="button secondary"
                aria-label="Próxima página"
                disabled={page >= pages || query.isFetching}
                onClick={() => setPage((value) => value + 1)}
              >
                Próxima
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
