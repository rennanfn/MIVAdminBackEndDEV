import { Router } from 'express';
import CategoriaLogomarcaController from '../controllers/CategoriaLogomarcaController';

const categoriaLogomarcaRoutes = Router();

categoriaLogomarcaRoutes.post('/', CategoriaLogomarcaController.insertOrUpdate);
categoriaLogomarcaRoutes.get('/', CategoriaLogomarcaController.show);
categoriaLogomarcaRoutes.get(
  '/:id_categoria_logomarca_geral',
  CategoriaLogomarcaController.showPorLogoGer,
);
categoriaLogomarcaRoutes.get(
  '/catlog/:id_marca/:id_pais',
  CategoriaLogomarcaController.showPorCatLog,
);
categoriaLogomarcaRoutes.get('/ativo', CategoriaLogomarcaController.showAtivo);
categoriaLogomarcaRoutes.patch('/', CategoriaLogomarcaController.ativaDesativa);

export default categoriaLogomarcaRoutes;
