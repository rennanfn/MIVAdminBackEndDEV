import { Router } from 'express';
import LogController from '../controllers/LogController';

const logsRoutes = Router();

logsRoutes.get('/', LogController.show);

export default logsRoutes;
