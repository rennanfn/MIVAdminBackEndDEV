/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
/* eslint-disable no-async-promise-executor */
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import shortid from 'shortid';
import {
  ListaMarcas,
  MarcasGeral,
  iMarcaGeral,
} from '../entities/MarcaGeralEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import { convertDate2String } from '../utils/dateNow';
import retornoPadrao from '../utils/retornoPadrao';

export class MarcaGeralDB extends MarcasGeral {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na biblioteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro no banco
    consoleLog(`Erro ao buscar marca, rows = undefined`, pVerbose.erro);
    return new ErrorHandlerDB(`Erro ao buscar marca, rows = undefined`);
  }

  async insert(obj: iMarcaGeral, conn: Connection): Promise<iReturnDefault> {
    obj.id_marca_geral = shortid.generate();

    const sql = `INSERT INTO marca_geral (id_marca_geral, titulo, status, criado_em, atualizado_em) VALUES (?,?,?,?,?)`;
    const values = [
      obj.id_marca_geral,
      obj.titulo,
      obj.status,
      obj.criado_em,
      obj.atualizado_em,
    ];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 1) {
        consoleLog(`Marca ${obj.titulo} inserida com sucesso!`, pVerbose.aviso);
        return Promise.resolve(
          retornoPadrao(0, `Marca ${obj.titulo} inserida com sucesso!`),
        );
      } else {
        consoleLog(`Erro ao inserir marca`, pVerbose.erro);
        return Promise.resolve(retornoPadrao(1, `Erro ao inserir marca`));
      }
    } catch (error) {
      consoleLog(`Erro ao inserir marca: ${error}`, pVerbose.erro);
      return Promise.reject(error);
    }
  }

  async update(obj: iMarcaGeral, conn: Connection): Promise<iReturnDefault> {
    const sql = `UPDATE marca_geral SET titulo = ?, atualizado_em = ? WHERE id_marca_geral = ?`;
    const values = [obj.titulo, obj.atualizado_em, obj.id_marca_geral];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);

      if (result.affectedRows === 0) {
        consoleLog(`Marca ${obj.titulo} não encontrada`, pVerbose.erro);
        return Promise.reject(
          retornoPadrao(1, `Marca ${obj.titulo} não encontrada`),
        );
      }
      consoleLog(`Marca ${obj.titulo} atualizada com sucesso!`, pVerbose.aviso);
      return Promise.resolve(
        retornoPadrao(0, `Marca ${obj.titulo} atualizada com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async show(conn: Connection): Promise<ListaMarcas[]> {
    const sql = `SELECT mrcg.id_marca_geral,
                 mrcg.titulo,
                 mrcg.status,
                 mrcg.criado_em,
                 mrcg.atualizado_em,
                 JSON_ARRAYAGG(
                     JSON_OBJECT(
                         'id_marca', mrc.id_marca,
                         'titulo', mrc.titulo,
                         'status', mrc.status,
                         'id_pais', mrc.id_pais,
                         'nome_pais', pais.nome
                      )
                    ) AS lista_marcas
                 FROM marca_geral mrcg
                 LEFT JOIN marca mrc ON mrc.id_marca_geral = mrcg.id_marca_geral
                 LEFT JOIN pais pais ON pais.id_pais = mrc.id_pais
                 GROUP BY mrcg.id_marca_geral
                 ORDER BY mrcg.titulo ASC`;
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
        } as ListaMarcas;
      });
      return Promise.resolve(marca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showAtivo(conn: Connection): Promise<iMarcaGeral[]> {
    const sql = `SELECT id_marca_geral,
                 titulo,
                 status,
                 criado_em,
                 atualizado_em
                 FROM marca_geral
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
        } as iMarcaGeral;
      });
      return Promise.resolve(marca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async find(id_marca_geral: string, conn: Connection): Promise<iMarcaGeral[]> {
    const sql = `SELECT * FROM marca_geral WHERE id_marca_geral = ?`;

    try {
      const [rows]: any = await conn.query(sql, [id_marca_geral]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }

      const marca = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iMarcaGeral;
      });

      return Promise.resolve(marca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async ativaDesativa(
    obj: iMarcaGeral,
    conn: Connection,
  ): Promise<iReturnDefault> {
    const sql = `UPDATE marca_geral SET status = ?, atualizado_em = ? WHERE id_marca_geral = ?`;
    const values = [obj.status, obj.atualizado_em, obj.id_marca_geral];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);

      if (result.affectedRows === 0) {
        consoleLog(`Marca ${obj.titulo} não encontrada`, pVerbose.erro);
        return Promise.reject(
          retornoPadrao(1, `Marca ${obj.titulo} não encontrada`),
        );
      }
      consoleLog(`Marca ${obj.titulo} atualizada com sucesso!`, pVerbose.aviso);
      return Promise.resolve(retornoPadrao(0, `Marca atualizada com sucesso!`));
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
