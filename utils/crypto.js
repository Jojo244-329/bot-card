const CryptoJS = require("crypto-js");
const key = process.env.CRYPTO_KEY;

function criptografar(texto) {
  return CryptoJS.AES.encrypt(texto, key).toString();
}

function descriptografar(criptado) {
  const bytes = CryptoJS.AES.decrypt(criptado, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

module.exports = { criptografar, descriptografar };
