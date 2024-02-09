/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
/* eslint-disable prettier/prettier */
import * as CryptoJS from 'crypto-js';
import { NextFunction, Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { Token } from '../Interface';
import { ErroGeneral } from './../utils/ErroGeneral';
import { consoleLog, pVerbose } from './consoleLog';
import retornoPadrao from './retornoPadrao';
import { MySqlConnection } from '../database/MySqlConnection';
import { UsuarioDB } from '../database/UsuarioDB';

interface DataToRefresh {
  id_usuario: string;
  email: string;
}

function encryptToken(obj: string): string {
  const payload_key =
    typeof process.env.PAYLOAD_KEY !== 'undefined'
      ? process.env.PAYLOAD_KEY
      : '';

  if (payload_key === '') return '';
  const key = CryptoJS.enc.Utf8.parse(payload_key);
  const iv = CryptoJS.enc.Utf8.parse(payload_key);

  const encrypted = CryptoJS.AES.encrypt(
    CryptoJS.enc.Utf8.parse(obj.toString()),
    key,
    {
      keySize: 128 / 8,
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    },
  );
  return encrypted.toString();
}

function gerarToken(obj: Token): string {
  const secretKey =
    typeof process.env.TOKEN_SECRET_MIV !== 'undefined'
      ? process.env.TOKEN_SECRET_MIV
      : '';

  if (secretKey === '') return '';

  const corpoToken = JSON.stringify(obj);
  const newPayload = encryptToken(corpoToken);

  if (newPayload === '') return '';
  const tokenEncrypto = {
    tokenEnc: newPayload,
  };

  const tokenExpireTime = process.env.TOKEN_EXPIRES_IN_MINUTE ?? '60';
  const jwtOptions: jwt.SignOptions = {
    expiresIn: `${tokenExpireTime}m`,
  };
  const token = jwt.sign(tokenEncrypto, secretKey, jwtOptions);

  return token;
}

function decryptToken(encrypted: string): string {
  const payload_key =
    typeof process.env.PAYLOAD_KEY !== 'undefined'
      ? process.env.PAYLOAD_KEY
      : '';

  if (payload_key === '') return '';

  const key = CryptoJS.enc.Utf8.parse(payload_key);
  const iv = CryptoJS.enc.Utf8.parse(payload_key);

  const decrypted = CryptoJS.AES.decrypt(encrypted.toString(), key, {
    keySize: 128 / 8,
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}

function validLifeTimeToken(iat: number, exp: number): boolean {
  const tokenExpireTime = process.env.TOKEN_EXPIRES_IN_MINUTE ?? '60';
  const tokenExpireInMs = Number(tokenExpireTime) * 60000;

  const timeDiff = Math.abs(+new Date(exp) - +new Date(iat)) * 1000;
  if (Math.trunc(timeDiff) <= tokenExpireInMs) return true;
  return false;
}

function isRefreshable(expiredAt: string): boolean {
  // Pega a diferença entre a hora atual e a hora que o token expirou,
  // divide por 60000 para transformar milisegundos em minuto.
  const timeDiff = Math.abs(+new Date() - +new Date(expiredAt)) / 60000;
  // Se o token expirou a menos de 10 minutos então pode ser atualizado.
  if (Math.trunc(timeDiff) <= 10) {
    return true;
  }
  return false;
}

function getDataToRefresh(token: string): DataToRefresh | null {
  try {
    const secretKey =
      typeof process.env.TOKEN_SECRET_MIV !== 'undefined'
        ? process.env.TOKEN_SECRET_MIV
        : '';

    const payloadTokenEnc = jwt.verify(token, secretKey) as jwt.JwtPayload;
    if (payloadTokenEnc) {
      // Se passar no verify é sinal que o token não esta expirado então não pode fazer refresh,
      // descriptografa o token para pegar o id para o log
      const tokenEncript = jwt.decode(token) as jwt.JwtPayload;
      if (typeof tokenEncript?.tokenEnc === 'undefined') return null;

      const tokenDecript = decryptToken(tokenEncript.tokenEnc);
      if (tokenDecript.length <= 0) return null;

      const { id_usuario }: DataToRefresh = JSON.parse(tokenDecript);
      consoleLog(
        `Tentativa de refresh sem estar expirado - token: ${payloadTokenEnc}`,
        1,
      );
      return null;
    }
  } catch (error) {
    // Verifica se foi erro de expiração e se pode atualizar o token
    if (error instanceof TokenExpiredError) {
      if (
        error?.name === 'TokenExpiredError' &&
        isRefreshable(String(error.expiredAt))
      ) {
        const tokenEncript = jwt.decode(token) as jwt.JwtPayload;
        if (typeof tokenEncript?.tokenEnc === 'undefined') return null;

        const tokenDecript = decryptToken(tokenEncript.tokenEnc);
        if (tokenDecript.length <= 0) return null;

        const { email, id_usuario }: DataToRefresh = JSON.parse(tokenDecript);
        if (typeof email === 'undefined' || typeof id_usuario === 'undefined') {
          consoleLog(`Token sem login ou id, refresh cancelado`, 1);
          return null;
        }
        return { email, id_usuario };
      }
    }
  }
  return null;
}

export const validaToken = async (
  req: Request,
  resp: Response,
  next: NextFunction,
) => {
  const userIp = req.clientIpInfo?.ip ?? '';
  const url = req.url ?? '';

  const token = req.headers.authorization;
  if (typeof token === 'undefined') {
    consoleLog(`Request sem token`, pVerbose.erro);
    return resp
      .status(403)
      .json(
        retornoPadrao(1, 'Sessão expirada. Realize a autenticação novamente.'),
      );
  }
  try {
    const secretKey =
      typeof process.env.TOKEN_SECRET_MIV !== 'undefined'
        ? process.env.TOKEN_SECRET_MIV
        : '';

    const payloadTokenEnc = jwt.verify(token, secretKey) as jwt.JwtPayload;

    const { iat, exp } = payloadTokenEnc;
    if (
      typeof iat === 'undefined' ||
      typeof exp === 'undefined' ||
      iat === null ||
      exp === null ||
      !validLifeTimeToken(iat, exp)
    ) {
      consoleLog(`Claims inválidas`, pVerbose.erro);
      return resp
        .status(403)
        .json(
          retornoPadrao(
            1,
            'Sessão expirada. Realize a autenticação novamente.',
          ),
        );
    }
    const decoded = decryptToken(payloadTokenEnc.tokenEnc);
    if (decoded === '') {
      consoleLog(`Não foi possível descriptografar o token`, pVerbose.erro);
      return resp
        .status(403)
        .json(
          retornoPadrao(1, `Sessão expirada. Realize a autenticação novamente`),
        );
    }
    const tokenDados = JSON.parse(decoded) as Token;
    if (typeof tokenDados.id_usuario === 'undefined') {
      consoleLog(`Token sem o parâmetro id`, pVerbose.erro);
      return resp
        .status(403)
        .json(
          retornoPadrao(1, `Sessão expirada. Realize a autenticação novamente`),
        );
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
      const usuario = await cadUsuario.findLogin(
        tokenDados.email,
        connection,
      );

      if (usuario.length === 0) {
        consoleLog(`Usuário não encontrado!`, pVerbose.erro);
        return resp.status(403).json(retornoPadrao(1, `Sessão Expirada!`));
      }

      req.customProperties = {
        email: tokenDados.email,
        id_usuario: tokenDados.id_usuario,
        token_data: tokenDados,
      };
    } catch (error) {
      consoleLog(`Erro ao buscar usuário`, pVerbose.erro);
      return resp.status(403).json(retornoPadrao(1, `Token Inválido!`));
    } finally {
      MySqlConnection.closeConnection(connection);
    }
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      if (
        error?.name === 'TokenExpiredError' &&
        isRefreshable(String(error.expiredAt))
      ) {
        consoleLog(
          `Token expirado mas pode ser atualizado. Expirou em: ${error?.expiredAt} - url: ${url}`,
          pVerbose.aviso,
        );
        return resp
          .status(401)
          .json(
            retornoPadrao(
              1,
              `Sessão Expirada. Realize novamente a autenticação.`,
            ),
          );
      }
      consoleLog(`Token Expirado - url: ${url}`, pVerbose.erro);
      return resp
        .status(403)
        .json(
          retornoPadrao(1, `Sessão Expirada. Realize a autenticação novamente`),
        );
    }
    consoleLog(`Token Inválido - url: ${url}`, pVerbose.erro);
    return resp
      .status(403)
      .json(
        retornoPadrao(1, `Sessão Expirada! Realize a autenticação novamente`),
      );
  }
};

export {
  decryptToken, encryptToken, gerarToken, getDataToRefresh
};

