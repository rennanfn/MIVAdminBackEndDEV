import { Router } from 'express';
import SegmentoGeralController from '../controllers/SegmentoGeralController';

const segmentoGeralRoutes = Router();

segmentoGeralRoutes.post('/', SegmentoGeralController.insert);
segmentoGeralRoutes.put('/', SegmentoGeralController.update);
segmentoGeralRoutes.get('/', SegmentoGeralController.show);
segmentoGeralRoutes.get('/ativo', SegmentoGeralController.showAtivo);
segmentoGeralRoutes.patch('/', SegmentoGeralController.ativaDesativa);

export default segmentoGeralRoutes;
