import { Router } from 'express';
import ConteudoController from '../controllers/ConteudoController';

const conteudoRoutes = Router();

conteudoRoutes.post('/', ConteudoController.insert);
conteudoRoutes.post('/uploadArray', ConteudoController.uploadArray);
conteudoRoutes.post('/upload', ConteudoController.upload);
conteudoRoutes.get('/download/:fileName', ConteudoController.download);
conteudoRoutes.put('/', ConteudoController.update);
conteudoRoutes.get('/', ConteudoController.show);
conteudoRoutes.get(
  '/:id_categoria/:id_marca',
  ConteudoController.findCategoria,
);
conteudoRoutes.get(
  '/find/:id_categoria/:id_marca/:id_conteudo',
  ConteudoController.findConteudo,
);
conteudoRoutes.post('/catPais', ConteudoController.showPaisCategoria);
conteudoRoutes.get('/ativo', ConteudoController.showAtivo);
conteudoRoutes.patch('/', ConteudoController.ativaDesativa);

export default conteudoRoutes;
