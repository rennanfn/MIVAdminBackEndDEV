/* eslint-disable camelcase */
/* eslint-disable no-async-promise-executor */
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import shortid from 'shortid';
import { Cidades, iCidade } from '../entities/CidadeEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import retornoPadrao from '../utils/retornoPadrao';

export class CidadeDB extends Cidades {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na biblioteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro
    consoleLog(`Erro ao buscar cidade, rows = undefined`, pVerbose.erro);
    return new ErrorHandlerDB(`Erro ao buscar cidade, rows = undefined`);
  }

  async insert(obj: iCidade, conn: Connection): Promise<iReturnDefault> {
    obj.id_cidade = shortid.generate();
    const sql = `INSERT INTO cidade (id_cidade,id_estado, nome) VALUES (?,?,?)`;
    const values = [obj.id_cidade, obj.id_estado, obj.nome];
    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 1) {
        consoleLog(`Cidade ${obj.nome} inserida com sucesso!`, pVerbose.aviso);
        return Promise.resolve(
          retornoPadrao(0, `Cidade ${obj.nome} inserida com sucesso!`),
        );
      } else {
        consoleLog(`Erro ao inserir cidade`, pVerbose.erro);
        return Promise.resolve(retornoPadrao(1, `Erro ao inserir cidade`));
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async update(obj: iCidade, conn: Connection): Promise<iReturnDefault> {
    const sql = `UPDATE cidade SET id_estado = ?, nome = ? WHERE id_cidade = ?`;
    const values = [obj.id_estado, obj.nome, obj.id_cidade];
    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 1) {
        consoleLog(
          `Cidade ${obj.nome} atualizada com sucesso!`,
          pVerbose.aviso,
        );
        return Promise.resolve(
          retornoPadrao(0, `Cidade ${obj.nome} atualizada com sucesso!`),
        );
      } else {
        consoleLog(`Erro ao atualizar cidade`, pVerbose.erro);
        return Promise.resolve(retornoPadrao(1, `Erro ao atualizar cidade`));
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showCidadeEstado(
    id_estado: string,
    conn: Connection,
  ): Promise<iCidade[]> {
    const sql = `SELECT * FROM cidade WHERE id_estado = ? ORDER BY nome ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [id_estado]);
      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }
      const cidades = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iCidade;
      });
      return Promise.resolve(cidades);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async show(conn: Connection): Promise<iCidade[]> {
    const sql = `SELECT cid.id_cidade,
                 cid.nome,
                 cid.id_estado,
                 est.nome AS nome_estado
                 FROM cidade cid
                 LEFT JOIN estado est ON est.id_estado = cid.id_estado`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, []);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }
      const cidade = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iCidade;
      });
      return Promise.resolve(cidade);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async find(nome: string, conn: Connection): Promise<iCidade[]> {
    const sql = `SELECT * FROM cidade WHERE nome = ?`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [nome]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }
      const nome_estado = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iCidade;
      });
      return Promise.resolve(nome_estado);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
