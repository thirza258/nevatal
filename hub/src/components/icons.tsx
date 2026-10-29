import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const ArrowUpRight = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
)

export const ArrowRight = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 12h15m-6-6 6 6-6 6" />
  </svg>
)

export const Check = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m4.5 12.5 4.5 4.5L19.5 6.5" />
  </svg>
)

export const Menu = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
)

export const Close = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
)

export const Search = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
)

export const Spark = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />
  </svg>
)
