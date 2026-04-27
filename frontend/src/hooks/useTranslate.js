import { useLanguage } from '../context/LanguageContext';
import { getUIText } from '../utils/uiTranslations';

export const useTranslate = () => {
  const { language } = useLanguage();
  
  const T = (key) => {
    return getUIText(key, language);
  };
  
  return { T, currentLanguage: language };
};
