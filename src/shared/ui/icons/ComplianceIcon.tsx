import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type ComplianceIconName =
  | 'shield'
  | 'lock'
  | 'family'
  | 'bell'
  | 'trash'
  | 'document';

interface ComplianceIconProps {
  name: ComplianceIconName;
  color: string;
  size?: number;
}

export function ComplianceIcon({
  name,
  color,
  size = 20,
}: ComplianceIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'shield' && (
        <>
          <Path
            d="M12 2.8 20 6v5.1c0 5-3.4 8.4-8 10.1-4.6-1.7-8-5.1-8-10.1V6l8-3.2Z"
            fill={color}
          />
          <Path
            d="m8.5 11.8 2.2 2.2 4.8-5"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {name === 'lock' && (
        <>
          <Rect x="5" y="10" width="14" height="11" rx="2.5" fill={color} />
          <Path
            d="M8 10V7a4 4 0 0 1 8 0v3"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Circle cx="12" cy="15" r="1.2" fill="#fff" />
          <Path
            d="M12 16v1.5"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )}
      {name === 'family' && (
        <>
          <Circle cx="9" cy="8" r="3" stroke={color} strokeWidth="1.8" />
          <Circle cx="17" cy="9" r="2.3" stroke={color} strokeWidth="1.8" />
          <Path
            d="M3.5 19c.3-3.2 2.2-5 5.5-5s5.2 1.8 5.5 5H3.5ZM15 14.5c3.5-.5 5.4 1 5.7 4.5h-4"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {name === 'bell' && (
        <>
          <Path
            d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10 21h4"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      )}
      {name === 'trash' && (
        <>
          <Path
            d="M4 7h16M10 3h4l1 4H9l1-4ZM7 7l1 14h8l1-14"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10 10v7m4-7v7"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </>
      )}
      {name === 'document' && (
        <>
          <Path
            d="M6 3.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V3.5Z"
            stroke={color}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <Path
            d="M14 3.5V8h4M9 12h6m-6 3.5h6"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      )}
    </Svg>
  );
}
