import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { Feedback } from "../components/Feedback";

const classes = { Promotor: "promoter", Neutro: "neutral", Detrator: "detractor" };

export function ContactSatisfactionPanel({ id }: { id: number }) {
  const query = useQuery({
    queryKey: ["satisfaction", id],
    queryFn: ({ signal }) => api.satisfaction(id, signal),
  });
  const data = query.data;
  return <section className="contact-satisfaction" aria-labelledby="satisfaction-title">
    <div className="satisfaction-heading">
      <h2 id="satisfaction-title">Satisfação do aluno</h2>
      {data && <span>{data.responsesCount.toLocaleString("pt-BR")} {data.responsesCount === 1 ? "resposta" : "respostas"}</span>}
    </div>
    {query.isPending && <Feedback message="Carregando a satisfação do aluno…" />}
    {query.isError && <Feedback message={query.error.message} retry={() => void query.refetch()} />}
    {data && <>
      <div className="latest-nps">
        <span>Classificação NPS mais recente</span>
        <strong className={data.latestNpsClass ? classes[data.latestNpsClass] : "unclassified"}>{data.latestNpsClass ?? "Sem resposta NPS"}</strong>
      </div>
      <dl className="student-nps-counts">
        <div><dt><span className="dot promoters" aria-hidden="true" />Promotoras</dt><dd>{data.promoters}</dd></div>
        <div><dt><span className="dot neutrals" aria-hidden="true" />Neutras</dt><dd>{data.neutrals}</dd></div>
        <div><dt><span className="dot detractors" aria-hidden="true" />Detratoras</dt><dd>{data.detractors}</dd></div>
      </dl>
      {data.responsesCount === 0 && <p className="satisfaction-empty">Este aluno ainda não tem respostas válidas.</p>}
    </>}
  </section>;
}
