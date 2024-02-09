import { ZodError, ZodIssue } from 'zod';
import { ErroType, iReturnDefault } from './ReturnDefault';
import { consoleLog, pVerbose } from './consoleLog';
import { campoObrigatorio } from '../entities/UsuarioEntity';

export class ErroGeneral extends iReturnDefault {
  retorno: { erro: ErroType; mensagem: string };

  constructor(retorno: iReturnDefault) {
    super();
    this.retorno = retorno.retorno;
  }

  static getErrorGeneral(
    msg: string,
    erro?: unknown,
    clienteIp?: string,
  ): iReturnDefault {
    // Se o tipo do erro for de validação do Zod
    if (erro instanceof ZodError) {
      return this.getErrorZod(msg, erro.issues);
    }
    if (erro instanceof iReturnDefault) {
      // Se o erro for uma instância do returnDefault então a mensagem já foi tratada.
      consoleLog(`ip: ${clienteIp} - ${erro.retorno.mensagem}`, pVerbose.erro);
      return erro;
    }

    if (
      erro instanceof Error ||
      erro instanceof TypeError ||
      erro instanceof RangeError ||
      erro instanceof EvalError ||
      erro instanceof ReferenceError ||
      erro instanceof SyntaxError ||
      erro instanceof URIError
    ) {
      if (erro.name === 'TypeError') {
        consoleLog(
          `ip: ${clienteIp} - ${msg} - Verifique a conexão com o MySQL. Erro: ${erro.message}`,
          pVerbose.erro,
        );
        return { retorno: { erro: 1, mensagem: msg } };
      }

      if (erro.message.startsWith('ORA')) {
        consoleLog(
          `ip: ${clienteIp} - ${msg} - Verifique o tipo de dados do objeto. Erro: ${erro.message}`,
          pVerbose.erro,
        );
        return { retorno: { erro: 1, mensagem: msg } };
      }

      consoleLog(`ip: ${clienteIp} - ${msg} - ${erro} `, pVerbose.erro);
      return { retorno: { erro: 1, mensagem: msg } };
    }

    // Se o tipo do erro não foi identificado
    consoleLog(
      `ip: ${clienteIp} - ${msg} - Tipo do erro não identificado`,
      pVerbose.erro,
    );
    return { retorno: { erro: 1, mensagem: msg } };
  }

  private static getErrorZod(
    mensagem: string,
    issues: ZodIssue[],
    clienteIp?: string,
  ): iReturnDefault {
    for (const erro of issues) {
      if (erro.message === campoObrigatorio) {
        consoleLog(
          `ip: ${clienteIp} - O campo ${erro.path.join('.')} é ${erro.message}`,
          pVerbose.erro,
        );
      } else if (erro.code === 'invalid_type') {
        consoleLog(
          `ip: ${clienteIp} - O campo ${erro.path.join('.')} deve ser ${
            erro.expected
          }`,
          pVerbose.erro,
        );
      } else {
        consoleLog(`ip: ${clienteIp} - ${erro.message}`, pVerbose.erro);
      }
    }
    return { retorno: { erro: 1, mensagem } };
  }
}
