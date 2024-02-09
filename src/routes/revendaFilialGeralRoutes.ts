import { Router } from 'express';
import RevendaFilialGeralController from '../controllers/RevendaFilialGeralController';

const revendaFilialGeralRoutes = Router();

revendaFilialGeralRoutes.post('/', RevendaFilialGeralController.insert);
revendaFilialGeralRoutes.put('/', RevendaFilialGeralController.update);
revendaFilialGeralRoutes.get('/', RevendaFilialGeralController.show);
revendaFilialGeralRoutes.get('/ativo', RevendaFilialGeralController.showAtivo);
revendaFilialGeralRoutes.patch('/', RevendaFilialGeralController.ativaDesativa);

export default revendaFilialGeralRoutes;
