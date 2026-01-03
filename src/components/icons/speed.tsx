export default function SpeedIcon({
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" {...props}>
      <path d="M16 320a240 240 0 0 1 480 0" fill="#152C40" opacity=".08" />
      <path d="M16 320A240 240 0 0 1 101.73 136.16L140.3 182.1A180 180 0 0 0 76 320Z" fill="#E3443E" />
      <path d="M101.73 136.16A240 240 0 0 1 410.27 136.16L371.7 182.1A180 180 0 0 0 140.3 182.1Z" fill="#F6CB53" />
      <path d="M410.27 136.16A240 240 0 0 1 496 320H436A180 180 0 0 0 371.7 182.1Z" fill="#55CC8A" />
      <path d="M106 320a150 150 0 0 1 300 0" stroke="#4B5670" strokeWidth={14} fill="none" />
      <line x1="256" y1="320" x2="420" y2="230" stroke="#0F2F43" strokeWidth={28} strokeLinecap="round" />
      <polygon points="440,220 402,242 421,205" fill="#0F2F43" />
      <circle cx="256" cy="320" r="42" fill="#0A3A52" />
    </svg>
  );
}
