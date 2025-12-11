require('dotenv').config();
const { enviarEmail } = require('./emailService');

enviarEmail({
  nome: 'Cliente Teste',
  email: 'seu@email.com',
  transacao: 'TESTE123',
  data: '11/12/2025',
  valor: '$99.00',
  produto: 'Produto Teste',
  linkAcesso: 'https://example.com',
  imagem: 'https://via.placeholder.com/300x200'
});
