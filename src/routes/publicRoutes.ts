/* eslint-disable prettier/prettier */
import { Router } from 'express';
import PaisController from '../controllers/PaisController';
import SegmentoController from '../controllers/SegmentoController';
import ConteudoController from '../controllers/ConteudoController';
import MarcaController from '../controllers/MarcaController';
import LogomarcaController from '../controllers/LogomarcaController';
import RevendaFilialController from '../controllers/RevendaFilialDB';

const publicRoutes = Router();

publicRoutes.get('/files/pais/:imagem', PaisController.exibirImagem);
publicRoutes.get('/files/segmentos/:imagem', SegmentoController.exibirImagem);
publicRoutes.get('/files/conteudo/:imagem', ConteudoController.exibirImagem);
publicRoutes.get('/files/marca/:imagem', MarcaController.exibirImagem);
publicRoutes.get('/files/logomarca/:imagem', LogomarcaController.exibirImagem);
publicRoutes.get('/files/revenda/:imagem', RevendaFilialController.exibirImagem);

export default publicRoutes;
