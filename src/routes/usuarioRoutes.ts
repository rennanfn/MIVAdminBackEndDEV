import { Router } from 'express';
import UsuarioController from '../controllers/UsuarioController';

const usuarioRoutes = Router();

usuarioRoutes.post('/', UsuarioController.insert);
usuarioRoutes.put('/', UsuarioController.update);
usuarioRoutes.get('/', UsuarioController.show);
usuarioRoutes.patch('/:id_usuario', UsuarioController.ativaDesativa);
usuarioRoutes.get('/:id_usuario', UsuarioController.find);

export default usuarioRoutes;
