/** The N in a disc, with the plum dot from the wordmark. White on the yellow surfaces. */
const LogoMark = ({ tone = 'sun', className = '' }: { tone?: 'sun' | 'paper'; className?: string }) => (
  <span
    aria-hidden="true"
    className={`relative grid h-9 w-9 flex-none place-items-center rounded-full font-display text-[15px] font-bold text-cobalt ${
      tone === 'sun' ? 'bg-sun' : 'bg-paper'
    } ${className}`}
  >
    N
    <span className="absolute right-[7px] top-[7px] h-1.5 w-1.5 rounded-full bg-plum" />
  </span>
)

export default LogoMark
