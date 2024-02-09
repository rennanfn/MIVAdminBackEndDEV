import { iReturnDefault } from '../utils/ReturnDefault';
import { Connection } from 'mysql2/promise';

export interface iLogs {
  id_log: string;
  id_usuario: string;
  id_filial: string;
  acao: string;
  acesso: Date | string;
  nome_usuario?: string;
  nome_filial?: string;
}

export abstract class Logs {
  abstract insert(
    idUsuario: string,
    idFilial: string,
    acao: string,
    conn: Connection,
  ): Promise<iReturnDefault>;

  abstract show(conn: Connection): Promise<iLogs[]>;
}
