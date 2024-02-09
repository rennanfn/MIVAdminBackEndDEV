/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unreachable-loop */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable no-async-promise-executor */
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import shortid from 'shortid';
import { Revendas, iRevendaFilial } from '../entities/RevendaFilialEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import { convertDate2String } from '../utils/dateNow';
import retornoPadrao from '../utils/retornoPadrao';

export class RevendaFilialDB extends Revendas {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na biblioteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro no banco
    consoleLog(
      `Erro ao buscar Revenda/Filial, rows = undefined`,
      pVerbose.erro,
    );
    return new ErrorHandlerDB(
      `Erro ao buscar Revenda/Filial, rows = undefined`,
    );
  }

  async insert(obj: iRevendaFilial, conn: Connection): Promise<iReturnDefault> {
    obj.id_revenda_filial = shortid.generate();

    return new Promise(async (resolve, reject) => {
      const sql = `INSERT INTO revenda_filial
                   (id_revenda_filial, id_pais, id_segmento, titulo, status, cor_texto, logo_botao, nome_logo_botao,
                    id_revenda_filial_geral, criado_em, atualizado_em)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
      const values = [
        obj.id_revenda_filial,
        obj.id_pais,
        obj.id_segmento,
        obj.titulo,
        obj.status,
        obj.cor_texto,
        obj.logo_botao,
        obj.nome_logo_botao,
        obj.id_revenda_filial_geral,
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
          return resolve(
            retornoPadrao(
              0,
              `Revenda/Filial ${obj.titulo} inserida com sucesso!`,
            ),
          );
        } else {
          consoleLog(`Erro ao inserir Revenda/Filial`, pVerbose.erro);
          return resolve(retornoPadrao(1, `Erro ao inserir Revenda/Filial`));
        }
      } catch (error) {
        consoleLog(`Erro ao inserir Revenda/Filial: ${error}`, pVerbose.erro);
        return reject(error);
      }
    });
  }

  async update(obj: iRevendaFilial, conn: Connection): Promise<iReturnDefault> {
    const sql = `UPDATE revenda_filial
                 SET id_revenda_filial = ?,
                 id_pais = ?,
                 id_segmento = ?,
                 titulo = ?,
                 cor_texto = ?,
                 logo_botao = ?,
                 nome_logo_botao = ?,
                 atualizado_em = ?
                 WHERE id_revenda_filial = ?`;
    const values = [
      obj.id_revenda_filial,
      obj.id_pais,
      obj.id_segmento,
      obj.titulo,
      obj.cor_texto,
      obj.logo_botao,
      obj.nome_logo_botao,
      obj.atualizado_em,
      obj.id_revenda_filial,
    ];

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

  async show(conn: Connection): Promise<iRevendaFilial[]> {
    const sql = `SELECT rvf.id_revenda_filial,
                 rvf.titulo,
                 rvf.status,
                 rvf.id_segmento,
                 seg.titulo AS segmento,
                 rvf.id_pais,
                 pais.nome AS nome_pais,
                 rvf.cor_texto,
                 rvf.logo_botao,
                 rvf.nome_logo_botao,
                 rvf.criado_em,
                 rvf.atualizado_em,
                 rvf.id_revenda_filial_geral,
                 rvfg.titulo AS revenda_filial_geral
                 FROM revenda_filial rvf
                 LEFT JOIN pais pais ON pais.id_pais = rvf.id_pais
                 LEFT JOIN revenda_filial_geral rvfg ON rvfg.id_revenda_filial_geral = rvf.id_revenda_filial_geral
                 LEFT JOIN segmento seg ON seg.id_segmento = rvf.id_segmento
                 GROUP BY rvf.id_revenda_filial
                 ORDER BY rvf.titulo ASC`;
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
        } as iRevendaFilial;
      });
      return Promise.resolve(marca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showPais(
    id_revenda_filial_geral: string,
    conn: Connection,
  ): Promise<iRevendaFilial[]> {
    const sql = `SELECT rvf.id_pais,
                 pais.nome AS nome_pais,
                 rvf.criado_em,
                 rvf.atualizado_em
                 FROM revenda_filial rvf
                 LEFT JOIN pais pais ON pais.id_pais = rvf.id_pais
                 WHERE rvf.id_revenda_filial_geral = ? AND pais.status = 1
                 ORDER BY pais.nome ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [
        id_revenda_filial_geral,
      ]);

      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const revenda_filial = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as iRevendaFilial;
      });
      return Promise.resolve(revenda_filial);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showSegPais(
    id_segmento: string,
    id_pais: string,
    conn: Connection,
  ): Promise<iRevendaFilial[]> {
    const sql = `SELECT rvf.id_revenda_filial,
                 rvf.titulo,
                 rvf.id_segmento,
                 rvf.id_pais,
                 rvf.cor_texto,
                 rvf.logo_botao,
                 rvf.nome_logo_botao,
                 rvf.id_revenda_filial_geral,
                 rvfg.titulo AS revenda_filial_geral
                 FROM revenda_filial rvf
                 LEFT JOIN revenda_filial_geral rvfg ON rvfg.id_revenda_filial_geral = rvf.id_revenda_filial_geral
                 WHERE rvf.id_segmento = ? AND rvf.id_pais = ? AND rvf.status = 1
                 GROUP BY rvf.id_revenda_filial
                 ORDER BY rvf.titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [
        id_segmento,
        id_pais,
      ]);

      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const revenda_filial = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iRevendaFilial;
      });
      return Promise.resolve(revenda_filial);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showPorRevendaFilialGeral(
    id_revenda_filial_geral: string,
    conn: Connection,
  ): Promise<iRevendaFilial[]> {
    const sql = `SELECT rvf.id_revenda_filial,
                 rvf.titulo,
                 rvf.status,
                 rvf.id_segmento,
                 seg.titulo AS segmento,
                 rvf.id_pais,
                 pais.nome AS nome_pais,
                 rvf.cor_texto,
                 rvf.logo_botao,
                 rvf.nome_logo_botao,
                 rvf.criado_em,
                 rvf.atualizado_em,
                 rvf.id_revenda_filial_geral,
                 rvfg.titulo AS revenda_filial_geral
                 FROM revenda_filial rvf
                 LEFT JOIN pais pais ON pais.id_pais = rvf.id_pais
                 LEFT JOIN revenda_filial_geral rvfg ON rvfg.id_revenda_filial_geral = rvf.id_revenda_filial_geral
                 LEFT JOIN segmento seg ON seg.id_segmento = rvf.id_segmento
                 WHERE rvf.id_revenda_filial_geral = ?
                 GROUP BY rvf.id_revenda_filial
                 ORDER BY rvf.titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [
        id_revenda_filial_geral,
      ]);

      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const revenda = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as iRevendaFilial;
      });
      return Promise.resolve(revenda);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showAtivo(conn: Connection): Promise<iRevendaFilial[]> {
    const sql = `SELECT rvf.id_revenda_filial,
                 rvf.titulo,
                 rvf.status,
                 rvf.id_segmento,
                 seg.titulo AS segmento,
                 rvf.id_pais,
                 pais.nome AS nome_pais,
                 rvf.cor_texto,
                 rvf.logo_botao,
                 rvf.nome_logo_botao,
                 rvf.criado_em,
                 rvf.atualizado_em,
                 rvf.id_revenda_filial_geral,
                 rvfg.titulo AS revenda_filial_geral
                 FROM revenda_filial rvf
                 LEFT JOIN pais pais ON pais.id_pais = rvf.id_pais
                 LEFT JOIN revenda_filial_geral rvfg ON rvfg.id_revenda_filial_geral = rvf.id_revenda_filial_geral
                 LEFT JOIN segmento seg ON seg.id_segmento = rvf.id_segmento
                 WHERE rvf.status = 1
                 GROUP BY rvf.id_revenda_filial
                 ORDER BY rvf.titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql);

      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const revenda = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as iRevendaFilial;
      });
      return Promise.resolve(revenda);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async find(
    id_revenda_filial: string,
    conn: Connection,
  ): Promise<iRevendaFilial> {
    const sql = `SELECT rev.id_revenda_filial,
                 rev.id_pais,
                 rev.id_segmento,
                 seg.titulo AS segmento,
                 pais.nome AS nome_pais,
                 rev.titulo,
                 rev.status,
                 rev.cor_texto,
                 rev.logo_botao,
                 rev.nome_logo_botao,
                 rev.id_revenda_filial_geral,
                 rvfg.titulo AS titulo_revenda_filial_geral,
                 rev.criado_em,
                 rev.atualizado_em
                 FROM revenda_filial rev
                 LEFT JOIN pais pais ON pais.id_pais = rev.id_pais
                 LEFT JOIN revenda_filial_geral rvfg ON rvfg.id_revenda_filial_geral = rev.id_revenda_filial_geral
                 LEFT JOIN segmento seg ON seg.id_segmento = rev.id_segmento
                 WHERE rev.id_revenda_filial = ?
                 ORDER BY rev.titulo ASC`;
    try {
      const [rows]: any = await conn.query(sql, id_revenda_filial);
      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }

      const revenda = {
        ...rows[0], // Pega o primeiro elemento do array
      } as iRevendaFilial;
      return Promise.resolve(revenda);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async findRevendaFilialGeral(
    id_revenda_filial_geral: string,
    conn: Connection,
  ): Promise<iRevendaFilial[]> {
    const sql = `SELECT id_revenda_filial, titulo, status, atualizado_em FROM revenda_filial WHERE id_revenda_filial_geral = ?`;

    try {
      const [rows]: any = await conn.query(sql, [id_revenda_filial_geral]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }

      const revenda = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iRevendaFilial;
      });

      return Promise.resolve(revenda);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async ativaDesativa(
    revendas: iRevendaFilial[],
    conn: Connection,
  ): Promise<iReturnDefault[]> {
    const sql = `UPDATE revenda_filial SET status = ?, atualizado_em = ? WHERE id_revenda_filial = ?`;

    try {
      const promises = revendas.map(async (revenda) => {
        const values = [
          revenda.status,
          revenda.atualizado_em,
          revenda.id_revenda_filial,
        ];
        const [result] = await conn.query<ResultSetHeader>(sql, values);

        if (result.affectedRows === 0) {
          consoleLog(`Revenda/Filial não encontrada`, pVerbose.erro);
          return retornoPadrao(1, `Revenda/Filial não encontrada`);
        }
        consoleLog(`Revenda/Filial atualizada com sucesso!`, pVerbose.aviso);
        return retornoPadrao(0, `Revenda/Filial atualizada com sucesso!`);
      });
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
