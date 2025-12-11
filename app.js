require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const routes = require('./routes/api');
const path = require('path');


const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', routes);
app.use('/uploads', express.static(path.join(__dirname, 'routes/uploads')));


mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('🩸 Mongo conectado ao inferno!'))
  .catch(err => console.error('Erro no Mongo:', err));

const PORT = process.env.PORT || 6666;
app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando no portão ${PORT}`);
});
