/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable camelcase */
import { Request, Response } from 'express';
import { ConteudoDB } from '../database/ConteudoDB';
import { MySqlConnection } from '../database/MySqlConnection';
import { PaisDB } from '../database/PaisDB';
import { iConteudo, iConteudoZ } from '../entities/ConteudoEntity';
import { ErroGeneral } from '../utils/ErroGeneral';
import retornoPadrao from '../utils/retornoPadrao';
import multer from 'multer';
import shortid from 'shortid';
import fs from 'node:fs';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import * as mime from 'mime';
import { publicPath } from '../routes';
import path from 'path';
export default class ConteudoController {
  static async insert(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    let conteudo;
    try {
      conteudo = iConteudoZ.parse(req.body);
      conteudo.criado_em = new Date();
      conteudo.status = 1;
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

    const cadConteudo = new ConteudoDB();
    const cadPais = new PaisDB();
    try {
      const paisDB = await cadPais.find(conteudo.id_pais, connection);

      if (paisDB.length <= 0 || paisDB[0].status === 0) {
        consoleLog(`País informado não existe ou está inativo`, pVerbose.erro);
        return resp
          .status(400)
          .json(retornoPadrao(1, `País informado não existe ou está inativo`));
      }

      const retorno = await cadConteudo.insert(conteudo, connection);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao inserir o conteúdo ${conteudo.titulo}`,
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
      const finalPath = `${process.env.STORAGE}/files/conteudo/${fileId}.${fileExtension}`;

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
        const finalPath = `${process.env.STORAGE}/files/conteudo/${fileId}.${fileExtension}`;

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

    const conteudoPath = `${publicPath}/conteudo`;

    const filePath = path.join(conteudoPath, fileName);

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
    const filePath = `${process.env.STORAGE}/files/conteudo/${fileName}`;

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
    let conteudo; // iConteudo;
    try {
      conteudo = iConteudoZ.parse(req.body);
      conteudo.atualizado_em = new Date();
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
    const cadConteudo = new ConteudoDB();
    const cadPais = new PaisDB();
    try {
      const paisDB = await cadPais.find(conteudo.id_pais, connection);

      if (paisDB.length <= 0 || paisDB[0].status === 0) {
        consoleLog(`País informado não existe ou está inativo`, pVerbose.erro);
        return resp
          .status(400)
          .json(retornoPadrao(1, `País informado não existe ou está inativo`));
      }
      const retorno = await cadConteudo.update(conteudo, connection);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar conteúdo ${conteudo.titulo}`,
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
    const conteudoDB = new ConteudoDB();
    try {
      const retorno = await conteudoDB.show(connection);
      return resp.json(retorno);
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao buscar conteúdos`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }

  static async findCategoria(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const { id_categoria } = req.params;
    const { id_marca } = req.params;
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
    const conteudoDB = new ConteudoDB();
    try {
      const retorno = await conteudoDB.findCategoria(
        id_categoria,
        id_marca,
        connection,
      );
      return resp.json(retorno);
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao buscar conteúdos`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }

  static async findConteudo(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const { id_categoria } = req.params;
    const { id_marca } = req.params;
    const { id_conteudo } = req.params;
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
    const conteudoDB = new ConteudoDB();
    try {
      const retorno = await conteudoDB.findConteudo(
        id_categoria,
        id_marca,
        id_conteudo,
        connection,
      );
      return resp.json(retorno);
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao buscar conteúdos`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }

  static async showPaisCategoria(
    req: Request,
    resp: Response,
  ): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const conteudo = req.body;
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
    const conteudoDB = new ConteudoDB();
    try {
      const retorno = await conteudoDB.showPaisCategoria(conteudo, connection);
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
    const conteudoDB = new ConteudoDB();
    try {
      const retorno = await conteudoDB.showAtivo(connection);
      return resp.json(retorno);
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao buscar conteúdos`,
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
    const id_conteudo: iConteudo = req.body;
    const idArray = Array.isArray(id_conteudo) ? id_conteudo : [id_conteudo];

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
    const cadConteudo = new ConteudoDB();
    try {
      const conteudos: iConteudo[] = [];
      for (const itemIdConteudo of idArray) {
        const conteudo = await cadConteudo.find(
          itemIdConteudo.id_conteudo,
          connection,
        );
        conteudos.push(...conteudo);
      }
      if (typeof conteudos === 'undefined' || conteudos.length === 0) {
        consoleLog(`Conteúdo não encontrado`, pVerbose.erro);
        return resp
          .status(400)
          .json(retornoPadrao(1, 'Conteúdo não encontrado'));
      }

      const ativarDesativarConteudo = conteudos.map((conteudo) => {
        if (conteudo.status === 1) {
          conteudo.status = 0;
        } else {
          conteudo.status = 1;
        }
        conteudo.atualizado_em = new Date();
        return conteudo;
      });

      const ativarDesativar = ativarDesativarConteudo.map((conteudo) =>
        cadConteudo.ativaDesativa(conteudo, connection),
      );

      const retorno = await Promise.all(ativarDesativar);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar conteúdo`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }
}
