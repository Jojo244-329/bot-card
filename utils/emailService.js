const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Carrega e faz replace dos dados no template
function gerarEmailHTML(dados) {
  const templatePath = path.join(__dirname, '../templates/hotmart-email.html');
  let html = fs.readFileSync(templatePath, 'utf-8');

  // Substitui os placeholders
  html = html
    .replace(/{{nome}}/g, dados.nome)
    .replace(/{{email}}/g, dados.email)
    .replace(/{{transacao}}/g, dados.transacao)
    .replace(/{{data}}/g, dados.data)
    .replace(/{{linkAcesso}}/g, dados.linkAcesso)
    .replace(/{{produto}}/g, dados.produto)
    .replace(/{{imagem}}/g, dados.imagem) 
    .replace(/{{valor}}/g, dados.valor);

  return html;
}

// Transporter do Nodemailer (use variáveis do .env)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Função para enviar e-mail
async function enviarEmail(dados) {
  const html = gerarEmailHTML(dados);

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: dados.email,
    subject: '🎉 Acesso liberado ao seu produto!',
    html
  };

  return await transporter.sendMail(mailOptions);
}

module.exports = { enviarEmail };
