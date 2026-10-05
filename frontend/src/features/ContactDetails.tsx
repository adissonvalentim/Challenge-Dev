import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { api } from "../api/client";
import type { Contact } from "../api/types";
import { Feedback } from "../components/Feedback";
import { ContactForm } from "./ContactForm";
import { ContactSatisfactionPanel } from "./ContactSatisfactionPanel";
import { ContactHistory } from "./ContactHistory";

export function ContactDetails({ id, onBack, onDelete, onSaved, busy }: {
  id: number;
  onBack: () => void;
  onDelete: (contact: Contact, trigger: HTMLButtonElement) => void;
  busy: boolean;
  onSaved: (contact: Contact) => void;
}) {
  const query = useQuery({
    queryKey: ["contact", id],
    queryFn: ({ signal }) => api.contact(id, signal),
  });
  const contact = query.data;
  return <section className="contact-details" aria-label="Detalhes do contato">
    <button className="button secondary back-button" disabled={busy} onClick={onBack}><ArrowLeft size={18} aria-hidden="true" />Voltar aos contatos</button>
    {query.isPending && <Feedback message="Carregando os dados do contato…" />}
    {query.isError && <Feedback message={query.error.message} retry={() => void query.refetch()} />}
    {contact && <>
      <div className="page-heading contact-profile-heading">
        <div className="contact-profile">
          <span className="contact-initials large" aria-hidden="true">{contact.name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]).join("")}</span>
          <div><h1>{contact.name}</h1><p>{contact.email}</p></div>
        </div>
        <button className="button danger" disabled={busy} onClick={event => onDelete(contact, event.currentTarget)}><Trash2 size={16} aria-hidden="true" />Excluir contato</button>
      </div>
      <div className="contact-detail-grid">
        <ContactForm key={contact.id} contact={contact} disabled={busy} onClose={onBack} onSaved={onSaved} />
        <div className="contact-insights">
          <ContactSatisfactionPanel id={contact.id} />
          <ContactHistory contact={contact} focusOnOpen={false} />
        </div>
      </div>
    </>}
  </section>;
}
