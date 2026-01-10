import type { ThemeConfig } from 'antd';

export const themeConfig: ThemeConfig = {
    token: {
        // Global tokens
        fontSize: 14,
        colorPrimary: '#1677ff', // Example primary color, can be customized
        borderRadius: 6,
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    },
    components: {
        Input: {
            // iOS zoom fix: Ensure font size is at least 16px for inputs
            fontSize: 16,
        },
        Select: {
            // iOS zoom fix for Select
            fontSize: 16,
        },
        DatePicker: {
            fontSize: 16,
        },
        Button: {
            // Example override
            borderRadius: 4,
            controlHeight: 40,
        },
        Layout: {
            bodyBg: '#f5f5f5',
            headerBg: '#ffffff',
        }
    },
};
