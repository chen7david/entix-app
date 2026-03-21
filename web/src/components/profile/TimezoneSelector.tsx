import { Select } from 'antd';
import { useUserPreferences } from '@web/src/hooks/auth/useUserPreferences';

export const TimezoneSelector = () => {
    const { timezone, updateTimezone } = useUserPreferences();

    // Dynamically retrieve all supported structural Time Zones globally bypassing static generic lookups seamlessly.
    const timezones = Intl.supportedValuesOf('timeZone').map(tz => ({
        label: tz,
        value: tz
    }));

    return (
        <Select
            showSearch
            style={{ width: '100%' }}
            placeholder="Select a Timezone"
            optionFilterProp="children"
            value={timezone}
            onChange={(val) => updateTimezone(val)}
            filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={timezones}
        />
    );
};
