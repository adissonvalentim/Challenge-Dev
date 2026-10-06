import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Contact } from "../api/types";
import { Feedback } from "../components/Feedback";

const date = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function ContactHistory({ contact, onClose, focusOnOpen = true }: {
  contact: Contact;
  onClose?: () => void;
  focusOnOpen?: boolean;
}) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (focusOnOpen) title.current?.focus(); }, [focusOnOpen]);
  const query = useQuery({
    queryKey: ["responses", contact.id],
    queryFn: ({ signal }) => api.responses(contact.id, signal),
  });

  return <section className="contact-history" aria-labelledby="history-title">
    <div className="section-heading">
      <h2 id="history-title" ref={title} tabIndex={-1}>Histórico de {contact.name}</h2>
      {onClose && <button className="button secondary" onClick={onClose}>Fechar histórico</button>}
    </div>
    <p className="note">Respostas mais recentes primeiro. Datas em UTC.</p>
    {query.isPending && <Feedback message="Carregando o histórico…" />}
    {query.isError && <Feedback message={query.error.message} retry={() => void query.refetch()} />}
    {query.data?.length === 0 && <Feedback message="Este contato ainda não tem respostas válidas." />}
    {query.data && query.data.length > 0 && <ol className="response-list">
      {query.data.map(response => <li key={response.id}>
        <div className="response-heading">
          <div className="response-survey">
            <h3>{response.surveyName}</h3>
            <p className="response-meta"><time dateTime={response.respondedAt}>{date.format(new Date(response.respondedAt))} UTC</time></p>
            <span className="response-channel">Canal: {response.channel}</span>
          </div>
          <div className="response-score">
            <span>Nota {response.surveyType}</span>
            <strong>{response.score}<span>/{response.surveyType === "NPS" ? 10 : 5}</span></strong>
          </div>
        </div>
        <div className={`response-comment-area${response.comment === null ? " without-comment" : ""}`}>
          <span>Comentário</span>
          <p className="response-comment">{response.comment ?? "Sem comentário."}</p>
        </div>
      </li>)}
    </ol>}
  </section>;
}
