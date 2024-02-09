/* eslint-disable camelcase */
import { Request, Response } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import shortid from 'shortid';
import { MySqlConnection } from '../database/MySqlConnection';
import { PaisDB } from '../database/PaisDB';
import { iPais, iPaisZ } from '../entities/PaisEntity';
import { ErroGeneral } from '../utils/ErroGeneral';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import retornoPadrao from '../utils/retornoPadrao';
import * as mime from 'mime';
import path from 'path';
import { publicPath } from '../routes';

export default class PaisController {
  static async insert(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    let pais: iPais;
    try {
      pais = iPaisZ.parse(req.body);
      pais.criado_em = new Date();
      pais.status = 1;
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

    const cadPais = new PaisDB();
    try {
      const paisDB = await cadPais.find(pais.nome, connection);
      // Se existir, não permite cadastrar nome igual!
      if (paisDB.length > 0) {
        return resp
          .status(400)
          .json(retornoPadrao(1, `País ${pais.nome} já cadastrado!`));
      }

      const retorno = await cadPais.insert(pais, connection);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao inserir o país ${pais.nome}`,
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
      const finalPath = `${process.env.STORAGE}/files/pais/${fileId}.${fileExtension}`;

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

  static async download(req: Request, resp: Response): Promise<void> {
    // Aqui, você precisará fornecer o nome do arquivo que deseja baixar
    const fileName = req.params.fileName; // Certifique-se de definir a rota apropriada para o nome do arquivo

    // Construa o caminho completo para o arquivo
    const filePath = `${process.env.STORAGE}/files/pais/${fileName}`;

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

  static async exibirImagem(req: Request, resp: Response): Promise<void> {
    // Aqui, você precisará fornecer o nome do arquivo que deseja exibir
    const fileName = req.params.imagem; // Certifique-se de definir a rota apropriada para o nome do arquivo

    // Construa o caminho completo para o arquivo
    // const filePath = `${process.env.STORAGE}/${fileName}`;
    const paisPath = `${publicPath}/pais`;

    const filePath = path.join(paisPath, fileName);

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

  static async update(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    let pais: iPais;
    try {
      pais = iPaisZ.parse(req.body);
      pais.atualizado_em = new Date();
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

    const cadPais = new PaisDB();
    try {
      const paisDB = await cadPais.find(pais.nome, connection);
      // Se existir, não permite cadastrar nome igual!
      if (paisDB.length > 0) {
        return resp
          .status(400)
          .json(retornoPadrao(1, `País ${pais.nome} já cadastrado!`));
      }
      const retorno = await cadPais.update(pais, connection);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar o país ${pais.nome}`,
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
    const paisDB = new PaisDB();
    try {
      const retorno = await paisDB.show(connection);
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
    const paisDB = new PaisDB();
    try {
      const retorno = await paisDB.showAtivo(connection);
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
    const id_pais: iPais = req.body;
    const idArray = Array.isArray(id_pais) ? id_pais : [id_pais];

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

    const cadPais = new PaisDB();
    try {
      const paises: iPais[] = [];
      for (const itemIdPais of idArray) {
        const pais = await cadPais.find(itemIdPais.id_pais, connection);
        paises.push(...pais);
      }
      if (typeof paises === 'undefined' || paises.length === 0) {
        return resp.status(400).json(retornoPadrao(1, 'País não encontrado'));
      }

      const ativarDesativarPais = paises.map((pais) => {
        if (pais.status === 1) {
          pais.status = 0;
        } else {
          pais.status = 1;
        }
        pais.atualizado_em = new Date();
        return pais;
      });

      const ativarDesativar = ativarDesativarPais.map((pais) =>
        cadPais.ativaDesativa(pais, connection),
      );

      const retorno = await Promise.all(ativarDesativar);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar o país`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }
}
