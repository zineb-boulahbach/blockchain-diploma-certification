import type { ReactNode, SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement> & {
  title?: string;
};

function BaseIcon({ title, children, ...props }: Props & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : 'presentation'}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconHome(props: Props) {
  return (
    <BaseIcon {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 10v10h14V10" />
    </BaseIcon>
  );
}

export function IconShield(props: Props) {
  return (
    <BaseIcon {...props}>
      <path d="M12 2 20 6v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
    </BaseIcon>
  );
}

export function IconCap(props: Props) {
  return (
    <BaseIcon {...props}>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M7 10v5c0 1.7 2.2 3 5 3s5-1.3 5-3v-5" />
      <path d="M21 7v6" />
    </BaseIcon>
  );
}

export function IconSearch(props: Props) {
  return (
    <BaseIcon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </BaseIcon>
  );
}

export function IconBook(props: Props) {
  return (
    <BaseIcon {...props}>
      <path d="M4 19a2 2 0 0 0 2 2h14" />
      <path d="M6 3h14v18H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
    </BaseIcon>
  );
}

export function IconPlus(props: Props) {
  return (
    <BaseIcon {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </BaseIcon>
  );
}

export function IconTable(props: Props) {
  return (
    <BaseIcon {...props}>
      <path d="M3 6h18v12H3V6z" />
      <path d="M3 10h18" />
      <path d="M8 6v12" />
      <path d="M16 6v12" />
    </BaseIcon>
  );
}

export function IconArrowLeft(props: Props) {
  return (
    <BaseIcon {...props}>
      <path d="M15 18l-6-6 6-6" />
    </BaseIcon>
  );
}

export function IconDownload(props: Props) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3v10" />
      <path d="M8 11l4 4 4-4" />
      <path d="M4 21h16" />
    </BaseIcon>
  );
}

export function IconShare(props: Props) {
  return (
    <BaseIcon {...props}>
      <path d="M12 16v-9" />
      <path d="M8.5 8.5 12 5l3.5 3.5" />
      <path d="M5 12v7h14v-7" />
    </BaseIcon>
  );
}
