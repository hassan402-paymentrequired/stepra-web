import { useTheme } from 'next-themes';
import { useEffect } from 'react';

const LIGHT = '#ffffff';
const DARK = '#252525';

export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const color = resolvedTheme === 'dark' ? DARK : LIGHT;
    let meta = document.querySelector('meta[name="theme-color"]');

    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }

    meta.setAttribute('content', color);
    document.documentElement.style.colorScheme = resolvedTheme === 'dark' ? 'dark' : 'light';
  }, [resolvedTheme]);

  return null;
}
