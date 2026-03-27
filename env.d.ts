interface ImportMeta {
    readonly env: ImportMetaEnv;
    readonly glob: (pattern: string, options?: any) => Record<string, any>;
}

interface ImportMetaEnv {
    readonly [key: string]: string | boolean | undefined;
    readonly VITE_ENABLE_CF_IMAGES?: string;
}
