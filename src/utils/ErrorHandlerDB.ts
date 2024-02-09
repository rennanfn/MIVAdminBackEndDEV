import { iReturnDefault } from './ReturnDefault';

export class ErrorHandlerDB {
  private _retorno: iReturnDefault;

  constructor(mensagem: string) {
    this._retorno = { retorno: { erro: 1, mensagem } };
  }

  getRetorno(): iReturnDefault {
    return this._retorno;
  }

  // Código implementado para atender os erros qua ainda possuem a propriedade error.message
  get message(): string {
    return this._retorno.retorno.mensagem;
  }
}
