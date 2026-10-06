import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { api } from "../api/client";
import { Feedback } from "../components/Feedback";

const integer = new Intl.NumberFormat("pt-BR");
const percentage = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function Summary() {
  const query = useQuery({
    queryKey: ["summary"],
    queryFn: ({ signal }) => api.summary(signal),
  });
  const data = query.data;
  return (
    <section aria-labelledby="summary-title">
      <div className="page-heading">
        <div>
          <h1 id="summary-title">Resumo de satisfação</h1>
          <p>Uma visão das respostas dos seus alunos.</p>
        </div>
        <button
          className="button secondary"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw size={17} aria-hidden="true" />
          {query.isFetching ? "Atualizando…" : "Atualizar"}
        </button>
      </div>
      {query.isPending && (
        <Feedback message="Carregando o resumo de satisfação…" />
      )}
      {query.isError && (
        <Feedback
          message={query.error.message}
          retry={() => void query.refetch()}
        />
      )}
      {data && (
        <>
          {data.responsesCount === 0 && (
            <Feedback message="Ainda não há respostas válidas para apresentar." />
          )}
          <div className="metrics">
            <article className="metric nps">
              <h2>NPS geral</h2>
              <strong>{data.npsResponses ? data.npsScore : "—"}</strong>
              <p>
                {data.npsResponses
                  ? `${integer.format(data.npsResponses)} respostas NPS`
                  : "Sem respostas NPS"}
              </p>
            </article>
            <article className="metric">
              <h2>Respostas válidas</h2>
              <strong>{integer.format(data.responsesCount)}</strong>
              <p>Todas as pesquisas</p>
            </article>
            <article className="metric">
              <h2>Média CSAT</h2>
              <strong>
                {data.csatAvg === null
                  ? "—"
                  : data.csatAvg.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
              </strong>
              <p>
                {data.csatAvg === null
                  ? "Sem respostas CSAT"
                  : "Escala de 1 a 5"}
              </p>
            </article>
          </div>
          <article className="distribution">
            <div className="section-heading">
              <h2>Como os alunos responderam</h2>
              <span>Pesquisas NPS</span>
            </div>
            <div className="distribution-bar" aria-hidden="true">
              {(["promoters", "neutrals", "detractors"] as const).map((key) => (
                <div
                  key={key}
                  className={key}
                  style={{
                    width: `${data.npsResponses ? (data[key].count / data.npsResponses) * 100 : 0}%`,
                  }}
                />
              ))}
            </div>
            <dl className="distribution-details">
              {(
                [
                  {
                    key: "promoters",
                    label: "Promotores",
                    scale: "Notas 9–10",
                  },
                  { key: "neutrals", label: "Neutros", scale: "Notas 7–8" },
                  {
                    key: "detractors",
                    label: "Detratores",
                    scale: "Notas 0–6",
                  },
                ] as const
              ).map((item) => (
                <div key={item.key}>
                  <dt>
                    <span className={`dot ${item.key}`} aria-hidden="true" />
                    {item.label}
                  </dt>
                  <dd>
                    <strong>{percentage.format(data[item.key].pct)}%</strong>
                    <span>
                      {integer.format(data[item.key].count)} respostas ·{" "}
                      {item.scale}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="note">
              O NPS considera apenas pesquisas de escala 0–10. Respostas e
              contatos excluídos ficam fora dos indicadores.
            </p>
          </article>
        </>
      )}
    </section>
  );
}
