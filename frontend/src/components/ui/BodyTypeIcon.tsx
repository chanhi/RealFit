import React from 'react'

interface BodyTypeIconProps {
  type: 'male-slim' | 'male-large' | 'female-slim' | 'female-large'
  selected?: boolean
  className?: string
}

const COLORS: Record<string, string> = {
  'male-slim': '#4A90D9',
  'male-large': '#1E3A5F',
  'female-slim': '#E8749A',
  'female-large': '#9B59B6',
}

export const BodyTypeIcon: React.FC<BodyTypeIconProps> = ({ type, selected = false, className = '' }) => {
  const fill = selected ? 'currentColor' : COLORS[type]

  return (
    <svg className={className} viewBox="0 0 40 72" fill={fill}>
      {type === 'male-slim' && (
        <>
          {/* Head */}
          <circle cx="20" cy="7" r="5" />
          {/* Neck */}
          <rect x="17.5" y="12" width="5" height="3" rx="2" />
          {/* Narrow torso */}
          <rect x="13" y="15" width="14" height="23" rx="3" />
          {/* Left leg */}
          <rect x="13" y="39" width="5.5" height="27" rx="2.5" />
          {/* Right leg */}
          <rect x="21.5" y="39" width="5.5" height="27" rx="2.5" />
        </>
      )}
      {type === 'male-large' && (
        <>
          {/* Head */}
          <circle cx="20" cy="7" r="6" />
          {/* Neck */}
          <rect x="16" y="13" width="8" height="3" rx="2" />
          {/* Wide torso - broad shoulders */}
          <rect x="7" y="16" width="26" height="23" rx="4" />
          {/* Left leg - thick */}
          <rect x="8" y="40" width="8" height="26" rx="3" />
          {/* Right leg - thick */}
          <rect x="24" y="40" width="8" height="26" rx="3" />
        </>
      )}
      {type === 'female-slim' && (
        <>
          {/* Head */}
          <circle cx="20" cy="7" r="4.5" />
          {/* Neck */}
          <rect x="18" y="11.5" width="4" height="3" rx="1.5" />
          {/* Hourglass torso - narrow waist, moderate hips */}
          <path d="M13,15 L27,15 Q23,26 27,38 L13,38 Q17,26 13,15 Z" />
          {/* Left leg */}
          <rect x="13" y="39" width="5.5" height="27" rx="2.5" />
          {/* Right leg */}
          <rect x="21.5" y="39" width="5.5" height="27" rx="2.5" />
        </>
      )}
      {type === 'female-large' && (
        <>
          {/* Head */}
          <circle cx="20" cy="7" r="5.5" />
          {/* Neck */}
          <rect x="17" y="12.5" width="6" height="3" rx="2" />
          {/* Fuller hourglass - wider hips */}
          <path d="M11,16 L29,16 Q24,27 32,40 L8,40 Q16,27 11,16 Z" />
          {/* Left leg - fuller */}
          <rect x="9" y="41" width="7" height="25" rx="3" />
          {/* Right leg - fuller */}
          <rect x="24" y="41" width="7" height="25" rx="3" />
        </>
      )}
    </svg>
  )
}

export { COLORS as BODY_TYPE_COLORS }
