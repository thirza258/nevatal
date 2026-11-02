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

export const ArrowLeft = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M20 12H5m6-6-6 6 6 6" />
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

export const Eye = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const Monitor = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
)

export const ImageIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="m3.5 17 5-5 4 4 3-3 5 5" />
  </svg>
)

export const Spark = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />
  </svg>
)

export const Shuffle = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M3 7h3.5c2 0 3.2 1 4.3 2.7l2.4 4.6C14.3 16 15.5 17 17.5 17H21m0 0-3-3m3 3-3 3M3 17h3.5c1.2 0 2.1-.4 2.9-1.1M21 7h-3.5c-1.2 0-2.1.4-2.9 1.1M21 7l-3-3m3 3-3 3" />
  </svg>
)

export const Pause = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M9 5v14M15 5v14" />
  </svg>
)

export const Play = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M7 5.5v13l11-6.5-11-6.5Z" />
  </svg>
)

export const ArrowDown = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 4v14m-6-6 6 6 6-6" />
  </svg>
)

export const ArrowUp = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 20V6m-6 6 6-6 6 6" />
  </svg>
)
