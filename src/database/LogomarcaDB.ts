/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-async-promise-executor */
/* eslint-disable camelcase */
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import shortid from 'shortid';
import { Logomarcas, iLogomarca } from '../entities/LogomarcaEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import { convertDate2String } from '../utils/dateNow';
import retornoPadrao from '../utils/retornoPadrao';

export class LogomarcaDB extends Logomarcas {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na biblioteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro no banco
    consoleLog(`Erro ao buscar logomarca, rows = undefined`, pVerbose.erro);
    return new ErrorHandlerDB(`Erro ao buscar logomarca, rows = undefined`);
  }

  async insert(obj: iLogomarca, conn: Connection): Promise<iReturnDefault> {
    obj.id_logomarca = shortid.generate();

    const sql = `INSERT INTO logomarca
               (id_logomarca, id_marca_geral, id_categoria_logomarca, id_pais, titulo, subtitulo, texto_logomarca, status, lista_arquivos, cores, imagem_destaque, nome_imagem_destaque, criado_em, atualizado_em)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const values = [
      obj.id_logomarca,
      obj.id_marca_geral,
      obj.id_categoria_logomarca,
      obj.id_pais,
      obj.titulo,
      obj.subtitulo,
      obj.texto_logomarca,
      obj.status,
      JSON.stringify(obj.lista_arquivos),
      JSON.stringify(obj.cores),
      obj.imagem_destaque,
      obj.nome_imagem_destaque,
      obj.criado_em,
      obj.atualizado_em,
    ];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 1) {
        consoleLog(
          `Logomarca: ${obj.titulo} inserida com sucesso!`,
          pVerbose.aviso,
        );
        return Promise.resolve(
          retornoPadrao(0, `Logomarca: ${obj.titulo} inserida com sucesso!`),
        );
      } else {
        consoleLog(`Erro ao inserir logomarca`, pVerbose.erro);
        return Promise.resolve(retornoPadrao(1, `Erro ao inserir logomarca`));
      }
    } catch (error) {
      consoleLog(`Erro ao inserir logomarca: ${error}`, pVerbose.erro);
      return Promise.reject(error);
    }
  }

  async update(obj: iLogomarca, conn: Connection): Promise<iReturnDefault> {
    const sql = `UPDATE logomarca SET id_marca_geral = ?,
                 id_categoria_logomarca = ?,
                 id_pais = ?,
                 titulo = ?,
                 subtitulo = ?,
                 texto_logomarca = ?,
                 status = ?,
                 lista_arquivos = ?,
                 cores = ?,
                 imagem_destaque = ?,
                 nome_imagem_destaque = ?,
                 atualizado_em = ?
                 WHERE id_logomarca = ?`;
    const values = [
      obj.id_marca_geral,
      obj.id_categoria_logomarca,
      obj.id_pais,
      obj.titulo,
      obj.subtitulo,
      obj.texto_logomarca,
      obj.status,
      JSON.stringify(obj.lista_arquivos),
      JSON.stringify(obj.cores),
      obj.imagem_destaque,
      obj.nome_imagem_destaque,
      obj.atualizado_em,
      obj.id_logomarca,
    ];
    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 0) {
        consoleLog(`Logomarca ${obj.titulo} não encontrada`, pVerbose.erro);
        return Promise.reject(
          retornoPadrao(1, `Logomarca ${obj.titulo} não encontrada`),
        );
      }
      consoleLog(
        `Logomarca ${obj.titulo} atualizada com sucesso!`,
        pVerbose.aviso,
      );
      return Promise.resolve(
        retornoPadrao(0, `Logomarca ${obj.titulo} atualizada com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async show(conn: Connection): Promise<iLogomarca[]> {
    const sql = `SELECT * FROM logomarca ORDER BY titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, []);
      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }
      const logomarca = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as iLogomarca;
      });
      return Promise.resolve(logomarca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showCatLog(id_pais: string, conn: Connection): Promise<iLogomarca[]> {
    const sql = `SELECT id_categoria_logomarca, titulo
                 FROM categoria_logomarca log
                 WHERE id_pais = ?
                 ORDER BY titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [id_pais]);
      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }
      const logomarca = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as iLogomarca;
      });
      return Promise.resolve(logomarca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showPaisMarca(
    id_pais: string,
    id_marca_geral: string,
    conn: Connection,
  ): Promise<RowDataPacket[]> {
    const sql = `SELECT log.id_logomarca,
                 log.id_marca_geral,
                 log.id_categoria_logomarca,
                 catlog.titulo AS categoria_logomarca,
                 log.id_pais,
                 pais.nome AS nome_pais,
                 log.titulo,
                 log.subtitulo,
                 log.texto_logomarca,
                 log.status,
                 log.lista_arquivos,
                 log.cores,
                 log.imagem_destaque,
                 log.nome_imagem_destaque,
                 log.criado_em,
                 log.atualizado_em
                 FROM logomarca log
                 INNER JOIN pais pais ON pais.id_pais = log.id_pais
                 INNER JOIN categoria_logomarca catlog ON catlog.id_categoria_logomarca = log.id_categoria_logomarca
                 WHERE log.id_pais = ? AND log.id_marca_geral = ?
                 ORDER BY log.titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [
        id_pais,
        id_marca_geral,
      ]);
      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const logomarca = rows.map((formatObject) => {
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
          cores: JSON.parse(formatObject.cores).map((coresItem) => {
            let cor = coresItem.cor;

            // Se 'cores' for um objeto, tenta convertê-lo para JSON
            if (typeof coresItem.cor === 'object' && coresItem.cor !== null) {
              try {
                cor = JSON.stringify(coresItem.cor);
              } catch (error) {
                consoleLog(
                  'Erro ao converter o cores para JSON',
                  pVerbose.erro,
                );
              }
            }

            return {
              cor: coresItem.cor,
              descricao: coresItem.descricao,
              legenda_cor: coresItem.legenda_cor,
            };
          }),
        };
      });
      return Promise.resolve(logomarca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showPorMarca(
    id_marca: string,
    id_categoria_logomarca: string,
    conn: Connection,
  ): Promise<iLogomarca[]> {
    const sql = `SELECT log.id_logomarca,
                 log.titulo,
                 log.texto_logomarca,
                 log.imagem_destaque,
                 log.nome_imagem_destaque,
                 mrc.cor_botao,
                 mrc.cor_texto,
                 clg.titulo as titulo_catLog_geral
                 FROM logomarca log
                 LEFT JOIN categoria_logomarca catlog on catlog.id_categoria_logomarca = log.id_categoria_logomarca
                 LEFT JOIN categoria_logomarca_geral clg on clg.id_categoria_logomarca_geral = catlog.id_categoria_logomarca_geral
                 LEFT JOIN marca_geral mrc_geral ON mrc_geral.id_marca_geral = log.id_marca_geral
                 LEFT JOIN marca mrc ON  mrc.id_marca_geral = log.id_marca_geral AND mrc.id_marca_geral = mrc_geral.id_marca_geral
                 WHERE mrc.id_marca = ? AND catlog.id_categoria_logomarca = ?
                 ORDER BY log.nome_imagem_destaque`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [
        id_marca,
        id_categoria_logomarca,
      ]);

      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const marca = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iLogomarca;
      });
      return Promise.resolve(marca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showAtivo(conn: Connection): Promise<iLogomarca[]> {
    const sql = `SELECT * FROM logomarca WHERE status = 1 ORDER BY titulo ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql);
      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }
      const logomarca = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as iLogomarca;
      });
      return Promise.resolve(logomarca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async find(id_logomarca: string, conn: Connection): Promise<iLogomarca> {
    const sql = `SELECT log.id_logomarca,
                  log.id_categoria_logomarca,
                  log.titulo,
                  log.subtitulo,
                  log.imagem_destaque,
                  log.nome_imagem_destaque,
                  log.texto_logomarca,
                  log.lista_arquivos,
                  log.cores,
                  clg.titulo as titulo_catLog_geral
                  FROM logomarca log
                  LEFT JOIN categoria_logomarca catlog on catlog.id_categoria_logomarca = log.id_categoria_logomarca
                  LEFT JOIN categoria_logomarca_geral clg on clg.id_categoria_logomarca_geral = catlog.id_categoria_logomarca_geral
                  WHERE id_logomarca = ?`;
    try {
      const [rows] = await conn.query(sql, [id_logomarca]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }

      const logomarca: iLogomarca = {
        ...rows[0],
        lista_arquivos: JSON.parse(rows[0].lista_arquivos).map(
          (arquivoItem: any) => {
            let arquivo = arquivoItem.arquivo;

            if (
              typeof arquivoItem.arquivo === 'object' &&
              arquivoItem.arquivo !== null
            ) {
              try {
                arquivo = JSON.stringify(arquivoItem.arquivo);
              } catch (error) {
                console.log('Erro ao converter o arquivo para JSON: ', error);
              }
            }

            return {
              titulo_botao: arquivoItem.titulo_botao,
              arquivo,
              nome_arquivo: arquivoItem.nome_arquivo,
            };
          },
        ),
        cores: JSON.parse(rows[0].cores).map((coresItem: any) => {
          let cor = coresItem.cor;

          if (typeof coresItem.cor === 'object' && coresItem.cor !== null) {
            try {
              cor = JSON.stringify(coresItem.cor);
            } catch (error) {
              console.log('Erro ao converter o cores para JSON', error);
            }
          }

          return {
            cor: coresItem.cor,
            descricao: coresItem.descricao,
            legenda_cor: coresItem.legenda_cor,
          };
        }),
      };

      return Promise.resolve(logomarca);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async ativaDesativa(
    obj: iLogomarca,
    conn: Connection,
  ): Promise<iReturnDefault> {
    const sql = `UPDATE logomarca SET status = ?, atualizado_em = ? WHERE id_logomarca = ?`;
    const values = [obj.status, obj.atualizado_em, obj.id_logomarca];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 0) {
        consoleLog(`Logomarca ${obj.titulo} não encontrada`, pVerbose.erro);
        return Promise.reject(
          retornoPadrao(1, `Logomarca ${obj.titulo} não encontrada`),
        );
      }
      consoleLog(
        `Logomarca ${obj.titulo} atualizada com sucesso!`,
        pVerbose.aviso,
      );
      return Promise.resolve(
        retornoPadrao(0, `Logomarca atualizada com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
