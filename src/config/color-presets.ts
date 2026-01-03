import { useTheme } from 'next-themes';

export const presetLight = {
  lighter: '#f1f1f1',
  light: '#666666',
  default: '#111111',
  dark: '#000000',
  foreground: '#ffffff',
};

export const presetDark = {
  lighter: '#222222',
  light: '#929292',
  default: '#f1f1f1',
  dark: '#ffffff',
  foreground: '#111111',
};

export const DEFAULT_PRESET_COLORS = {
  lighter: '#d7e3fe',
  light: '#608efb',
  default: '#3872fa',
  dark: '#1d58d8',
  foreground: '#ffffff',
};

export const DEFAULT_PRESET_COLOR_NAME = 'Blue';

export const usePresets = () => {
  const { theme } = useTheme();

  return [
    {
      name: DEFAULT_PRESET_COLOR_NAME,
      colors: DEFAULT_PRESET_COLORS,
    },
    {
      name: 'Black',
      colors: {
        lighter: theme === 'light' ? presetLight.lighter : presetDark.lighter,
        light: theme === 'light' ? presetLight.light : presetDark.light,
        default: theme === 'light' ? presetLight.default : presetDark.default,
        dark: theme === 'light' ? presetLight.dark : presetDark.dark,
        foreground:
          theme === 'light' ? presetLight.foreground : presetDark.foreground,
      },
    },
    {
      name: 'Teal',
      colors: {
        lighter: '#ccfbf1',
        light: '#5eead4',
        default: '#0d9488',
        dark: '#115e59',
        foreground: '#ffffff',
      },
    },
    {
      name: 'Violet',
      colors: {
        lighter: '#ede9fe',
        light: '#a5b4fc',
        default: '#7c3aed',
        dark: '#4c1d95',
        foreground: '#ffffff',
      },
    },
    {
      name: 'Rose',
      colors: {
        lighter: '#ffe4e6',
        light: '#fda4af',
        default: '#e11d48',
        dark: '#be123c',
        foreground: '#ffffff',
      },
    },
    {
      name: 'Yellow',
      colors: {
        lighter: '#fef9c3',
        light: '#fde047',
        default: '#ca8a04',
        dark: '#a16207',
        foreground: '#ffffff',
      },
    },
  ];
};
