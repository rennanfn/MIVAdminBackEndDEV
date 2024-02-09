/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { Request, Response } from 'express';
import { MySqlConnection } from '../database/MySqlConnection';
import { RevendaFilialDB } from '../database/RevendaFilialDB';
import { RevendaFilialGeralDB } from '../database/RevendaFilialGeralDB';
import {
  iRevendaFilialGeral,
  iRevendaFilialGeralZ,
} from '../entities/RevendaFilialGeralEntity';
import { ErroGeneral } from '../utils/ErroGeneral';
import retornoPadrao from '../utils/retornoPadrao';

export default class RevendaFilialGeralController {
  static async insert(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    let revenda_filial_geral: iRevendaFilialGeral;
    try {
      revenda_filial_geral = iRevendaFilialGeralZ.parse(req.body);
      revenda_filial_geral.criado_em = new Date();
      revenda_filial_geral.status = 1;
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

    const cadRevFilialGeral = new RevendaFilialGeralDB();
    try {
      await cadRevFilialGeral.insert(revenda_filial_geral, connection);
      await connection.commit();
      const retorno = {
        id_revenda_filial_geral:
          revenda_filial_geral.id_revenda_filial_geral.toString(),
      };
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao inserir Revenda/Filial ${revenda_filial_geral.titulo}`,
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
    let revenda_filial_geral: iRevendaFilialGeral;
    try {
      revenda_filial_geral = iRevendaFilialGeralZ.parse(req.body);
      revenda_filial_geral.atualizado_em = new Date();
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

    const cadRevFilialGeral = new RevendaFilialGeralDB();
    try {
      await cadRevFilialGeral.update(revenda_filial_geral, connection);
      await connection.commit();
      const retorno = {
        id_revenda_filial_geral:
          revenda_filial_geral.id_revenda_filial_geral.toString(),
      };
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar Revenda/Filial ${revenda_filial_geral.titulo}`,
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
    const cadRevFilialDB = new RevendaFilialGeralDB();
    try {
      const retorno = await cadRevFilialDB.show(connection);
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
    const cadRevFilialDB = new RevendaFilialGeralDB();
    try {
      const retorno = await cadRevFilialDB.showAtivo(connection);
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
    const revendasGerais: iRevendaFilialGeral[] = req.body;

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

    const cadRevFilialGeral = new RevendaFilialGeralDB();
    const cadRevenda = new RevendaFilialDB();

    try {
      for (const revendaGeral of revendasGerais) {
        const revendaGeralExistente = await cadRevFilialGeral.find(
          revendaGeral.id_revenda_filial_geral,
          connection,
        );

        if (!revendaGeralExistente || revendaGeralExistente.length === 0) {
          return resp
            .status(400)
            .json(retornoPadrao(1, `Revenda/Filial Geral não encontrada`));
        }

        // Ativa/Desativa Revenda/Filial Geral
        const ativarDesativarRevendaFilialGeral = {
          status: revendaGeralExistente[0].status === 1 ? 0 : 1,
          atualizado_em: new Date(),
          id_revenda_filial_geral: revendaGeral.id_revenda_filial_geral,
          titulo: revendaGeral.titulo,
        };

        await cadRevFilialGeral.ativaDesativa(
          ativarDesativarRevendaFilialGeral,
          connection,
        );
      }

      // Agora desativa as revendas associadas após desativar as revendas gerais
      for (const revendaGeral of revendasGerais) {
        const revendasAssociadas = await cadRevenda.findRevendaFilialGeral(
          revendaGeral.id_revenda_filial_geral,
          connection,
        );

        const ativarDesativarRevendas = revendasAssociadas.map((revenda) => ({
          status: revenda.status === 1 ? 0 : 1,
          atualizado_em: new Date(),
          id_revenda_filial: revenda.id_revenda_filial,
          id_segmento: revenda.id_segmento,
          titulo: revenda.titulo,
          id_pais: revenda.id_pais,
          cor_texto: revenda.cor_texto,
          logo_botao: revenda.logo_botao,
          nome_logo_botao: revenda.nome_logo_botao,
          id_revenda_filial_geral: revenda.id_revenda_filial_geral,
        }));
        await cadRevenda.ativaDesativa(ativarDesativarRevendas, connection);
      }

      await connection.commit();
      return resp.json(
        retornoPadrao(0, `Revenda/Filiais atualizadas com sucesso`),
      );
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro atualizar marcas gerais e marcas associadss`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }
}
