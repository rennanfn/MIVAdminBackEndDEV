/* eslint-disable camelcase */
import { Request, Response } from 'express';
import * as mime from 'mime';
import multer from 'multer';
import fs from 'node:fs';
import path from 'path';
import shortid from 'shortid';
import { MySqlConnection } from '../database/MySqlConnection';
import { PaisDB } from '../database/PaisDB';
import { RevendaFilialDB } from '../database/RevendaFilialDB';
import {
  iRevendaFilial,
  iRevendaFilialZ,
} from '../entities/RevendaFilialEntity';
import { publicPath } from '../routes';
import { ErroGeneral } from '../utils/ErroGeneral';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import retornoPadrao from '../utils/retornoPadrao';

export default class RevendaFilialController {
  static async insert(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    let revenda: iRevendaFilial;
    try {
      revenda = iRevendaFilialZ.parse(req.body);
      revenda.criado_em = new Date();
      revenda.status = 1;
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
    const cadRevenda = new RevendaFilialDB();
    const cadPais = new PaisDB();
    try {
      const paisDB = await cadPais.find(revenda.id_pais, connection);

      if (paisDB.length <= 0 || paisDB[0].status === 0) {
        return resp
          .status(400)
          .json(retornoPadrao(1, `País informado não existe ou está inativo`));
      }
      const retorno = await cadRevenda.insert(revenda, connection);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao inserir Revenda/Filial ${revenda.titulo}`,
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
      const finalPath = `${process.env.STORAGE}/files/revenda/${fileId}.${fileExtension}`;

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
    const revendaPath = `${publicPath}/revenda`;

    const filePath = path.join(revendaPath, fileName);

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

  static async download(req: Request, resp: Response): Promise<void> {
    // Aqui, você precisará fornecer o nome do arquivo que deseja baixar
    const fileName = req.params.fileName; // Certifique-se de definir a rota apropriada para o nome do arquivo

    // Construa o caminho completo para o arquivo
    const filePath = `${process.env.STORAGE}/files/revenda/${fileName}`;

    // Verifique se o arquivo existe
    if (!fs.existsSync(filePath)) {
      resp.status(400).json(retornoPadrao(1, `Arquivo não encontrado`));
    } else {
      // Configurar os cabeçalhos da resposta para indicar um arquivo para download
      resp.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      resp.setHeader('Content-Type', 'application/octet-stream');

      // Crie um fluxo de leitura do arquivo e envie para a resposta
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(resp);
    }
  }

  static async update(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    let revenda: iRevendaFilial;

    try {
      revenda = iRevendaFilialZ.parse(req.body);
      revenda.atualizado_em = new Date();
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

    const cadRevenda = new RevendaFilialDB();
    const cadPais = new PaisDB();
    try {
      const paisDB = await cadPais.find(revenda.id_pais, connection);

      if (paisDB.length <= 0 || paisDB[0].status === 0) {
        return resp
          .status(400)
          .json(retornoPadrao(1, `País informado não existe ou está inativo`));
      }
      const retorno = await cadRevenda.update(revenda, connection);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar Revenda/Filial ${revenda.titulo}`,
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
    const revendaDB = new RevendaFilialDB();
    try {
      const retorno = await revendaDB.show(connection);
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

  static async showSegPais(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const { id_segmento, id_pais } = req.params;
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
    const revendaDB = new RevendaFilialDB();
    try {
      const retorno = await revendaDB.showSegPais(
        id_segmento,
        id_pais,
        connection,
      );
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
    const { id_revenda_filial_geral } = req.params;
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
    const revendaDB = new RevendaFilialDB();
    try {
      const retorno = await revendaDB.showPais(
        id_revenda_filial_geral,
        connection,
      );
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

  static async showPorMarcaGeral(
    req: Request,
    resp: Response,
  ): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const { id_revenda_filial_geral } = req.params;

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
    const revendaDB = new RevendaFilialDB();
    try {
      const retorno = await revendaDB.showPorRevendaFilialGeral(
        id_revenda_filial_geral,
        connection,
      );
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
    const revendaDB = new RevendaFilialDB();
    try {
      const retorno = await revendaDB.showAtivo(connection);
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
    const revenda_filial: iRevendaFilial = req.body;
    const revendaArray = Array.isArray(revenda_filial)
      ? revenda_filial
      : [revenda_filial];

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

    const revendaDB = new RevendaFilialDB();
    try {
      const revendas: iRevendaFilial[] = [];
      for (const itemIdRevenda of revendaArray) {
        const revenda = await revendaDB.find(
          itemIdRevenda.id_revenda_filial,
          connection,
        );
        revendas.push(revenda);
      }
      if (typeof revendas === 'undefined' || revendas.length === 0) {
        return resp
          .status(400)
          .json(retornoPadrao(1, 'Revenda não encontrada'));
      }

      const ativarDesativarMarca = revendas.map((revenda) => ({
        status: revenda.status === 1 ? 0 : 1,
        atualizado_em: new Date(),
        id_revenda_filial: revenda.id_revenda_filial,
        titulo: revenda.titulo,
        id_pais: revenda.id_pais,
        id_segmento: revenda.id_segmento,
        cor_texto: revenda.cor_texto,
        logo_botao: revenda.logo_botao,
        nome_logo_botao: revenda.nome_logo_botao,
        id_revenda_filial_geral: revenda.id_revenda_filial_geral,
      }));

      const ativarDesativar = await revendaDB.ativaDesativa(
        ativarDesativarMarca,
        connection,
      );

      const retorno = await Promise.all(ativarDesativar);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar Revenda/Filial`,
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
    const { id_revenda_filial } = req.params;

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
    const cadRevenda = new RevendaFilialDB();
    try {
      const marca = await cadRevenda.find(id_revenda_filial, connection);
      return resp.json(marca);
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao buscar marca`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }
}
