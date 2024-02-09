/* eslint-disable camelcase */
import { CidadeDB } from '../database/CidadeDB';
import { MySqlConnection } from '../database/MySqlConnection';
import { iCidade, iCidadeZ } from '../entities/CidadeEntity';
import { ErroGeneral } from '../utils/ErroGeneral';
import { Request, Response } from 'express';
import retornoPadrao from '../utils/retornoPadrao';

export default class CidadeController {
  static async insert(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    let cidade: iCidade;
    try {
      cidade = iCidadeZ.parse(req.body);
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
    const cadCidade = new CidadeDB();
    try {
      const cidadeDB = await cadCidade.find(cidade.nome, connection);
      // Se existir, não permite cadastrar nome igual!
      if (cidadeDB.length > 0) {
        return resp
          .status(400)
          .json(retornoPadrao(1, `Cidade ${cidade.nome} já cadastrada!`));
      }

      await cadCidade.insert(cidade, connection);
      await connection.commit();
      const id_cidade = cidade.id_cidade;
      return resp.json({ id_cidade });
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao inserir cidade ${cidade.nome}`,
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
    let cidade: iCidade;
    try {
      cidade = iCidadeZ.parse(req.body);
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

    const cadCidade = new CidadeDB();
    try {
      const retorno = await cadCidade.update(cidade, connection);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar cidade ${cidade.nome}`,
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
    const cidadeDB = new CidadeDB();
    try {
      const retorno = await cidadeDB.show(connection);
      return resp.json(retorno);
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao buscar cidades`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }

  static async showCidadeEstado(
    req: Request,
    resp: Response,
  ): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const { id_estado } = req.params;

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
    const cidadeDB = new CidadeDB();
    try {
      const retorno = await cidadeDB.showCidadeEstado(id_estado, connection);
      return resp.json(retorno);
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao buscar cidade`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }
}
