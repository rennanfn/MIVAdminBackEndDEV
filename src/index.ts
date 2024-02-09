/* eslint-disable @typescript-eslint/no-unused-vars */
import { Ipware } from '@fullerstack/nax-ipware';
import cors, { CorsOptions } from 'cors';
import express from 'express';
import { createPool } from 'mysql2/promise';
import { MySqlConnection } from './database/MySqlConnection';
import dbconfig from './database/dbconfig';
import routes from './routes/index';
import { requireOrigin } from './utils/RequireOrigins';
import { consoleLog, pVerbose } from './utils/consoleLog';

// URLS liberadas para acessarem a api, devem ser separadas por ;
const origensPermitidas = process.env.CORS_URL_PERMITIDAS_MIV || '';

const expressPort = Number(process.env.PORTA_EXPRESS_MIV);
if (!expressPort) {
  consoleLog('Falta variável de ambiente PORTA_EXPRESS_MIV', pVerbose.erro);
  process.exit(1);
}

// const tokenAPI = process.env.TOKEN_API_MIV;
// if (!tokenAPI) {
//   console.error('Falta variável de ambiente TOKEN_API_MIV');
//   if (process.env.NODE_ENV === 'PROD') {
//     exit(1);
//   }
// }

const corsOptions: CorsOptions = {
  origin: origensPermitidas.split(';'),
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

async function init() {
  try {
    console.log('Aguarde, criando pool', pVerbose.aviso);
    MySqlConnection.pool = createPool(dbconfig);
    console.log('Pool MySQL Criado', pVerbose.aviso);
  } catch (error) {
    console.log(`Erro ao iniciar pool do MySQL ${error}`, pVerbose.erro);
  }
}

const ipware = new Ipware();
const server = express();

server.use(cors(corsOptions));
server.use(express.json({ limit: '10mb' }));
server.use(express.urlencoded({ extended: false }));
// Adiciona o IP do cliente nas requisições;
server.use((req, res, next) => {
  const ipInfo = ipware.getClientIP(req);
  if (ipInfo !== null) {
    req.clientIpInfo = {
      ip: ipInfo.ip,
      isPublic: ipInfo.isPublic,
    };
  }
  next();
});
server.use(requireOrigin);
server.use(routes);

if (process.env.NODE_ENV === 'DEV') {
  server.listen(expressPort, () => {
    consoleLog(`Serviço iniciando na porta ${expressPort}`, pVerbose.aviso);
    init();
  });
}
