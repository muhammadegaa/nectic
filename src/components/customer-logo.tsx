interface CustomerLogoProps {
  name: string
  logoUrl: string
}

export function CustomerLogo({ name, logoUrl }: CustomerLogoProps) {
  return (
    <div className="flex items-center justify-center w-32 h-12 opacity-60 hover:opacity-100 transition-opacity">
      <span className="text-xs text-slate-400 font-medium">{name}</span>
    </div>
  )
}

