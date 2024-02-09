export default {
  host: process.env.DB_DEV_HOST_MIV, // Endereço do servidor do MySQL
  user: process.env.DB_DEV_USER_NAME_MIV, // Nome de usuário do MySQL
  password: process.env.DB_DEV_USER_PASSWORD_MIV, // Senha do MySQL
  database: process.env.DB_DEV_CONNECT_DESCRIPTOR_MIV, // Nome do banco de dados MySQL
  waitForConnections: true, // Aguardar por conexões quando o pool estiver esgotado
  connectionLimit: 120, // Limite máximo de conexões no pool
};
