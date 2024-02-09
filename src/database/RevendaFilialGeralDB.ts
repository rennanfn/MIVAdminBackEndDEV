/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
/* eslint-disable no-async-promise-executor */
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import shortid from 'shortid';
import {
  ListaRevendas,
  RevendasGeral,
  iRevendaFilialGeral,
} from '../entities/RevendaFilialGeralEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import { convertDate2String } from '../utils/dateNow';
import retornoPadrao from '../utils/retornoPadrao';

export class RevendaFilialGeralDB extends RevendasGeral {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na biblioteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro no banco
    consoleLog(
      `Erro ao buscar revenda/filial, rows = undefined`,
      pVerbose.erro,
    );
    return new ErrorHandlerDB(
      `Erro ao buscar revenda/filial, rows = undefined`,
    );
  }

  async insert(
    obj: iRevendaFilialGeral,
    conn: Connection,
  ): Promise<iReturnDefault> {
    obj.id_revenda_filial_geral = shortid.generate();

    const sql = `INSERT INTO revenda_filial_geral (id_revenda_filial_geral, titulo, status, criado_em, atualizado_em) VALUES (?,?,?,?,?)`;
    const values = [
      obj.id_revenda_filial_geral,
      obj.titulo,
      obj.status,
      obj.criado_em,
      obj.atualizado_em,
    ];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 1) {
        consoleLog(
          `Revenda/Filial ${obj.titulo} inserida com sucesso!`,
          pVerbose.aviso,
        );
        return Promise.resolve(
          retornoPadrao(
            0,
            `Revenda/Filial ${obj.titulo} inserida com sucesso!`,
          ),
        );
      } else {
        consoleLog(`Erro ao inserir Revenda/Filial`, pVerbose.erro);
        return Promise.resolve(
          retornoPadrao(1, `Erro ao inserir Revenda/Filial`),
        );
      }
    } catch (error) {
      consoleLog(`Erro ao inserir Revenda/Filial: ${error}`, pVerbose.erro);
      return Promise.reject(error);
    }
  }

  async update(
    obj: iRevendaFilialGeral,
    conn: Connection,
  ): Promise<iReturnDefault> {
    const sql = `UPDATE revenda_filial_geral SET titulo = ?, atualizado_em = ? WHERE id_revenda_filial_geral = ?`;
    const values = [obj.titulo, obj.atualizado_em, obj.id_revenda_filial_geral];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);

      if (result.affectedRows === 0) {
        consoleLog(
          `Revenda/Filial ${obj.titulo} não encontrada`,
          pVerbose.erro,
        );
        return Promise.reject(
          retornoPadrao(1, `Revenda/Filial ${obj.titulo} não encontrada`),
        );
      }
      consoleLog(
        `Revenda/Filial ${obj.titulo} atualizada com sucesso!`,
        pVerbose.aviso,
      );
      return Promise.resolve(
        retornoPadrao(
          0,
          `Revenda/Filial ${obj.titulo} atualizada com sucesso!`,
        ),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async show(conn: Connection): Promise<ListaRevendas[]> {
    const sql = `SELECT rvfg.id_revenda_filial_geral,
                 rvfg.titulo,
                 rvfg.status,
                 rvfg.criado_em,
                 rvfg.atualizado_em,
                 JSON_ARRAYAGG(
                     JSON_OBJECT(
                         'id_revenda_filial', rvf.id_revenda_filial,
                         'titulo', rvf.titulo,
                         'status', rvf.status,
                         'id_pais', rvf.id_pais,
                         'nome_pais', pais.nome
                      )
                    ) AS lista_revendas
                 FROM revenda_filial_geral rvfg
                 LEFT JOIN revenda_filial rvf ON rvf.id_revenda_filial_geral = rvfg.id_revenda_filial_geral
                 LEFT JOIN pais pais ON pais.id_pais = rvf.id_pais
                 GROUP BY rvfg.id_revenda_filial_geral
                 ORDER BY rvfg.titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql);

      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const marca = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as ListaRevendas;
      });
      return Promise.resolve(marca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showAtivo(conn: Connection): Promise<iRevendaFilialGeral[]> {
    const sql = `SELECT id_revenda_filial_geral,
                 titulo,
                 status,
                 criado_em,
                 atualizado_em
                 FROM revenda_filial_geral
                 WHERE status = 1
                 ORDER BY titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql);

      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const marca = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as iRevendaFilialGeral;
      });
      return Promise.resolve(marca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async find(
    id_revenda_filial_geral: string,
    conn: Connection,
  ): Promise<iRevendaFilialGeral[]> {
    const sql = `SELECT * FROM revenda_filial_geral WHERE id_revenda_filial_geral = ?`;

    try {
      const [rows]: any = await conn.query(sql, [id_revenda_filial_geral]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }

      const revenda = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iRevendaFilialGeral;
      });

      return Promise.resolve(revenda);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async ativaDesativa(
    obj: iRevendaFilialGeral,
    conn: Connection,
  ): Promise<iReturnDefault> {
    const sql = `UPDATE revenda_filial_geral SET status = ?, atualizado_em = ? WHERE id_revenda_filial_geral = ?`;
    const values = [obj.status, obj.atualizado_em, obj.id_revenda_filial_geral];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);

      if (result.affectedRows === 0) {
        consoleLog(
          `Revenda/Filial ${obj.titulo} não encontrada`,
          pVerbose.erro,
        );
        return Promise.reject(
          retornoPadrao(1, `Revenda/Filial ${obj.titulo} não encontrada`),
        );
      }
      consoleLog(
        `Revenda/Filial ${obj.titulo} atualizada com sucesso!`,
        pVerbose.aviso,
      );
      return Promise.resolve(
        retornoPadrao(0, `Revenda/Filial atualizada com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
