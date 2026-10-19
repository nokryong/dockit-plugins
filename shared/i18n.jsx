import { useSyncExternalStore } from 'react';
import { translate, translateMessage as translateKnownMessage } from './messages.mjs';

const sdk = window.Dockit;
const getLanguage = () => (sdk.language ?? sdk.theme?.language) === 'en' ? 'en' : 'ko';
const subscribe = listener => sdk.onLanguageChange ? sdk.onLanguageChange(listener) : sdk.onThemeChange(listener);
export const useLanguage = () => useSyncExternalStore(subscribe, getLanguage, getLanguage);
export const t = (source, ...values) => translate(getLanguage(), source, ...values);
export const translateMessage = message => translateKnownMessage(getLanguage(), message);
