import { useEffect, useState } from 'react';
export const sdk = window.Dockit;
export const report = error => sdk.notify(error?.message || '작업에 실패했습니다.', 'danger').catch(() => {});
function applyTheme(theme) {
  const colors = theme.colors || {};
  const dark = theme.isDarkMode;
  const vars = {
    text: colors.white?.[1] || (dark ? '#f1f3f5' : '#20252c'),
    surface: colors['cool-gray']?.[1] || (dark ? '#252930' : '#f5f7fa'),
    border: colors['cool-gray']?.[3] || (dark ? '#505763' : '#dce1e8'),
    muted: colors['cool-gray']?.[8] || (dark ? '#b3bdcc' : '#606b7b'),
    accent: colors[theme.name]?.[7] || (dark ? '#9dbbff' : '#2458b8'),
    soft: colors[theme.name]?.[1] || (dark ? '#29384e' : '#edf3ff'),
    danger: dark ? '#ffb4b4' : '#b42318',
  };
  // In Dockit's palette white[1] is the foreground in both theme variants.
  for (const [key, value] of Object.entries(vars)) document.documentElement.style.setProperty('--' + key, value);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}
export function useTheme() {
  const [theme, setTheme] = useState(sdk.theme);
  useEffect(() => { applyTheme(sdk.theme); return sdk.onThemeChange(value => { applyTheme(value); setTheme(value); }); }, []);
  return theme;
}
export function useFooter(text) { useEffect(() => { sdk.setFooter(text).catch(report); }, [text]); }
export function useActions(actions, handler) {
  useEffect(() => { sdk.setActions(actions).catch(report); }, [actions]);
  useEffect(() => sdk.onAction(handler), [handler]);
}
