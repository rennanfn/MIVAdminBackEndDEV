/* eslint-disable camelcase */
import bcrypt from 'bcrypt';
import retornoPadrao from './retornoPadrao';
import { consoleLog, pVerbose } from './consoleLog';

// Classe para criptografar senha do operador utilizando a função hash
export default abstract class Criptografar {
  static criptografarSenha(senha: string): Promise<string> {
    return new Promise((resolve, reject) => {
      consoleLog(`Criptografando senha`, pVerbose.aviso);
      bcrypt
        .hash(senha, 10)
        .then((hash) => {
          consoleLog(`Senha criptografada com sucesso!`, pVerbose.aviso);
          return resolve(hash);
        })
        .catch((erro) => {
          consoleLog(
            `Erro ao criptografar senha ${erro.message}`,
            pVerbose.erro,
          );
          return reject(retornoPadrao(1, `Erro ao criptografar senha`));
        });
    });
  }

  static compararSenhas(senhaOperador: string, senhaBD: string): boolean {
    consoleLog(`Comparando senhas`, pVerbose.aviso);
    if (bcrypt.compareSync(senhaOperador, senhaBD)) {
      consoleLog(`Senhas conferem`, pVerbose.aviso);
      return true;
    }
    consoleLog(`Senhas não conferem`, pVerbose.erro);
    return false;
  }

  static senhasConfirmacao(
    senha_nova: string,
    senha_nova_confirmacao: string,
  ): boolean {
    consoleLog(`Comparando senha nova`, pVerbose.aviso);
    if (senha_nova === senha_nova_confirmacao) {
      consoleLog(`Senhas novas conferem`, pVerbose.aviso);
      return true;
    }
    consoleLog(`Senhas novas não conferem`, pVerbose.erro);
    return false;
  }

  static compararLogin(loginOperador: string, loginBD: string): boolean {
    consoleLog(`Comparando usuários`, pVerbose.aviso);
    if (bcrypt.compareSync(loginOperador, loginBD)) {
      consoleLog(`Usuários conferem`, pVerbose.aviso);
      return true;
    }
    consoleLog(`Usuários não conferem`, pVerbose.erro);
    return false;
  }
}
