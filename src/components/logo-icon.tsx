export default function LogoIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M50 6 C26 28 20 46 20 64 A30 30 0 0 0 80 64 C80 46 74 28 50 6 Z"
        stroke="#F5A623"
        strokeWidth="5.5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
