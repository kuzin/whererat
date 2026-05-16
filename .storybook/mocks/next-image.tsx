import { type ImgHTMLAttributes } from "react";

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  style?: React.CSSProperties;
};

export default function NextImage({ src, alt, fill, width, height, style, className, ...props }: ImageProps) {
  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...style }}
        className={className}
        {...props}
      />
    );
  }
  return <img src={src} alt={alt} width={width} height={height} style={style} className={className} {...props} />;
}
