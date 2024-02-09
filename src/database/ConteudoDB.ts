/* eslint-disable no-async-promise-executor */
/* eslint-disable camelcase */
import { bufferToArrayBuffer } from 'buffer-to-arraybuffer';
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import shortid from 'shortid';
import { Conteudos, iConteudo } from '../entities/ConteudoEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import { convertDate2String } from '../utils/dateNow';
import retornoPadrao from '../utils/retornoPadrao';

export class ConteudoDB extends Conteudos {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na biblioteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro no banco
    consoleLog(`Erro ao buscar conteúdo, rows = undefined`, pVerbose.erro);
    return new ErrorHandlerDB(`Erro ao buscar conteúdo, rows = undefined`);
  }

  async insert(obj: iConteudo, conn: Connection): Promise<iReturnDefault> {
    obj.id_conteudo = shortid.generate();

    const sql = `INSERT INTO conteudo
               (id_conteudo, id_pais, id_categoria, status, id_marca_geral, titulo, imagem_destaque, nome_imagem_destaque, texto_conteudo, lista_arquivos, criado_em, atualizado_em)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
    const values = [
      obj.id_conteudo,
      obj.id_pais,
      obj.id_categoria,
      obj.status,
      obj.id_marca_geral,
      obj.titulo,
      obj.imagem_destaque,
      obj.nome_imagem_destaque,
      obj.texto_conteudo,
      JSON.stringify(obj.lista_arquivos), // Precisa serializar a lista_arquivos
      obj.criado_em,
      obj.atualizado_em,
    ];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 1) {
        consoleLog(
          `Conteúdo: ${obj.titulo} inserido com sucesso!`,
          pVerbose.aviso,
        );
        return Promise.resolve(
          retornoPadrao(0, `Conteúdo: ${obj.titulo} inserido com sucesso!`),
        );
      } else {
        consoleLog(`Erro ao inserir conteúdo`, pVerbose.erro);
        return Promise.resolve(retornoPadrao(1, `Erro ao inserir conteúdo`));
      }
    } catch (error) {
      consoleLog(`Erro ao inserir conteúdo: ${error}`, pVerbose.erro);
      return Promise.reject(error);
    }
  }

  async update(obj: iConteudo, conn: Connection): Promise<iReturnDefault> {
    const sql = `UPDATE conteudo SET id_pais = ?,
                 id_categoria = ?,
                 status = ?,
                 id_marca_geral = ?,
                 titulo = ?,
                 imagem_destaque = ?,
                 nome_imagem_destaque = ?,
                 texto_conteudo = ?,
                 lista_arquivos = ?,
                 atualizado_em = ?
                 WHERE id_conteudo = ?`;
    const values = [
      obj.id_pais,
      obj.id_categoria,
      obj.status,
      obj.id_marca_geral,
      obj.titulo,
      obj.imagem_destaque,
      obj.nome_imagem_destaque,
      obj.texto_conteudo,
      JSON.stringify(obj.lista_arquivos), // Precisa serializar a lista_arquivos
      obj.atualizado_em,
      obj.id_conteudo,
    ];
    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 0) {
        consoleLog(`Conteúdo ${obj.titulo} não encontrado`, pVerbose.erro);
        return Promise.reject(
          retornoPadrao(1, `Conteúdo ${obj.titulo} não encontrado`),
        );
      }
      consoleLog(
        `Conteúdo ${obj.titulo} atualizado com sucesso!`,
        pVerbose.aviso,
      );
      return Promise.resolve(
        retornoPadrao(0, `Conteúdo ${obj.titulo} atualizado com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async show(conn: Connection): Promise<iConteudo[]> {
    const sql = `SELECT * FROM conteudo ORDER BY titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, {
        fetchBlob: true,
      });
      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }
      const conteudo = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
          lista_arquivos: formatObject.lista_arquivos?.map((blob: Buffer) => {
            const arquivoBlob = bufferToArrayBuffer(blob);
            return {
              titulo_botao: formatObject.lista_arquivos[0].titulo_botao,
              arquivo: new File(
                arquivoBlob,
                formatObject.lista_arquivos[0].titulo,
              ),
            };
          }),
        } as iConteudo;
      });
      return Promise.resolve(conteudo);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showPaisCategoria(
    obj: iConteudo,
    conn: Connection,
  ): Promise<RowDataPacket[]> {
    const sql = `SELECT cont.id_conteudo,
                 cont.id_pais,
                 pais.nome AS nome_pais,
                 cont.id_categoria,
                 cat.titulo AS categoria,
                 cont.status,
                 cont.id_marca_geral,
                 mrc.titulo AS marca,
                 cont.titulo,
                 cont.imagem_destaque,
                 cont.nome_imagem_destaque,
                 cont.texto_conteudo,
                 cont.lista_arquivos,
                 cont.criado_em,
                 cont.atualizado_em
                 FROM conteudo cont
                 LEFT JOIN pais pais ON pais.id_pais = cont.id_pais
                 LEFT JOIN categoria cat ON cat.id_categoria = cont.id_categoria
                 LEFT JOIN marca mrc ON mrc.id_marca_geral  = cont.id_marca_geral AND mrc.id_pais = cont.id_pais
                 WHERE cont.id_pais = ? AND cont.id_categoria = ? AND cont.id_marca_geral = ?
                 ORDER BY cont.titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [
        obj.id_pais,
        obj.id_categoria,
        obj.id_marca_geral,
      ]);
      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const conteudo = rows.map((formatObject) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
          lista_arquivos: JSON.parse(formatObject.lista_arquivos).map(
            (arquivoItem) => {
              let arquivo = arquivoItem.arquivo;

              // Se 'arquivo' for um objeto, tenta convertê-lo para JSON
              if (
                typeof arquivoItem.arquivo === 'object' &&
                arquivoItem.arquivo !== null
              ) {
                try {
                  arquivo = JSON.stringify(arquivoItem.arquivo);
                } catch (error) {
                  consoleLog(
                    'Erro ao converter o arquivo para JSON: ',
                    pVerbose.erro,
                  );
                }
              }

              return {
                titulo_botao: arquivoItem.titulo_botao,
                arquivo,
                nome_arquivo: arquivoItem.nome_arquivo,
              };
            },
          ),
        };
      });
      return Promise.resolve(conteudo);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showAtivo(conn: Connection): Promise<iConteudo[]> {
    const sql = `SELECT * FROM conteudo WHERE status = 1 ORDER BY titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql);
      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }
      const conteudo = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as iConteudo;
      });
      return Promise.resolve(conteudo);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async find(id_conteudo: string, conn: Connection): Promise<iConteudo[]> {
    const sql = `SELECT * FROM conteudo WHERE id_conteudo = ?`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [id_conteudo]);
      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }
      const conteudo = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iConteudo;
      });
      return Promise.resolve(conteudo);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async findCategoria(
    id_categoria: string,
    id_marca: string,
    conn: Connection,
  ): Promise<iConteudo[]> {
    const sql = `SELECT cont.id_conteudo,
                 cont.titulo,
                 cat.titulo as titulo_categoria,
                 cont.imagem_destaque,
                 cont.nome_imagem_destaque
                 FROM conteudo cont
                 LEFT JOIN categoria cat on cat.id_categoria = cont.id_categoria
                 LEFT JOIN marca_geral mrc_geral on mrc_geral.id_marca_geral = cont.id_marca_geral
                 LEFT JOIN marca mrc on mrc.id_marca_geral = cont.id_marca_geral
                 WHERE cont.id_categoria = ? AND mrc.id_marca = ?`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [
        id_categoria,
        id_marca,
      ]);
      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }
      const conteudo = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iConteudo;
      });
      return Promise.resolve(conteudo);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async findConteudo(
    id_categoria: string,
    id_marca: string,
    id_conteudo: string,
    conn: Connection,
  ): Promise<iConteudo> {
    const sql = `SELECT cont.id_conteudo,
                 cont.titulo,
                 cat.titulo as titulo_categoria,
                 cont.imagem_destaque,
                 cont.nome_imagem_destaque,
                 cont.texto_conteudo,
                 cont.lista_arquivos
                 FROM conteudo cont
                 LEFT JOIN categoria cat on cat.id_categoria = cont.id_categoria
                 LEFT JOIN marca_geral mrc_geral on mrc_geral.id_marca_geral = cont.id_marca_geral
                 LEFT JOIN marca mrc on mrc.id_marca_geral = cont.id_marca_geral
                 WHERE cont.id_categoria  = ? AND mrc.id_marca = ? AND cont.id_conteudo = ?`;
    try {
      const [rows] = await conn.query(sql, [
        id_categoria,
        id_marca,
        id_conteudo,
      ]);
      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }
      const conteudo: iConteudo = {
        ...rows[0],
        lista_arquivos: JSON.parse(rows[0].lista_arquivos).map(
          (arquivoItem) => {
            let arquivo = arquivoItem.arquivo;

            // Se 'arquivo' for um objeto, tenta convertê-lo para JSON
            if (
              typeof arquivoItem.arquivo === 'object' &&
              arquivoItem.arquivo !== null
            ) {
              try {
                arquivo = JSON.stringify(arquivoItem.arquivo);
              } catch (error) {
                consoleLog(
                  'Erro ao converter o arquivo para JSON: ',
                  pVerbose.erro,
                );
              }
            }

            return {
              titulo_botao: arquivoItem.titulo_botao,
              arquivo,
              nome_arquivo: arquivoItem.nome_arquivo,
            };
          },
        ),
      };

      return Promise.resolve(conteudo);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async ativaDesativa(
    obj: iConteudo,
    conn: Connection,
  ): Promise<iReturnDefault> {
    const sql = `UPDATE conteudo SET status = ?, atualizado_em = ? WHERE id_conteudo = ?`;
    const values = [obj.status, obj.atualizado_em, obj.id_conteudo];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 0) {
        consoleLog(`Conteúdo ${obj.titulo} não encontrado`, pVerbose.erro);
        return Promise.reject(
          retornoPadrao(1, `Conteúdo ${obj.titulo} não encontrado`),
        );
      }
      consoleLog(
        `Conteúdo ${obj.titulo} atualizado com sucesso!`,
        pVerbose.aviso,
      );
      return Promise.resolve(
        retornoPadrao(0, `Conteúdo atualizado com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
