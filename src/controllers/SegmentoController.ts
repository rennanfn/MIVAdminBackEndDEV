/* eslint-disable camelcase */
import { Request, Response } from 'express';
import { MySqlConnection } from '../database/MySqlConnection';
import { PaisDB } from '../database/PaisDB';
import { SegmentoDB } from '../database/SegmentoDB';
import { iPais } from '../entities/PaisEntity';
import { iSegmento } from '../entities/SegmentoEntity';
import { ErroGeneral } from '../utils/ErroGeneral';
import retornoPadrao from '../utils/retornoPadrao';
import multer from 'multer';
import shortid from 'shortid';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import fs from 'node:fs';
import * as mime from 'mime';
import { publicPath } from '../routes';
import path from 'path';

export default class SegmentoController {
  static async insertOrUpdate(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const items = req.body;
    const idArray = Array.isArray(items) ? items : [items];
    let segmento;
    let semsegmento;

    try {
      segmento = idArray.filter((item) => item.id_segmento); // Filtra objetos com id_segmento
      semsegmento = idArray.filter((item) => !item.id_segmento); // Filtra objetos sem id_segmento
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

    const cadSegmento = new SegmentoDB();
    const cadPais = new PaisDB();

    try {
      const paises: iPais[] = [];
      for (const itemIdPais of idArray) {
        const paisObj = await cadPais.find(itemIdPais.id_pais, connection);
        if (paisObj && paisObj.length > 0) {
          paises.push(...paisObj);
        }
      }

      if (paises.length === 0 || paises[0].status === 0) {
        return resp
          .status(400)
          .json(retornoPadrao(1, `País informado não existe ou está inativo`));
      }

      // Unifica os dois verificadores numa unica variavel
      const validaSegmento = [...segmento, ...semsegmento];

      const insertPromises = validaSegmento.map((seg) => {
        if (!seg.id_segmento) {
          // Se o objeto não tem id_segmento, chame o insert
          seg.criado_em = new Date();
          seg.status = 1;
          return cadSegmento.insert(seg, connection);
        } else {
          // Se não, chame o update
          return cadSegmento.update(seg, connection);
        }
      });

      const retorno = await Promise.all(insertPromises);

      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao inserir/atualizar segmento(s)`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }

  static async upload(req: Request, resp: Response): Promise<void> {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, `${process.env.STORAGE}`);
      },
      filename: (req, file, cb) => {
        const uniquePrefix = shortid.generate();
        cb(null, uniquePrefix + '-' + file.originalname);
      },
    });

    const upload = multer({ storage });

    const uploadMiddleware = upload.single('arquivo');

    uploadMiddleware(req, resp, async (err) => {
      if (err) {
        consoleLog('Erro ao fazer upload do arquivo:', pVerbose.erro);
        return resp
          .status(400)
          .json(retornoPadrao(1, `Erro ao fazer upload do arquivo`));
      }

      if (!req.file) {
        consoleLog(`Nenhum arquivo foi enviado`, pVerbose.erro);
        return resp
          .status(400)
          .json(retornoPadrao(1, `Nenhum arquivo foi enviado`));
      }
      // Aqui, 'req.file' contém as informações do arquivo após o upload
      const { path } = req.file;

      // Obtém o nome original do arquivo
      const originalName = req.file.originalname;

      // Extrai a extensão do arquivo
      const fileExtension = originalName.split('.').pop();

      // Gere um ID único usando shortid
      const fileId = shortid.generate();

      // Crie o caminho final usando o ID gerado
      const finalPath = `${process.env.STORAGE}/${fileId}.${fileExtension}`;

      // Renomeie o arquivo com o caminho final
      fs.rename(path, finalPath, (renameErr) => {
        if (renameErr) {
          consoleLog('Erro ao renomear o arquivo:', pVerbose.erro);
          return resp
            .status(400)
            .json(retornoPadrao(1, `Erro ao renomear o arquivo`));
        }
        // Retorna o caminho onde o arquivo foi salvo com seu respectivo nome
        return resp.status(200).json({ finalPath, originalName });
      });
    });
  }

  static async exibirImagem(req: Request, resp: Response): Promise<void> {
    // Aqui, você precisará fornecer o nome do arquivo que deseja exibir
    const fileName = req.params.imagem; // Certifique-se de definir a rota apropriada para o nome do arquivo

    // Construa o caminho completo para o arquivo
    // const filePath = `${process.env.STORAGE}/${fileName}`;
    const segmentoPath = `${publicPath}/segmentos`;

    const filePath = path.join(segmentoPath, fileName);

    try {
      // Verifique se o arquivo existe
      if (!(await fs.existsSync(filePath))) {
        resp.status(400).json(retornoPadrao(1, `Arquivo não encontrado`));
        return;
      }
    } catch (error) {
      resp
        .status(500)
        .json(retornoPadrao(1, `Erro ao verificar a existência do arquivo`));
      return;
    }

    // Use a biblioteca mime para obter o tipo MIME do arquivo
    const contentType = mime.getType(filePath);

    if (!contentType) {
      resp
        .status(400)
        .json(
          retornoPadrao(1, `Não foi possível determinar o tipo de conteúdo`),
        );
      return;
    }

    // Configurar o tipo de conteúdo para a resposta
    resp.setHeader('Content-Type', contentType);

    // Crie um fluxo de leitura do arquivo e envie para a resposta
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(resp);
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
    const segmentoDB = new SegmentoDB();
    try {
      const retorno = await segmentoDB.show(connection);
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
    const segmentoDB = new SegmentoDB();
    try {
      const retorno = await segmentoDB.showAtivo(connection);
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

  static async showPais(req: Request, resp: Response): Promise<Response> {
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
    const segmentoDB = new SegmentoDB();
    try {
      const retorno = await segmentoDB.showPais(id_pais, connection);
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

  static async showPaisSeg(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const { id_segmento } = req.params;
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
    const segmentoDB = new SegmentoDB();
    try {
      const retorno = await segmentoDB.showPaisSeg(id_segmento, connection);
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

  static async findSegmento(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const { id_segmento } = req.params;
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
    const segmentoDB = new SegmentoDB();
    try {
      const retorno = await segmentoDB.findSegmento(id_segmento, connection);
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
    const id_segmento: iSegmento = req.body;
    const idArray = Array.isArray(id_segmento) ? id_segmento : [id_segmento];

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

    const cadSegmento = new SegmentoDB();
    try {
      const segmentos: iSegmento[] = [];
      for (const itemIdSegmento of idArray) {
        const segmento = await cadSegmento.find(
          itemIdSegmento.id_segmento,
          connection,
        );
        segmentos.push(...segmento);
      }
      if (typeof segmentos === 'undefined' || segmentos.length === 0) {
        return resp
          .status(400)
          .json(retornoPadrao(1, 'Segmento não encontrado'));
      }

      const ativarDesativarSegmento = segmentos.map((segmento) => ({
        status: segmento.status === 1 ? 0 : 1,
        atualizado_em: new Date(),
        id_segmento: segmento.id_segmento,
        titulo: segmento.titulo,
        id_pais: segmento.id_pais,
        id_segmento_geral: segmento.id_segmento_geral,
      }));

      const ativarDesativar = await cadSegmento.ativaDesativa(
        ativarDesativarSegmento,
        connection,
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
