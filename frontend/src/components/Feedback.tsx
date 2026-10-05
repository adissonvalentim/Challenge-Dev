export function Feedback({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="feedback" role={retry ? "alert" : "status"}>
      <p>{message}</p>
      {retry && (
        <button className="button secondary" onClick={retry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}
