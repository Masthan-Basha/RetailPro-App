// DARK theme (default – existing look)
export const DARK_COLORS = {
  bgBase:'#0d0f14', bgSurface:'#13161d', bgElevated:'#1a1e28', bgCard:'#1e2330',
  border:'#2a2f3f', borderLight:'#353c52',
  textPrimary:'#e8ecf4', textSecondary:'#8892aa', textMuted:'#556070',
  accent:'#3b82f6', accentBg:'rgba(59,130,246,0.15)',
  green:'#22c55e',  greenBg:'rgba(34,197,94,0.12)',
  amber:'#f59e0b',  amberBg:'rgba(245,158,11,0.12)',
  red:'#ef4444',    redBg:'rgba(239,68,68,0.12)',
  purple:'#a855f7', purpleBg:'rgba(168,85,247,0.12)',
  white:'#ffffff',
  isDark: true,
};

// LIGHT theme
export const LIGHT_COLORS = {
  bgBase:'#f0f4fa', bgSurface:'#ffffff', bgElevated:'#e8edf6', bgCard:'#ffffff',
  border:'#d1d9e8', borderLight:'#c0cade',
  textPrimary:'#0f1826', textSecondary:'#4a5568', textMuted:'#8896b0',
  accent:'#2563eb', accentBg:'rgba(37,99,235,0.10)',
  green:'#16a34a',  greenBg:'rgba(22,163,74,0.10)',
  amber:'#d97706',  amberBg:'rgba(217,119,6,0.10)',
  red:'#dc2626',    redBg:'rgba(220,38,38,0.10)',
  purple:'#7c3aed', purpleBg:'rgba(124,58,237,0.10)',
  white:'#ffffff',
  isDark: false,
};

// Default export (backward compat) — will be overridden by ThemeContext at runtime
export const COLORS = DARK_COLORS;

export const RADIUS  = { sm:6, md:10, lg:16, xl:24, full:999 };
export const SPACING = { xs:4, sm:8,  md:16, lg:24, xl:32  };
export const SHADOW  = {
  sm:{ shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.2, shadowRadius:2, elevation:2 },
  md:{ shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:6, elevation:6 },
  card:{ shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.35, shadowRadius:8, elevation:4 },
};
