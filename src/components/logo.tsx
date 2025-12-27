import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="https://ik.imagekit.io/lwr4hqcxw/Alhuffaazhacademynigerialtd_1_.png"
      alt="Al-Huffaazh Academy Logo"
      width={64}
      height={64}
      className={className}
      aria-label="Al-Huffaazh Academy Logo"
      priority
    />
  );
}
