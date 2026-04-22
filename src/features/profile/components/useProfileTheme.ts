import { useTheme } from '@/contexts/ThemeContext';

export function useProfileTheme() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    return {
        isDark,
        bgPage: isDark ? 'bg-[#0e0d15]' : 'bg-gray-100',
        bgCard: isDark ? 'bg-[#282832]' : 'bg-white',
        bgSub: isDark ? 'bg-[#1e1e26]' : 'bg-gray-50',
        borderCls: isDark ? 'border-gray-700' : 'border-gray-200',
        textPrimary: isDark ? 'text-white' : 'text-gray-900',
        textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
        textMuted: isDark ? 'text-gray-500' : 'text-gray-400',
        hoverBg: isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100',
        fieldBg: isDark ? 'bg-[#1e1e26]' : 'bg-gray-50',
    };
}
