/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */
/* eslint-disable no-async-promise-executor */
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import shortid from 'shortid';
import {
  CategoriaLogoGeral,
  ListaCategoriaLogo,
  iCategoriaLogoGeral,
} from '../entities/CategoriaLogoGeralEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import { convertDate2String } from '../utils/dateNow';
import retornoPadrao from '../utils/retornoPadrao';

export class CategoriaLogoGeralDB extends CategoriaLogoGeral {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na biblioteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro no banco
    consoleLog(
      `Erro ao buscar categoria_logomarca, rows = undefined`,
      pVerbose.erro,
    );
    return new ErrorHandlerDB(
      `Erro ao buscar categoria_logomarca, rows = undefined`,
    );
  }

  async insert(
    obj: iCategoriaLogoGeral,
    conn: Connection,
  ): Promise<iReturnDefault> {
    obj.id_categoria_logomarca_geral = shortid.generate();

    const sql = `INSERT INTO categoria_logomarca_geral (id_categoria_logomarca_geral, titulo, status, criado_em, atualizado_em) VALUES (?,?,?,?,?)`;
    const values = [
      obj.id_categoria_logomarca_geral,
      obj.titulo,
      obj.status,
      obj.criado_em,
      obj.atualizado_em,
    ];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 1) {
        consoleLog(
          `Categoria_logomarca ${obj.titulo} inserida com sucesso!`,
          pVerbose.aviso,
        );
        return Promise.resolve(
          retornoPadrao(
            0,
            `Categoria_logomarca ${obj.titulo} inserida com sucesso!`,
          ),
        );
      } else {
        consoleLog(`Erro ao inserir categoria_logomarca`, pVerbose.erro);
        return Promise.resolve(
          retornoPadrao(1, `Erro ao inserir categoria_logomarca`),
        );
      }
    } catch (error) {
      consoleLog(
        `Erro ao inserir categoria_logomarca: ${error}`,
        pVerbose.erro,
      );
      return Promise.reject(error);
    }
  }

  async update(
    obj: iCategoriaLogoGeral,
    conn: Connection,
  ): Promise<iReturnDefault> {
    const sql = `UPDATE categoria_logomarca_geral SET titulo = ?, atualizado_em = ? WHERE id_categoria_logomarca_geral = ?`;
    const values = [
      obj.titulo,
      obj.atualizado_em,
      obj.id_categoria_logomarca_geral,
    ];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);

      if (result.affectedRows === 0) {
        consoleLog(
          `Categoria_logomarca ${obj.titulo} não encontrada`,
          pVerbose.erro,
        );
        return Promise.reject(
          retornoPadrao(1, `Categoria_logomarca ${obj.titulo} não encontrada`),
        );
      }
      consoleLog(
        `Categoria_logomarca ${obj.titulo} atualizada com sucesso!`,
        pVerbose.aviso,
      );
      return Promise.resolve(
        retornoPadrao(
          0,
          `Categoria_logomarca ${obj.titulo} atualizada com sucesso!`,
        ),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async show(conn: Connection): Promise<ListaCategoriaLogo[]> {
    const sql = `SELECT catlogger.id_categoria_logomarca_geral,
                 catlogger.titulo,
                 catlogger.status,
                 catlogger.criado_em,
                 catlogger.atualizado_em,
                 JSON_ARRAYAGG(
                     JSON_OBJECT(
                         'id_categoria_logomarca', catlog.id_categoria_logomarca,
                         'titulo', catlog.titulo,
                         'status', catlog.status,
                         'id_pais', catlog.id_pais,
                         'nome_pais', pais.nome
                      )
                    ) AS lista_categoria_logomarca
                 FROM categoria_logomarca_geral catlogger
                 INNER JOIN categoria_logomarca catlog ON catlog.id_categoria_logomarca_geral = catlogger.id_categoria_logomarca_geral
                 INNER JOIN pais pais ON pais.id_pais = catlog.id_pais
                 GROUP BY catlogger.id_categoria_logomarca_geral
                 ORDER BY catlogger.titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql);

      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const categoria_logomarca_geral = rows.map(
        (formatObject: RowDataPacket) => {
          return {
            ...formatObject,
            criado_em: convertDate2String(new Date(formatObject.criado_em)),
            atualizado_em:
              formatObject.atualizado_em !== null
                ? convertDate2String(new Date(formatObject.atualizado_em))
                : '',
          } as ListaCategoriaLogo;
        },
      );
      return Promise.resolve(categoria_logomarca_geral);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showAtivo(conn: Connection): Promise<iCategoriaLogoGeral[]> {
    const sql = `SELECT id_categoria_logomarca_geral,
                 titulo,
                 status,
                 criado_em,
                 atualizado_em
                 FROM categoria_logomarca_geral
                 WHERE status = 1
                 ORDER BY titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql);

      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const categoria_logomarca_geral = rows.map(
        (formatObject: RowDataPacket) => {
          return {
            ...formatObject,
            criado_em: convertDate2String(new Date(formatObject.criado_em)),
            atualizado_em:
              formatObject.atualizado_em !== null
                ? convertDate2String(new Date(formatObject.atualizado_em))
                : '',
          } as iCategoriaLogoGeral;
        },
      );
      return Promise.resolve(categoria_logomarca_geral);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async find(
    id_categoria_logomarca_geral: string,
    conn: Connection,
  ): Promise<iCategoriaLogoGeral[]> {
    const sql = `SELECT * FROM categoria_logomarca_geral WHERE id_categoria_logomarca_geral = ?`;

    try {
      const [rows]: any = await conn.query(sql, [id_categoria_logomarca_geral]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }

      const categoria_logomarca_geral = rows.map(
        (formatObject: RowDataPacket) => {
          return {
            ...formatObject,
          } as iCategoriaLogoGeral;
        },
      );

      return Promise.resolve(categoria_logomarca_geral);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async ativaDesativa(
    obj: iCategoriaLogoGeral,
    conn: Connection,
  ): Promise<iReturnDefault> {
    const sql = `UPDATE categoria_logomarca_geral SET status = ?, atualizado_em = ? WHERE id_categoria_logomarca_geral = ?`;
    const values = [
      obj.status,
      obj.atualizado_em,
      obj.id_categoria_logomarca_geral,
    ];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);

      if (result.affectedRows === 0) {
        consoleLog(
          `Categoria_logomarca ${obj.titulo} não encontrada`,
          pVerbose.erro,
        );
        return Promise.reject(
          retornoPadrao(1, `Categoria_logomarca ${obj.titulo} não encontrada`),
        );
      }
      consoleLog(
        `Categoria_logomarca ${obj.titulo} atualizada com sucesso!`,
        pVerbose.aviso,
      );
      return Promise.resolve(
        retornoPadrao(0, `Categoria_logomarca atualizada com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
