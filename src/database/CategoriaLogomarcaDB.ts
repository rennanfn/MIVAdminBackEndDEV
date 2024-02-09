/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
/* eslint-disable no-async-promise-executor */
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import shortid from 'shortid';
import {
  CategoriaLogomarcas,
  ListaCatLogomarca,
  iCategoriaLogomarca,
} from '../entities/CategoriaLogomarcaEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import { convertDate2String } from '../utils/dateNow';
import retornoPadrao from '../utils/retornoPadrao';

export class CategoriaLogomarcaDB extends CategoriaLogomarcas {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na biblioteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro no banco
    consoleLog(
      `Erro ao buscar categoria logomarca, rows = undefined`,
      pVerbose.erro,
    );
    return new ErrorHandlerDB(
      `Erro ao buscar categoria logomarca, rows = undefined`,
    );
  }

  async insert(
    obj: iCategoriaLogomarca,
    conn: Connection,
  ): Promise<iReturnDefault> {
    obj.id_categoria_logomarca = shortid.generate();

    const sql = `INSERT INTO categoria_logomarca
                 (id_categoria_logomarca, id_pais, titulo, status, id_categoria_logomarca_geral, texto_descricao, criado_em, atualizado_em)
                 VALUES (?,?,?,?,?,?,?,?)`;
    const values = [
      obj.id_categoria_logomarca,
      obj.id_pais,
      obj.titulo,
      obj.status,
      obj.id_categoria_logomarca_geral,
      obj.texto_descricao,
      obj.criado_em,
      obj.atualizado_em,
    ];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 1) {
        consoleLog(
          `Categoria Logomarca ${obj.titulo} inserida com sucesso!`,
          pVerbose.aviso,
        );
        return Promise.resolve(
          retornoPadrao(
            0,
            `Categoria Logomarca ${obj.titulo} inserida com sucesso!`,
          ),
        );
      } else {
        consoleLog(`Erro ao inserir categoria logomarca`, pVerbose.erro);
        return Promise.resolve(
          retornoPadrao(1, `Erro ao inserir categoria logomarca`),
        );
      }
    } catch (error) {
      consoleLog(
        `Erro ao inserir categoria logomarca: ${error}`,
        pVerbose.erro,
      );
      return Promise.reject(error);
    }
  }

  async update(
    obj: iCategoriaLogomarca,
    conn: Connection,
  ): Promise<iReturnDefault> {
    const sql = `UPDATE categoria_logomarca SET id_pais = ?, titulo = ?, status = ?, texto_descricao = ?, atualizado_em = ? WHERE id_categoria_logomarca = ?`;
    const values = [
      obj.id_pais,
      obj.titulo,
      obj.status,
      obj.texto_descricao,
      (obj.atualizado_em = new Date()),
      obj.id_categoria_logomarca,
    ];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);

      if (result.affectedRows === 0) {
        consoleLog(
          `Categoria Logomarca ${obj.titulo} não encontrada`,
          pVerbose.erro,
        );
        return Promise.reject(
          retornoPadrao(1, `Categoria Logomarca ${obj.titulo} não encontrada`),
        );
      }
      consoleLog(
        `Categoria Logomarca ${obj.titulo} atualizada com sucesso!`,
        pVerbose.aviso,
      );
      return Promise.resolve(
        retornoPadrao(
          0,
          `Categoria Logomarca ${obj.titulo} atualizada com sucesso!`,
        ),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async show(conn: Connection): Promise<iCategoriaLogomarca[]> {
    const sql = `SELECT catlog.id_categoria_logomarca,
                 catlog.id_pais,
                 pais.nome AS nome_pais,
                 catlog.titulo,
                 catlog.status,
                 catlog.id_categoria_logomarca_geral,
                 catlogger.titulo AS categoria_logomarca_geral,
                 catlog.texto_descricao,
                 catlog.criado_em,
                 catlog.atualizado_em
                 FROM categoria_logomarca catlog
                 INNER JOIN pais pais ON pais.id_pais = catlog.id_pais
                 INNER JOIN categoria_logomarca_geral catlogger ON catlogger.id_categoria_logomarca_geral = catlog.id_categoria_logomarca_geral
                 ORDER BY catlog.titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql);

      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const categoria_logomarca = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as ListaCatLogomarca;
      });

      return Promise.resolve(categoria_logomarca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showPorLogoGer(
    id_categoria_logomarca_geral: string,
    conn: Connection,
  ): Promise<iCategoriaLogomarca[]> {
    const sql = `SELECT catlog.id_categoria_logomarca,
                 catlog.id_pais,
                 pais.nome AS nome_pais,
                 catlog.titulo,
                 catlog.status,
                 catlog.id_categoria_logomarca_geral,
                 catlogger.titulo AS categoria_logomarca_geral,
                 catlog.texto_descricao,
                 catlog.criado_em,
                 catlog.atualizado_em
                 FROM categoria_logomarca catlog
                 INNER JOIN pais pais ON pais.id_pais = catlog.id_pais
                 INNER JOIN categoria_logomarca_geral catlogger ON catlogger.id_categoria_logomarca_geral = catlog.id_categoria_logomarca_geral
                 WHERE catlog.id_categoria_logomarca_geral = ?
                 ORDER BY catlog.titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [
        id_categoria_logomarca_geral,
      ]);

      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const categoria_logomarca = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as ListaCatLogomarca;
      });

      return Promise.resolve(categoria_logomarca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showPorCatLog(
    id_marca: string,
    id_pais: string,
    conn: Connection,
  ): Promise<iCategoriaLogomarca[]> {
    const sql = `SELECT DISTINCT
                 catlog.id_categoria_logomarca,
                 catlog.titulo,
                 catlog.texto_descricao
                 FROM categoria_logomarca catlog
                 LEFT JOIN logomarca log ON log.id_categoria_logomarca = catlog.id_categoria_logomarca
                 LEFT JOIN marca mrc ON mrc.id_marca_geral = log.id_marca_geral
                 WHERE mrc.id_marca = ? AND catlog.id_pais = ?
                 ORDER BY catlog.titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [
        id_marca,
        id_pais,
      ]);

      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const categoria_logomarca = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as ListaCatLogomarca;
      });

      return Promise.resolve(categoria_logomarca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showAtivo(conn: Connection): Promise<iCategoriaLogomarca[]> {
    const sql = `SELECT catlog.id_categoria_logomarca,
                 catlog.id_pais,
                 pais.nome AS nome_pais,
                 catlog.titulo,
                 catlog.status,
                 catlog.id_categoria_logomarca_geral,
                 catlogger.titulo AS categoria_logomarca_geral,
                 catlog.texto_descricao,
                 catlog.criado_em,
                 catlog.atualizado_em
                 FROM categoria_logomarca catlog
                 INNER JOIN pais pais ON pais.id_pais = catlog.id_pais
                 INNER JOIN categoria_logomarca_geral catlogger ON catlogger.id_categoria_logomarca_geral = catlog.id_categoria_logomarca_geral
                 WHERE catlog.status = 1
                 ORDER BY catlog.titulo ASC`;
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
        } as ListaCatLogomarca;
      });

      return Promise.resolve(segmento);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async find(
    id_categoria_logomarca: string,
    conn: Connection,
  ): Promise<iCategoriaLogomarca[]> {
    const sql = `SELECT id_categoria_logomarca, status, atualizado_em FROM categoria_logomarca WHERE id_categoria_logomarca = ?`;

    try {
      const [rows]: any = await conn.query(sql, [id_categoria_logomarca]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }

      const segmento = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as ListaCatLogomarca;
      });

      return Promise.resolve(segmento);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async ativaDesativa(
    obj: iCategoriaLogomarca,
    conn: Connection,
  ): Promise<iReturnDefault> {
    const sql = `UPDATE categoria_logomarca SET status = ?, atualizado_em = ? WHERE id_categoria_logomarca = ?`;
    const values = [obj.status, obj.atualizado_em, obj.id_categoria_logomarca];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);

      if (result.affectedRows === 0) {
        consoleLog(
          `Categoria Logomarca ${obj.titulo} não encontrada`,
          pVerbose.erro,
        );
        return Promise.reject(
          retornoPadrao(1, `Categoria Logomarca ${obj.titulo} não encontrada`),
        );
      }
      consoleLog(
        `Categoria Logomarca ${obj.titulo} atualizada com sucesso!`,
        pVerbose.aviso,
      );
      return Promise.resolve(
        retornoPadrao(0, `Categoria Logomarca atualizada com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
