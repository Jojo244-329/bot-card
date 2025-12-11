const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function enviarEmail(dados) {
  const path = require('path');
  const fs = require('fs');

  const templatePath = path.join(__dirname, '..', 'template', 'hotmart-email.html');
  let html = fs.readFileSync(templatePath, 'utf-8');


  console.log("📂 Tentando carregar o template...");
  console.log("📁 Caminho absoluto:", path.join(__dirname, '..', 'templates', 'hotmart-email.html'));

  html = html
    .replace(/{{nome}}/g, dados.nome)
    .replace(/{{email}}/g, dados.email)
    .replace(/{{transacao}}/g, dados.transacao)
    .replace(/{{data}}/g, dados.data)
    .replace(/{{linkAcesso}}/g, dados.linkAcesso)
    .replace(/{{produto}}/g, dados.produto)
    .replace(/{{imagem}}/g, dados.imagem)
    .replace(/{{valor}}/g, dados.valor);

  const msg = {
    to: dados.email,
    from: process.env.EMAIL_REMETENTE,
    subject: '🧾 Confirmação de acesso',
    html
  };

  await sgMail.send(msg);
  console.log(`✅ Email enviado para ${dados.nome} <${dados.email}>`);
}

module.exports = { enviarEmail };
