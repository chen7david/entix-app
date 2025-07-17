export enum AppEnv {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

export const AppEnvFileName: Record<AppEnv, string> = {
  [AppEnv.Development]: '.env',
  [AppEnv.Staging]: '.env',
  [AppEnv.Test]: 'test.env',
  [AppEnv.Production]: '.env',
};
