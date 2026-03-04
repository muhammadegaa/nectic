// Real brand-accurate SVG icons for all integrations

export function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#25D366" />
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884z"
        fill="white"
      />
    </svg>
  )
}

export function ZoomIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#2D8CFF" />
      <path
        d="M13.8 8H6.6C5.716 8 5 8.716 5 9.6v5.6c0 .442.358.8.8.8h7.2c.884 0 1.6-.716 1.6-1.6V9.6c0-.442-.358-.8-.8-.8z"
        fill="white"
      />
      <path
        d="M15.4 10.267l2.933-1.955A.4.4 0 0119 8.645v6.71a.4.4 0 01-.667.3L15.4 13.733v-3.466z"
        fill="white"
      />
    </svg>
  )
}

export function FirefliesIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#6C47FF" />
      <path d="M12 4L14.5 9.5H19.5L15.5 12.5L17 18L12 14.5L7 18L8.5 12.5L4.5 9.5H9.5L12 4Z" fill="white" />
    </svg>
  )
}

export function HubSpotIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#FF7A59" />
      <circle cx="15.5" cy="8.5" r="2.5" fill="white" />
      <circle cx="15.5" cy="8.5" r="1.2" fill="#FF7A59" />
      <path d="M13.5 8.5H10M10 8.5C10 10.433 8.433 12 6.5 12C4.567 12 3 10.433 3 8.5 M10 15.5C10 13.567 8.433 12 6.5 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15.5" y1="11" x2="15.5" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="15.5" cy="17.5" r="1.5" fill="white" />
    </svg>
  )
}

export function JiraIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#0052CC" />
      <path
        d="M12.006 4.5a.377.377 0 00-.262.112L4.64 11.63a.377.377 0 000 .523l3.614 3.636 3.49-3.51.002-.002 3.633-3.655a.377.377 0 000-.523L12.268 4.612a.377.377 0 00-.262-.112z"
        fill="url(#jira-a)"
      />
      <path
        d="M11.997 8.244l-3.497 3.518 3.497 3.518 3.497-3.518-3.497-3.518z"
        fill="url(#jira-b)"
      />
      <path
        d="M11.994 11.756a.377.377 0 00-.262.111l-7.104 7.149a.377.377 0 000 .522l1.375 1.385a.377.377 0 00.533 0l5.72-5.753 5.719 5.753a.377.377 0 00.534 0l1.375-1.385a.377.377 0 000-.522l-7.628-7.149a.377.377 0 00-.262-.111z"
        fill="url(#jira-c)"
      />
      <defs>
        <linearGradient id="jira-a" x1="12.003" y1="4.5" x2="7.74" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2684FF" />
          <stop offset="1" stopColor="#0052CC" />
        </linearGradient>
        <linearGradient id="jira-b" x1="12.58" y1="8.191" x2="10.07" y2="11.695" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2684FF" />
          <stop offset="1" stopColor="#0052CC" />
        </linearGradient>
        <linearGradient id="jira-c" x1="12.003" y1="11.762" x2="17.376" y2="19.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2684FF" />
          <stop offset="1" stopColor="#0052CC" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function SlackIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="white" />
      <path d="M8.5 14.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM8.5 14.5H15" stroke="#E01E5A" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.5 9.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM9.5 9.5V16" stroke="#36C5F0" strokeWidth="2" strokeLinecap="round" />
      <path d="M15.5 9.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM15.5 9.5H9" stroke="#2EB67D" strokeWidth="2" strokeLinecap="round" />
      <path d="M14.5 14.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM14.5 14.5V8" stroke="#ECB22E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function LinearIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#5E6AD2" />
      <path
        d="M5 15.456L8.544 19C10.296 17.904 11.84 16.512 13.12 14.88L8.864 10.624C7.28 11.872 5.904 13.472 5 15.456zM5.344 12.64l6.016 6.016C12.576 17.84 13.664 16.8 14.56 15.6L8.4 9.44C7.2 10.336 6.16 11.424 5.344 12.64zM9.808 8.336l5.856 5.856C16.384 12.896 17.024 11.408 17.312 9.8L14.2 6.688C12.592 6.976 11.104 7.616 9.808 8.336zM12.8 5.72L18.28 11.2C18.432 10.32 18.5 9.42 18.5 8.5C18.5 6.84 17.1 5 15.5 5C14.58 5 13.68 5.26 12.8 5.72z"
        fill="white"
      />
    </svg>
  )
}

export function SalesforceIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#00A1E0" />
      <path
        d="M10.2 7.2a3 3 0 015.4 1.2 2.4 2.4 0 013 2.4 2.4 2.4 0 01-2.4 2.4H7.2A2.4 2.4 0 014.8 10.8a2.4 2.4 0 012.4-2.4c.12 0 .24 0 .36.024A3 3 0 0110.2 7.2z"
        fill="white"
      />
    </svg>
  )
}

export function NotionIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#191919" />
      <path
        d="M7 6h6.5l3.5 4v8H7V6zm0 0v12m9-8H7"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Source badge component used inline in cards/quotes
export function SourceBadge({ source, size = 16 }: { source: string; size?: number }) {
  const map: Record<string, { icon: JSX.Element; label: string; bg: string; text: string }> = {
    whatsapp: {
      icon: <WhatsAppIcon size={size} />,
      label: "WhatsApp",
      bg: "bg-green-50",
      text: "text-green-700",
    },
    zoom: {
      icon: <ZoomIcon size={size} />,
      label: "Zoom",
      bg: "bg-blue-50",
      text: "text-blue-700",
    },
    fireflies: {
      icon: <FirefliesIcon size={size} />,
      label: "Fireflies",
      bg: "bg-violet-50",
      text: "text-violet-700",
    },
    hubspot: {
      icon: <HubSpotIcon size={size} />,
      label: "HubSpot",
      bg: "bg-orange-50",
      text: "text-orange-700",
    },
    jira: {
      icon: <JiraIcon size={size} />,
      label: "Jira",
      bg: "bg-blue-50",
      text: "text-blue-800",
    },
    slack: {
      icon: <SlackIcon size={size} />,
      label: "Slack",
      bg: "bg-purple-50",
      text: "text-purple-700",
    },
    linear: {
      icon: <LinearIcon size={size} />,
      label: "Linear",
      bg: "bg-indigo-50",
      text: "text-indigo-700",
    },
  }

  const cfg = map[source]
  if (!cfg) return null

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}
