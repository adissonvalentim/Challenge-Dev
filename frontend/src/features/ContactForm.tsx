import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Contact, ContactInput } from "../api/types";

export function ContactForm({ contact, onClose, onSaved }: {
  contact: Contact | null;
  onClose: () => void;
  onSaved: (contact: Contact) => void;
}) {
  const [name, setName] = useState(contact?.name ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [segment, setSegment] = useState(contact?.segment ?? "");
  const nameInput = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  useEffect(() => { nameInput.current?.focus(); }, []);
  const mutation = useMutation({
    mutationFn: (input: ContactInput) => contact
      ? api.updateContact(contact.id, input)
      : api.createContact(input),
    onSuccess: async saved => {
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
      onSaved(saved);
    },
  });

  return <section className="contact-form" aria-labelledby="form-title">
    <h2 id="form-title">{contact ? "Editar contato" : "Novo contato"}</h2>
    <p>Nome e e-mail são obrigatórios. O segmento é opcional.</p>
    <form onSubmit={event => {
      event.preventDefault();
      mutation.mutate({ name: name.trim(), email: email.trim(), segment: segment.trim() || null });
    }}>
      <fieldset disabled={mutation.isPending}>
        <legend className="sr-only">Dados do contato</legend>
        <div className="form-fields">
          <label>Nome<input ref={nameInput} name="name" autoComplete="name" required value={name} onChange={event => setName(event.target.value)} /></label>
          <label>E-mail<input name="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>
          <label>Segmento <span>(opcional)</span><input name="segment" value={segment} onChange={event => setSegment(event.target.value)} /></label>
        </div>
        {mutation.isError && <p className="form-error" role="alert">{mutation.error.message}</p>}
        <div className="form-actions">
          <button type="submit" className="button primary">{mutation.isPending ? "Salvando…" : "Salvar contato"}</button>
          <button type="button" className="button secondary" onClick={onClose}>Cancelar</button>
        </div>
      </fieldset>
    </form>
  </section>;
}
