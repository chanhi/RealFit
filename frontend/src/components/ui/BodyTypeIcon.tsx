import React from 'react'
import type { BaseModelType } from '../../store/useFittingStore'

interface BodyTypeIconProps {
  type: BaseModelType
  selected?: boolean
  className?: string
}

const COLORS: Record<BaseModelType, string> = {
  'male-slim': '#4A90D9',
  'male-normal': '#2563EB',
  'male-chubby': '#1E3A5F',
  'female-slim': '#E8749A',
  'female-normal': '#EC4899',
  'female-chubby': '#9B59B6',
}

export const BodyTypeIcon: React.FC<BodyTypeIconProps> = ({ type, selected = false, className = '' }) => {
  const fill = selected ? 'currentColor' : COLORS[type]

  const gender = type.startsWith('male') ? 'male' : 'female'
  const body = type.split('-')[1]

  const isSlim = body === 'slim'
  const isNormal = body === 'normal'
  const isChubby = body === 'chubby'

  return (
    <svg className={className} viewBox="0 0 40 72" fill={fill}>
      {gender === 'male' && (
        <>
          <circle cx="20" cy="7" r={isChubby ? 6 : 5} />
          <rect x={isChubby ? 16 : 17} y="12" width={isChubby ? 8 : 6} height="3" rx="2" />

          {isSlim && <rect x="14" y="16" width="12" height="23" rx="3" />}
          {isNormal && <rect x="11" y="16" width="18" height="24" rx="4" />}
          {isChubby && <rect x="7" y="16" width="26" height="25" rx="5" />}

          <rect x={isSlim ? 13 : isNormal ? 11 : 8} y="41" width={isSlim ? 5.5 : isNormal ? 7 : 8.5} height="25" rx="3" />
          <rect x={isSlim ? 21.5 : isNormal ? 22 : 23.5} y="41" width={isSlim ? 5.5 : isNormal ? 7 : 8.5} height="25" rx="3" />
        </>
      )}

      {gender === 'female' && (
        <>
          <circle cx="20" cy="7" r={isChubby ? 5.5 : 4.8} />
          <rect x={isChubby ? 17 : 18} y="12" width={isChubby ? 6 : 4} height="3" rx="2" />

          {isSlim && <path d="M14,16 L26,16 Q23,27 27,39 L13,39 Q17,27 14,16 Z" />}
          {isNormal && <path d="M12,16 L28,16 Q24,27 30,40 L10,40 Q16,27 12,16 Z" />}
          {isChubby && <path d="M10,16 L30,16 Q25,28 33,41 L7,41 Q15,28 10,16 Z" />}

          <rect x={isSlim ? 13 : isNormal ? 11 : 9} y="42" width={isSlim ? 5.5 : isNormal ? 7 : 8} height="24" rx="3" />
          <rect x={isSlim ? 21.5 : isNormal ? 22 : 23} y="42" width={isSlim ? 5.5 : isNormal ? 7 : 8} height="24" rx="3" />
        </>
      )}
    </svg>
  )
}

export { COLORS as BODY_TYPE_COLORS }
