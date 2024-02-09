/* eslint-disable camelcase */
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { Estados, iEstado } from '../entities/EstadoEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import retornoPadrao from '../utils/retornoPadrao';
import shortid from 'shortid';

export class EstadoDB extends Estados {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na biblioteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro
    consoleLog(`Erro ao buscar estado, rows = undefined`, pVerbose.erro);
    return new ErrorHandlerDB(`Erro ao buscar estado, rows = undefined`);
  }

  async insert(obj: iEstado, conn: Connection): Promise<iReturnDefault> {
    obj.id_estado = shortid.generate();
    const sql = `INSERT INTO estado (id_estado, nome, id_pais) VALUES (?,?,?)`;
    const values = [obj.id_estado, obj.nome, obj.id_pais];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 1) {
        consoleLog(`Estado ${obj.nome} inserido com sucesso!`, pVerbose.aviso);
        return Promise.resolve(
          retornoPadrao(0, `Estado ${obj.nome} inserido com sucesso!`),
        );
      } else {
        consoleLog(`Erro ao inserir estado`, pVerbose.erro);
        return Promise.resolve(retornoPadrao(1, `Erro ao inserir estado`));
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showEstadoPais(id_pais: string, conn: Connection): Promise<iEstado[]> {
    const sql = `SELECT * FROM estado WHERE id_pais = ? ORDER BY nome ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [id_pais]);
      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }
      const estado = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iEstado;
      });
      return Promise.resolve(estado);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async find(
    nome: string,
    id_pais: string,
    conn: Connection,
  ): Promise<iEstado[]> {
    const sql = `SELECT * FROM estado WHERE nome = ? AND id_pais = ?`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [nome, id_pais]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }
      const nome_estado = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iEstado;
      });
      return Promise.resolve(nome_estado);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
