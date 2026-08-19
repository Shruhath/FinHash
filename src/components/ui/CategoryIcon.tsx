import { resolveCategoryIcon } from "../../lib/categoryIcons";

interface Props {
  name?: string;
  color: string;
  size?: number;
  /** Renders the tinted rounded tile behind the glyph. */
  tile?: boolean;
  tileSize?: number;
}

/** Resolves a stored lucide icon name to a component, with a safe fallback. */
export default function CategoryIcon({
  name,
  color,
  size = 18,
  tile = true,
  tileSize = 40,
}: Props) {
  const Glyph = resolveCategoryIcon(name);
  const glyph = <Glyph size={size} strokeWidth={2} />;

  if (!tile) return <span style={{ color, display: "flex" }}>{glyph}</span>;

  return (
    <span
      className="category-icon"
      style={{
        width: tileSize,
        height: tileSize,
        color,
        backgroundColor: `${color}1f`,
        boxShadow: `inset 0 0 0 1px ${color}2e`,
      }}
    >
      {glyph}
    </span>
  );
}
