/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
/* eslint-disable no-async-promise-executor */
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import shortid from 'shortid';
import {
  ListaSegmentos,
  SegmentosGeral,
  iSegmentoGeral,
} from '../entities/SegmentoGeralEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import { convertDate2String } from '../utils/dateNow';
import retornoPadrao from '../utils/retornoPadrao';

export class SegmentoGeralDB extends SegmentosGeral {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na biblioteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro no banco
    consoleLog(`Erro ao buscar segmento, rows = undefined`, pVerbose.erro);
    return new ErrorHandlerDB(`Erro ao buscar segmento, rows = undefined`);
  }

  async insert(obj: iSegmentoGeral, conn: Connection): Promise<iReturnDefault> {
    obj.id_segmento_geral = shortid.generate();

    const sql = `INSERT INTO segmento_geral (id_segmento_geral, titulo, status, criado_em, atualizado_em) VALUES (?,?,?,?,?)`;
    const values = [
      obj.id_segmento_geral,
      obj.titulo,
      obj.status,
      obj.criado_em,
      obj.atualizado_em,
    ];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 1) {
        consoleLog(
          `Segmento ${obj.titulo} inserido com sucesso!`,
          pVerbose.aviso,
        );
        return Promise.resolve(
          retornoPadrao(0, `Segmento ${obj.titulo} inserido com sucesso!`),
        );
      } else {
        consoleLog(`Erro ao inserir segmento`, pVerbose.erro);
        return Promise.resolve(retornoPadrao(1, `Erro ao inserir segmento`));
      }
    } catch (error) {
      consoleLog(`Erro ao inserir segmento: ${error}`, pVerbose.erro);
      return Promise.reject(error);
    }
  }

  async update(obj: iSegmentoGeral, conn: Connection): Promise<iReturnDefault> {
    const sql = `UPDATE segmento_geral SET titulo = ?, atualizado_em = ? WHERE id_segmento_geral = ?`;
    const values = [obj.titulo, obj.atualizado_em, obj.id_segmento_geral];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);

      if (result.affectedRows === 0) {
        consoleLog(`Segmento ${obj.titulo} não encontrado`, pVerbose.erro);
        return Promise.reject(
          retornoPadrao(1, `Segmento ${obj.titulo} não encontrado`),
        );
      }
      consoleLog(
        `Segmento ${obj.titulo} atualizado com sucesso!`,
        pVerbose.aviso,
      );
      return Promise.resolve(
        retornoPadrao(0, `Segmento ${obj.titulo} atualizado com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async show(conn: Connection): Promise<ListaSegmentos[]> {
    const sql = `SELECT segger.id_segmento_geral,
                 segger.titulo,
                 segger.status,
                 segger.criado_em,
                 segger.atualizado_em,
                 JSON_ARRAYAGG(
                     JSON_OBJECT(
                         'id_segmento', seg.id_segmento,
                         'titulo', seg.titulo,
                         'status', seg.status,
                         'id_pais', seg.id_pais,
                         'nome_pais', pais.nome
                      )
                    ) AS lista_segmento
                 FROM segmento_geral segger
                 LEFT JOIN segmento seg ON seg.id_segmento_geral = segger.id_segmento_geral
                 LEFT JOIN pais pais ON pais.id_pais = seg.id_pais
                 GROUP BY segger.id_segmento_geral
                 ORDER BY segger.titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql);

      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const segmento = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as ListaSegmentos;
      });
      return Promise.resolve(segmento);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showAtivo(conn: Connection): Promise<iSegmentoGeral[]> {
    const sql = `SELECT id_segmento_geral,
                 titulo,
                 status,
                 criado_em,
                 atualizado_em
                 FROM segmento_geral
                 WHERE status = 1
                 ORDER BY titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql);

      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const segmento = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as iSegmentoGeral;
      });
      return Promise.resolve(segmento);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async find(
    id_segmento_geral: string,
    conn: Connection,
  ): Promise<iSegmentoGeral[]> {
    const sql = `SELECT * FROM segmento_geral WHERE id_segmento_geral = ?`;

    try {
      const [rows]: any = await conn.query(sql, [id_segmento_geral]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }

      const segmento = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iSegmentoGeral;
      });

      return Promise.resolve(segmento);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async ativaDesativa(
    obj: iSegmentoGeral,
    conn: Connection,
  ): Promise<iReturnDefault> {
    const sql = `UPDATE segmento_geral SET status = ?, atualizado_em = ? WHERE id_segmento_geral = ?`;
    const values = [obj.status, obj.atualizado_em, obj.id_segmento_geral];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);

      if (result.affectedRows === 0) {
        consoleLog(`Segmento ${obj.titulo} não encontrado`, pVerbose.erro);
        return Promise.reject(
          retornoPadrao(1, `Segmento ${obj.titulo} não encontrado`),
        );
      }
      consoleLog(
        `Segmento ${obj.titulo} atualizado com sucesso!`,
        pVerbose.aviso,
      );
      return Promise.resolve(
        retornoPadrao(0, `Segmento atualizado com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
