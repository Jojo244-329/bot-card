// 📦 /services/hotmartBot.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
puppeteer.use(StealthPlugin());

async function typeSlow(page, selector, text, delay = 100) {
  for (const char of text) {
    await page.type(selector, char);
    await new Promise(r => setTimeout(r, delay));
  }
}

module.exports = async function executarCompra(dados) {
  const browser = await puppeteer.launch({
  headless: false,
  executablePath: '/root/.cache/puppeteer/chrome/linux-143.0.7499.40/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});


  const page = await browser.newPage();

  // 🧭 Lista de links do funil (ordem importa)
  const funilLinks = [
    'https://pay.hotmart.com/C102834094U?off=4rh575gy',
    'https://pay.hotmart.com/V102834147J?off=f533rin3',
    'https://pay.hotmart.com/L102834195R?off=2n9qexis',
    'https://pay.hotmart.com/S102834023Y?off=m9jlalbo'
    
    
  ];

  try {

    await page.evaluateOnNewDocument(() => {
        window._tokenConfirmation = false;
        window.addEventListener('message', (event) => {
          if (event.origin.includes('pci-pay.hotmart.com')) {
            if (event.data?.action === 'on_generate_tokens_intent_success') {
              window._tokenConfirmation = true;
            }
          }
        });
      });

    for (const link of funilLinks) {
      console.log(`🛸 Acessando página do funil: ${link}`);

      
      await page.goto(link, { waitUntil: 'networkidle2' });

      await page.waitForSelector('#EMAIL', { timeout: 15000 });

      // Email
      console.log("📧 Preenchendo email...");
      await page.focus('#EMAIL');
      await page.evaluate(() => { document.querySelector('#EMAIL').value = ''; });
      await typeSlow(page, '#EMAIL', dados.email, 100);

      // Confirmação de Email
      console.log("📧 Confirmando email...");
      await page.focus('#EMAIL_CONFIRMATION');
      await page.evaluate(() => { document.querySelector('#EMAIL_CONFIRMATION').value = ''; });
      await typeSlow(page, '#EMAIL_CONFIRMATION', dados.emailConfirm, 100);


      // Nome completo
      console.log("👤 Preenchendo nome...");

    // Sanitiza o nome
    dados.nome = dados.nome
    .replace(/[^a-zA-ZÀ-ú\s]/g, '')
    .trim();

    await page.waitForSelector('#NAME', { visible: true, timeout: 10000 });
    await page.focus('#NAME');
    await page.evaluate(() => { document.querySelector('#NAME').value = ''; });
    await typeSlow(page, '#NAME', dados.nome, 100);
    await page.click('#EMAIL'); // força validação saindo do campo
    await delay(1000);

 

      // Força validação com blur
      console.log("🧠 Forçando validação com clique fora...");
      await page.click('#NAME');
      await delay(2000);

      // Aguardando o iframe carregar
      console.log("🧿 Aguardando iframe do cartão...");
      await page.waitForSelector('#credit-card-form-embed iframe', { visible: true, timeout: 15000 });
      const iframeElement = await page.$('#credit-card-form-embed iframe');
      const iframe = await iframeElement.contentFrame();

      if (!iframe) throw new Error("❌ Não foi possível acessar o iframe do cartão.");

      // 🧼 LIMPEZA PROFUNDA DOS CAMPOS
      await iframe.evaluate(() => {
      document.querySelector('#CARD_NUMBER').value = '';
      document.querySelector('#CARD_EXPIRY_MONTH_YEAR').value = '';
      document.querySelector('#CARD_CVV').value = '';
      document.querySelector('#CARD_HOLDER').value = '';
      });


      // Campos do cartão
      console.log("🔢 Preenchendo número do cartão...");
      await iframe.waitForSelector('#CARD_NUMBER', { visible: true, timeout: 10000 });
      await iframe.type('#CARD_NUMBER', dados.numero);

      console.log("📆 Preenchendo validade...");
      await iframe.type('#CARD_EXPIRY_MONTH_YEAR', formatarValidade(dados.validade));

      console.log("🔐 Preenchendo CVV...");
      await iframe.type('#CARD_CVV', dados.cvv);

      console.log("👤 Nome no cartão...");
      await iframe.type('#CARD_HOLDER', dados.nomeCartao);


      // Botão de Compra
      console.log("🚨 Enviando pagamento...");
      await page.click('#payment-button');

      // Token
      console.log("🧭 Aguardando token de pagamento do iframe...");
      await page.waitForFunction(() => window._tokenConfirmation === true, {
        timeout: 30000
      });
      console.log("✅ Token de cartão confirmado pelo iframe.");

      console.log("⏳ Aguardando 2 minutos antes de seguir para o próximo produto...");
        await delay(30000); // 2 minutos (120.000ms)

        console.log("➡️ Indo para o próximo link do funil...");


      console.log("⏳ Aguardando carregamento final da Hotmart...");
      await delay(10000);
    }
  } finally {
    await browser.close(); 
  }
};

function formatarValidade(val) {
  const mes = val.substring(0, 2);
  const ano = val.substring(2, 4);
  return `${mes}/${ano}`;
}
