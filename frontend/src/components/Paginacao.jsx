export default function Paginacao({ pagina, totalPaginas, total, onMudarPagina }) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="paginacao">
      <span className="paginacao-info">{total} registro(s) — página {pagina} de {totalPaginas}</span>
      <div className="paginacao-botoes">
        <button
          className="botao-secundario"
          disabled={pagina <= 1}
          onClick={() => onMudarPagina(pagina - 1)}
        >
          Anterior
        </button>
        <button
          className="botao-secundario"
          disabled={pagina >= totalPaginas}
          onClick={() => onMudarPagina(pagina + 1)}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
