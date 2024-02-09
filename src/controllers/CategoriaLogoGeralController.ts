/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { Request, Response } from 'express';
import { CategoriaLogoGeralDB } from '../database/CategoriaLogoGeralDB';
import { MySqlConnection } from '../database/MySqlConnection';
import {
  iCategoriaLogoGeral,
  iCategoriaLogoGeralZ,
} from '../entities/CategoriaLogoGeralEntity';
import { ErroGeneral } from '../utils/ErroGeneral';
import retornoPadrao from '../utils/retornoPadrao';
import { consoleLog, pVerbose } from '../utils/consoleLog';

export default class CategoriaLogoGeralController {
  static async insert(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    let categoria_logomarca_geral: iCategoriaLogoGeral;
    try {
      categoria_logomarca_geral = iCategoriaLogoGeralZ.parse(req.body);
      categoria_logomarca_geral.criado_em = new Date();
      categoria_logomarca_geral.status = 1;
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

    const cadCatLogoGeral = new CategoriaLogoGeralDB();
    try {
      await cadCatLogoGeral.insert(categoria_logomarca_geral, connection);
      await connection.commit();
      const retorno = {
        id_categoria_logomarca_geral:
          categoria_logomarca_geral.id_categoria_logomarca_geral.toString(),
      };
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao inserir categoria_logomarca_geral ${categoria_logomarca_geral.titulo}`,
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
    let categoria_logomarca_geral: iCategoriaLogoGeral;
    try {
      categoria_logomarca_geral = iCategoriaLogoGeralZ.parse(req.body);
      categoria_logomarca_geral.atualizado_em = new Date();
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

    const cadCatLogoGeral = new CategoriaLogoGeralDB();
    try {
      await cadCatLogoGeral.update(categoria_logomarca_geral, connection);
      await connection.commit();
      const retorno = {
        id_categoria_logomarca_geral:
          categoria_logomarca_geral.id_categoria_logomarca_geral.toString(),
      };
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar categoria_logomarca_geral ${categoria_logomarca_geral.titulo}`,
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
    const catLogoGeralDB = new CategoriaLogoGeralDB();
    try {
      const retorno = await catLogoGeralDB.show(connection);
      return resp.json(retorno);
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao buscar parâmetros`,
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
    const catLogoGeralDB = new CategoriaLogoGeralDB();
    try {
      const retorno = await catLogoGeralDB.showAtivo(connection);
      return resp.json(retorno);
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao buscar parâmetros`,
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
    const id_categoria_logomarca_geral: iCategoriaLogoGeral = req.body;
    const idArray = Array.isArray(id_categoria_logomarca_geral)
      ? id_categoria_logomarca_geral
      : [id_categoria_logomarca_geral];

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

    const cadCatLogoGeral = new CategoriaLogoGeralDB();
    try {
      const catLogoGerais: iCategoriaLogoGeral[] = [];
      for (const itemIdCatLogoGeral of idArray) {
        const catLogoGeral = await cadCatLogoGeral.find(
          itemIdCatLogoGeral.id_categoria_logomarca_geral,
          connection,
        );
        catLogoGerais.push(...catLogoGeral);
      }
      if (typeof catLogoGerais === 'undefined' || catLogoGerais.length === 0) {
        consoleLog(`Categoria Logomarca Geral não encontrado`, pVerbose.erro);
        return resp
          .status(400)
          .json(retornoPadrao(1, 'Categoria Logomarca Geral não encontrado'));
      }

      const ativarDesativarCatLogoGerais = catLogoGerais.map((catlogoger) => {
        if (catlogoger.status === 1) {
          catlogoger.status = 0;
        } else {
          catlogoger.status = 1;
        }
        catlogoger.atualizado_em = new Date();
        return catlogoger;
      });

      const ativarDesativar = ativarDesativarCatLogoGerais.map((catlogoger) =>
        cadCatLogoGeral.ativaDesativa(catlogoger, connection),
      );

      const retorno = await Promise.all(ativarDesativar);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar segmento`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }
}
