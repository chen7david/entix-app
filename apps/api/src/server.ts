import 'reflect-metadata';
import { ContainerManager } from '@utils/di.util';
import { Container } from '@utils/typedi.util';
import { ServerService } from '@services/server.service';

ContainerManager.bootstrap();
const serverService = Container.get(ServerService);
serverService.start();
