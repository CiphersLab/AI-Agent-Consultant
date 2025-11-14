import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  href?: string;
}

export function Logo({ size = 'md', showText = true, href = '/' }: LogoProps) {
  const sizes = {
    sm: { container: 'h-8', image: 32, text: 'text-sm' },
    md: { container: 'h-10', image: 40, text: 'text-base' },
    lg: { container: 'w-[130px] h-11', image: 130, text: 'text-lg' },
  };

  const content = (
    <div className="flex items-center gap-2">
      <div className={`relative ${sizes[size].container} aspect-square`}>
        <Image
          src="/Ciphers_lab_horizontal.png"
          alt="CiphersLab"
          width={sizes[size].image}
          height={sizes[size].image}
          className="object-contain"
        />
      </div>
      {/* {showText && (
        <span className={`font-bold text-gray-900 ${sizes[size].text}`}>
          CiphersLab
        </span>
      )} */}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}