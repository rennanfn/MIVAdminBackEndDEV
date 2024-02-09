/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unreachable-loop */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable no-async-promise-executor */
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import shortid from 'shortid';
import { Marcas, iMarca } from '../entities/MarcaEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import { convertDate2String } from '../utils/dateNow';
import retornoPadrao from '../utils/retornoPadrao';
import { MarcaCategoriaDB } from './MarcaCategoriaDB';

export class MarcaDB extends Marcas {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na biblioteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro no banco
    consoleLog(`Erro ao buscar categoria, rows = undefined`, pVerbose.erro);
    return new ErrorHandlerDB(`Erro ao buscar categoria, rows = undefined`);
  }

  async insert(obj: iMarca, conn: Connection): Promise<iReturnDefault> {
    obj.id_marca = shortid.generate();

    const { lista_categorias, ...objMarca } = obj; // remove a lista de categorias para inserir após salvar a marca

    const idsCategoria = obj.lista_categorias;

    return new Promise(async (resolve, reject) => {
      const marcaCategoriaDB = new MarcaCategoriaDB();
      const sql = `INSERT INTO marca
                   (id_marca, id_pais, id_segmento, titulo, status, cor_botao, cor_texto, logo_botao, logo_miniatura, nome_logo_botao, nome_logo_miniatura,
                    id_marca_geral, criado_em, atualizado_em)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
      const values = [
        objMarca.id_marca,
        objMarca.id_pais,
        objMarca.id_segmento,
        objMarca.titulo,
        objMarca.status,
        objMarca.cor_botao,
        objMarca.cor_texto,
        objMarca.logo_botao,
        objMarca.logo_miniatura,
        objMarca.nome_logo_botao,
        objMarca.nome_logo_miniatura,
        objMarca.id_marca_geral,
        objMarca.criado_em,
        objMarca.atualizado_em,
      ];

      try {
        await conn.beginTransaction();
        // insere a marca
        const [result] = await conn.query<ResultSetHeader>(sql, values);
        // insere as categorias relacionadas a marca
        await marcaCategoriaDB.insert(objMarca.id_marca, idsCategoria, conn);

        if (result.affectedRows === 1) {
          consoleLog(
            `Marca ${obj.titulo} inserida com sucesso!`,
            pVerbose.aviso,
          );
          return resolve(
            retornoPadrao(0, `Marca ${obj.titulo} inserida com sucesso!`),
          );
        } else {
          consoleLog(`Erro ao inserir marca`, pVerbose.erro);
          return resolve(retornoPadrao(1, `Erro ao inserir marca`));
        }
      } catch (error) {
        consoleLog(`Erro ao inserir marca: ${error}`, pVerbose.erro);
        return reject(error);
      }
    });
  }

  async update(obj: iMarca, conn: Connection): Promise<iReturnDefault> {
    const marcaCategoriaDB = new MarcaCategoriaDB();
    const ids_categoria = obj.lista_categorias;
    const { lista_categorias, ...objMarca } = obj; // remove lista_categoria para atualizar dados primários

    const sql = `UPDATE marca
                 SET id_marca = ?,
                 id_pais = ?,
                 id_segmento = ?,
                 titulo = ?,
                 cor_botao = ?,
                 cor_texto = ?,
                 logo_botao = ?,
                 logo_miniatura = ?,
                 nome_logo_botao = ?,
                 nome_logo_miniatura = ?,
                 id_marca_geral = ?,
                 atualizado_em = ?
                 WHERE id_marca = ?`;
    const values = [
      obj.id_marca,
      obj.id_pais,
      obj.id_segmento,
      obj.titulo,
      obj.cor_botao,
      obj.cor_texto,
      obj.logo_botao,
      obj.logo_miniatura,
      objMarca.nome_logo_botao,
      objMarca.nome_logo_miniatura,
      obj.id_marca_geral,
      obj.atualizado_em,
      obj.id_marca,
    ];

    try {
      await conn.beginTransaction();
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      // Durante o processo de edição da marca, serão removidas as categorias.
      // Este procedimento se fez necessário para que caso haja a remoção de alguma categoria da marca, apenas as permissões corretas permaneçam!
      await marcaCategoriaDB.delete(objMarca.id_marca, conn);
      // Após a remoção, insere apenas as permissões vindas do objeto
      await marcaCategoriaDB.insert(
        String(objMarca.id_marca),
        ids_categoria,
        conn,
      );

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

  async show(conn: Connection): Promise<iMarca[]> {
    const sql = `SELECT mrc.id_marca,
                 mrc.titulo,
                 mrc.status,
                 mrc.id_segmento,
                 seg.titulo AS segmento,
                 mrc.id_pais,
                 pais.nome AS nome_pais,
                 mrc.cor_botao,
                 mrc.cor_texto,
                 mrc.logo_botao,
                 mrc.logo_miniatura,
                 mrc.nome_logo_botao,
                 mrc.nome_logo_miniatura,
                 mrc.criado_em,
                 mrc.atualizado_em,
                 mrc.id_marca_geral,
                 mrcg.titulo AS marca_geral,
                 JSON_ARRAYAGG(
                     JSON_OBJECT(
                         'id_categoria', mrccat.id_categoria,
                         'titulo', cat.titulo,
                         'status', cat.status,
                         'id_marca', mrccat.id_marca
                      )
                   ) AS lista_categorias
                 FROM marca mrc
                 LEFT JOIN marca_categoria_relacional mrccat ON mrccat.id_marca = mrc.id_marca
                 LEFT JOIN categoria cat ON cat.id_categoria = mrccat.id_categoria
                 LEFT JOIN pais pais ON pais.id_pais = mrc.id_pais
                 LEFT JOIN marca_geral mrcg ON mrcg.id_marca_geral = mrc.id_marca_geral
                 LEFT JOIN segmento seg ON seg.id_segmento = mrc.id_segmento
                 GROUP BY mrc.id_marca
                 ORDER BY mrc.titulo ASC`;
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
        } as iMarca;
      });
      return Promise.resolve(marca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showPais(id_marca_geral: string, conn: Connection): Promise<iMarca[]> {
    const sql = `SELECT mrc.id_pais,
                 pais.nome AS nome_pais,
                 mrc.criado_em,
                 mrc.atualizado_em
                 FROM marca mrc
                 LEFT JOIN pais pais ON pais.id_pais = mrc.id_pais
                 WHERE mrc.id_marca_geral = ? AND pais.status = 1
                 ORDER BY pais.nome ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [id_marca_geral]);

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
        } as iMarca;
      });
      return Promise.resolve(marca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showSegPais(
    id_segmento: string,
    id_pais: string,
    conn: Connection,
  ): Promise<iMarca[]> {
    const sql = `SELECT mrc.id_marca,
                 mrc.titulo,
                 mrc.id_segmento,
                 mrc.id_pais,
                 mrc.cor_botao,
                 mrc.cor_texto,
                 mrc.logo_botao,
                 mrc.logo_miniatura,
                 mrc.nome_logo_botao,
                 mrc.nome_logo_miniatura,
                 mrc.id_marca_geral,
                 mrcg.titulo AS marca_geral,
                 JSON_ARRAYAGG(
                     JSON_OBJECT(
                         'id_categoria', mrccat.id_categoria,
                         'titulo', cat.titulo,
                         'status', cat.status,
                         'id_marca', mrccat.id_marca
                      )
                   ) AS lista_categorias
                 FROM marca mrc
                 LEFT JOIN marca_categoria_relacional mrccat ON mrccat.id_marca = mrc.id_marca
                 LEFT JOIN categoria cat ON cat.id_categoria = mrccat.id_categoria
                 LEFT JOIN marca_geral mrcg ON mrcg.id_marca_geral = mrc.id_marca_geral
                 WHERE mrc.id_segmento = ? AND mrc.id_pais = ? AND mrc.status = 1
                 GROUP BY mrc.id_marca
                 ORDER BY mrc.titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [
        id_segmento,
        id_pais,
      ]);

      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const marca = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iMarca;
      });
      return Promise.resolve(marca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showCategoria(
    id_marca_geral: string,
    id_pais: string,
    conn: Connection,
  ): Promise<iMarca[]> {
    const sql = `SELECT mrc.id_marca,
                 mrc.id_segmento,
                 seg.titulo AS segmento,
                 mrc.id_pais,
                 pais.nome AS nome_pais,
                 mrc.criado_em,
                 mrc.atualizado_em,
                 JSON_ARRAYAGG(
                  JSON_OBJECT(
                      'id_categoria', mrccat.id_categoria,
                      'titulo', cat.titulo,
                      'status', cat.status
                   )
                ) AS lista_categorias
                 FROM marca mrc
                 LEFT JOIN marca_categoria_relacional mrccat ON mrccat.id_marca = mrc.id_marca
                 LEFT JOIN categoria cat ON cat.id_categoria = mrccat.id_categoria
                 LEFT JOIN pais pais ON pais.id_pais = mrc.id_pais
                 LEFT JOIN segmento seg ON seg.id_segmento = mrc.id_segmento
                 WHERE mrc.id_marca_geral = ? AND mrc.id_pais = ?
                 GROUP BY mrc.id_marca
                 ORDER BY pais.nome ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [
        id_marca_geral,
        id_pais,
      ]);

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
        } as iMarca;
      });
      return Promise.resolve(marca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showCategoriaPorMarca(
    id_marca: string,
    conn: Connection,
  ): Promise<iMarca[]> {
    const sql = `SELECT mrc.cor_botao,
                 mrc.cor_texto,
                 mrc.id_segmento,
                 seg.titulo AS segmento,
                 JSON_ARRAYAGG(
                  JSON_OBJECT(
                      'id_categoria', mrccat.id_categoria,
                      'titulo', cat.titulo,
                      'status', cat.status
                   )
                ) AS lista_categorias
                 FROM marca mrc
                 LEFT JOIN marca_categoria_relacional mrccat ON mrccat.id_marca = mrc.id_marca
                 LEFT JOIN categoria cat ON cat.id_categoria = mrccat.id_categoria
                 LEFT JOIN segmento seg ON seg.id_segmento = mrc.id_segmento
                 WHERE mrc.id_marca = ?
                 GROUP BY mrc.id_marca`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [id_marca]);

      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const marca = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iMarca;
      });
      return Promise.resolve(marca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showPorMarcaGeral(
    id_marca_geral: string,
    conn: Connection,
  ): Promise<iMarca[]> {
    const sql = `SELECT mrc.id_marca,
                 mrc.titulo,
                 mrc.status,
                 mrc.id_segmento,
                 seg.titulo AS segmento,
                 mrc.id_pais,
                 pais.nome AS nome_pais,
                 mrc.cor_botao,
                 mrc.cor_texto,
                 mrc.logo_botao,
                 mrc.logo_miniatura,
                 mrc.nome_logo_botao,
                 mrc.nome_logo_miniatura,
                 mrc.criado_em,
                 mrc.atualizado_em,
                 mrc.id_marca_geral,
                 mrcg.titulo AS marca_geral,
                 JSON_ARRAYAGG(
                     JSON_OBJECT(
                         'id_categoria', mrccat.id_categoria,
                         'titulo', cat.titulo,
                         'status', cat.status,
                         'id_marca', mrccat.id_marca
                      )
                   ) AS lista_categorias
                 FROM marca mrc
                 LEFT JOIN marca_categoria_relacional mrccat ON mrccat.id_marca = mrc.id_marca
                 LEFT JOIN categoria cat ON cat.id_categoria = mrccat.id_categoria
                 LEFT JOIN pais pais ON pais.id_pais = mrc.id_pais
                 LEFT JOIN marca_geral mrcg ON mrcg.id_marca_geral = mrc.id_marca_geral
                 LEFT JOIN segmento seg ON seg.id_segmento = mrc.id_segmento
                 WHERE mrc.id_marca_geral = ?
                 GROUP BY mrc.id_marca
                 ORDER BY mrc.titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [id_marca_geral]);

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
        } as iMarca;
      });
      return Promise.resolve(marca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showAtivo(conn: Connection): Promise<iMarca[]> {
    const sql = `SELECT mrc.id_marca,
                 mrc.titulo,
                 mrc.status,
                 mrc.id_segmento,
                 seg.titulo AS segmento,
                 mrc.id_pais,
                 pais.nome AS nome_pais,
                 mrc.cor_botao,
                 mrc.cor_texto,
                 mrc.logo_botao,
                 mrc.logo_miniatura,
                 mrc.nome_logo_botao,
                 mrc.nome_logo_miniatura,
                 mrc.criado_em,
                 mrc.atualizado_em,
                 mrc.id_marca_geral,
                 mrcg.titulo AS marca_geral,
                 JSON_ARRAYAGG(
                     JSON_OBJECT(
                         'id_categoria', mrccat.id_categoria,
                         'titulo', cat.titulo,
                         'status', cat.status,
                         'id_marca', mrccat.id_marca
                      )
                   ) AS lista_categorias
                 FROM marca mrc
                 LEFT JOIN marca_categoria_relacional mrccat ON mrccat.id_marca = mrc.id_marca
                 LEFT JOIN categoria cat ON cat.id_categoria = mrccat.id_categoria
                 LEFT JOIN pais pais ON pais.id_pais = mrc.id_pais
                 LEFT JOIN marca_geral mrcg ON mrcg.id_marca_geral = mrc.id_marca_geral
                 LEFT JOIN segmento seg ON seg.id_segmento = mrc.id_segmento
                 WHERE mrc.status = 1
                 GROUP BY mrc.id_marca
                 ORDER BY mrc.titulo ASC`;
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
        } as iMarca;
      });
      return Promise.resolve(marca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async find(id_marca: string, conn: Connection): Promise<iMarca> {
    const marcaCategoriaDB = new MarcaCategoriaDB();
    const sql = `SELECT marca.id_marca,
                 marca.id_pais,
                 marca.id_segmento,
                 seg.titulo AS segmento,
                 pais.nome AS nome_pais,
                 marca.titulo,
                 marca.status,
                 marca.cor_botao,
                 marca.cor_texto,
                 marca.logo_botao,
                 marca.logo_miniatura,
                 marca.nome_logo_botao,
                 marca.nome_logo_miniatura,
                 marca.id_marca_geral,
                 mrcg.titulo AS titulo_marca_geral,
                 marca.criado_em,
                 marca.atualizado_em
                 FROM marca marca
                 LEFT JOIN pais pais ON pais.id_pais = marca.id_pais
                 LEFT JOIN marca_geral mrcg ON mrcg.id_marca_geral = marca.id_marca_geral
                 LEFT JOIN segmento seg ON seg.id_segmento = marca.id_segmento
                 WHERE marca.id_marca = ?
                 ORDER BY marca.titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [id_marca]);
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
        } as iMarca;
      });

      if (marca.length > 0) {
        marca[0].lista_categorias = await marcaCategoriaDB.find(
          marca[0].id_marca,
          conn,
        );
      }

      return Promise.resolve(marca[0]);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async findMarcaGeral(
    id_marca_geral: string,
    conn: Connection,
  ): Promise<iMarca[]> {
    const sql = `SELECT id_marca, titulo, status, atualizado_em FROM marca WHERE id_marca_geral = ?`;

    try {
      const [rows]: any = await conn.query(sql, [id_marca_geral]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }

      const marca = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iMarca;
      });

      return Promise.resolve(marca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async ativaDesativa(
    marcas: iMarca[],
    conn: Connection,
  ): Promise<iReturnDefault[]> {
    const sql = `UPDATE marca SET status = ?, atualizado_em = ? WHERE id_marca = ?`;

    try {
      const promises = marcas.map(async (marca) => {
        const values = [marca.status, marca.atualizado_em, marca.id_marca];
        const [result] = await conn.query<ResultSetHeader>(sql, values);

        if (result.affectedRows === 0) {
          consoleLog(`Marca não encontrada`, pVerbose.erro);
          return retornoPadrao(1, `Marca não encontrada`);
        }
        consoleLog(`Marca atualizada com sucesso!`, pVerbose.aviso);
        return retornoPadrao(0, `Marca atualizada com sucesso!`);
      });
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
