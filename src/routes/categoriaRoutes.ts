import { Router } from 'express';
import CategoriaController from '../controllers/CategoriaController';

const categoriaRoutes = Router();

categoriaRoutes.post('/', CategoriaController.insertOrUpdate);
// categoriaRoutes.put('/', CategoriaController.update);
categoriaRoutes.get('/', CategoriaController.show);
categoriaRoutes.get('/ativo', CategoriaController.showAtivo);
categoriaRoutes.get('/:id_pais', CategoriaController.showPorPais);
categoriaRoutes.patch('/', CategoriaController.ativaDesativa);

export default categoriaRoutes;
