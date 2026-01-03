export default function OntIcon({
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 512 512"
      {...props}
    >
      <defs>
        <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5C5E6B" />
          <stop offset="100%" stopColor="#4A4C57" />
        </linearGradient>
        <linearGradient id="antennaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5B5D69" />
          <stop offset="100%" stopColor="#3E404A" />
        </linearGradient>
        <linearGradient id="slotGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2E3140" />
          <stop offset="100%" stopColor="#212432" />
        </linearGradient>
      </defs>

      <rect x="72" y="92" width="32" height="280" rx="16" fill="url(#antennaGrad)" />
      <rect x="408" y="92" width="32" height="280" rx="16" fill="url(#antennaGrad)" />

      <g fill="none" stroke="#5393FF" strokeWidth={28} strokeLinecap="round">
        <path d="M128 142c100-82 256-82 356 0" />
        <path d="M176 186c74-60 182-60 256 0" />
        <path d="M236 232c40-34 100-34 140 0" />
        <circle cx="306" cy="288" r="16" fill="#5393FF" stroke="none" />
      </g>

      <rect x="36" y="300" width="440" height="140" rx="28" fill="url(#baseGrad)" />
      <rect x="56" y="320" width="400" height="100" rx="22" fill="#5A5D68" opacity="0.28" />

      <rect x="236" y="324" width="40" height="28" rx="6" fill="#A9F0D1" />
      <rect x="176" y="386" width="160" height="18" rx="9" fill="url(#slotGrad)" />

      <rect x="80" y="440" width="40" height="28" rx="6" fill="#30323C" />
      <rect x="392" y="440" width="40" height="28" rx="6" fill="#30323C" />

      <circle cx="96" cy="388" r="9" fill="#FFB14A" />
      <circle cx="128" cy="388" r="9" fill="#7ED957" />
      <circle cx="416" cy="388" r="9" fill="#9A8BFF" />
      <circle cx="444" cy="388" r="9" fill="#7C73FF" />
    </svg>
  );
}
