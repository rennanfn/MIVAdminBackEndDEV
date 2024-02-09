/* eslint-disable @typescript-eslint/no-explicit-any */
declare namespace Express {
  interface Request {
    customProperties: {
      email: string;
      id_usuario: string;
      token_data?: any;
    };
    clientIpInfo?: {
      ip: string;
      isPublic: boolean;
    };
  }
}
