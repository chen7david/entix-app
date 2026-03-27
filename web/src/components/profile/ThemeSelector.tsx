import { type AppTheme, useUserPreferences } from "@web/src/hooks/auth/useUserPreferences";
import { Select } from "antd";

export const ThemeSelector = () => {
    const { theme, updateTheme } = useUserPreferences();

    return (
        <Select
            style={{ width: "100%" }}
            value={theme}
            onChange={(val) => updateTheme(val as AppTheme)}
            options={[
                { label: "System Default", value: "system" },
                { label: "Light", value: "light" },
                { label: "Dark", value: "dark" },
            ]}
        />
    );
};
