import { Router } from 'express';
import FilialController from '../controllers/FilialController';

const filialRoutes = Router();

filialRoutes.post('/', FilialController.insert);
filialRoutes.put('/', FilialController.update);
filialRoutes.get('/', FilialController.show);
filialRoutes.get('/ativo', FilialController.showAtivo);
filialRoutes.patch('/', FilialController.ativaDesativa);

export default filialRoutes;
