interface LogoProps {
  size?: number;
  /** Renders the wordmark next to the glyph. */
  withWordmark?: boolean;
  /** Spin the glyph — used on loading screens. */
  animated?: boolean;
  className?: string;
}

/** The FinHash "#" — two slanted strokes layered over two flat ones. */
export function LogoMark({ size = 28, animated = false }: LogoProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      role="img"
      aria-label="FinHash"
      className={animated ? "logo-mark logo-mark--animated" : "logo-mark"}
    >
      <defs>
        <linearGradient id="fh-v" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#FFA05C" />
          <stop offset="100%" stopColor="#E86A0A" />
        </linearGradient>
        <linearGradient id="fh-h" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%" stopColor="#B34900" />
          <stop offset="100%" stopColor="#CC5500" />
        </linearGradient>
      </defs>
      <g fill="url(#fh-h)">
        <rect x="96" y="182" width="320" height="48" rx="24" />
        <rect x="96" y="296" width="320" height="48" rx="24" />
      </g>
      <g
        fill="url(#fh-v)"
        transform="translate(256,256) skewX(-12) translate(-256,-256)"
      >
        <rect x="174" y="96" width="48" height="320" rx="24" />
        <rect x="290" y="96" width="48" height="320" rx="24" />
      </g>
    </svg>
  );
}

export default function Logo({
  size = 28,
  withWordmark = true,
  animated,
  className = "",
}: LogoProps) {
  return (
    <span className={`logo ${className}`}>
      <LogoMark size={size} animated={animated} />
      {withWordmark && (
        <span className="logo__word" style={{ fontSize: size * 0.66 }}>
          Fin<span className="logo__word-accent">Hash</span>
        </span>
      )}
    </span>
  );
}
