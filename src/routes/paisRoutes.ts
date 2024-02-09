import { Router, Request, Response } from 'express';
import PaisController from '../controllers/PaisController';
import path from 'path';

const paisRoutes = Router();

paisRoutes.post('/', PaisController.insert);
paisRoutes.post('/upload', PaisController.upload);
paisRoutes.get('/download/:fileName', PaisController.download);
paisRoutes.get('/exibirImagem/:fileName', PaisController.exibirImagem);

paisRoutes.get('/exibir/:imageName', (req: Request, resp: Response) => {
  const imageName = req.params.imageName;
  // Construa o caminho completo para a imagem
  const imagePath = path.join(__dirname, '../public', imageName);
  // Envie a imagem como resposta
  resp.sendFile(imagePath);
});

paisRoutes.put('/', PaisController.update);
paisRoutes.get('/', PaisController.show);
paisRoutes.get('/ativos', PaisController.showAtivo);
paisRoutes.patch('/', PaisController.ativaDesativa);

export default paisRoutes;
