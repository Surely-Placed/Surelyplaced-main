import Image from 'next/image';

export default function LandingGlow({ style = {} }) {
  return (
    <Image
      src="/landing/glow-gradient.png"
      alt=""
      width={1300}
      height={900}
      aria-hidden
      priority={false}
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        WebkitMaskImage: 'radial-gradient(closest-side, #000 55%, transparent)',
        maskImage: 'radial-gradient(closest-side, #000 55%, transparent)',
        animation: 'sp-glow 9s ease-in-out infinite',
        height: 'auto',
        ...style,
      }}
    />
  );
}
