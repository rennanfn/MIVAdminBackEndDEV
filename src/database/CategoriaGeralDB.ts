/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
/* eslint-disable no-async-promise-executor */
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import shortid from 'shortid';
import {
  CategoriasGeral,
  ListaCategorias,
  iCategoriaGeral,
} from '../entities/CategoriaGeralEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import { convertDate2String } from '../utils/dateNow';
import retornoPadrao from '../utils/retornoPadrao';

export class CategoriaGeralDB extends CategoriasGeral {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na biblioteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro no banco
    consoleLog(`Erro ao buscar categoria, rows = undefined`, pVerbose.erro);
    return new ErrorHandlerDB(`Erro ao buscar categoria, rows = undefined`);
  }

  async insert(
    obj: iCategoriaGeral,
    conn: Connection,
  ): Promise<iReturnDefault> {
    obj.id_categoria_geral = shortid.generate();

    const sql = `INSERT INTO categoria_geral (id_categoria_geral, titulo, status, criado_em, atualizado_em) VALUES (?,?,?,?,?)`;
    const values = [
      obj.id_categoria_geral,
      obj.titulo,
      obj.status,
      obj.criado_em,
      obj.atualizado_em,
    ];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 1) {
        consoleLog(
          `Categoria ${obj.titulo} inserida com sucesso!`,
          pVerbose.aviso,
        );
        return Promise.resolve(
          retornoPadrao(0, `Categoria ${obj.titulo} inserida com sucesso!`),
        );
      } else {
        consoleLog(`Erro ao inserir categoria`, pVerbose.erro);
        return Promise.resolve(retornoPadrao(1, `Erro ao inserir categoria`));
      }
    } catch (error) {
      consoleLog(`Erro ao inserir categoria: ${error}`, pVerbose.erro);
      return Promise.reject(error);
    }
  }

  async update(
    obj: iCategoriaGeral,
    conn: Connection,
  ): Promise<iReturnDefault> {
    const sql = `UPDATE categoria_geral SET titulo = ?, atualizado_em = ? WHERE id_categoria_geral = ?`;
    const values = [obj.titulo, obj.atualizado_em, obj.id_categoria_geral];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);

      if (result.affectedRows === 0) {
        consoleLog(`Categoria ${obj.titulo} não encontrada`, pVerbose.erro);
        return Promise.reject(
          retornoPadrao(1, `Categoria ${obj.titulo} não encontrada`),
        );
      }
      consoleLog(
        `Categoria ${obj.titulo} atualizada com sucesso!`,
        pVerbose.aviso,
      );
      return Promise.resolve(
        retornoPadrao(0, `Categoria ${obj.titulo} atualizada com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async show(conn: Connection): Promise<ListaCategorias[]> {
    const sql = `SELECT catg.id_categoria_geral,
                 catg.titulo,
                 catg.status,
                 catg.criado_em,
                 catg.atualizado_em,
                 JSON_ARRAYAGG(
                     JSON_OBJECT(
                         'id_categoria', cat.id_categoria,
                         'titulo', cat.titulo,
                         'status', cat.status,
                         'id_pais', cat.id_pais,
                         'nome_pais', pais.nome
                      )
                    ) AS lista_categoria
                 FROM categoria_geral catg
                 LEFT JOIN categoria cat ON cat.id_categoria_geral = catg.id_categoria_geral
                 LEFT JOIN pais pais ON pais.id_pais = cat.id_pais
                 GROUP BY catg.id_categoria_geral
                 ORDER BY catg.titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql);

      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const categoria = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as ListaCategorias;
      });
      return Promise.resolve(categoria);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showAtivo(conn: Connection): Promise<iCategoriaGeral[]> {
    const sql = `SELECT id_categoria_geral,
                 titulo,
                 status,
                 criado_em,
                 atualizado_em
                 FROM categoria_geral
                 WHERE status = 1
                 ORDER BY titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql);

      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const categoria = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as iCategoriaGeral;
      });
      return Promise.resolve(categoria);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async find(
    id_categoria_geral: string,
    conn: Connection,
  ): Promise<iCategoriaGeral[]> {
    const sql = `SELECT * FROM categoria_geral WHERE id_categoria_geral = ?`;

    try {
      const [rows]: any = await conn.query(sql, [id_categoria_geral]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }

      const categoria = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iCategoriaGeral;
      });

      return Promise.resolve(categoria);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async findNome(titulo: string, conn: Connection): Promise<iCategoriaGeral[]> {
    const sql = `SELECT * FROM categoria_geral WHERE titulo = ?`;

    try {
      const [rows]: any = await conn.query(sql, [titulo]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }

      const categoria = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iCategoriaGeral;
      });

      return Promise.resolve(categoria);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async ativaDesativa(
    obj: iCategoriaGeral,
    conn: Connection,
  ): Promise<iReturnDefault> {
    const sql = `UPDATE categoria_geral SET status = ?, atualizado_em = ? WHERE id_categoria_geral = ?`;
    const values = [obj.status, obj.atualizado_em, obj.id_categoria_geral];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);

      if (result.affectedRows === 0) {
        consoleLog(
          `Categoria Geral ${obj.titulo} não encontrada`,
          pVerbose.erro,
        );
        return Promise.reject(
          retornoPadrao(1, `Categoria Geral ${obj.titulo} não encontrada`),
        );
      }
      consoleLog(
        `Categoria Geral ${obj.titulo} atualizada com sucesso!`,
        pVerbose.aviso,
      );
      return Promise.resolve(
        retornoPadrao(0, `Categoria Geral atualizada com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
