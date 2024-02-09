import { Router } from 'express';
import RevendaFilialController from '../controllers/RevendaFilialDB';

const revendaFilialRoutes = Router();

revendaFilialRoutes.get(
  '/revGeral/:id_revenda_filial_geral',
  RevendaFilialController.showPorMarcaGeral,
);
revendaFilialRoutes.post('/', RevendaFilialController.insert);
revendaFilialRoutes.post('/upload', RevendaFilialController.upload);
revendaFilialRoutes.get(
  '/download/:fileName',
  RevendaFilialController.download,
);
revendaFilialRoutes.put('/', RevendaFilialController.update);
revendaFilialRoutes.get('/', RevendaFilialController.show);
revendaFilialRoutes.get(
  '/pais/:id_revenda_filial_geral',
  RevendaFilialController.showPais,
);
revendaFilialRoutes.get(
  '/:id_segmento/:id_pais',
  RevendaFilialController.showSegPais,
);
revendaFilialRoutes.get('/ativo', RevendaFilialController.showAtivo);
revendaFilialRoutes.get('/:id_revenda_filial', RevendaFilialController.find);
revendaFilialRoutes.patch('/', RevendaFilialController.ativaDesativa);

export default revendaFilialRoutes;
