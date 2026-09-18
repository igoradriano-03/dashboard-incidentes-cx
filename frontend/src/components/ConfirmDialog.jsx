export default function ConfirmDialog({ titulo, mensagem, onConfirmar, onCancelar }) {
  return (
    <div className="modal-fundo" onClick={onCancelar}>
      <div className="modal-caixa" onClick={(e) => e.stopPropagation()}>
        <h3>{titulo}</h3>
        <p>{mensagem}</p>
        <div className="modal-acoes">
          <button className="botao-secundario" onClick={onCancelar}>Cancelar</button>
          <button className="botao-perigo" onClick={onConfirmar}>Confirmar exclusão</button>
        </div>
      </div>
    </div>
  );
}
