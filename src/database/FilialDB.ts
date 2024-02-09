/* eslint-disable no-async-promise-executor */
/* eslint-disable camelcase */
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import shortid from 'shortid';
import { Filiais, iFilial } from '../entities/FilialEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import { convertDate2String } from '../utils/dateNow';
import retornoPadrao from '../utils/retornoPadrao';

export class FilialDB extends Filiais {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na biblioteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro no banco
    consoleLog(`Erro ao buscar país, rows = undefined`, pVerbose.erro);
    return new ErrorHandlerDB(`Erro ao buscar país, rows = undefined`);
  }

  async insert(obj: iFilial, conn: Connection): Promise<iReturnDefault> {
    obj.id_filial = shortid.generate();
    const sql = `INSERT INTO filial (id_filial, nome, status, id_pais, id_cidade, id_estado, criado_em, atualizado_em) VALUES (?,?,?,?,?,?,?,?)`;
    const values = [
      obj.id_filial,
      obj.nome,
      obj.status,
      obj.id_pais,
      obj.id_cidade,
      obj.id_estado,
      obj.criado_em,
      obj.atualizado_em,
    ];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 1) {
        consoleLog(`Filial: ${obj.nome} inserida com sucesso!`, pVerbose.aviso);
        return Promise.resolve(
          retornoPadrao(0, `Filial: ${obj.nome} inserida com sucesso!`),
        );
      } else {
        consoleLog(`Erro ao inserir filial`, pVerbose.erro);
        return Promise.resolve(retornoPadrao(1, `Erro ao inserir filial`));
      }
    } catch (error) {
      consoleLog(`Erro ao inserir filial: ${error}`, pVerbose.erro);
      return Promise.reject(error);
    }
  }

  async update(obj: iFilial, conn: Connection): Promise<iReturnDefault> {
    const sql = `UPDATE filial SET nome = ?, id_pais = ?,  id_estado = ?, id_cidade = ?, atualizado_em = ? WHERE id_filial = ?`;
    const values = [
      obj.nome,
      obj.id_pais,
      obj.id_estado,
      obj.id_cidade,
      obj.atualizado_em,
      obj.id_filial,
    ];
    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 0) {
        consoleLog(`Filial ${obj.nome} não encontrada`, pVerbose.erro);
        return Promise.reject(
          retornoPadrao(1, `Filial ${obj.nome} não encontrada`),
        );
      }
      consoleLog(`Filial ${obj.nome} atualizada com sucesso!`, pVerbose.aviso);
      return Promise.resolve(
        retornoPadrao(0, `Filial ${obj.nome} atualizada com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async show(conn: Connection): Promise<iFilial[]> {
    const sql = `SELECT * FROM filial ORDER BY nome ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql);
      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }
      const filial = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as iFilial;
      });
      return Promise.resolve(filial);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showAtivo(conn: Connection): Promise<iFilial[]> {
    const sql = `SELECT * FROM filial WHERE status = 1 ORDER BY nome ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql);
      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }
      const filial = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as iFilial;
      });
      return Promise.resolve(filial);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async find(id_filial: string, conn: Connection): Promise<iFilial[]> {
    const sql = `SELECT * FROM filial WHERE id_filial = ?`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [id_filial]);
      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }
      const filial = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iFilial;
      });
      return Promise.resolve(filial);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async ativaDesativa(obj: iFilial, conn: Connection): Promise<iReturnDefault> {
    const sql = `UPDATE filial SET status = ?, atualizado_em = ? WHERE id_filial = ?`;
    const values = [obj.status, obj.atualizado_em, obj.id_filial];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 0) {
        consoleLog(`Filial ${obj.nome} não encontrada`, pVerbose.erro);
        return Promise.reject(
          retornoPadrao(1, `Filial ${obj.nome} não encontrada`),
        );
      }
      consoleLog(`Filial ${obj.nome} atualizada com sucesso!`, pVerbose.aviso);
      return Promise.resolve(
        retornoPadrao(0, `Filial atualizada com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
