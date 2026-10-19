// Host-side pieces the original Dockit widgets read from app contexts, rebuilt on the plugin SDK.
import { useEffect, useState } from 'react';
import { SoonUIDesign, darkTheme, defaultTheme } from 'sud-ui';
import 'sud-ui/dist/index.css';
import { t, translateMessage } from './i18n.jsx';

export const sdk = window.Dockit;
export const report = error => sdk.notify(translateMessage(error?.message || t('작업에 실패했습니다.')), 'danger').catch(() => {});

// Same values as dockit/app/LIB/constant/uiProps.js.
export const inputProps = { size: 'sm', shadow: 'none', color: 'white-1', border: false, style: { width: '100%' } };
export const shadowSm = { shadow: 'sm', style: { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)' } };
export const overlayShadow = { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.12)' };

export function useDockitTheme() {
  const [theme, setTheme] = useState(sdk.theme);
  useEffect(() => sdk.onThemeChange(setTheme), []);
  return theme;
}

export function PluginRoot({ theme, children }) {
  const base = theme.isDarkMode ? darkTheme : defaultTheme;
  const design = { ...base, colors: theme.colors, body: { ...base.body, backgroundColor: 'transparent' } };
  return <SoonUIDesign theme={design} darkTheme={design} isDarkMode={theme.isDarkMode}>{children}</SoonUIDesign>;
}

export function useFooter(text) { useEffect(() => { sdk.setFooter(text).catch(report); }, [text]); }
export function useActions(actions, handler) {
  useEffect(() => { sdk.setActions(actions).catch(report); }, [actions]);
  useEffect(() => sdk.onAction(handler), [handler]);
}
