export default function LoadingSpinner({ texto = 'Carregando...' }) {
  return (
    <div className="estado-carregamento">
      <div className="spinner" />
      <p>{texto}</p>
    </div>
  );
}
