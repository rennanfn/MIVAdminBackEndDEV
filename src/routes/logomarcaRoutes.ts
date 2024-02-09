import { Router } from 'express';
import LogomarcaController from '../controllers/LogomarcaController';

const logomarcaRoutes = Router();

logomarcaRoutes.post('/', LogomarcaController.insert);
logomarcaRoutes.post('/upload', LogomarcaController.upload);
logomarcaRoutes.post('/uploadArray', LogomarcaController.uploadArray);
logomarcaRoutes.get('/download/:fileName', LogomarcaController.download);
logomarcaRoutes.put('/', LogomarcaController.update);
logomarcaRoutes.get('/', LogomarcaController.show);
logomarcaRoutes.get('/:id_logomarca', LogomarcaController.find);
logomarcaRoutes.get(
  '/marca/:id_marca/:id_categoria_logomarca',
  LogomarcaController.showPorMarca,
);
logomarcaRoutes.get('/catLog/:id_pais', LogomarcaController.showCatLog);
logomarcaRoutes.get(
  '/paisMarca/:id_pais/:id_marca_geral',
  LogomarcaController.showPaisMarca,
);
logomarcaRoutes.get('/ativo', LogomarcaController.showAtivo);
logomarcaRoutes.patch('/', LogomarcaController.ativaDesativa);

export default logomarcaRoutes;
