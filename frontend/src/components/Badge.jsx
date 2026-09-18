export default function Badge({ texto, cor = '#0B2545' }) {
  return (
    <span
      className="badge"
      style={{
        backgroundColor: `${cor}1F`,
        color: cor,
        border: `1px solid ${cor}55`,
      }}
    >
      {texto}
    </span>
  );
}
