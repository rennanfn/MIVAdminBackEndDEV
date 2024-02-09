import { Router } from 'express';
import CategoriaGeralController from '../controllers/CategoriaGeralController';

const categoriaGeralRoutes = Router();

categoriaGeralRoutes.post('/', CategoriaGeralController.insert);
categoriaGeralRoutes.put('/', CategoriaGeralController.update);
categoriaGeralRoutes.get('/', CategoriaGeralController.show);
categoriaGeralRoutes.get('/ativo', CategoriaGeralController.showAtivo);
categoriaGeralRoutes.patch('/', CategoriaGeralController.ativaDesativa);

export default categoriaGeralRoutes;
