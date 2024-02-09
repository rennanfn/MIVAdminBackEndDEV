import { Router } from 'express';
import CategoriaLogoGeralController from '../controllers/CategoriaLogoGeralController';

const categoriaLogoGeralRoutes = Router();

categoriaLogoGeralRoutes.post('/', CategoriaLogoGeralController.insert);
categoriaLogoGeralRoutes.put('/', CategoriaLogoGeralController.update);
categoriaLogoGeralRoutes.get('/', CategoriaLogoGeralController.show);
categoriaLogoGeralRoutes.get('/ativo', CategoriaLogoGeralController.showAtivo);
categoriaLogoGeralRoutes.patch('/', CategoriaLogoGeralController.ativaDesativa);

export default categoriaLogoGeralRoutes;
