"use client";

import { useEffect,useState } from 'react';
import { useGenericIndexedDBStore } from './useGenericIndexedDBStore';
import { DEFAULT_FONT_CONFIG } from '@/utils/font-config-constants';
import { SavedFontData,FontThemeConfig } from '@/types/font-config';

export const useFontConfig = () => {
  const [themeConfig,setThemeConfig] = useState<FontThemeConfig>(DEFAULT_FONT_CONFIG);

  const { getByKey } = useGenericIndexedDBStore<SavedFontData>(
    'font-config',
    'configs',
    'id'
  );

  // Apply config to document CSS variables (for Tailwind compatibility)
  const applyConfigToDocument = (config: FontThemeConfig) => {
    const { fontFamily,fontSize,colorPrimary } = config.token;

    // Set CSS variables for Tailwind and custom CSS
    document.documentElement.style.setProperty('--font-family',fontFamily);
    document.documentElement.style.setProperty('--font-size',`${fontSize}px`);
    document.documentElement.style.setProperty('--primary',colorPrimary);
  };

  // Load font config from IndexedDB
  const loadFontConfig = async () => {
    try {
      const savedData = await getByKey('current-font-config');

      if (savedData && savedData.config) {
        setThemeConfig({ ...savedData.config });
        applyConfigToDocument({ ...savedData.config });
      } else {
        // No saved config, use default
        setThemeConfig(DEFAULT_FONT_CONFIG);
        applyConfigToDocument(DEFAULT_FONT_CONFIG);
      }
    } catch (error) {
      console.error('Error loading font config:',error);
      setThemeConfig(DEFAULT_FONT_CONFIG);
      applyConfigToDocument(DEFAULT_FONT_CONFIG);
    }
  };

  useEffect(() => {
    loadFontConfig();

    // Listen for storage changes to auto-reload config
    const handleStorageChange = () => {
      loadFontConfig();
    };

    // Listen for custom events when config is saved
    const handleConfigUpdate = async () => {
      console.log('Font config update event received, reloading...');
      await loadFontConfig();
    };

    window.addEventListener('storage',handleStorageChange);
    window.addEventListener('font-config-updated',handleConfigUpdate);

    return () => {
      window.removeEventListener('storage',handleStorageChange);
      window.removeEventListener('font-config-updated',handleConfigUpdate);
    };
  },[getByKey]);

  return {
    themeConfig,
    loadFontConfig,
    applyConfigToDocument,
  };
};
