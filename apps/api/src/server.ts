import 'reflect-metadata';
import { ContainerManager } from '@utils/di.util';
import { Container } from '@utils/typedi.util';
import { ConfigService } from './services/config.service';

ContainerManager.bootstrap();

const config = Container.get(ConfigService);
console.log(config.env.PORT);
