/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { Request, Response } from 'express';
import { MarcaGeralDB } from '../database/MarcaGeralDB';
import { MySqlConnection } from '../database/MySqlConnection';
import { iMarcaGeral, iMarcaGeralZ } from '../entities/MarcaGeralEntity';
import { ErroGeneral } from '../utils/ErroGeneral';
import retornoPadrao from '../utils/retornoPadrao';
import { MarcaDB } from '../database/MarcaDB';

export default class MarcaGeralController {
  static async insert(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    let marca_geral: iMarcaGeral;
    try {
      marca_geral = iMarcaGeralZ.parse(req.body);
      marca_geral.criado_em = new Date();
      marca_geral.status = 1;
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

    const cadMarcaGeral = new MarcaGeralDB();
    try {
      await cadMarcaGeral.insert(marca_geral, connection);
      await connection.commit();
      const retorno = {
        id_marca_geral: marca_geral.id_marca_geral.toString(),
      };
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao inserir marca${marca_geral.titulo}`,
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
    let marca_geral: iMarcaGeral;
    try {
      marca_geral = iMarcaGeralZ.parse(req.body);
      marca_geral.atualizado_em = new Date();
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

    const cadMarcaGeral = new MarcaGeralDB();
    try {
      await cadMarcaGeral.update(marca_geral, connection);
      await connection.commit();
      const retorno = {
        id_marca_geral: marca_geral.id_marca_geral.toString(),
      };
      return resp.json(retorno);
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        `Erro ao atualizar marca ${marca_geral.titulo}`,
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
    const marcaGeralDB = new MarcaGeralDB();
    try {
      const retorno = await marcaGeralDB.show(connection);
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
    const marcaGeralDB = new MarcaGeralDB();
    try {
      const retorno = await marcaGeralDB.showAtivo(connection);
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

  // static async ativaDesativa(req: Request, resp: Response): Promise<Response> {
  //   const clienteIp = req.clientIpInfo?.ip ?? '';
  //   const id_marca_geral: iMarcaGeral = req.body;
  //   const idArray = Array.isArray(id_marca_geral)
  //     ? id_marca_geral
  //     : [id_marca_geral];

  //   let connection;
  //   try {
  //     connection = await MySqlConnection.getConnection();
  //   } catch (error) {
  //     const retornar = ErroGeneral.getErrorGeneral(
  //       `Erro ao abrir conexão com o MySQL`,
  //       error,
  //       clienteIp,
  //     );
  //     return resp.status(400).json(retornar);
  //   }

  //   const cadMarcaGeral = new MarcaGeralDB();
  //   try {
  //     const marcasGerais: iMarcaGeral[] = [];
  //     for (const itemIdMarcaGeral of idArray) {
  //       const marcaGeral = await cadMarcaGeral.find(
  //         itemIdMarcaGeral.id_marca_geral,
  //         connection,
  //       );
  //       marcasGerais.push(...marcaGeral);
  //     }
  //     if (typeof marcasGerais === 'undefined' || marcasGerais.length === 0) {
  //       return resp
  //         .status(400)
  //         .json(retornoPadrao(1, 'Marca Geral não encontrada'));
  //     }

  //     const ativarDesativarMarcasGerais = marcasGerais.map((mrcg) => {
  //       if (mrcg.status === 1) {
  //         mrcg.status = 0;
  //       } else {
  //         mrcg.status = 1;
  //       }
  //       mrcg.atualizado_em = new Date();
  //       return mrcg;
  //     });

  //     const ativarDesativar = ativarDesativarMarcasGerais.map((mrcg) =>
  //       cadMarcaGeral.ativaDesativa(mrcg, connection),
  //     );

  //     const retorno = await Promise.all(ativarDesativar);
  //     await connection.commit();
  //     return resp.json(retorno);
  //   } catch (error) {
  //     await connection.rollback();
  //     const resultErro = ErroGeneral.getErrorGeneral(
  //       `Erro ao atualizar marca`,
  //       error,
  //       clienteIp,
  //     );
  //     return resp.status(400).json(resultErro);
  //   } finally {
  //     MySqlConnection.closeConnection(connection);
  //   }
  // }

  static async ativaDesativa(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const marcasGerais: iMarcaGeral[] = req.body;

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

    const cadMarcaGeral = new MarcaGeralDB();
    const cadMarca = new MarcaDB();

    try {
      for (const marcaGeral of marcasGerais) {
        const marcaGeralExistente = await cadMarcaGeral.find(
          marcaGeral.id_marca_geral,
          connection,
        );

        if (!marcaGeralExistente || marcaGeralExistente.length === 0) {
          return resp
            .status(400)
            .json(retornoPadrao(1, `Marca Geral não encontrada`));
        }

        // Ativa/Desativa Marca Geral
        const ativarDesativarMarcaGeral = {
          status: marcaGeralExistente[0].status === 1 ? 0 : 1,
          atualizado_em: new Date(),
          id_marca_geral: marcaGeral.id_marca_geral,
          titulo: marcaGeral.titulo,
        };

        await cadMarcaGeral.ativaDesativa(
          ativarDesativarMarcaGeral,
          connection,
        );
      }

      // Agora desativa as marcas associadas após desativar as marcas gerais
      for (const marcaGeral of marcasGerais) {
        const marcasAssociadas = await cadMarca.findMarcaGeral(
          marcaGeral.id_marca_geral,
          connection,
        );

        const ativarDesativarMarcas = marcasAssociadas.map((marca) => ({
          status: marca.status === 1 ? 0 : 1,
          atualizado_em: new Date(),
          id_marca: marca.id_marca,
          id_segmento: marca.id_segmento,
          titulo: marca.titulo,
          id_pais: marca.id_pais,
          cor_botao: marca.cor_botao,
          cor_texto: marca.cor_texto,
          logo_botao: marca.logo_botao,
          logo_miniatura: marca.logo_miniatura,
          nome_logo_botao: marca.nome_logo_botao,
          nome_logo_miniatura: marca.nome_logo_miniatura,
          lista_categorias: marca.lista_categorias,
          id_marca_geral: marca.id_marca_geral,
        }));
        await cadMarca.ativaDesativa(ativarDesativarMarcas, connection);
      }

      await connection.commit();
      return resp.json(retornoPadrao(0, `Marcas atualizadas com sucesso`));
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
