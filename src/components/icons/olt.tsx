export default function OltIcon({
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
        <linearGradient id="topGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8ECF6" />
          <stop offset="100%" stopColor="#D6DBEA" />
        </linearGradient>
        <linearGradient id="sideGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C5CBE0" />
          <stop offset="100%" stopColor="#B7BED8" />
        </linearGradient>
        <linearGradient id="panelGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#20293A" />
          <stop offset="100%" stopColor="#1A2231" />
        </linearGradient>
        <linearGradient id="handleGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EAF0FF" />
          <stop offset="100%" stopColor="#B9C6E3" />
        </linearGradient>
      </defs>

      <polygon points="144,96 400,240 256,324 0,180" fill="url(#topGrad)" />
      <polygon points="0,180 256,324 256,476 0,332" fill="url(#sideGrad)" />
      <polygon points="256,324 400,240 400,392 256,476" fill="#9AA3BD" />

      <polygon points="192,128 352,216 240,280 80,192" fill="#D3D8EA" />

      <path d="M126 250c20-8 28-16 36-36 8 20 16 28 36 36-20 8-28 16-36 36-8-20-16-28-36-36z" fill="#FFFFFF" opacity="0.9" />

      <polygon points="256,324 480,200 480,360 256,476" fill="url(#panelGrad)" />

      <g opacity="0.5" stroke="#324157" strokeWidth={10} strokeLinecap="round">
        <line x1="300" y1="338" x2="444" y2="256" />
        <line x1="300" y1="370" x2="444" y2="288" />
        <line x1="300" y1="404" x2="444" y2="322" />
      </g>

      <rect x="452" y="238" width="28" height="22" rx="4" transform="skewY(-30)" fill="#FF5B61" />
      <rect x="452" y="268" width="28" height="22" rx="4" transform="skewY(-30)" fill="#2ED47A" />
      <rect x="452" y="298" width="28" height="22" rx="4" transform="skewY(-30)" fill="#58C5FF" />

      <rect x="272" y="350" width="12" height="18" transform="skewY(-30)" fill="#F3B562" />
      <rect x="272" y="382" width="12" height="18" transform="skewY(-30)" fill="#F3B562" />

      <path d="M268 362c0 18 8 24 18 18l8-4c6-4 10-10 10-18v-60c0-8-4-14-10-18l-8-4c-10-6-18 0-18 18v68z" fill="#162030" />
      <path d="M286 318c0-8 6-12 12-9l2 1c4 2 6 6 6 10v50c0 4-2 8-6 10l-2 1c-6 3-12-1-12-9v-54z" fill="url(#handleGrad)" />
      <rect x="294" y="327" width="8" height="44" rx="3" fill="#FFFFFF" opacity="0.75" />

      <path d="M456 258c0 18 8 24 18 18l8-4c6-4 10-10 10-18v-60c0-8-4-14-10-18l-8-4c-10-6-18 0-18 18v68z" fill="#162030" />
      <path d="M474 214c0-8 6-12 12-9l2 1c4 2 6 6 6 10v50c0 4-2 8-6 10l-2 1c-6 3-12-1-12-9v-54z" fill="url(#handleGrad)" />
      <rect x="482" y="223" width="8" height="44" rx="3" fill="#FFFFFF" opacity="0.75" />
    </svg>
  );
}
