import { Router } from 'express';
import EstadoController from '../controllers/EstadoController';

const estadoRoutes = Router();

estadoRoutes.post('/', EstadoController.insert);
estadoRoutes.get('/:id_pais', EstadoController.showEstadoPais);

export default estadoRoutes;
