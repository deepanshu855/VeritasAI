import iconUrl from "../../../assets/veritasai-icon.png";

export default function BrandLogo({ size = 32, withName = true }) {
  return (
    <span className="vbrand">
      <img
        src={iconUrl}
        alt={withName ? "" : "VeritasAI"}
        width={size}
        height={size}
        className="vbrand-mark"
      />
      {withName && <span className="vbrand-name">VeritasAI</span>}
    </span>
  );
}

