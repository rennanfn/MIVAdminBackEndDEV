/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { Request, Response } from 'express';
import { MySqlConnection } from '../database/MySqlConnection';
import { SegmentoGeralDB } from '../database/SegmentoGeralDB';
import {
  iSegmentoGeral,
  iSegmentoGeralZ,
} from '../entities/SegmentoGeralEntity';
import { ErroGeneral } from '../utils/ErroGeneral';
import retornoPadrao from '../utils/retornoPadrao';
import { SegmentoDB } from '../database/SegmentoDB';

export default class SegmentoGeralController {
  static async insert(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    let segmento_geral: iSegmentoGeral;
    try {
      segmento_geral = iSegmentoGeralZ.parse(req.body);
      segmento_geral.criado_em = new Date();
      segmento_geral.status = 1;
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

    const cadSegmentoGeral = new SegmentoGeralDB();
    try {
      await cadSegmentoGeral.insert(segmento_geral, connection);
      await connection.commit();
      const retorno = {
        id_segmento_geral: segmento_geral.id_segmento_geral.toString(),
      };
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao inserir segmento ${segmento_geral.titulo}`,
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
    let segmento_geral: iSegmentoGeral;
    try {
      segmento_geral = iSegmentoGeralZ.parse(req.body);
      segmento_geral.atualizado_em = new Date();
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

    const cadSegmentoGeral = new SegmentoGeralDB();
    try {
      await cadSegmentoGeral.update(segmento_geral, connection);
      await connection.commit();
      const retorno = {
        id_segmento_geral: segmento_geral.id_segmento_geral.toString(),
      };
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar segmento ${segmento_geral.titulo}`,
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
    const segmentoGeralDB = new SegmentoGeralDB();
    try {
      const retorno = await segmentoGeralDB.show(connection);
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
    const segmentoGeralDB = new SegmentoGeralDB();
    try {
      const retorno = await segmentoGeralDB.showAtivo(connection);
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
    const segmentosGerais: iSegmentoGeral[] = req.body;

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

    const cadSegmentoGeral = new SegmentoGeralDB();
    const cadSegmento = new SegmentoDB();

    try {
      for (const segmentoGeral of segmentosGerais) {
        const segmentoGeralExistente = await cadSegmentoGeral.find(
          segmentoGeral.id_segmento_geral,
          connection,
        );

        if (!segmentoGeralExistente || segmentoGeralExistente.length === 0) {
          return resp
            .status(400)
            .json(retornoPadrao(1, `Segmento Geral não encontrado`));
        }

        // Ativa/Desativa Segmento Geral
        const ativarDesativarSegmentoGeral = {
          status: segmentoGeralExistente[0].status === 1 ? 0 : 1,
          atualizado_em: new Date(),
          id_segmento_geral: segmentoGeral.id_segmento_geral,
          titulo: segmentoGeral.titulo,
        };

        await cadSegmentoGeral.ativaDesativa(
          ativarDesativarSegmentoGeral,
          connection,
        );
      }

      // Agora desativa os segmentos associados após desativar os segmentos gerais
      for (const segmentoGeral of segmentosGerais) {
        const segmentosAssociados = await cadSegmento.findSegGeral(
          segmentoGeral.id_segmento_geral,
          connection,
        );

        const ativarDesativarSegmentos = segmentosAssociados.map(
          (segmento) => ({
            status: segmento.status === 1 ? 0 : 1,
            atualizado_em: new Date(),
            id_segmento: segmento.id_segmento,
            titulo: segmento.titulo,
            id_pais: segmento.id_pais,
            id_segmento_geral: segmento.id_segmento_geral,
          }),
        );
        await cadSegmento.ativaDesativa(ativarDesativarSegmentos, connection);
      }

      await connection.commit();
      return resp.json(retornoPadrao(0, `Segmentos atualizados com sucesso`));
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro atualizar segmentos gerais e segmentos associados`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }
}
