import { DependencyManager } from '@utils/di.util';
import { EnvToken } from './factories/env.factory';
import { Container } from '@utils/typedi.util';

const dependencyManager = new DependencyManager();
dependencyManager.bootstrap();

const config = Container.get(EnvToken);
console.log(config);
