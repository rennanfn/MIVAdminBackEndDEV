/* eslint-disable camelcase */
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import shortid from 'shortid';
import { Paises, iPais } from '../entities/PaisEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import { convertDate2String } from '../utils/dateNow';
import retornoPadrao from '../utils/retornoPadrao';

export class PaisDB extends Paises {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na bibliteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro
    consoleLog(`Erro ao buscar país, rows = undefined`, pVerbose.erro);
    return new ErrorHandlerDB(`Erro ao buscar país, rows = undefined`);
  }

  async insert(obj: iPais, conn: Connection): Promise<iReturnDefault> {
    obj.id_pais = shortid.generate();

    const sql = `INSERT INTO pais
                    (id_pais, nome, botao_trocar_senha, botao_sair, botao_ajuda, label_senha_atual, label_nova_senha, label_confirmar_senha, link_botao_ajuda,
                     logo_miv, bandeira_imagem, nome_logo_miv, nome_bandeira_imagem, texto_rodape, criado_em, atualizado_em, status)
                  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const values = [
      obj.id_pais,
      obj.nome,
      obj.botao_trocar_senha,
      obj.botao_sair,
      obj.botao_ajuda,
      obj.label_senha_atual,
      obj.label_nova_senha,
      obj.label_confirmar_senha,
      obj.link_botao_ajuda,
      obj.logo_miv,
      obj.bandeira_imagem,
      obj.nome_logo_miv,
      obj.nome_bandeira_imagem,
      obj.texto_rodape,
      obj.criado_em,
      obj.atualizado_em,
      obj.status,
    ];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 1) {
        consoleLog(`País: ${obj.nome} inserido com sucesso!`, pVerbose.aviso);
        return Promise.resolve(
          retornoPadrao(0, `País: ${obj.nome} inserido com sucesso!`),
        );
      } else {
        consoleLog(`Erro ao inserir país`, pVerbose.erro);
        return Promise.resolve(retornoPadrao(1, `Erro ao inserir país`));
      }
    } catch (error) {
      consoleLog(`Erro ao inserir país: ${error}`, pVerbose.erro);
      return Promise.reject(error);
    }
  }

  async update(obj: iPais, conn: Connection): Promise<iReturnDefault> {
    const sql = `UPDATE pais SET
                    nome = ?, botao_trocar_senha = ?, botao_sair = ?, botao_ajuda = ?, label_nova_senha = ?, label_nova_senha = ?, label_confirmar_senha = ?,
                    link_botao_ajuda = ?, logo_miv = ?, bandeira_imagem = ?, nome_logo_miv = ?, nome_bandeira_imagem = ?, texto_rodape = ?, atualizado_em = ?
                 WHERE id_pais = ?`;
    const values = [
      obj.nome,
      obj.botao_trocar_senha,
      obj.botao_sair,
      obj.botao_ajuda,
      obj.label_senha_atual,
      obj.label_nova_senha,
      obj.label_confirmar_senha,
      obj.link_botao_ajuda,
      obj.logo_miv,
      obj.bandeira_imagem,
      obj.nome_logo_miv,
      obj.nome_bandeira_imagem,
      obj.texto_rodape,
      obj.atualizado_em,
      obj.id_pais,
    ];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 0) {
        consoleLog(`País ${obj.nome} não encontrado`, pVerbose.erro);
        return Promise.reject(
          retornoPadrao(1, `País ${obj.nome} não encontrado`),
        );
      }
      consoleLog(`País ${obj.nome} atualizado com sucesso!`, pVerbose.aviso);
      return Promise.resolve(
        retornoPadrao(0, `País ${obj.nome} atualizado com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async show(conn: Connection): Promise<iPais[]> {
    const sql = `SELECT * FROM pais ORDER BY nome ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql);
      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }
      const paises = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as iPais;
      });
      return Promise.resolve(paises);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async showAtivo(conn: Connection): Promise<iPais[]> {
    const sql = `SELECT * FROM pais WHERE status = 1 ORDER BY nome ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql);
      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }
      const paises = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as iPais;
      });
      return Promise.resolve(paises);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async find(id_pais: string, conn: Connection): Promise<iPais[]> {
    const sql = `SELECT * FROM pais WHERE id_pais = ?`;

    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [id_pais]);
      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }
      const pais = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iPais;
      });
      return Promise.resolve(pais);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async ativaDesativa(obj: iPais, conn: Connection): Promise<iReturnDefault> {
    const sql = `UPDATE pais SET status = ?, atualizado_em = ? WHERE id_pais = ?`;
    const values = [obj.status, obj.atualizado_em, obj.id_pais];
    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      if (result.affectedRows === 0) {
        consoleLog(`País ${obj.nome} não encontrado`, pVerbose.erro);
        return Promise.reject(
          retornoPadrao(1, `País ${obj.nome} não encontrado`),
        );
      }
      consoleLog(`País ${obj.nome} atualizado com sucesso!`, pVerbose.aviso);
      return Promise.resolve(retornoPadrao(0, `País atualizado com sucesso!`));
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
