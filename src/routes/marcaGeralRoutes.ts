import { Router } from 'express';
import MarcaGeralController from '../controllers/MarcaGeralController';

const marcaGeralRoutes = Router();

marcaGeralRoutes.post('/', MarcaGeralController.insert);
marcaGeralRoutes.put('/', MarcaGeralController.update);
marcaGeralRoutes.get('/', MarcaGeralController.show);
marcaGeralRoutes.get('/ativo', MarcaGeralController.showAtivo);
marcaGeralRoutes.patch('/', MarcaGeralController.ativaDesativa);

export default marcaGeralRoutes;
