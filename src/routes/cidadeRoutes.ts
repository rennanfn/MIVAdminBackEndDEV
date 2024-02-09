import { Router } from 'express';
import CidadeController from '../controllers/CidadeController';

const cidadeRoutes = Router();

cidadeRoutes.post('/', CidadeController.insert);
cidadeRoutes.put('/', CidadeController.update);
cidadeRoutes.get('/', CidadeController.show);
cidadeRoutes.get('/:id_estado', CidadeController.showCidadeEstado);

export default cidadeRoutes;
