/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable no-async-promise-executor */
import { Connection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import shortid from 'shortid';
import { Usuarios, iUsuario } from '../entities/UsuarioEntity';
import { ErrorHandlerDB } from '../utils/ErrorHandlerDB';
import { iReturnDefault } from '../utils/ReturnDefault';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import { convertDate2String } from '../utils/dateNow';
import retornoPadrao from '../utils/retornoPadrao';
import { UsuarioPaisDB } from './UsuarioPaisDB';

export class UsuarioDB extends Usuarios {
  private rowsUndefined(): ErrorHandlerDB {
    // Quando rows for undefined é porque teve algum erro na biblioteca
    // quando não encontra dados na tabela retorna um array vazio, e se o select falhar
    // por algum campo escrito errado, cai no catch, então somente retorna undefined em rows em caso de erro no banco
    consoleLog(`Erro ao buscar país, rows = undefined`, pVerbose.erro);
    return new ErrorHandlerDB(`Erro ao buscar país, rows = undefined`);
  }

  async insert(obj: iUsuario, conn: Connection): Promise<iReturnDefault> {
    obj.id_usuario = shortid.generate();
    const { lista_pais, ...objUsuario } = obj; // remove a lista de paises para inserir após salvar o usuário

    const idsPais = obj.lista_pais;

    return new Promise(async (resolve, reject) => {
      const usuarioPaisDB = new UsuarioPaisDB();
      const sql = `INSERT INTO usuario
                   (id_usuario, email, nome, senha, id_filial, responsavel, telefone, acesso_admin, acesso_user, criado_em, atualizado_em, status)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
      const values = [
        objUsuario.id_usuario,
        objUsuario.email,
        objUsuario.nome,
        objUsuario.senha,
        objUsuario.id_filial,
        objUsuario.responsavel,
        objUsuario.telefone,
        objUsuario.acesso_admin,
        objUsuario.acesso_user,
        objUsuario.criado_em,
        objUsuario.atualizado_em,
        objUsuario.status,
      ];

      try {
        await conn.beginTransaction();
        // insere o usuário
        const [resultUsuario] = await conn.query<ResultSetHeader>(sql, values);
        // insere os países que usuário terá acesso
        await usuarioPaisDB.insert(objUsuario.id_usuario, idsPais, conn);

        if (resultUsuario.affectedRows === 1) {
          consoleLog(
            `Usuário: ${obj.email} inserido com sucesso!`,
            pVerbose.aviso,
          );
          return resolve(
            retornoPadrao(0, `Usuário: ${obj.email} inserido com sucesso!`),
          );
        } else {
          consoleLog(`Erro ao inserir usuário`, pVerbose.erro);
          return resolve(retornoPadrao(1, `Erro ao inserir usuário`));
        }
      } catch (error) {
        return reject(error);
      }
    });
  }

  /**
   * Atualização do usuário, não será atualizado senha e status
   * @param obj iUsuario
   * @param conn Connection
   * @returns iReturnDefault
   */
  async update(obj: iUsuario, conn: Connection): Promise<iReturnDefault> {
    const usuarioPaisDB = new UsuarioPaisDB();
    const ids_pais = obj.lista_pais;
    const { lista_pais, ...objUsuario } = obj; // remove lista_pais para atualizar dados primários

    const sql = `UPDATE usuario SET
                  id_usuario = ?,
                  email = ?,
                  nome = ?,
                  id_filial = ?,
                  responsavel = ?,
                  telefone = ?,
                  acesso_admin = ?,
                  acesso_user = ?,
                  atualizado_em = ?
                 WHERE id_usuario = ?`;
    const values = [
      obj.id_usuario,
      obj.email,
      obj.nome,
      obj.id_filial,
      obj.responsavel,
      obj.telefone,
      obj.acesso_admin,
      obj.acesso_user,
      obj.atualizado_em,
      obj.id_usuario,
    ];

    try {
      await conn.beginTransaction();
      const [result] = await conn.query<ResultSetHeader>(sql, values);
      // Durante o processo de edição do usuário, serão removidas as permissões de país
      // Este procedimento se fez necessário para que caso haja a remoção de alguma permissão do usuário, apenas as permissões corretas permaneçam!
      await usuarioPaisDB.delete(objUsuario.id_usuario, conn);
      // Após a remoção, insere apenas as permissões vindas do objeto
      await usuarioPaisDB.insert(obj.id_usuario, ids_pais, conn);

      if (result.affectedRows === 0) {
        consoleLog(`Usuário ${obj.email} não encontrado`, pVerbose.erro);
        return Promise.reject(
          retornoPadrao(1, `Usuário ${obj.email} não encontrado`),
        );
      }
      consoleLog(
        `Usuário ${obj.email} atualizado com sucesso!`,
        pVerbose.aviso,
      );
      return Promise.resolve(
        retornoPadrao(0, `Usuário ${obj.email} atualizado com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async trocarSenha(
    email: string,
    senhaNova: string,
    conn: Connection,
  ): Promise<iReturnDefault> {
    const senhaTemp = undefined;
    const sql = `UPDATE usuario SET senha = ?, senhaTemp = ? WHERE email = ?`;

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, [
        senhaNova,
        senhaTemp,
        email,
      ]);

      if (result.affectedRows === 0) {
        consoleLog(`Usuário ${email} não encontrado`, pVerbose.erro);
        return Promise.reject(
          retornoPadrao(1, `Usuário ${email} não encontrado`),
        );
      }
      consoleLog(`Usuário ${email} atualizado com sucesso!`, pVerbose.aviso);
      return Promise.resolve(
        retornoPadrao(0, `Usuário ${email} atualizado com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async senhaTemp(
    email: string,
    senhaTemp: string,
    conn: Connection,
  ): Promise<iReturnDefault> {
    const sql = `UPDATE usuario SET senhaTemp = ? WHERE email = ?`;

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, [
        senhaTemp,
        email,
      ]);

      if (result.affectedRows === 0) {
        consoleLog(`Usuário ${email} não encontrado`, pVerbose.erro);
        return Promise.reject(
          retornoPadrao(1, `Usuário ${email} não encontrado`),
        );
      }
      consoleLog(`Usuário ${email} atualizado com sucesso!`, pVerbose.aviso);
      return Promise.resolve(
        retornoPadrao(0, `Usuário ${email} atualizado com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async show(conn: Connection): Promise<iUsuario[]> {
    const sqlUsuario = `SELECT usr.id_usuario,
                          usr.email,
                          usr.nome,
                          usr.id_filial,
                          fil.nome AS nome_filial,
                          usr.responsavel,
                          usr.telefone,
                          usr.acesso_admin,
                          usr.acesso_user,
                          usr.criado_em,
                          usr.atualizado_em,
                          usr.status
                        FROM usuario usr
                        INNER JOIN filial fil ON fil.id_filial = usr.id_filial
                        ORDER BY usr.nome ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sqlUsuario);
      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }
      const usuarios = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          senha: '',
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as iUsuario;
      });
      return Promise.resolve(usuarios);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async find(id_usuario: string, conn: Connection): Promise<iUsuario> {
    const usuarioPaisDB = new UsuarioPaisDB();
    const sqlUsuario = `SELECT usr.id_usuario,
                          usr.email,
                          usr.nome,
                          usr.id_filial,
                          fil.nome AS nome_filial,
                          usr.responsavel,
                          usr.telefone,
                          usr.acesso_admin,
                          usr.acesso_user,
                          usr.criado_em,
                          usr.atualizado_em,
                          usr.status
                        FROM usuario usr
                        INNER JOIN filial fil ON fil.id_filial = usr.id_filial
                        WHERE usr.id_usuario = ?
                        ORDER BY usr.nome ASC`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sqlUsuario, [
        id_usuario,
      ]);
      if (!Array.isArray(rows)) {
        return Promise.reject(this.rowsUndefined());
      }

      const usuario = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
          senha: '',
          criado_em: convertDate2String(new Date(formatObject.criado_em)),
          atualizado_em:
            formatObject.atualizado_em !== null
              ? convertDate2String(new Date(formatObject.atualizado_em))
              : '',
        } as iUsuario;
      });

      if (usuario.length > 0) {
        usuario[0].lista_pais = await usuarioPaisDB.find(
          usuario[0].id_usuario,
          conn,
        );
      }

      return Promise.resolve(usuario[0]);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async findLogin(email: string, conn: Connection): Promise<iUsuario[]> {
    const sql = `SELECT * FROM usuario WHERE email = ? AND status = 1`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [email]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }
      const login_usuario = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iUsuario;
      });
      return Promise.resolve(login_usuario);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async findBySenhaTemp(
    senhaTemp: string,
    conn: Connection,
  ): Promise<iUsuario[]> {
    const sql = `SELECT * FROM usuario WHERE senhaTemp = ? AND status = 1`;
    try {
      const [rows] = await conn.query<RowDataPacket[]>(sql, [senhaTemp]);

      if (typeof rows === 'undefined') {
        return Promise.reject(this.rowsUndefined());
      }
      const login_usuario = rows.map((formatObject: RowDataPacket) => {
        return {
          ...formatObject,
        } as iUsuario;
      });
      return Promise.resolve(login_usuario);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async ativaDesativa(
    obj: iUsuario,
    conn: Connection,
  ): Promise<iReturnDefault> {
    const sql = `UPDATE usuario SET status = ?, atualizado_em = ? WHERE id_usuario = ?`;
    const values = [obj.status, obj.atualizado_em, obj.id_usuario];

    try {
      const [result] = await conn.query<ResultSetHeader>(sql, values);

      if (result.affectedRows === 0) {
        consoleLog(`Usuário não encontrado`, pVerbose.erro);
        return Promise.reject(retornoPadrao(1, `Usuário não encontrado`));
      }
      consoleLog(`Usuário atualizado com sucesso!`, pVerbose.aviso);
      return Promise.resolve(
        retornoPadrao(0, `Usuário atualizado com sucesso!`),
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
