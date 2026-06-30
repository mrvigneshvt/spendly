import React from 'react';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeContext';

interface IconProps {
  color?: string;
  size?: number;
}

export function DashboardIcon({ color, size = 24 }: IconProps) {
  const { colors } = useTheme();
  const fill = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={fill}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M9 21V12h6v9"
        stroke={fill}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function PendingIcon({ color, size = 24 }: IconProps) {
  const { colors } = useTheme();
  const fill = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={fill} strokeWidth={2} fill="none" />
      <Path d="M12 7v5l3 3" stroke={fill} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function LedgerIcon({ color, size = 24 }: IconProps) {
  const { colors } = useTheme();
  const fill = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={18} height={18} rx={2} stroke={fill} strokeWidth={2} fill="none" />
      <Line x1={7} y1={9} x2={17} y2={9} stroke={fill} strokeWidth={2} strokeLinecap="round" />
      <Line x1={7} y1={13} x2={17} y2={13} stroke={fill} strokeWidth={2} strokeLinecap="round" />
      <Line x1={7} y1={17} x2={13} y2={17} stroke={fill} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function CategoriesIcon({ color, size = 24 }: IconProps) {
  const { colors } = useTheme();
  const fill = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth={2}>
      <Rect x={3} y={3} width={7} height={7} rx={1} fill="none" />
      <Rect x={14} y={3} width={7} height={7} rx={1} fill="none" />
      <Rect x={14} y={14} width={7} height={7} rx={1} fill="none" />
      <Rect x={3} y={14} width={7} height={7} rx={1} fill="none" />
    </Svg>
  );
}

export function LightIcon({ color, size = 24 }: IconProps) {
  const { colors } = useTheme();
  const fill = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={4} stroke={fill} strokeWidth={2} fill="none" />
      <Path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke={fill} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function DarkIcon({ color, size = 24 }: IconProps) {
  const { colors } = useTheme();
  const fill = color || colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"
        stroke={fill}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
