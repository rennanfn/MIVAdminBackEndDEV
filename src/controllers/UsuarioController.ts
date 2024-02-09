/* eslint-disable camelcase */
import { Request, Response } from 'express';
import { MySqlConnection } from '../database/MySqlConnection';
import { iUsuario, iUsuarioZ } from '../entities/UsuarioEntity';
import { ErroGeneral } from '../utils/ErroGeneral';
import Criptografar from '../utils/criptografar';
import retornoPadrao from '../utils/retornoPadrao';
import { UsuarioDB } from './../database/UsuarioDB';

export default class UsuarioController {
  static async insert(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    let usuario: iUsuario;
    try {
      usuario = iUsuarioZ.parse(req.body);
      usuario.criado_em = new Date();
      usuario.status = 1;
      usuario.acesso_user = 1;
      if (usuario.senha === '') {
        return resp
          .status(400)
          .json(retornoPadrao(1, `Objeto recebido não é do tipo esperado`));
      }
    } catch (error) {
      const retornar = ErroGeneral.getErrorGeneral(
        `Objeto recebido não é do tipo esperado`,
        error,
        clienteIp,
      );
      return resp.status(400).json(retornar);
    }
    let connection;
    try {
      connection = await MySqlConnection.getConnection();
    } catch (error) {
      const retornar = ErroGeneral.getErrorGeneral(
        `Erro ao abrir conexão com o MySQL`,
        error,
        clienteIp,
      );
      return resp.status(400).json(retornar);
    }
    const cadUsuario = new UsuarioDB();
    try {
      // Verifica no banco se já existe o login que está sendo cadastrado. Logins iguais não são permitidos
      const usuarioDB = await cadUsuario.findLogin(usuario.email, connection);

      if (usuarioDB.length >= 1) {
        return resp
          .status(400)
          .json(retornoPadrao(1, `Email de usuário já existente`));
      }
      // Criptografa a senha
      const senhaCrip = await Criptografar.criptografarSenha(usuario.senha);
      usuario.senha = senhaCrip;

      const retorno = await cadUsuario.insert(usuario, connection);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao inserir o usuário ${usuario.email}`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }

  static async update(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    let usuario: iUsuario;
    try {
      usuario = iUsuarioZ.parse(req.body);
      usuario.atualizado_em = new Date();
    } catch (error) {
      const retornar = ErroGeneral.getErrorGeneral(
        `Objeto recebido não é do tipo esperado`,
        error,
        clienteIp,
      );
      return resp.status(400).json(retornar);
    }
    let connection;
    try {
      connection = await MySqlConnection.getConnection();
    } catch (error) {
      const retornar = ErroGeneral.getErrorGeneral(
        `Erro ao abrir conexão com o MySQL`,
        error,
        clienteIp,
      );
      return resp.status(400).json(retornar);
    }
    const cadUsuario = new UsuarioDB();
    try {
      // Verifica no banco se já existe o login que está sendo cadastrado. Logins iguais não são permitidos
      const usuarioDB = await cadUsuario.findLogin(usuario.email, connection);

      if (
        usuarioDB.length >= 1 &&
        usuarioDB[0].id_usuario !== usuario.id_usuario
      ) {
        return resp
          .status(400)
          .json(retornoPadrao(1, `Email de usuário já existente`));
      }

      const retorno = await cadUsuario.update(usuario, connection);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar usuário ${usuario.email}`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }

  static async show(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    let connection;
    try {
      connection = await MySqlConnection.getConnection();
    } catch (error) {
      const erro = ErroGeneral.getErrorGeneral(
        `Erro ao abrir conexão com o MySQL`,
        error,
        clienteIp,
      );
      return resp.status(400).json(erro);
    }
    const usuarioDB = new UsuarioDB();
    try {
      const retorno = await usuarioDB.show(connection);
      return resp.json(retorno);
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao buscar usuários`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }

  static async ativaDesativa(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const { id_usuario } = req.params;

    let connection;
    try {
      connection = await MySqlConnection.getConnection();
    } catch (error) {
      const retornar = ErroGeneral.getErrorGeneral(
        `Erro ao abrir conexão com o MySQL`,
        error,
        clienteIp,
      );
      return resp.status(400).json(retornar);
    }

    const cadUsuario = new UsuarioDB();
    try {
      const usuario = await cadUsuario.find(id_usuario, connection);
      if (typeof usuario === 'undefined') {
        return resp
          .status(400)
          .json(retornoPadrao(1, 'Usuário não encontrado'));
      }

      if (usuario.status === 1) {
        usuario.status = 0;
      } else {
        usuario.status = 1;
      }

      usuario.atualizado_em = new Date();

      const retorno = await cadUsuario.ativaDesativa(usuario, connection);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar usuário`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }

  static async find(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const { id_usuario } = req.params;

    let connection;
    try {
      connection = await MySqlConnection.getConnection();
    } catch (error) {
      const retornar = ErroGeneral.getErrorGeneral(
        `Erro ao abrir conexão com o MySQL`,
        error,
        clienteIp,
      );
      return resp.status(400).json(retornar);
    }
    const cadUsuario = new UsuarioDB();
    try {
      const usuario = await cadUsuario.find(id_usuario, connection);
      return resp.json(usuario);
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao buscar usuário`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }
}
