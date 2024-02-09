/* eslint-disable camelcase */
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import shortid from 'shortid';
import { Logs, iLogs } from '../entities/LogsEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import { convertDateTime2String } from '../utils/dateNow';
import retornoPadrao from '../utils/retornoPadrao';

export class LogsDB extends Logs {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na biblioteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro no banco
    consoleLog(`Erro ao buscar categoria, rows = undefined`, pVerbose.erro);
    return new ErrorHandlerDB(`Erro ao buscar categoria, rows = undefined`);
  }

  async insert(
    idUsuario: string,
    idFilial: string,
    acao: string,
    conn: Connection,
  ): Promise<iReturnDefault> {
    const acesso = new Date();
    const sql = `INSERT INTO logs (id_log, id_usuario, id_filial, acao, acesso) VALUES (?,?,?,?,?)`;
    const id_log = shortid.generate();
    const values = [id_log, idUsuario, idFilial, acao, acesso];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);

      if (result.affectedRows === 1) {
        consoleLog(`Log inserido com sucesso`, pVerbose.aviso);
      } else {
        consoleLog(`Erro ao inserir log`, pVerbose.erro);
      }

      return Promise.resolve(retornoPadrao(1, `Log cadastrado com sucesso!`));
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async show(conn: Connection): Promise<iLogs[]> {
    const sql = `SELECT
                  log.id_log,
                  log.id_usuario,
                  usr.email AS usuario,
                  log.id_filial,
                  fil.nome AS nome_filial,
                  log.acao,
                  log.acesso
                 FROM logs log
                 INNER JOIN usuario usr ON usr.id_usuario = log.id_usuario
                 INNER JOIN filial fil ON fil.id_filial = log.id_filial
                 ORDER BY log.acesso DESC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql);

      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const logs = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          acesso: convertDateTime2String(new Date(formatObject.acesso)),
        } as iLogs;
      });
      return Promise.resolve(logs);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
