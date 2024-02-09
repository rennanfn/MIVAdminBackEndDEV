export type ErroType = 0 | 1;

export interface ReturnDefaultInt {
  retorno: {
    erro: ErroType;
    mensagem: string;
  };
}

export abstract class ReturnDefault implements ReturnDefaultInt {
  retorno!: { erro: ErroType; mensagem: string };
}

export interface Token {
  id_usuario: string;
  nome: string;
  email: string;
}
