/* eslint-disable camelcase */
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import shortid from 'shortid';
import { UsuarioPaises, iUsuarioPais } from '../entities/UsuarioPaisEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import retornoPadrao from '../utils/retornoPadrao';

export class UsuarioPaisDB extends UsuarioPaises {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na biblioteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro
    consoleLog(`Erro ao buscar usuario_pais, rows = undefined`, pVerbose.erro);
    return new ErrorHandlerDB(`Erro ao buscar usuario_pais, rows = undefined`);
  }

  async insert(
    idUsuario: string,
    idsPais: iUsuarioPais[],
    conn: Connection,
  ): Promise<iReturnDefault> {
    const sqlPais = `INSERT INTO usuario_pais_relacional (id_usuario_pais, id_pais, id_usuario) VALUES (?,?,?)`;

    try {
      await Promise.all(
        idsPais.map(async (usuario_pais) => {
          const id_usuario_pais = shortid.generate();
          const valuesPais = [id_usuario_pais, usuario_pais.id_pais, idUsuario];
          return conn.query<ResultSetHeader>(sqlPais, valuesPais);
        }),
      );
      return Promise.resolve(
        retornoPadrao(0, `Permissão inserida com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async delete(idUsuario: string, conn: Connection): Promise<iReturnDefault> {
    const deleteIdUsuario = `DELETE FROM usuario_pais_relacional WHERE id_usuario = ?`;
    const valuesDelete = [idUsuario];
    try {
      await conn.query<ResultSetHeader>(deleteIdUsuario, valuesDelete);
      return Promise.resolve(
        retornoPadrao(0, `Permissão deletada com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async find(id_usuario: string, conn: Connection): Promise<iUsuarioPais[]> {
    const sql = `SELECT
                  usuario.id_pais,
                  pais.nome,
                  pais.botao_trocar_senha,
                  pais.botao_trocar_pais,
                  pais.botao_meu_perfil,
                  pais.botao_sair,
                  pais.botao_ajuda,
                  pais.label_senha_atual,
                  pais.label_nova_senha,
                  pais.label_confirmar_senha,
                  pais.link_botao_ajuda,
                  pais.logo_miv,
                  pais.texto_rodape,
                  pais.bandeira_imagem
                FROM usuario_pais_relacional usuario
                LEFT JOIN pais pais on pais.id_pais = usuario.id_pais
                WHERE usuario.id_usuario = ?
                ORDER BY pais.nome`;

    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [id_usuario]);
      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }
      const usuario_pais = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iUsuarioPais;
      });
      return Promise.resolve(usuario_pais);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
