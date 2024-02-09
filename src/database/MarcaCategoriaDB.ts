/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import shortid from 'shortid';
import {
  MarcaCategoria,
  iMarcaCategoria,
} from '../entities/MarcaCategoriaEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import retornoPadrao from '../utils/retornoPadrao';

export class MarcaCategoriaDB extends MarcaCategoria {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na biblioteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro no banco
    consoleLog(
      `Erro ao buscar marca_categoria, rows = undefined`,
      pVerbose.erro,
    );
    return new ErrorHandlerDB(
      `Erro ao buscar marca_categoria, rows = undefined`,
    );
  }

  async insert(
    idMarca: string,
    idsCategoria: iMarcaCategoria[],
    conn: Connection,
  ): Promise<iReturnDefault> {
    const sql = `INSERT INTO marca_categoria_relacional (id_marca_categoria, id_marca, id_categoria) VALUES (?,?,?)`;

    try {
      await Promise.all(
        idsCategoria.map(async (marca_categoria) => {
          const id_marca_categoria = shortid.generate();
          const values = [
            id_marca_categoria,
            idMarca,
            marca_categoria.id_categoria,
          ];
          return conn.query<ResultSetHeader>(sql, values);
        }),
      );
      return Promise.resolve(
        retornoPadrao(0, `Categoria inserida com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async delete(idMarca: string, conn: Connection): Promise<iReturnDefault> {
    const deleteIdMarca = `DELETE FROM marca_categoria_relacional WHERE id_marca = ?`;
    const valuesDelete = [idMarca];
    try {
      await conn.query<ResultSetHeader>(deleteIdMarca, valuesDelete);
      return Promise.resolve(
        retornoPadrao(0, `Categoria deletada com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async find(id_marca: string, conn: Connection): Promise<iMarcaCategoria[]> {
    const sql = `SELECT
                  mrc.id_marca_categoria,
                  mrc.id_marca,
                  mrc.id_categoria,
                  cat.titulo
                FROM marca_categoria_relacional mrc
                INNER JOIN categoria cat on cat.id_categoria = mrc.id_categoria
                WHERE mrc.id_marca = ?`;

    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [id_marca]);
      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }
      const marca_categoria = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iMarcaCategoria;
      });
      return Promise.resolve(marca_categoria);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
