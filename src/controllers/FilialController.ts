/* eslint-disable camelcase */
import { FilialDB } from '../database/FilialDB';
import { MySqlConnection } from '../database/MySqlConnection';
import { iFilial, iFilialZ } from '../entities/FilialEntity';
import { ErroGeneral } from '../utils/ErroGeneral';
import { Request, Response } from 'express';
import retornoPadrao from '../utils/retornoPadrao';
import { PaisDB } from '../database/PaisDB';
import { consoleLog, pVerbose } from '../utils/consoleLog';

export default class FilialController {
  static async insert(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    let filial: iFilial;
    try {
      filial = iFilialZ.parse(req.body);
      filial.criado_em = new Date();
      filial.status = 1;
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

    const cadFilial = new FilialDB();
    const cadPais = new PaisDB();
    try {
      const paisDB = await cadPais.find(filial.id_pais, connection);

      if (paisDB.length <= 0 || paisDB[0].status === 0) {
        consoleLog(`País informado não existe ou está inativo`, pVerbose.erro);
        return resp
          .status(400)
          .json(retornoPadrao(1, `País informado não existe ou está inativo`));
      }
      const retorno = await cadFilial.insert(filial, connection);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao inserir o filial ${filial.nome}`,
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
    let filial: iFilial;
    try {
      filial = iFilialZ.parse(req.body);
      filial.atualizado_em = new Date();
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
    const cadFilial = new FilialDB();
    const cadPais = new PaisDB();
    try {
      const paisDB = await cadPais.find(filial.id_pais, connection);

      if (paisDB.length <= 0 || paisDB[0].status === 0) {
        consoleLog(`País informado não existe ou está inativo`, pVerbose.erro);
        return resp
          .status(400)
          .json(retornoPadrao(1, `País informado não existe ou está inativo`));
      }
      const retorno = await cadFilial.update(filial, connection);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar filial ${filial.nome}`,
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
    const filialDB = new FilialDB();
    try {
      const retorno = await filialDB.show(connection);
      return resp.json(retorno);
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao buscar filiais`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }

  static async showAtivo(req: Request, resp: Response): Promise<Response> {
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
    const filialDB = new FilialDB();
    try {
      const retorno = await filialDB.showAtivo(connection);
      return resp.json(retorno);
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao buscar filiais`,
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
    const id_filial: iFilial = req.body;
    const idArray = Array.isArray(id_filial) ? id_filial : [id_filial];

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
    const cadFilial = new FilialDB();
    try {
      const filiais: iFilial[] = [];
      for (const itemIdFilial of idArray) {
        const filial = await cadFilial.find(itemIdFilial.id_filial, connection);
        filiais.push(...filial);
      }
      if (typeof filiais === 'undefined' || filiais.length === 0) {
        return resp.status(400).json(retornoPadrao(1, 'Filial não encontrada'));
      }

      const ativarDesativarFilial = filiais.map((filial) => {
        if (filial.status === 1) {
          filial.status = 0;
        } else {
          filial.status = 1;
        }
        filial.atualizado_em = new Date();
        return filial;
      });

      const ativarDesativar = ativarDesativarFilial.map((filial) =>
        cadFilial.ativaDesativa(filial, connection),
      );

      const retorno = await Promise.all(ativarDesativar);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar filial`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }
}
