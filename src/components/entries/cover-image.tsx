import Image from "next/image";

type CoverImageProps = {
  src: string | null;
  alt: string;
  sizes: string;
  preload?: boolean;
  className?: string;
};

/** Portada en proporción 2:3; si no hay imagen muestra el título como marcador. */
export function CoverImage({ src, alt, sizes, preload, className = "" }: CoverImageProps) {
  return (
    <div
      className={`relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-surface ${className}`}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} preload={preload} className="object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center p-3 text-center text-sm font-medium text-muted">
          {alt}
        </div>
      )}
    </div>
  );
}
