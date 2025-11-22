import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <Image
        src="/logo.png"
        alt="VyraLab"
        width={160}
        height={160}
        className="transition-transform group-hover:scale-105 h-12 sm:h-14 w-auto"
        priority
      />
    </Link>
  );
}
