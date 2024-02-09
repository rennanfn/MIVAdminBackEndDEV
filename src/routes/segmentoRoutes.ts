import { Router } from 'express';
import SegmentoController from '../controllers/SegmentoController';

const segmentoRoutes = Router();

segmentoRoutes.post('/', SegmentoController.insertOrUpdate);
segmentoRoutes.post('/upload', SegmentoController.upload);
segmentoRoutes.get('/exibirImagem/:fileName', SegmentoController.exibirImagem);
segmentoRoutes.get('/', SegmentoController.show);
segmentoRoutes.get('/:id_pais', SegmentoController.showPais);
segmentoRoutes.get('/:id_segmento', SegmentoController.showPaisSeg);
segmentoRoutes.get('/find/:id_segmento', SegmentoController.findSegmento);
segmentoRoutes.get('/ativo', SegmentoController.showAtivo);
segmentoRoutes.patch('/', SegmentoController.ativaDesativa);

export default segmentoRoutes;
