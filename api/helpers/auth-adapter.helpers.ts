type AdapterWhere = {
    operator: string;
    value: unknown;
};

type AdapterParams = {
    where?: AdapterWhere[];
    [key: string]: unknown;
};

type AdapterMethod = (params: AdapterParams) => Promise<unknown[] | number | void | null>;

interface BaseAdapter {
    findMany: AdapterMethod;
    deleteMany: AdapterMethod;
}

/**
 * Patches a Better Auth adapter factory to handle Cloudflare D1's 100-parameter limit.
 * 
 * Cloudflare D1 has a hard limit of 100 bound parameters per SQL statement.
 * Better Auth's internal logic often uses `findMany` and `deleteMany` with large
 * arrays in `IN` clauses (e.g., when an organization has > 100 members).
 * 
 * This wrapper intercepts the adapter instance and patches its methods
 * to automatically chunk requests when an "in" operator with a large array is used.
 * 
 * @param adapterFactory - The original adapter factory (e.g. from drizzleAdapter)
 */
export const patchD1Adapter = (adapterFactory: any) => {
    return (options: any) => {
        const adapter = adapterFactory(options) as BaseAdapter;

        // --- Patch findMany ---
        const originalFindMany = adapter.findMany.bind(adapter);
        adapter.findMany = async (params: AdapterParams) => {
            const { where } = params;
            const inCondition = where?.find((w) => w.operator === "in" && Array.isArray(w.value));

            if (inCondition && (inCondition.value as unknown[]).length > 90) {
                const allValues = inCondition.value as unknown[];
                const otherConditions = where?.filter((w) => w !== inCondition) || [];
                let allResults: unknown[] = [];

                // Chunk into 90 to stay safe under the 100 limit
                for (let i = 0; i < allValues.length; i += 90) {
                    const chunk = allValues.slice(i, i + 90);
                    const results = await originalFindMany({
                        ...params,
                        where: [...otherConditions, { ...inCondition, value: chunk }],
                    }) as unknown[];
                    
                    if (results) {
                        allResults = allResults.concat(results);
                    }
                }
                return allResults;
            }

            return originalFindMany(params);
        };

        // --- Patch deleteMany ---
        const originalDeleteMany = adapter.deleteMany.bind(adapter);
        adapter.deleteMany = async (params: AdapterParams) => {
            const { where } = params;
            const inCondition = where?.find((w) => w.operator === "in" && Array.isArray(w.value));

            if (inCondition && (inCondition.value as unknown[]).length > 90) {
                const allValues = inCondition.value as unknown[];
                const otherConditions = where?.filter((w) => w !== inCondition) || [];
                let totalChanges = 0;

                for (let i = 0; i < allValues.length; i += 90) {
                    const chunk = allValues.slice(i, i + 90);
                    const count = await originalDeleteMany({
                        ...params,
                        where: [...otherConditions, { ...inCondition, value: chunk }],
                    }) as number;
                    totalChanges += (count || 0);
                }
                return totalChanges;
            }

            return originalDeleteMany(params);
        };

        return adapter;
    };
};
