import { publicPath } from './../routes/index';
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable camelcase */
import { Request, Response } from 'express';
import { LogomarcaDB } from '../database/LogomarcaDB';
import { MySqlConnection } from '../database/MySqlConnection';
import { PaisDB } from '../database/PaisDB';
import { iLogomarca, iLogomarcaZ } from '../entities/LogomarcaEntity';
import { ErroGeneral } from '../utils/ErroGeneral';
import retornoPadrao from '../utils/retornoPadrao';
import multer from 'multer';
import shortid from 'shortid';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import fs from 'node:fs';
import path from 'path';
import * as mime from 'mime';

export default class LogomarcaController {
  static async insert(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    let logomarca;
    try {
      logomarca = iLogomarcaZ.parse(req.body);
      logomarca.criado_em = new Date();
      logomarca.status = 1;
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

    const cadLogomarca = new LogomarcaDB();
    const cadPais = new PaisDB();
    try {
      const paisDB = await cadPais.find(logomarca.id_pais, connection);

      if (paisDB.length <= 0 || paisDB[0].status === 0) {
        return resp
          .status(400)
          .json(retornoPadrao(1, `País informado não existe ou está inativo`));
      }
      const retorno = await cadLogomarca.insert(logomarca, connection);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao inserir o conteúdo ${logomarca.titulo}`,
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
      const finalPath = `${process.env.STORAGE}/files/logomarca/${fileId}.${fileExtension}`;

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

  static async uploadArray(req: Request, resp: Response): Promise<void> {
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

    const uploadMiddleware = upload.array('arquivos');

    uploadMiddleware(req, resp, async (err) => {
      if (err) {
        consoleLog('Erro ao fazer upload do arquivo:', pVerbose.erro);
        return resp
          .status(400)
          .json(retornoPadrao(1, `Erro ao fazer upload do arquivo`));
      }

      if (!req.files) {
        consoleLog(`Nenhum arquivo foi enviado`, pVerbose.erro);
        return resp
          .status(400)
          .json(retornoPadrao(1, `Nenhum arquivo foi enviado`));
      }
      const uploadedFiles: { finalPath: string; originalName: string }[] = [];

      for (const file of req.files as Express.Multer.File[]) {
        // Aqui, 'file' contém as informações do arquivo após o upload
        const { path } = file;

        // Obtém o nome original do arquivo
        const originalName = file.originalname;

        // Extrai a extensão do arquivo
        const fileExtension = originalName.split('.').pop();

        // Gere um ID único usando shortid
        const fileId = shortid.generate();

        // Crie o caminho final usando o ID gerado
        const finalPath = `${process.env.STORAGE}/files/logomarca/${fileId}.${fileExtension}`;

        // Renomeie o arquivo com o caminho final
        fs.rename(path, finalPath, (renameErr) => {
          if (renameErr) {
            consoleLog('Erro ao renomear o arquivo:', pVerbose.erro);
            return resp
              .status(400)
              .json(retornoPadrao(1, `Erro ao renomear o arquivo`));
          }

          // Adiciona o objeto ao array
          uploadedFiles.push({ finalPath, originalName });

          // Se todos os arquivos foram processados, envie a resposta
          if (uploadedFiles.length === req.files!.length) {
            return resp.status(200).json(uploadedFiles);
          }
        });
      }
    });
  }

  static async exibirImagem(req: Request, resp: Response): Promise<void> {
    // Aqui, você precisará fornecer o nome do arquivo que deseja exibir
    const fileName = req.params.imagem; // Certifique-se de definir a rota apropriada para o nome do arquivo

    // Construa o caminho completo para o arquivo
    // const filePath = `${process.env.STORAGE}/${fileName}`;
    const logomarcaPath = `${publicPath}/logomarca`;

    const filePath = path.join(logomarcaPath, fileName);

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
    const filePath = `${process.env.STORAGE}/files/logomarca/${fileName}`;

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
    let logomarca;
    try {
      logomarca = iLogomarcaZ.parse(req.body);
      logomarca.atualizado_em = new Date();
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
    const cadLogomarca = new LogomarcaDB();
    const cadPais = new PaisDB();
    try {
      const paisDB = await cadPais.find(logomarca.id_pais, connection);

      if (paisDB.length <= 0 || paisDB[0].status === 0) {
        return resp
          .status(400)
          .json(retornoPadrao(1, `País informado não existe ou está inativo`));
      }
      const retorno = await cadLogomarca.update(logomarca, connection);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar logomarca ${logomarca.titulo}`,
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
    const logomarcaDB = new LogomarcaDB();
    try {
      const retorno = await logomarcaDB.show(connection);
      return resp.json(retorno);
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao buscar logomarcas`,
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
    const { id_logomarca } = req.params;
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
    const logomarcaDB = new LogomarcaDB();
    try {
      const retorno = await logomarcaDB.find(id_logomarca, connection);
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

  static async showCatLog(req: Request, resp: Response): Promise<Response> {
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
    const logomarcaDB = new LogomarcaDB();
    try {
      const retorno = await logomarcaDB.showCatLog(id_pais, connection);
      return resp.json(retorno);
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao buscar logomarcas`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }

  static async showPorMarca(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const { id_marca } = req.params;
    const { id_categoria_logomarca } = req.params;
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
    const logomarcaDB = new LogomarcaDB();
    try {
      const retorno = await logomarcaDB.showPorMarca(
        id_marca,
        id_categoria_logomarca,
        connection,
      );
      return resp.json(retorno);
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao buscar logomarcas`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }

  static async showPaisMarca(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const { id_pais } = req.params;
    const { id_marca_geral } = req.params;
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
    const logomarcaDB = new LogomarcaDB();
    try {
      const retorno = await logomarcaDB.showPaisMarca(
        id_pais,
        id_marca_geral,
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
    const logomarcaDB = new LogomarcaDB();
    try {
      const retorno = await logomarcaDB.showAtivo(connection);
      return resp.json(retorno);
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao buscar logomarcas`,
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
    const id_logomarca: iLogomarca = req.body;
    const idArray = Array.isArray(id_logomarca) ? id_logomarca : [id_logomarca];

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
    const cadLogomarca = new LogomarcaDB();
    try {
      const logomarcas: iLogomarca[] = [];
      for (const itemIdLogomarca of idArray) {
        const logomarca = await cadLogomarca.find(
          itemIdLogomarca.id_logomarca,
          connection,
        );
        logomarcas.push(logomarca);
      }
      if (typeof logomarcas === 'undefined' || logomarcas.length === 0) {
        return resp
          .status(400)
          .json(retornoPadrao(1, 'Logomarca não encontrada'));
      }

      const ativarDesativarLogomarca = logomarcas.map((logomarca) => {
        if (logomarca.status === 1) {
          logomarca.status = 0;
        } else {
          logomarca.status = 1;
        }
        logomarca.atualizado_em = new Date();
        return logomarca;
      });

      const ativarDesativar = ativarDesativarLogomarca.map((logomarca) =>
        cadLogomarca.ativaDesativa(logomarca, connection),
      );

      const retorno = await Promise.all(ativarDesativar);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar logomarca`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }
}
