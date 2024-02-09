/* eslint-disable camelcase */
import { Request, Response } from 'express';
import { CategoriaDB } from '../database/CategoriaDB';
import { MySqlConnection } from '../database/MySqlConnection';
import { PaisDB } from '../database/PaisDB';
import { iCategoria } from '../entities/CategoriaEntity';
import { iPais } from '../entities/PaisEntity';
import { ErroGeneral } from '../utils/ErroGeneral';
import retornoPadrao from '../utils/retornoPadrao';
import { consoleLog, pVerbose } from '../utils/consoleLog';

export default class CategoriaController {
  static async insertOrUpdate(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const items = req.body;
    const idArray = Array.isArray(items) ? items : [items];
    let categoria;
    let semcategoria;

    try {
      categoria = idArray.filter((item) => item.id_categoria); // Filtra objetos com id_categoria
      semcategoria = idArray.filter((item) => !item.id_categoria); // Filtra objetos sem id_categoria
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

    const cadCategoria = new CategoriaDB();
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
        consoleLog(`País informado não existe ou está inativo`, pVerbose.erro);
        return resp
          .status(400)
          .json(retornoPadrao(1, `País informado não existe ou está inativo`));
      }

      const categoriaPais: iCategoria[] = [];
      for (const itemCatPais of idArray) {
        if (!itemCatPais.id_categoria) {
          const catPaisObj = await cadCategoria.findNomePais(
            itemCatPais.titulo,
            itemCatPais.id_pais,
            connection,
          );
          if (catPaisObj && catPaisObj.length > 0) {
            categoriaPais.push(...catPaisObj);
          }
        }
      }

      if (categoriaPais.length > 0) {
        consoleLog(`Categoria já cadastrada para este país`, pVerbose.erro);
        return resp
          .status(400)
          .json(retornoPadrao(1, `Categoria já cadastrada para este país`));
      }

      // Unifica os dois verificadores numa unica variavel
      const validaCategoria = [...categoria, ...semcategoria];

      const insertPromises = validaCategoria.map((cat) => {
        if (!cat.id_categoria) {
          // Se o objeto não tem id_categoria, chame o insert
          cat.criado_em = new Date();
          cat.status = 1;
          return cadCategoria.insert(cat, connection);
        } else {
          // Se não, chame o update
          return cadCategoria.update(cat, connection);
        }
      });

      const retorno = await Promise.all(insertPromises);

      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao inserir/atualizar categoria(s)`,
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
    const categoriaDB = new CategoriaDB();
    try {
      const retorno = await categoriaDB.show(connection);
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

  static async showPorPais(req: Request, resp: Response): Promise<Response> {
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
    const categoriaDB = new CategoriaDB();
    try {
      const retorno = await categoriaDB.showPorPais(id_pais, connection);
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
    const categoriaDB = new CategoriaDB();
    try {
      const retorno = await categoriaDB.showAtivo(connection);
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
    const id_categoria: iCategoria = req.body;
    const idArray = Array.isArray(id_categoria) ? id_categoria : [id_categoria];

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

    const cadCategoria = new CategoriaDB();
    try {
      const categorias: iCategoria[] = [];
      for (const itemIdCategoria of idArray) {
        const categoria = await cadCategoria.find(
          itemIdCategoria.id_categoria,
          connection,
        );
        categorias.push(...categoria);
      }
      if (typeof categorias === 'undefined' || categorias.length === 0) {
        consoleLog(`Categoria não encontrada`, pVerbose.erro);
        return resp
          .status(400)
          .json(retornoPadrao(1, 'Categoria não encontrada'));
      }

      const ativarDesativarCategoria = categorias.map((categoria) => ({
        status: categoria.status === 1 ? 0 : 1,
        atualizado_em: new Date(),
        id_categoria: categoria.id_categoria,
        titulo: categoria.titulo,
        id_pais: categoria.id_pais,
        id_categoria_geral: categoria.id_categoria_geral,
      }));

      const ativarDesativar = await cadCategoria.ativaDesativa(
        ativarDesativarCategoria,
        connection,
      );

      const retorno = await Promise.all(ativarDesativar);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar categoria`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }
}
