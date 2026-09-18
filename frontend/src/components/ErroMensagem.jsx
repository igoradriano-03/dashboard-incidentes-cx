export default function ErroMensagem({ mensagem, onTentarNovamente }) {
  return (
    <div className="estado-erro">
      <p>{mensagem}</p>
      {onTentarNovamente && (
        <button className="botao-secundario" onClick={onTentarNovamente}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}
