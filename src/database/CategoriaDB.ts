/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
/* eslint-disable no-async-promise-executor */
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import shortid from 'shortid';
import { Categorias, PaisNomes, iCategoria } from '../entities/CategoriaEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import { convertDate2String } from '../utils/dateNow';
import retornoPadrao from '../utils/retornoPadrao';

export class CategoriaDB extends Categorias {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na biblioteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro no banco
    consoleLog(`Erro ao buscar categoria, rows = undefined`, pVerbose.erro);
    return new ErrorHandlerDB(`Erro ao buscar categoria, rows = undefined`);
  }

  async insert(obj: iCategoria, conn: Connection): Promise<iReturnDefault> {
    obj.id_categoria = shortid.generate();

    const sql = `INSERT INTO categoria (id_categoria, id_pais, titulo, status, id_categoria_geral, criado_em, atualizado_em) VALUES (?,?,?,?,?,?,?)`;
    const values = [
      obj.id_categoria,
      obj.id_pais,
      obj.titulo,
      obj.status,
      obj.id_categoria_geral,
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

  async update(obj: iCategoria, conn: Connection): Promise<iReturnDefault> {
    const sql = `UPDATE categoria SET titulo = ?, id_pais = ?, status = ?, atualizado_em = ? WHERE id_categoria = ?`;
    const values = [
      obj.titulo,
      obj.id_pais,
      obj.status,
      (obj.atualizado_em = new Date()),
      obj.id_categoria,
    ];

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

  async show(conn: Connection): Promise<iCategoria[]> {
    const sql = `SELECT cat.id_categoria,
                 cat.id_pais,
                 pais.nome AS nome_pais,
                 cat.titulo,
                 cat.status,
                 cat.id_categoria_geral,
                 catg.titulo AS nome_categoria_geral,
                 cat.criado_em,
                 cat.atualizado_em
                 FROM categoria cat
                 LEFT JOIN pais pais ON pais.id_pais = cat.id_pais
                 LEFT JOIN categoria_geral catg ON catg.id_categoria_geral = cat.id_categoria_geral
                 ORDER BY cat.titulo ASC`;
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
        } as PaisNomes;
      });
      return Promise.resolve(categoria);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showPorPais(id_pais: string, conn: Connection): Promise<iCategoria[]> {
    const sql = `SELECT cat.id_categoria,
                 cat.id_pais,
                 pais.nome AS nome_pais,
                 cat.titulo,
                 cat.status,
                 cat.id_categoria_geral,
                 catg.titulo AS nome_categoria_geral,
                 cat.criado_em,
                 cat.atualizado_em
                 FROM categoria cat
                 INNER JOIN pais pais ON pais.id_pais = cat.id_pais
                 INNER JOIN categoria_geral catg ON catg.id_categoria_geral = cat.id_categoria_geral
                 WHERE cat.id_pais = ? AND cat.status = 1
                 ORDER BY cat.titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [id_pais]);

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
        } as PaisNomes;
      });
      return Promise.resolve(categoria);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showAtivo(conn: Connection): Promise<iCategoria[]> {
    const sql = `SELECT cat.id_categoria,
                 cat.id_pais,
                 pais.nome AS nome_pais,
                 cat.titulo,
                 cat.status,
                 cat.id_categoria_geral,
                 catg.titulo AS nome_categoria_geral,
                 cat.criado_em,
                 cat.atualizado_em
                 FROM categoria cat
                 INNER JOIN pais pais ON pais.id_pais = cat.id_pais
                 INNER JOIN categoria_geral catg ON catg.id_categoria_geral = cat.id_categoria_geral
                 WHERE cat.status = 1
                 ORDER BY cat.titulo ASC`;
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
        } as PaisNomes;
      });
      return Promise.resolve(categoria);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async find(id_categoria: string, conn: Connection): Promise<iCategoria[]> {
    const sql = `SELECT id_categoria, status, atualizado_em FROM categoria WHERE id_categoria = ?`;

    try {
      const [rows]: any = await conn.query(sql, [id_categoria]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }

      const categoria = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as PaisNomes;
      });

      return Promise.resolve(categoria);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async findNomePais(
    titulo: string,
    id_pais: string,
    conn: Connection,
  ): Promise<iCategoria[]> {
    const sql = `SELECT * FROM categoria WHERE titulo = ? AND id_pais = ?`;

    try {
      const [rows]: any = await conn.query(sql, [titulo, id_pais]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }

      const categoria = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as PaisNomes;
      });

      return Promise.resolve(categoria);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async findCatGeral(
    id_categoria_geral: string,
    conn: Connection,
  ): Promise<iCategoria[]> {
    const sql = `SELECT id_categoria, titulo, status, atualizado_em FROM categoria WHERE id_categoria_geral = ?`;

    try {
      const [rows]: any = await conn.query(sql, [id_categoria_geral]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }

      const categoria = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as PaisNomes;
      });

      return Promise.resolve(categoria);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async ativaDesativa(
    categorias: iCategoria[],
    conn: Connection,
  ): Promise<iReturnDefault[]> {
    const sql = `UPDATE categoria SET status = ?, atualizado_em = ? WHERE id_categoria = ?`;

    try {
      const promises = categorias.map(async (categoria) => {
        const values = [
          categoria.status,
          categoria.atualizado_em,
          categoria.id_categoria,
        ];
        const [result] = await conn.query<ResultSetHeader>(sql, values);

        if (result.affectedRows === 0) {
          consoleLog(
            `Categoria ${categoria.titulo} não encontrada`,
            pVerbose.erro,
          );
          return retornoPadrao(
            1,
            `Categoria ${categoria.titulo} não encontrada`,
          );
        }

        consoleLog(
          `Categoria ${categoria.titulo} atualizada com sucesso!`,
          pVerbose.aviso,
        );
        return retornoPadrao(0, `Categoria atualizada com sucesso!`);
      });

      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
