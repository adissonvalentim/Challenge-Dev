import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, Plus } from "lucide-react";
import { api } from "../api/client";
import { Feedback } from "../components/Feedback";
import { ContactHistory } from "./ContactHistory";
import { ContactForm } from "./ContactForm";
import type { Contact } from "../api/types";

export function Contacts() {
  const [editor, setEditor] = useState<{ contact: Contact | null } | null>(null);
  const [history, setHistory] = useState<Contact | null>(null);
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const deleteTitle = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (deleting) deleteTitle.current?.focus(); }, [deleting]);
  const deletion = useMutation({
    mutationFn: (contact: Contact) => api.deleteContact(contact.id),
    onSuccess: async () => {
      setDeleting(null);
      setEditor(null);
      setHistory(null);
      setNotice("Contato excluído com sucesso.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["contacts"] }),
        queryClient.invalidateQueries({ queryKey: ["summary"] }),
        queryClient.invalidateQueries({ queryKey: ["responses"] }),
      ]);
    },
  });
  const [notice, setNotice] = useState("");
  const editorTrigger = useRef<HTMLButtonElement | null>(null);
  const closeEditor = () => { setEditor(null); editorTrigger.current?.focus(); };
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
  useEffect(() => {
    if (data && page > Math.max(1, Math.ceil(data.total / 20))) {
      setPage(Math.max(1, Math.ceil(data.total / 20)));
    }
  }, [data, page]);
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / 20));
  return (
    <section aria-labelledby="contacts-title">
      <div className="page-heading">
        <div>
          <h1 id="contacts-title">Contatos</h1>
          <p>Encontre os alunos da Vita Bem-Estar.</p>
        </div>
        <button className="button primary" onClick={event => {
          editorTrigger.current = event.currentTarget;
          setNotice("");
          setDeleting(null);
          setHistory(null);
          setEditor({ contact: null });
        }}><Plus size={18} aria-hidden="true" />Novo contato</button>
      </div>
      {notice && <p className="success-notice" role="status">{notice}</p>}
      {history && <ContactHistory key={history.id} contact={history} onClose={() => {
        setHistory(null);
        editorTrigger.current?.focus();
      }} />}
      {deleting && <section className="contact-form" aria-labelledby="delete-title">
        <h2 id="delete-title" ref={deleteTitle} tabIndex={-1}>Excluir {deleting.name}?</h2>
        <p>O contato e suas respostas deixarão de aparecer na lista, no histórico e nos indicadores.</p>
        {deletion.isError && <p className="form-error" role="alert">{deletion.error.message}</p>}
        <div className="form-actions">
          <button className="button danger" disabled={deletion.isPending} onClick={() => deletion.mutate(deleting)}>{deletion.isPending ? "Excluindo…" : "Confirmar exclusão"}</button>
          <button className="button secondary" disabled={deletion.isPending} onClick={() => { setDeleting(null); editorTrigger.current?.focus(); }}>Cancelar</button>
        </div>
      </section>}
      {editor && <ContactForm key={editor.contact?.id ?? "new"} contact={editor.contact} onClose={closeEditor} onSaved={saved => {
        setNotice(editor.contact ? "Contato atualizado com sucesso." : "Contato criado com sucesso.");
        setSearch(saved.email);
        setAppliedSearch(saved.email);
        setPage(1);
        closeEditor();
      }} />}
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
                  <th scope="col">Ações</th>
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
                    <td><div className="row-actions">
                      <button className="button secondary" aria-label={`Histórico de ${contact.name}`} onClick={event => {
                        editorTrigger.current = event.currentTarget;
                        setEditor(null);
                        setDeleting(null);
                        setNotice("");
                        setHistory(contact);
                      }}>Histórico</button><button className="button secondary" aria-label={`Editar ${contact.name}`} onClick={event => {
                      editorTrigger.current = event.currentTarget;
                      setNotice("");
                      setDeleting(null);
                      setHistory(null);
                      setEditor({ contact });
                    }}>Editar</button>
                      <button className="button danger" aria-label={`Excluir ${contact.name}`} onClick={event => {
                        editorTrigger.current = event.currentTarget;
                        deletion.reset();
                        setEditor(null);
                        setNotice("");
                        setHistory(null);
                        setDeleting(contact);
                      }}>Excluir</button></div></td>
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
