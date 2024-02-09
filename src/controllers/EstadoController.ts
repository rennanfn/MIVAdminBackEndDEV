/* eslint-disable camelcase */
import { EstadoDB } from '../database/EstadoDB';
import { MySqlConnection } from '../database/MySqlConnection';
import { PaisDB } from '../database/PaisDB';
import { iEstado, iEstadoZ } from '../entities/EstadoEntity';
import { ErroGeneral } from '../utils/ErroGeneral';
import { Request, Response } from 'express';
import retornoPadrao from '../utils/retornoPadrao';
import { consoleLog, pVerbose } from '../utils/consoleLog';

export default class EstadoController {
  static async insert(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    let estado: iEstado;
    try {
      estado = iEstadoZ.parse(req.body);
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
    const cadEstado = new EstadoDB();
    const cadPais = new PaisDB();
    try {
      const paisDB = await cadPais.find(estado.id_pais, connection);

      if (paisDB.length <= 0 || paisDB[0].status === 0) {
        consoleLog(`País informado não existe ou está inativo`, pVerbose.erro);
        return resp
          .status(400)
          .json(retornoPadrao(1, `País informado não existe ou está inativo`));
      }

      const estadoDB = await cadEstado.find(
        estado.nome,
        estado.id_pais,
        connection,
      );
      // Verifica se já existe um estado cadastrado para o país
      if (estadoDB.length > 0) {
        return resp
          .status(400)
          .json(retornoPadrao(1, `Estado ${estado.nome} já cadastrado!`));
      }

      const retorno = await cadEstado.insert(estado, connection);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao inserir estado ${estado.nome}`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }

  static async showEstadoPais(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const { id_pais } = req.params;

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
    const estadoDB = new EstadoDB();
    try {
      const retorno = await estadoDB.showEstadoPais(id_pais, connection);
      return resp.json(retorno);
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao buscar estado`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }
}
