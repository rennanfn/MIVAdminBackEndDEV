/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { Request, Response } from 'express';
import { CategoriaGeralDB } from '../database/CategoriaGeralDB';
import { MySqlConnection } from '../database/MySqlConnection';
import {
  iCategoriaGeral,
  iCategoriaGeralZ,
} from '../entities/CategoriaGeralEntity';
import { ErroGeneral } from '../utils/ErroGeneral';
import retornoPadrao from '../utils/retornoPadrao';
import { CategoriaDB } from '../database/CategoriaDB';

export default class CategoriaGeralController {
  static async insert(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    let categoria_geral: iCategoriaGeral;
    try {
      categoria_geral = iCategoriaGeralZ.parse(req.body);
      categoria_geral.criado_em = new Date();
      categoria_geral.status = 1;
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

    const cadCategoriaGeral = new CategoriaGeralDB();
    try {
      const cadCategoriaGeralDB = await cadCategoriaGeral.findNome(
        categoria_geral.titulo!,
        connection,
      );
      // Não permite cadastrar categoria geral com mesmo nome
      if (cadCategoriaGeralDB.length > 0) {
        return resp
          .status(400)
          .json(
            retornoPadrao(
              1,
              `Categoria ${categoria_geral.titulo} já cadastrada`,
            ),
          );
      }
      await cadCategoriaGeral.insert(categoria_geral, connection);
      await connection.commit();
      const retorno = {
        id_categoria_geral: categoria_geral.id_categoria_geral.toString(),
      };
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao inserir categoria ${categoria_geral.titulo}`,
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
    let categoria_geral: iCategoriaGeral;
    try {
      categoria_geral = iCategoriaGeralZ.parse(req.body);
      categoria_geral.atualizado_em = new Date();
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

    const cadCategoriaGeral = new CategoriaGeralDB();
    try {
      const cadCategoriaGeralDB = await cadCategoriaGeral.findNome(
        categoria_geral.titulo!,
        connection,
      );
      // Não permite cadastrar categoria geral com mesmo nome
      if (cadCategoriaGeralDB.length > 0) {
        return resp
          .status(400)
          .json(
            retornoPadrao(
              1,
              `Categoria ${categoria_geral.titulo} já cadastrada`,
            ),
          );
      }
      await cadCategoriaGeral.update(categoria_geral, connection);
      await connection.commit();
      const retorno = {
        id_categoria_geral: categoria_geral.id_categoria_geral.toString(),
      };
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar categoria ${categoria_geral.titulo}`,
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
    const categoriaGeralDB = new CategoriaGeralDB();
    try {
      const retorno = await categoriaGeralDB.show(connection);
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
    const categoriaGeralDB = new CategoriaGeralDB();
    try {
      const retorno = await categoriaGeralDB.showAtivo(connection);
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
    const categoriasGerais: iCategoriaGeral[] = req.body;

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

    const cadCategoriaGeral = new CategoriaGeralDB();
    const cadCategoria = new CategoriaDB();

    try {
      for (const categoriaGeral of categoriasGerais) {
        const categoriaGeralExistente = await cadCategoriaGeral.find(
          categoriaGeral.id_categoria_geral,
          connection,
        );

        if (!categoriaGeralExistente || categoriaGeralExistente.length === 0) {
          return resp
            .status(400)
            .json(retornoPadrao(1, 'Categoria Geral não encontrada'));
        }

        // Ativa/Desativa a categoria geral
        const ativarDesativarCategoriaGeral = {
          status: categoriaGeralExistente[0].status === 1 ? 0 : 1,
          atualizado_em: new Date(),
          id_categoria_geral: categoriaGeral.id_categoria_geral,
          titulo: categoriaGeral.titulo,
        };

        await cadCategoriaGeral.ativaDesativa(
          ativarDesativarCategoriaGeral,
          connection,
        );
      }

      // Agora desativa as categorias associadas após desativar as categorias gerais
      for (const categoriaGeral of categoriasGerais) {
        const categoriasAssociadas = await cadCategoria.findCatGeral(
          categoriaGeral.id_categoria_geral,
          connection,
        );

        const ativarDesativarCategorias = categoriasAssociadas.map(
          (categoria) => ({
            status: categoria.status === 1 ? 0 : 1,
            atualizado_em: new Date(),
            id_categoria: categoria.id_categoria,
            titulo: categoria.titulo,
            id_pais: categoria.id_pais,
            id_categoria_geral: categoria.id_categoria_geral,
          }),
        );

        await cadCategoria.ativaDesativa(ativarDesativarCategorias, connection);
      }

      await connection.commit();

      return resp.json(retornoPadrao(0, `Categorias atualizadas com sucesso`));
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar categorias gerais e categorias associadas`,
        error,
        clienteIp,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }
}
