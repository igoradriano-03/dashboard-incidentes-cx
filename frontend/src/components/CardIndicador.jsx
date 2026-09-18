export default function CardIndicador({ titulo, valor, destaque = false }) {
  return (
    <div className={`card-indicador${destaque ? ' card-indicador-destaque' : ''}`}>
      <span className="card-indicador-titulo">{titulo}</span>
      <span className="card-indicador-valor">{valor}</span>
    </div>
  );
}
