import express, { Router } from 'express';
import path from 'path';
import { HoneyPot } from '../utils/HoneyPot';
import { validaToken } from '../utils/token';
import categoriaGeralRoutes from './categoriaGeralRoutes';
import categoriaLogoGeralRoutes from './categoriaLogoGeralRoutes';
import categoriaLogomarcaRoutes from './categoriaLogomarca';
import categoriaRoutes from './categoriaRoutes';
import cidadeRoutes from './cidadeRoutes';
import conteudoRoutes from './conteudoRoutes';
import estadoRoutes from './estadoRoutes';
import filialRoutes from './filialRoutes';
import loginRoutes from './loginRoutes';
import logomarcaRoutes from './logomarcaRoutes';
import logsRoutes from './logsRoutes';
import marcaGeralRoutes from './marcaGeralRoutes';
import marcaRoutes from './marcaRoutes';
import paisRoutes from './paisRoutes';
import publicRoutes from './publicRoutes';
import segmentoGeralRoutes from './segmentoGeralRoutes';
import segmentoRoutes from './segmentoRoutes';
import usuarioRoutes from './usuarioRoutes';
import revendaFilialGeralRoutes from './revendaFilialGeralRoutes';
import revendaFilialRoutes from './revendaFilialRoutes';

const routes = Router();

routes.use('/login', loginRoutes);
routes.use('/pais', validaToken, paisRoutes);
routes.use('/filial', validaToken, filialRoutes);
routes.use('/conteudo', validaToken, conteudoRoutes);
routes.use('/usuario', validaToken, usuarioRoutes);
routes.use('/categoria', validaToken, categoriaRoutes);
routes.use('/categoriaGeral', validaToken, categoriaGeralRoutes);
routes.use('/categoriaLogoGeral', validaToken, categoriaLogoGeralRoutes);
routes.use('/categoriaLogomarca', validaToken, categoriaLogomarcaRoutes);
routes.use('/logomarca', validaToken, logomarcaRoutes);
routes.use('/segmento', validaToken, segmentoRoutes);
routes.use('/segmentoGeral', validaToken, segmentoGeralRoutes);
routes.use('/marca', validaToken, marcaRoutes);
routes.use('/revenda', validaToken, revendaFilialRoutes);
routes.use('/marcaGeral', validaToken, marcaGeralRoutes);
routes.use('/revGeral', validaToken, revendaFilialGeralRoutes);
routes.use('/estado', validaToken, estadoRoutes);
routes.use('/cidade', validaToken, cidadeRoutes);
routes.use('/logs', validaToken, logsRoutes);

export const publicPath = path.join('public', 'files');

routes.use('/public', publicRoutes, express.static(publicPath));

// *********************************************************
// * Qualquer outra tentativa de acesso vai cair no HoneyPot
// * obs: Sempre deixar o honeyPot como última rota.
// *********************************************************
routes.all('/*', HoneyPot.reqGet);

export default routes;
