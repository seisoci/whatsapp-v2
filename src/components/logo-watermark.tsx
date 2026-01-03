import Image from 'next/image';

export default function LogoWatermark() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-5">
      <div className="absolute inset-0 grid grid-cols-4 md:grid-cols-8 p-4 -rotate-45 scale-150">
        {Array.from({ length: 64 }).map((_, index) => (
          <div key={index} className="flex items-center justify-center">
            <Image
              src="/logo-itn-with-name.svg"
              alt=""
              width={130}
              height={34}
              className="object-contain w-20 md:w-32"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
