import { Router } from 'express';
import MarcaController from '../controllers/MarcaController';

const marcaRoutes = Router();

marcaRoutes.get(
  '/marcaGeral/:id_marca_geral',
  MarcaController.showPorMarcaGeral,
);
marcaRoutes.post('/', MarcaController.insert);
marcaRoutes.post('/upload', MarcaController.upload);
marcaRoutes.get('/download/:fileName', MarcaController.download);
marcaRoutes.put('/', MarcaController.update);
marcaRoutes.get('/', MarcaController.show);
marcaRoutes.get(
  '/categoriaMarca/:id_marca',
  MarcaController.showCategoriaPorMarca,
);
marcaRoutes.get('/pais/:id_marca_geral', MarcaController.showPais);
marcaRoutes.get('/:id_segmento/:id_pais', MarcaController.showSegPais);
marcaRoutes.get(
  '/categoria/:id_marca_geral/:id_pais',
  MarcaController.showCategoria,
);
marcaRoutes.get('/ativo', MarcaController.showAtivo);
marcaRoutes.get('/:id_marca', MarcaController.find);
marcaRoutes.patch('/', MarcaController.ativaDesativa);

export default marcaRoutes;
