/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { iUsuario } from '../entities/UsuarioEntity';
import retornoPadrao from '../utils/retornoPadrao';
import { MySqlConnection } from '../database/MySqlConnection';
import { ErroGeneral } from '../utils/ErroGeneral';
import { UsuarioDB } from '../database/UsuarioDB';
import { consoleLog, pVerbose } from '../utils/consoleLog';
import Criptografar from '../utils/criptografar';
import { gerarToken, getDataToRefresh } from '../utils/token';
import { Connection } from 'mysql2/promise';
import { Token } from '../Interface';
import { LogsDB } from '../database/LogsDB';
import { UsuarioPaisDB } from '../database/UsuarioPaisDB';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

export class LoginController {
  static async autenticar(req: Request, resp: Response): Promise<Response> {
    const clienteIp = req.clientIpInfo?.ip ?? '';
    const { email, senha } = req.body;

    if (typeof email === 'undefined' || typeof senha === 'undefined') {
      return resp
        .status(400)
        .json(retornoPadrao(1, 'Objeto recebido não é do tipo esperado!'));
    }
    let connection;
    try {
      connection = await MySqlConnection.getConnection();
    } catch (error) {
      const retorno = ErroGeneral.getErrorGeneral(
        'Erro ao abrir conexão com o MySQL',
        error,
        clienteIp,
      );
      return resp.status(400).json(retorno);
    }

    const cadUsuario = new UsuarioDB();
    try {
      consoleLog(`Validando usuário e senha!`, pVerbose.aviso);
      const usuarioDB = await cadUsuario.findLogin(email, connection);
      // Se não existir, não permite login!
      if (usuarioDB.length <= 0) {
        return resp
          .status(400)
          .json(retornoPadrao(1, `Login ou senha inválido`));
      }

      // Se o usuário estiver inativo, não permite o login!
      if (usuarioDB[0].status === 0) {
        return resp
          .status(400)
          .json(
            retornoPadrao(
              1,
              `Usuário inativo. Contate o administrador do sistema`,
            ),
          );
      }

      // Faz a comparação da senha existente no banco com a digitada pelo usuário!
      const senhasConferem = await Criptografar.compararSenhas(
        senha,
        usuarioDB[0].senha,
      );

      // Se as senhas não conferem, não permite o login!
      if (!senhasConferem) {
        return resp
          .status(400)
          .json(retornoPadrao(1, `Login ou senha inválido!`));
      }

      /**
       * Identifica a origem da requisição para validar se o usuário tem permissão para acessar a url.
       * Se tiver permissão, encaminha para gerar o token de autenticação.
       */
      const origem = req.headers.origin;
      // Valida se usuário é admin e está acessando admin
      if (
        usuarioDB[0].acesso_admin === 1 &&
        origem === process.env.ORIGIN_ADMIN
      ) {
        const dadosToken = await LoginController.prepararToken(
          usuarioDB[0],
          connection,
        );
        const token = gerarToken(dadosToken);
        if (token === '') {
          return resp.status(400).json(retornoPadrao(1, `Erro ao gerar token`));
        } else {
          const cadLogs = new LogsDB();
          await cadLogs.insert(
            usuarioDB[0].id_usuario,
            usuarioDB[0].id_filial,
            `Login no sistema MIV ADM`,
            connection,
          );
          consoleLog(`Token gerado com sucesso!`, pVerbose.aviso);
          return resp.status(200).json({ token });
        }
      } else if (usuarioDB[0].acesso_admin === 0) {
        consoleLog(
          `ip: ${clienteIp}: Usuário sem permissão de acesso ao MIV ADM`,
          pVerbose.erro,
        );
        return resp
          .status(400)
          .json(retornoPadrao(1, `Usuário sem permissão de acesso ao MIV ADM`));
      }

      // Valida se usuário é comum e está acessando client
      if (usuarioDB[0].acesso_user === 1 && origem === process.env.ORIGIN_USR) {
        const dadosToken = await LoginController.prepararToken(
          usuarioDB[0],
          connection,
        );
        const token = gerarToken(dadosToken);
        if (token === '') {
          return resp.status(400).json(retornoPadrao(1, `Erro ao gerar token`));
        } else {
          const cadLogs = new LogsDB();
          await cadLogs.insert(
            usuarioDB[0].id_usuario,
            usuarioDB[0].id_filial,
            `Login no sistema MIV-USUÁRIO`,
            connection,
          );
          // Verifica quais paises o usuario logado tem permissão para acessar
          const cadUsuarioPais = new UsuarioPaisDB();
          const paisesPermitidos = await cadUsuarioPais.find(
            usuarioDB[0].id_usuario,
            connection,
          );
          consoleLog(`Token gerado com sucesso!`, pVerbose.aviso);
          return resp.status(200).json({ token, paisesPermitidos });
        }
      } else {
        consoleLog(
          `ip: ${clienteIp}: Usuário sem permissão de acesso`,
          pVerbose.erro,
        );
        return resp
          .status(400)
          .json(retornoPadrao(1, `Usuário sem permissão de acesso`));
      }
    } catch (error) {
      const retorno = ErroGeneral.getErrorGeneral(
        'Erro ao autenticar usuário',
        error,
        clienteIp,
      );
      return resp.status(400).json(retorno);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }

  static async prepararToken(
    usuarioDB: iUsuario,
    conn: Connection,
  ): Promise<Token> {
    const cadUsuario = new UsuarioDB();

    if (typeof usuarioDB.email === 'undefined' || usuarioDB.email === null) {
      return {} as Token;
    }
    const usuarioEmail = await cadUsuario.findLogin(usuarioDB.email, conn);

    const dadosToken: Token = {
      id_usuario: usuarioEmail[0].id_usuario,
      nome: usuarioEmail[0].nome,
      email: usuarioEmail[0].email,
    };
    return dadosToken;
  }

  static async refreshtoken(req: Request, resp: Response): Promise<Response> {
    // Verifica se o token recebido é valido
    const token = req.headers.authorization;
    if (typeof token === 'undefined') {
      consoleLog(`Request sem token, cancelado refresh token`, 1);
      return resp
        .status(403)
        .json(
          retornoPadrao(
            1,
            `Sessão Expirada. Realize novamente a autenticação.`,
          ),
        );
    }
    const dataToken = getDataToRefresh(token);
    if (!dataToken) {
      return resp
        .status(403)
        .json(
          retornoPadrao(
            1,
            `Sessão Expirada. Realize novamente a autenticação.`,
          ),
        );
    }

    // Começa a buscar os dados do usuario para criar o novo token
    let connection;
    try {
      connection = await MySqlConnection.getConnection();
    } catch (error) {
      const retorno = ErroGeneral.getErrorGeneral(
        'Erro ao abrir conexão com o MySQL',
        error,
      );
      return resp.status(400).json(retorno);
    }

    try {
      consoleLog(`Validando login - RefreshToken ${dataToken.email}`, 0);
      const cadUsuario = new UsuarioDB();
      const usuarioBD = await cadUsuario.findLogin(dataToken.email, connection);

      if (usuarioBD.length === 0) {
        consoleLog(`Email informado ${dataToken.email} não encontrado `, 1);
        return resp
          .status(400)
          .json(retornoPadrao(1, `Erro ao tentar atualizar token`));
      }

      const dadosToken = await LoginController.prepararToken(
        usuarioBD[0],
        connection,
      );

      const tokenNovo = gerarToken(dadosToken);
      if (tokenNovo === '') {
        return resp.status(400).json(retornoPadrao(1, `Erro ao gerar token`));
      }

      consoleLog(`Token gerado com sucesso.`, 0);
      return resp.status(200).json({ token: tokenNovo });
    } catch (error) {
      const resultErro = ErroGeneral.getErrorGeneral(
        'Erro ao atualizar token',
        error,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }

  static async trocarSenha(req: Request, resp: Response): Promise<Response> {
    const { email, senha_atual, senha_nova, senha_nova_confirmacao } = req.body;
    if (
      typeof email === 'undefined' ||
      typeof senha_atual === 'undefined' ||
      typeof senha_nova === 'undefined' ||
      typeof senha_nova_confirmacao === 'undefined'
    ) {
      return resp
        .status(400)
        .json(retornoPadrao(1, 'Objeto recebido não é do tipo esperado'));
    }

    let connection;
    try {
      connection = await MySqlConnection.getConnection();
    } catch (error) {
      const retorno = ErroGeneral.getErrorGeneral(
        'Erro ao abrir conexão com o MySQL',
        error,
      );
      return resp.status(400).json(retorno);
    }

    try {
      const cadUsuario = new UsuarioDB();
      const usuario = await cadUsuario.findLogin(email, connection);

      if (usuario.length === 0) {
        return resp
          .status(400)
          .json(retornoPadrao(1, `Usuário não encontrado!`));
      }
      if (
        typeof usuario[0].email === 'undefined' ||
        typeof usuario[0].senha === 'undefined'
      ) {
        consoleLog('Usuário não encontrado!', pVerbose.aviso);
        return resp
          .status(400)
          .json(retornoPadrao(1, 'Usuário não encontrado!'));
      }

      if (senha_atual === senha_nova) {
        return resp
          .status(400)
          .json(
            retornoPadrao(1, `A nova senha não pode ser igual à senha atual!`),
          );
      }
      const senhasConferem = await Criptografar.compararSenhas(
        senha_atual,
        usuario[0].senha,
      );

      if (!senhasConferem) {
        return resp.status(400).json(retornoPadrao(1, `Senha atual inválida.`));
      }

      const senhaConfirmacao = await Criptografar.senhasConfirmacao(
        senha_nova,
        senha_nova_confirmacao,
      );

      if (!senhaConfirmacao) {
        return resp
          .status(400)
          .json(retornoPadrao(1, `Senha nova não confere`));
      }

      const senhaNova = await Criptografar.criptografarSenha(senha_nova);
      usuario[0].senha = senhaNova;

      await cadUsuario.trocarSenha(email, senhaNova, connection);
      await connection.commit();

      return resp.json(retornoPadrao(0, `Senha redefinida com sucesso`));
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        'Erro ao alterar senha',
        error,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }

  static async alterarSenha(req: Request, resp: Response): Promise<Response> {
    const { senhaTemp } = req.params;
    const { senha_nova, senha_nova_confirmacao } = req.body;

    if (
      typeof senhaTemp === 'undefined' ||
      senha_nova === 'undefined' ||
      senha_nova_confirmacao === 'undefined'
    ) {
      return resp
        .status(400)
        .json(retornoPadrao(1, 'Objeto recebido não é do tipo esperado'));
    }

    let connection;
    try {
      connection = await MySqlConnection.getConnection();
    } catch (error) {
      const retorno = ErroGeneral.getErrorGeneral(
        'Erro ao abrir conexão com o MySQL',
        error,
      );
      return resp.status(400).json(retorno);
    }

    try {
      const cadUsuario = new UsuarioDB();
      const usuario = await cadUsuario.findBySenhaTemp(senhaTemp, connection);

      if (usuario.length === 0) {
        return resp
          .status(400)
          .json(retornoPadrao(1, `Usuário não encontrado!`));
      }

      const senhaConfirmacao = await Criptografar.senhasConfirmacao(
        senha_nova,
        senha_nova_confirmacao,
      );

      if (!senhaConfirmacao) {
        return resp
          .status(400)
          .json(retornoPadrao(1, `Senha nova não confere`));
      }

      const senhaNova = await Criptografar.criptografarSenha(senha_nova);
      usuario[0].senha = senhaNova;

      await cadUsuario.trocarSenha(usuario[0].email, senhaNova, connection);
      await connection.commit();

      return resp.json(retornoPadrao(0, `Senha redefinida com sucesso`));
    } catch (error) {
      await connection.rollback();
      const resultErro = ErroGeneral.getErrorGeneral(
        'Erro ao alterar senha',
        error,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }

  static async esqueciMinhaSenha(
    req: Request,
    resp: Response,
  ): Promise<Response> {
    const { email } = req.body;

    if (typeof email === 'undefined') {
      return resp
        .status(400)
        .json(retornoPadrao(1, `Objeto recebido não é do tipo esperado`));
    }

    let connection;
    try {
      connection = await MySqlConnection.getConnection();
    } catch (error) {
      const retorno = ErroGeneral.getErrorGeneral(
        'Erro ao abrir conexão com o MySQL',
        error,
      );
      return resp.status(400).json(retorno);
    }
    try {
      const cadUsuario = new UsuarioDB();
      const usuario = await cadUsuario.findLogin(email, connection);

      if (usuario.length === 0) {
        return resp
          .status(400)
          .json(retornoPadrao(1, `Usuário não encontrado ou está inativo`));
      }

      const cadLogs = new LogsDB();
      await cadLogs.insert(
        usuario[0].id_usuario,
        usuario[0].id_filial,
        `Solicitação de nova senha`,
        connection,
      );

      // Gere uma senha aleatória
      const novaSenha = crypto.randomBytes(10).toString('hex');

      // Adicione o tempo de expiração (por exemplo, 1 hora)
      const expiracao = new Date();
      expiracao.setHours(expiracao.getHours() + 1);

      await enviarNovaSenhaPorEmail(email, novaSenha);

      await cadUsuario.senhaTemp(email, novaSenha, connection);
      await connection.commit();
      return resp
        .status(200)
        .json(retornoPadrao(0, `Nova senha enviada com sucesso`));
    } catch (error) {
      await connection.roolback();
      const resultErro = ErroGeneral.getErrorGeneral(
        'Erro ao processar solicitação de nova senha',
        error,
      );
      return resp.status(400).json(resultErro);
    } finally {
      MySqlConnection.closeConnection(connection);
    }
  }
}

async function enviarNovaSenhaPorEmail(
  email: string,
  novaSenha: string,
): Promise<void> {
  // const smtpConfig = {
  //   host: `${process.env.HOST}`,
  //   port: 587,
  //   secure: false,
  //   auth: {
  //     user: `${process.env.USER}`,
  //     pass: `${process.env.PASS}`,
  //   },
  // };

  const transporte = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'rennanfn@gmail.com',
      pass: 'worg hdux etkw tqox',
    },
  });

  const mailOptions = {
    from: `rennanfn@gmail.com`,
    to: email,
    subject: 'Recuperação de Senha MIV',
    text: `
           Olá! Você solicitou uma nova senha para acesso ao sistema MIV

           Para redefinir sua senha, clique no link abaixo:

           https://miv-beta.casadiconti.com/alterar-senha/${novaSenha}

           Em seguida, redefina sua senha de uso pessoal com no mínimo 8 caracteres, contendo letras e números.

           Você não solicitou nova senha? Entre em contato com o administrador do sistema para fazer o bloqueio do seu usuário!`,
  };

  transporte
    .sendMail(mailOptions)
    .then(() => consoleLog('E-mail enviado com sucesso!', pVerbose.aviso))
    .catch((error) => console.error('Erro ao enviar e-mail: ', error));
}
