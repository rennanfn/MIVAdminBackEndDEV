export enum pVerbose {
  'erro' = 0,
  'aviso' = 1,
}

/**
 * Função para registrar no console erros e infos da aplicação, o controle da quantidade de informações exibidas é feita pela variável de ambiente 'VERBOSE_MIV'.
 * @param msg Mensagem que será exibida no console
 * @param verbose Nível de verbosidade, 'erro'(0) só irá gravar no log os erros, 'aviso'(1) vai gravar no log tanto os erros quanto os avisos
 */
export function consoleLog(msg: string | unknown, verbose: pVerbose): void {
  const verboseEnv = Number(process.env.VERBOSE_MIV);

  if (verboseEnv === pVerbose.aviso) {
    switch (verbose) {
      case pVerbose.aviso:
        console.info(msg);
        break;
      case pVerbose.erro:
        console.error(msg);
        break;
      default:
        console.log(msg);
        break;
    }
  }
  if (verboseEnv === pVerbose.erro && verbose === pVerbose.erro) {
    switch (verbose) {
      case pVerbose.erro:
        console.error(msg);
        break;
      default:
        console.log(msg);
        break;
    }
  }
}
