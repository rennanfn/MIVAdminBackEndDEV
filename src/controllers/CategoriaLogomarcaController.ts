/* eslint-disable camelcase */
import { Request, Response } from 'express';
import { CategoriaLogomarcaDB } from '../database/CategoriaLogomarcaDB';
import { MySqlConnection } from '../database/MySqlConnection';
import { PaisDB } from '../database/PaisDB';
import { iCategoriaLogomarca } from '../entities/CategoriaLogomarcaEntity';
import { iPais } from '../entities/PaisEntity';
import { ErroGeneral } from '../utils/ErroGeneral';
import retornoPadrao from '../utils/retornoPadrao';
import { consoleLog, pVerbose } from '../utils/consoleLog';

export default class CategoriaLogomarcaController {
  static async insertOrUpdate(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const items = req.body;
    const idArray = Array.isArray(items) ? items : [items];
    let categoria_logomarca;
    let semcategoria_logomarca;

    try {
      categoria_logomarca = idArray.filter(
        (item) => item.id_categoria_logomarca,
      ); // Filtra objetos com id_categoria
      semcategoria_logomarca = idArray.filter(
        (item) => !item.id_categoria_logomarca,
      ); // Filtra objetos sem id_categoria
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

    const cadCategoriLogomarca = new CategoriaLogomarcaDB();
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

      // Unifica os dois verificadores numa unica variavel
      const validaCategoriaLogomarca = [
        ...categoria_logomarca,
        ...semcategoria_logomarca,
      ];

      const insertPromises = validaCategoriaLogomarca.map((catlogo) => {
        if (!catlogo.id_categoria_logomarca) {
          // Se o objeto não tem id_categoria_logomarca, chame o insert
          catlogo.criado_em = new Date();
          catlogo.status = 1;
          return cadCategoriLogomarca.insert(catlogo, connection);
        } else {
          // Se não, chame o update
          return cadCategoriLogomarca.update(catlogo, connection);
        }
      });

      const retorno = await Promise.all(insertPromises);

      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao inserir/atualizar categoria logomarca(s)`,
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
    const categoriaLogoDB = new CategoriaLogomarcaDB();
    try {
      const retorno = await categoriaLogoDB.show(connection);
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

  static async showPorLogoGer(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const { id_categoria_logomarca_geral } = req.params;
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
    const categoriaLogoDB = new CategoriaLogomarcaDB();
    try {
      const retorno = await categoriaLogoDB.showPorLogoGer(
        id_categoria_logomarca_geral,
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

  static async showPorCatLog(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const { id_marca } = req.params;
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
    const categoriaLogoDB = new CategoriaLogomarcaDB();
    try {
      const retorno = await categoriaLogoDB.showPorCatLog(
        id_marca,
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
    const categoriaLogoDB = new CategoriaLogomarcaDB();
    try {
      const retorno = await categoriaLogoDB.showAtivo(connection);
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
    const id_categoria_logomarca: iCategoriaLogomarca = req.body;
    const idArray = Array.isArray(id_categoria_logomarca)
      ? id_categoria_logomarca
      : [id_categoria_logomarca];

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

    const cadCategoriaLogo = new CategoriaLogomarcaDB();
    try {
      const categoriasLogomarcas: iCategoriaLogomarca[] = [];
      for (const itemIdCategoriaLogo of idArray) {
        const categoriaLogomarca = await cadCategoriaLogo.find(
          itemIdCategoriaLogo.id_categoria_logomarca,
          connection,
        );
        categoriasLogomarcas.push(...categoriaLogomarca);
      }
      if (
        typeof categoriasLogomarcas === 'undefined' ||
        categoriasLogomarcas.length === 0
      ) {
        consoleLog(`Categoria Logomarca não encontrada`, pVerbose.erro);
        return resp
          .status(400)
          .json(retornoPadrao(1, 'Categoria Logomarca não encontrada'));
      }

      const ativarDesativarCategoriaLogo = categoriasLogomarcas.map(
        (catlogo) => {
          if (catlogo.status === 1) {
            catlogo.status = 0;
          } else {
            catlogo.status = 1;
          }
          catlogo.atualizado_em = new Date();
          return catlogo;
        },
      );

      const ativarDesativar = ativarDesativarCategoriaLogo.map((catlogo) =>
        cadCategoriaLogo.ativaDesativa(catlogo, connection),
      );

      const retorno = await Promise.all(ativarDesativar);
      await connection.commit();
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar categoria logomarca`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }
}
