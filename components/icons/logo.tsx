import Image from 'next/image';

export type ImageProps = {
  width?: number | string;
  height?: number | string;
  className?: string;
};

export default function LogoIcon(props: ImageProps) {
  return (
    <Image
      src="https://frontends.shopware.com/logo-icon.svg"
      alt="Shopware Composable Frontends Logo"
      width={Number(props.width)}
      height={Number(props.height)}
    ></Image>
  );
}
