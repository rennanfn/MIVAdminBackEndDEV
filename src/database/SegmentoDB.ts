/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
/* eslint-disable no-async-promise-executor */
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import shortid from 'shortid';
import { PaisNomes, Segmentos, iSegmento } from '../entities/SegmentoEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import { convertDate2String } from '../utils/dateNow';
import retornoPadrao from '../utils/retornoPadrao';

export class SegmentoDB extends Segmentos {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na biblioteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro no banco
    consoleLog(`Erro ao buscar segmento, rows = undefined`, pVerbose.erro);
    return new ErrorHandlerDB(`Erro ao buscar segmento, rows = undefined`);
  }

  async insert(obj: iSegmento, conn: Connection): Promise<iReturnDefault> {
    obj.id_segmento = shortid.generate();

    const sql = `INSERT INTO segmento (id_segmento, id_pais, titulo, status, id_segmento_geral, criado_em, atualizado_em) VALUES (?,?,?,?,?,?,?)`;
    const values = [
      obj.id_segmento,
      obj.id_pais,
      obj.titulo,
      obj.status,
      obj.id_segmento_geral,
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

  async update(obj: iSegmento, conn: Connection): Promise<iReturnDefault> {
    const sql = `UPDATE segmento SET id_pais = ?, titulo = ?, status = ?, atualizado_em = ? WHERE id_segmento = ?`;
    const values = [
      obj.id_pais,
      obj.titulo,
      obj.status,
      (obj.atualizado_em = new Date()),
      obj.id_segmento,
    ];

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

  async show(conn: Connection): Promise<iSegmento[]> {
    const sql = `SELECT seg.id_segmento,
                 seg.id_pais,
                 pais.nome AS nome_pais,
                 seg.titulo,
                 seg.status,
                 seg.id_segmento_geral,
                 segger.titulo AS segmento_geral,
                 seg.criado_em,
                 seg.atualizado_em
                 FROM segmento seg
                 LEFT JOIN pais pais ON pais.id_pais = seg.id_pais
                 LEFT JOIN segmento_geral segger ON segger.id_segmento_geral = seg.id_segmento_geral
                 ORDER BY seg.titulo ASC`;
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
        } as PaisNomes;
      });

      return Promise.resolve(segmento);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showPais(id_pais: string, conn: Connection): Promise<iSegmento[]> {
    const sql = `SELECT seg.id_segmento,
                 seg.id_pais,
                 pais.nome AS nome_pais,
                 seg.titulo,
                 seg.imagem,
                 seg.nome_imagem,
                 seg.status,
                 seg.id_segmento_geral,
                 segger.titulo AS segmento_geral,
                 seg.criado_em,
                 seg.atualizado_em
                 FROM segmento seg
                 LEFT JOIN pais pais ON pais.id_pais = seg.id_pais
                 LEFT JOIN segmento_geral segger ON segger.id_segmento_geral = seg.id_segmento_geral
                 WHERE seg.id_pais = ? AND seg.status = 1
                 ORDER BY seg.titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [id_pais]);

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
        } as PaisNomes;
      });

      return Promise.resolve(segmento);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showAtivo(conn: Connection): Promise<iSegmento[]> {
    const sql = `SELECT seg.id_segmento,
                 seg.id_pais,
                 pais.nome AS nome_pais,
                 seg.titulo,
                 seg.status,
                 seg.id_segmento_geral,
                 segger.titulo AS segmento_geral,
                 seg.criado_em,
                 seg.atualizado_em
                 FROM segmento seg
                 INNER JOIN pais pais ON pais.id_pais = seg.id_pais
                 INNER JOIN segmento_geral segger ON segger.id_segmento_geral = seg.id_segmento_geral
                 WHERE seg.status = 1
                 ORDER BY seg.titulo ASC`;
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
        } as PaisNomes;
      });

      return Promise.resolve(segmento);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showPaisSeg(
    id_segmento: string,
    conn: Connection,
  ): Promise<iSegmento[]> {
    const sql = `SELECT DISTINCT
                 pais.id_pais,
                 pais.nome AS nome_pais
                 FROM segmento seg
                 LEFT JOIN pais pais ON pais.id_pais = seg.id_pais = pais.id_pais
                 LEFT JOIN segmento_geral segger ON segger.id_segmento_geral = segger.id_segmento_geral
                 WHERE pais.status = 1 AND seg.id_segmento = ?
                 ORDER BY pais.nome ASC;`;

    try {
      const [rows]: any = await conn.query(sql, [id_segmento]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }

      const segmento = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as PaisNomes;
      });

      return Promise.resolve(segmento);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async find(id_segmento: string, conn: Connection): Promise<iSegmento[]> {
    const sql = `SELECT id_segmento, status, atualizado_em FROM segmento WHERE id_segmento = ?`;

    try {
      const [rows]: any = await conn.query(sql, [id_segmento]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }

      const segmento = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as PaisNomes;
      });

      return Promise.resolve(segmento);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async findSegmento(
    id_segmento: string,
    conn: Connection,
  ): Promise<iSegmento> {
    const sql = `SELECT id_segmento, titulo FROM segmento WHERE id_segmento = ? AND status = 1`;

    try {
      const [rows]: any = await conn.query(sql, [id_segmento]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }

      const segmento: PaisNomes = {
        ...rows[0],
      };

      return Promise.resolve(segmento);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async findSegGeral(
    id_segmento_geral: string,
    conn: Connection,
  ): Promise<iSegmento[]> {
    const sql = `SELECT id_segmento, titulo, status, atualizado_em FROM segmento WHERE id_segmento_geral = ?`;

    try {
      const [rows]: any = await conn.query(sql, [id_segmento_geral]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }

      const segmento = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as PaisNomes;
      });

      return Promise.resolve(segmento);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async ativaDesativa(
    segmentos: iSegmento[],
    conn: Connection,
  ): Promise<iReturnDefault[]> {
    const sql = `UPDATE segmento SET status = ?, atualizado_em = ? WHERE id_segmento = ?`;

    try {
      const promises = segmentos.map(async (segmento) => {
        const values = [
          segmento.status,
          segmento.atualizado_em,
          segmento.id_segmento,
        ];
        const [result] = await conn.query<ResultSetHeader>(sql, values);

        if (result.affectedRows === 0) {
          consoleLog(
            `Segmento ${segmento.titulo} não encontrado`,
            pVerbose.erro,
          );
          return retornoPadrao(1, `Segmento ${segmento.titulo} não encontrado`);
        }

        consoleLog(
          `Segmento ${segmento.titulo} atualizado com sucesso!`,
          pVerbose.aviso,
        );
        return retornoPadrao(0, `Segmento atualizado com sucesso!`);
      });
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
