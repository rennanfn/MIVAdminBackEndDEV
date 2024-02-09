import { validaToken } from './../utils/token';
import { Router } from 'express';
import { LoginController } from '../controllers/LoginController';

const loginRoutes = Router();

loginRoutes.post('/', LoginController.autenticar);
loginRoutes.post('/trocarSenha', validaToken, LoginController.trocarSenha);
loginRoutes.post('/esqueciSenha', LoginController.esqueciMinhaSenha);
loginRoutes.post('/alterarSenha/:senhaTemp', LoginController.alterarSenha);
loginRoutes.get('/refreshToken', LoginController.refreshtoken);

export default loginRoutes;
