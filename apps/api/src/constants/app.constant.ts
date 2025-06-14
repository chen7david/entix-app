export enum AppEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export const AppEnvFileName: Record<AppEnv, string> = {
  [AppEnv.Development]: '.env',
  [AppEnv.Test]: 'test.env',
  [AppEnv.Production]: '.env',
};
