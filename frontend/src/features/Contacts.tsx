import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, Plus, Trash2 } from "lucide-react";
import { api } from "../api/client";
import { Feedback } from "../components/Feedback";
import { ContactDetails } from "./ContactDetails";
import { ContactForm } from "./ContactForm";
import type { Contact } from "../api/types";

export function Contacts() {
  const [editor, setEditor] = useState<{ contact: Contact | null } | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const backToList = () => {
    setSelectedId(null);
    window.requestAnimationFrame(() => document.getElementById("contacts-title")?.focus());
  };
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const deleteTitle = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (deleting) deleteTitle.current?.focus(); }, [deleting]);
  const deletion = useMutation({
    mutationFn: (contact: Contact) => api.deleteContact(contact.id),
    onSuccess: async () => {
      setDeleting(null);
      setEditor(null);
      backToList();
      setNotice("Contato excluído com sucesso.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["contacts"] }),
        queryClient.invalidateQueries({ queryKey: ["summary"] }),
        queryClient.invalidateQueries({ queryKey: ["responses"] }),
        queryClient.invalidateQueries({ queryKey: ["contact"] }),
        queryClient.invalidateQueries({ queryKey: ["satisfaction"] }),
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
    const confirmation = deleting && <section className="contact-form" aria-labelledby="delete-title">
        <h2 id="delete-title" ref={deleteTitle} tabIndex={-1}>Excluir {deleting.name}?</h2>
        <p>O contato e suas respostas deixarão de aparecer na lista, no histórico e nos indicadores.</p>
        {deletion.isError && <p className="form-error" role="alert">{deletion.error.message}</p>}
        <div className="form-actions">
          <button className="button danger" disabled={deletion.isPending} onClick={() => deletion.mutate(deleting)}>{deletion.isPending ? "Excluindo…" : "Confirmar exclusão"}</button>
          <button className="button secondary" disabled={deletion.isPending} onClick={() => { setDeleting(null); editorTrigger.current?.focus(); }}>Cancelar</button>
        </div>
      </section>;
  const openDelete = (contact: Contact, trigger?: HTMLButtonElement) => {
    if (trigger) editorTrigger.current = trigger;
    deletion.reset();
    setNotice("");
    setDeleting(contact);
  };
  if (selectedId !== null) return <>
    {notice && <p className="success-notice" role="status">{notice}</p>}
    {confirmation}
    <ContactDetails busy={deletion.isPending} id={selectedId} onBack={backToList} onDelete={openDelete} onSaved={saved => {
      queryClient.setQueryData(["contact", saved.id], saved);
      setNotice("Contato atualizado com sucesso.");
    }} />
  </>;
  return (
    <section aria-labelledby="contacts-title">
      <div className="page-heading">
        <div>
          <h1 id="contacts-title" tabIndex={-1}>Contatos</h1>
          <p>Encontre os alunos da Vita Bem-Estar.</p>
        </div>
        <button className="button primary" disabled={deletion.isPending} onClick={event => {
          editorTrigger.current = event.currentTarget;
          setNotice("");
          setDeleting(null);
          setEditor({ contact: null });
        }}><Plus size={18} aria-hidden="true" />Novo contato</button>
      </div>
      {notice && <p className="success-notice" role="status">{notice}</p>}
      {confirmation}
      {editor && <ContactForm key={editor.contact?.id ?? "new"} contact={editor.contact} onClose={closeEditor} onSaved={saved => {
        setNotice(editor.contact ? "Contato atualizado com sucesso." : "Contato criado com sucesso.");
        queryClient.setQueryData(["contact", saved.id], saved);
        setEditor(null);
        setSelectedId(saved.id);
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
                  <th scope="col">Segmento</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((contact) => (
                  <tr key={contact.id} className="contact-row" onClick={event => {
                    const target = event.target;
                    if (deletion.isPending || window.getSelection()?.toString()) return;
                    if (target instanceof Element && target.closest("button, a, input, select, textarea")) return;
                    setNotice("");
                    setSelectedId(contact.id);
                  }}>
                    <td className="contact-name">
                      <div className="contact-identity">
                        <span className="contact-initials" aria-hidden="true">{contact.name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]).join("")}</span>
                        <div className="contact-labels">
                          <span className="contact-open">{contact.name}</span>
                          <span className="contact-email">{contact.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {contact.segment ? (
                        <span className="segment">{contact.segment}</span>
                      ) : (
                        "Sem segmento"
                      )}
                    </td>
                    <td><div className="row-actions">
                      <button className="button secondary" disabled={deletion.isPending} aria-label={`Ver contato ${contact.name}`} onClick={() => { setNotice(""); setSelectedId(contact.id); }}>Ver contato<ChevronRight size={16} aria-hidden="true" /></button>
                      <button className="button danger icon-button" disabled={deletion.isPending} aria-label={`Excluir ${contact.name}`} title={`Excluir ${contact.name}`} onClick={event => {
                        event.stopPropagation();
                        editorTrigger.current = event.currentTarget;
                        openDelete(contact);
                      }}><Trash2 size={16} aria-hidden="true" /></button>
                    </div></td>
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
