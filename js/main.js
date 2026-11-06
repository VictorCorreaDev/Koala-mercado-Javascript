/* ==========================================================
   Mercado Koala — interatividade (JavaScript puro, sem bibliotecas)
   Cada recurso é uma função independente, iniciada no final do arquivo.
   O HTML das páginas não precisa de alterações além da tag <script>.
   ========================================================== */
(() => {
  'use strict';

  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
  const pagina = location.pathname.split('/').pop() || 'index.html';

  const reduzirMovimento = () =>
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const comportamento = () => (reduzirMovimento() ? 'auto' : 'smooth');

  /* localStorage pode falhar (modo privado, arquivo local): sempre com try/catch */
  const guardar = (chave, valor) => {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* ignora */ }
  };
  const ler = (chave, padrao) => {
    try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; } catch (e) { return padrao; }
  };

  /* ---------- 1. Menu "hambúrguer" no celular ---------- */
  function menuMobile() {
    const nav = $('body > nav');
    const lista = nav && $('ul', nav);
    if (!lista) return;

    lista.id = lista.id || 'menu-lista';
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'menu-toggle';
    botao.setAttribute('aria-controls', lista.id);
    botao.setAttribute('aria-expanded', 'false');
    botao.textContent = '☰ Menu';
    nav.prepend(botao);
    nav.classList.add('js-menu');

    botao.addEventListener('click', () => {
      const aberto = nav.classList.toggle('aberto');
      botao.setAttribute('aria-expanded', String(aberto));
      botao.textContent = aberto ? '✕ Fechar' : '☰ Menu';
    });
    nav.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('aberto')) {
        nav.classList.remove('aberto');
        botao.setAttribute('aria-expanded', 'false');
        botao.textContent = '☰ Menu';
        botao.focus();
      }
    });
  }

  /* ---------- 2. Selo "Aberto agora / Fechado" ---------- */
  const HORARIOS = { // dia da semana (0 = domingo) -> [abre, fecha]
    0: [8, 14], 1: [7, 21], 2: [7, 21], 3: [7, 21], 4: [7, 21], 5: [7, 21], 6: [7, 20],
  };
  const NOMES_DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

  function statusLoja(agora = new Date()) {
    const hora = agora.getHours() + agora.getMinutes() / 60;
    const [abre, fecha] = HORARIOS[agora.getDay()];
    if (hora >= abre && hora < fecha) {
      return { aberto: true, texto: `Aberto agora · fecha às ${fecha}h` };
    }
    if (hora < abre) {
      return { aberto: false, texto: `Fechado · abre hoje às ${abre}h` };
    }
    const amanha = (agora.getDay() + 1) % 7;
    return { aberto: false, texto: `Fechado · abre ${NOMES_DIAS[amanha]} às ${HORARIOS[amanha][0]}h` };
  }

  function seloAbertoFechado() {
    const cabecalho = $('body > header');
    if (!cabecalho) return;
    const selo = document.createElement('p');
    selo.className = 'status-loja';
    selo.setAttribute('role', 'status');
    cabecalho.append(selo);

    const atualizar = () => {
      const s = statusLoja();
      if (selo.textContent !== s.texto) selo.textContent = s.texto;
      selo.classList.toggle('aberto', s.aberto);
      selo.classList.toggle('fechado', !s.aberto);
    };
    atualizar();
    setInterval(atualizar, 60000);
  }

  /* ---------- 3. Botão "voltar ao topo" ---------- */
  function voltarAoTopo() {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'voltar-topo';
    botao.setAttribute('aria-label', 'Voltar ao topo da página');
    botao.textContent = '↑';
    document.body.append(botao);

    botao.hidden = true; // fora da ordem do Tab enquanto não aparece
    window.addEventListener('scroll', () => {
      const ver = window.scrollY > 400;
      botao.hidden = !ver;
      botao.classList.toggle('visivel', ver);
    }, { passive: true });
    botao.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: comportamento() });
      const principal = $('main');
      if (principal) principal.focus({ preventScroll: true });
    });
  }

  /* ---------- 4. Animação de entrada ao rolar a página ---------- */
  function revelarAoRolar() {
    const alvos = $$('main section');
    if (typeof window.IntersectionObserver !== 'function') return;
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('revelado');
          observador.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    alvos.forEach((el) => {
      el.classList.add('revelar');
      observador.observe(el);
    });
  }

  /* ---------- 5. Máscaras de telefone e CNPJ ---------- */
  const soDigitos = (v) => v.replace(/\D/g, '');

  const mascaraTelefone = (v) => {
    const d = soDigitos(v).slice(0, 11);
    if (d.length <= 2) return d ? `(${d}` : '';
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const mascaraCnpj = (v) => {
    const d = soDigitos(v).slice(0, 14);
    return d
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  function mascaras() {
    $$('input[type="tel"]').forEach((campo) => {
      campo.addEventListener('input', () => { campo.value = mascaraTelefone(campo.value); });
    });
    const cnpj = $('#cnpj');
    if (cnpj) cnpj.addEventListener('input', () => { cnpj.value = mascaraCnpj(cnpj.value); });
  }

  /* ---------- 6. CNPJ só habilitado para pessoa jurídica (orçamento) ---------- */
  function cnpjCondicional() {
    const tipo = $('#tipo-cliente');
    const cnpj = $('#cnpj');
    if (!tipo || !cnpj) return;
    const atualizar = () => {
      const juridica = tipo.value === 'pessoa-juridica';
      cnpj.disabled = !juridica;
      cnpj.required = juridica;
      if (!juridica) cnpj.value = '';
    };
    tipo.addEventListener('change', atualizar);
    atualizar();
  }

  /* ---------- 7. Contador de caracteres nos campos de texto longo ---------- */
  function contadores() {
    $$('textarea[maxlength]').forEach((campo) => {
      const max = Number(campo.getAttribute('maxlength'));
      const contador = document.createElement('small');
      contador.className = 'contador';
      contador.id = `contador-${campo.id || Math.random().toString(36).slice(2, 7)}`;
      campo.setAttribute('aria-describedby', [campo.getAttribute('aria-describedby'), contador.id].filter(Boolean).join(' '));
      campo.insertAdjacentElement('afterend', contador);
      const atualizar = () => {
        const restantes = max - campo.value.length;
        contador.textContent = `${campo.value.length}/${max} caracteres`;
        contador.classList.toggle('limite', restantes <= max * 0.1);
      };
      campo.addEventListener('input', atualizar);
      atualizar();
    });
  }

  /* ---------- 8. Envio dos formulários com validação e mensagem de sucesso ---------- */
  function formularios() {
    $$('form').forEach((form) => {
      form.noValidate = true; // as mensagens são mostradas pelo script, em português

      const aviso = document.createElement('div');
      aviso.className = 'aviso-form';
      aviso.setAttribute('role', 'alert');
      aviso.tabIndex = -1;
      aviso.hidden = true;
      form.prepend(aviso);

      const nota = document.createElement('p');
      nota.innerHTML = 'Campos marcados com <span aria-hidden="true" class="obrigatorio">*</span><span class="so-leitor">asterisco</span> são obrigatórios.';
      form.prepend(nota);

      const rotuloDe = (campo) => {
        const r = campo.id && form.querySelector(`label[for="${campo.id}"]`);
        if (r) return r.textContent.replace(/\*|\(obrigatório\)/g, '').replace(/\s+/g, ' ').trim();
        const grupo = campo.closest('fieldset');
        return (grupo && grupo.querySelector('legend') ? grupo.querySelector('legend').textContent : campo.name).trim();
      };

      const limparErro = (campo) => {
        campo.classList.remove('invalido');
        campo.removeAttribute('aria-invalid');
        const msg = campo.id && document.getElementById(`erro-${campo.id}`);
        if (msg) {
          const ids = (campo.getAttribute('aria-describedby') || '').split(' ').filter((i) => i && i !== msg.id);
          if (ids.length) campo.setAttribute('aria-describedby', ids.join(' ')); else campo.removeAttribute('aria-describedby');
          msg.remove();
        }
      };

      const mostrar = (tipo, conteudo) => {
        aviso.className = `aviso-form ${tipo}`;
        aviso.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
        aviso.replaceChildren(conteudo);
        aviso.hidden = false;
        aviso.scrollIntoView({ behavior: comportamento(), block: 'center' });
      };

      form.addEventListener('input', (e) => { if (e.target.matches('input, select, textarea')) limparErro(e.target); });

      form.addEventListener('submit', (e) => {
        e.preventDefault(); // não há servidor: o envio é simulado
        $$('input, select, textarea', form).forEach(limparErro);
        const invalidos = $$('input, select, textarea', form).filter((c) => !c.checkValidity());

        if (invalidos.length) {
          const resumo = document.createElement('div');
          const titulo = document.createElement('p');
          titulo.textContent = `Encontramos ${invalidos.length} campo(s) para corrigir:`;
          const ul = document.createElement('ul');
          invalidos.forEach((c) => {
            c.classList.add('invalido');
            c.setAttribute('aria-invalid', 'true');
            if (c.id) {
              const msg = document.createElement('small');
              msg.id = `erro-${c.id}`;
              msg.className = 'erro-campo';
              msg.textContent = c.validationMessage;
              c.setAttribute('aria-describedby', [c.getAttribute('aria-describedby'), msg.id].filter(Boolean).join(' '));
              (c.type === 'radio' || c.type === 'checkbox' ? c.parentElement : c).insertAdjacentElement('afterend', msg);
            }
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${c.id}`;
            a.textContent = `${rotuloDe(c)}: ${c.validationMessage}`;
            a.addEventListener('click', (ev) => { ev.preventDefault(); c.focus(); });
            li.append(a);
            ul.append(li);
          });
          resumo.append(titulo, ul);
          mostrar('erro', resumo);
          invalidos[0].focus();
          return;
        }

        const nome = $('input[name^="nome"]', form);
        const primeiroNome = nome ? nome.value.trim().split(' ')[0] : '';
        const ok = document.createElement('p');
        ok.textContent = `Obrigado${primeiroNome ? ', ' + primeiroNome : ''}! Recebemos sua mensagem e responderemos em até 2 dias úteis.`;
        mostrar('sucesso', ok);
        if (form.querySelector('#produtos-desejados')) guardar('koala-lista', []);
        form.reset();
        $$('.contador', form).forEach((c) => c.previousElementSibling.dispatchEvent(new Event('input')));
        const tipo = $('#tipo-cliente', form);
        if (tipo) tipo.dispatchEvent(new Event('change'));
      });
    });
  }

  /* ---------- 9. Busca ao vivo (produtos e FAQ) ---------- */
  function criarBusca(rotulo, placeholder) {
    const caixa = document.createElement('section');
    caixa.className = 'caixa-busca';
    caixa.innerHTML = `
      <label for="busca-pagina">${rotulo}</label>
      <input type="search" id="busca-pagina" placeholder="${placeholder}" autocomplete="off" />
      <p class="resultado-busca" role="status" aria-live="polite"></p>`;
    const primeira = $('main section');
    primeira.insertAdjacentElement('afterend', caixa);
    return { entrada: $('input', caixa), resultado: $('.resultado-busca', caixa) };
  }

  function buscaAoVivo() {
    const ehProdutos = pagina === 'produtos.html';
    const ehFaq = pagina === 'faq.html';
    if (!ehProdutos && !ehFaq) return;

    const { entrada, resultado } = criarBusca(
      ehProdutos ? 'Buscar produto ou departamento' : 'Buscar uma pergunta',
      ehProdutos ? 'Ex.: picanha, pão, arroz…' : 'Ex.: estacionamento, pix, horário…'
    );
    const secoes = $$('main section').filter((s) => s.querySelector('article'));
    const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

    entrada.addEventListener('input', () => {
      const termo = normalizar(entrada.value.trim());
      let total = 0;
      secoes.forEach((secao) => {
        let visiveisNaSecao = 0;
        $$('article', secao).forEach((art) => {
          const bate = !termo || normalizar(art.textContent + ' ' + secao.querySelector('h2').textContent).includes(termo);
          art.hidden = !bate;
          if (bate) visiveisNaSecao++;
        });
        secao.hidden = visiveisNaSecao === 0;
        total += visiveisNaSecao;
      });
      resultado.textContent = termo
        ? (total ? `${total} resultado(s) para "${entrada.value.trim()}".` : `Nenhum resultado para "${entrada.value.trim()}".`)
        : '';
    });
  }

  /* ---------- 10. FAQ sanfona (clique na pergunta abre/fecha a resposta) ---------- */
  function faqSanfona() {
    if (pagina !== 'faq.html') return;
    $$('main article').forEach((art, i) => {
      const pergunta = $('h3', art);
      const resposta = [...art.children].filter((el) => el !== pergunta);
      if (!pergunta || !resposta.length) return;

      pergunta.classList.add('faq-pergunta');
      const botaoPergunta = document.createElement('button');
      botaoPergunta.type = 'button';
      botaoPergunta.className = 'faq-botao';
      botaoPergunta.append(...pergunta.childNodes);
      pergunta.append(botaoPergunta);
      const idResp = `faq-resp-${i}`;
      const corpo = document.createElement('div');
      corpo.id = idResp;
      corpo.className = 'faq-resposta';
      resposta.forEach((el) => corpo.append(el));
      art.append(corpo);

      const definir = (aberto) => {
        corpo.hidden = !aberto;
        botaoPergunta.setAttribute('aria-expanded', String(aberto));
        art.classList.toggle('faq-aberto', aberto);
      };
      definir(false);
      botaoPergunta.setAttribute('aria-controls', idResp);
      botaoPergunta.addEventListener('click', () => definir(corpo.hidden));
    });

    /* Ao buscar, abre automaticamente as respostas que combinam */
    const busca = $('#busca-pagina');
    if (busca) {
      busca.addEventListener('input', () => {
        const abrir = busca.value.trim() !== '';
        $$('main article').forEach((art) => {
          const p = $('.faq-botao', art);
          const c = $('.faq-resposta', art);
          if (p && c && !art.hidden) { c.hidden = !abrir; p.setAttribute('aria-expanded', String(abrir)); art.classList.toggle('faq-aberto', abrir); }
        });
      });
    }
  }

  /* ---------- 11. "Minha lista" de compras (produtos -> orçamento) ---------- */
  const lista = {
    itens: ler('koala-lista', []),
    salvar() { guardar('koala-lista', this.itens); },
  };

  function minhaLista() {
    const ehProdutos = pagina === 'produtos.html';
    const ehOrcamento = pagina === 'orcamento.html';
    if (!ehProdutos && !ehOrcamento) return;

    const painel = document.createElement('aside');
    painel.className = 'minha-lista';
    painel.setAttribute('aria-label', 'Minha lista de compras');
    painel.innerHTML = `
      <button type="button" class="lista-abrir" aria-expanded="false">🛒 Minha lista (<span class="lista-qtd">0</span>)</button>
      <div class="lista-corpo" hidden>
        <h2>Minha lista</h2>
        <ul class="lista-itens"></ul>
        <p class="so-leitor lista-anuncio" role="status"></p>
        <p class="lista-vazia">Sua lista está vazia. ${ehProdutos ? 'Clique em “＋” nos produtos.' : ''}</p>
        <div class="lista-acoes">
          ${ehProdutos ? '<a class="lista-orcar" href="../orcamento.html">Pedir orçamento</a>' : '<button type="button" class="lista-usar">Usar no orçamento</button>'}
          <button type="button" class="lista-limpar">Limpar</button>
        </div>
      </div>`;
    document.body.append(painel);

    const abrir = $('.lista-abrir', painel);
    const corpo = $('.lista-corpo', painel);
    const ul = $('.lista-itens', painel);
    const vazia = $('.lista-vazia', painel);
    const qtd = $('.lista-qtd', painel);
    const anuncio = $('.lista-anuncio', painel);
    const falar = (t) => { anuncio.textContent = ''; setTimeout(() => { anuncio.textContent = t; }, 50); };

    const desenhar = () => {
      ul.innerHTML = '';
      lista.itens.forEach((item, i) => {
        const li = document.createElement('li');
        li.append(item + ' ');
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'lista-remover';
        rm.setAttribute('aria-label', `Remover ${item}`);
        rm.textContent = '✕';
        rm.addEventListener('click', () => {
          lista.itens.splice(i, 1); lista.salvar(); desenhar();
          falar(`${item} removido da lista.`);
          (ul.querySelectorAll('.lista-remover')[Math.min(i, lista.itens.length - 1)] || abrir).focus();
        });
        li.append(rm);
        ul.append(li);
      });
      qtd.textContent = lista.itens.length;
      vazia.hidden = lista.itens.length > 0;
      $$('.btn-add').forEach((b) => {
        const marcado = lista.itens.includes(b.dataset.item);
        b.classList.toggle('marcado', marcado);
        b.textContent = marcado ? '✓' : '＋';
        b.setAttribute('aria-pressed', String(marcado));
        b.setAttribute('aria-label', `Adicionar à lista: ${b.dataset.item}`);
      });
    };

    abrir.addEventListener('click', () => {
      corpo.hidden = !corpo.hidden;
      abrir.setAttribute('aria-expanded', String(!corpo.hidden));
    });
    painel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !corpo.hidden) { corpo.hidden = true; abrir.setAttribute('aria-expanded', 'false'); abrir.focus(); }
    });
    $('.lista-limpar', painel).addEventListener('click', () => { lista.itens = []; lista.salvar(); desenhar(); falar('Lista esvaziada.'); abrir.focus(); });

    if (ehProdutos) {
      $$('main article li').forEach((li) => {
        const texto = li.textContent.trim();
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'btn-add';
        botao.dataset.item = texto;
        botao.setAttribute('aria-label', `Adicionar à lista: ${texto}`);
        botao.addEventListener('click', () => {
          const pos = lista.itens.indexOf(texto);
          if (pos >= 0) lista.itens.splice(pos, 1); else lista.itens.push(texto);
          lista.salvar();
          desenhar();
          falar(pos >= 0 ? `${texto} removido da lista.` : `${texto} adicionado à lista.`);
        });
        li.append(' ', botao);
      });
    }

    if (ehOrcamento) {
      const campo = $('#produtos-desejados');
      const preencher = () => {
        if (!campo || !lista.itens.length) return;
        campo.value = lista.itens.map((i) => `- ${i}`).join('\n');
        campo.dispatchEvent(new Event('input'));
        campo.focus();
      };
      $('.lista-usar', painel).addEventListener('click', preencher);
      if (lista.itens.length && campo && !campo.value) preencher();
    }

    desenhar();
  }

  /* ---------- 12. Dica do dia na página inicial (troca todo dia) ---------- */
  function dicaDoDia() {
    if (pagina !== 'index.html') return;
    const destino = $('main section:nth-of-type(3)');
    if (!destino) return;
    const dicas = [
      'Frutas da estação costumam ser mais saborosas e mais baratas.',
      'Peça ao açougueiro o corte na espessura que você prefere: é sem custo extra.',
      'O pão francês sai fresquinho de hora em hora na nossa padaria.',
      'Confira a validade e prefira os hortifrútis colhidos no dia.',
      'Faça sua lista antes de vir e economize tempo e dinheiro.',
      'Pague com Pix, débito ou crédito: aceitamos todos.',
      'Domingo abrimos das 8h às 14h: ótimo para o almoço em família.',
    ];
    const dia = Math.floor(Date.now() / 86400000);
    const bloco = document.createElement('section');
    bloco.className = 'dica-dia';
    bloco.innerHTML = `<h2>💡 Dica do dia</h2><p>${dicas[dia % dicas.length]}</p>`;
    destino.insertAdjacentElement('beforebegin', bloco);
  }

  /* ---------- 13. Carrossel de ofertas (página inicial) ---------- */
  function carrossel() {
    const raiz = $('.carrossel');
    if (!raiz) return;
    const faixa = $('.carrossel-faixa', raiz);
    const slides = $$('.slide', raiz);
    if (slides.length < 2) return;

    raiz.classList.add('js-carrossel');
    let atual = 0;
    let timer = null;
    const reduzir = reduzirMovimento();
    let pausado = false; // pausa escolhida pelo usuário (WCAG 2.2.2)

    const criarBotao = (classe, rotulo, texto) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = classe;
      b.setAttribute('aria-label', rotulo);
      b.textContent = texto;
      return b;
    };
    const anterior = criarBotao('carrossel-seta anterior', 'Slide anterior', '‹');
    const proximo = criarBotao('carrossel-seta proximo', 'Próximo slide', '›');
    const pontos = document.createElement('div');
    pontos.className = 'carrossel-pontos';
    const bolinhas = slides.map((_, i) => {
      const b = criarBotao('', `Ir para o slide ${i + 1}`, '');
      b.addEventListener('click', () => { ir(i); reiniciar(); });
      pontos.append(b);
      return b;
    });
    const pausa = criarBotao('carrossel-pausa', 'Pausar rotação automática dos slides', 'Pausar');
    pausa.setAttribute('aria-pressed', 'false');
    raiz.append(pausa, anterior, pontos, proximo);
    faixa.setAttribute('aria-live', 'off');

    function ir(i) {
      atual = (i + slides.length) % slides.length;
      faixa.style.transform = `translateX(-${atual * 100}%)`;
      slides.forEach((s, n) => {
        s.setAttribute('aria-hidden', String(n !== atual));
        /* links de slides escondidos saem da ordem do Tab */
        $$('a', s).forEach((a) => { a.tabIndex = n === atual ? 0 : -1; });
      });
      bolinhas.forEach((b, n) => {
        b.classList.toggle('ativo', n === atual);
        if (n === atual) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
    }
    const parar = () => { clearInterval(timer); timer = null; };
    const iniciar = () => { if (!reduzir && !pausado && !timer) timer = setInterval(() => ir(atual + 1), 5000); };
    const reiniciar = () => { parar(); iniciar(); };

    pausa.addEventListener('click', () => {
      pausado = !pausado;
      pausa.textContent = pausado ? 'Reproduzir' : 'Pausar';
      pausa.setAttribute('aria-label', pausado ? 'Retomar rotação automática dos slides' : 'Pausar rotação automática dos slides');
      pausa.setAttribute('aria-pressed', String(pausado));
      faixa.setAttribute('aria-live', pausado ? 'polite' : 'off');
      if (pausado) parar(); else iniciar();
    });
    anterior.addEventListener('click', () => { ir(atual - 1); reiniciar(); });
    proximo.addEventListener('click', () => { ir(atual + 1); reiniciar(); });

    /* pausa enquanto o mouse ou o foco do teclado estão no carrossel */
    raiz.addEventListener('mouseenter', parar);
    raiz.addEventListener('mouseleave', iniciar);
    raiz.addEventListener('focusin', parar);
    raiz.addEventListener('focusout', iniciar);
    raiz.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { ir(atual - 1); reiniciar(); }
      if (e.key === 'ArrowRight') { ir(atual + 1); reiniciar(); }
    });

    /* arrastar com o dedo no celular */
    let inicioX = null;
    raiz.addEventListener('touchstart', (e) => { inicioX = e.touches[0].clientX; }, { passive: true });
    raiz.addEventListener('touchend', (e) => {
      if (inicioX === null) return;
      const dx = e.changedTouches[0].clientX - inicioX;
      if (Math.abs(dx) > 40) { ir(atual + (dx < 0 ? 1 : -1)); reiniciar(); }
      inicioX = null;
    });

    ir(0);
    if (reduzir) pausa.hidden = true;
    iniciar();
  }

  /* ---------- 14. Barra de acessibilidade: tamanho da letra e alto contraste ---------- */
  function barraAcessibilidade() {
    const raiz = document.documentElement;
    const prefs = ler('koala-acessibilidade', null) || {
      fonte: 0,
      contraste: typeof window.matchMedia === 'function' && window.matchMedia('(prefers-contrast: more)').matches,
    };

    const barra = document.createElement('div');
    barra.className = 'barra-acessibilidade';
    barra.setAttribute('role', 'region');
    barra.setAttribute('aria-label', 'Ferramentas de acessibilidade');
    barra.innerHTML = `
      <span>Acessibilidade:</span>
      <button type="button" data-acao="menos" aria-label="Diminuir tamanho da letra">A−</button>
      <button type="button" data-acao="normal" aria-label="Tamanho normal da letra">A</button>
      <button type="button" data-acao="mais" aria-label="Aumentar tamanho da letra">A+</button>
      <button type="button" data-acao="contraste" aria-pressed="false">Alto contraste</button>
      <p class="so-leitor" role="status"></p>`;
    const aviso = $('p', barra);
    const btnContraste = $('[data-acao="contraste"]', barra);

    const aplicar = (anunciar) => {
      prefs.fonte = Math.max(0, Math.min(3, prefs.fonte));
      if (prefs.fonte) raiz.dataset.fonte = String(prefs.fonte); else delete raiz.dataset.fonte;
      if (prefs.contraste) raiz.dataset.contraste = 'alto'; else delete raiz.dataset.contraste;
      btnContraste.setAttribute('aria-pressed', String(prefs.contraste));
      guardar('koala-acessibilidade', prefs);
      if (anunciar) aviso.textContent = `Letra em ${['100%', '112%', '125%', '150%'][prefs.fonte]}. Alto contraste ${prefs.contraste ? 'ligado' : 'desligado'}.`;
    };
    barra.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-acao]');
      if (!b) return;
      const a = b.dataset.acao;
      if (a === 'mais') prefs.fonte += 1;
      if (a === 'menos') prefs.fonte -= 1;
      if (a === 'normal') prefs.fonte = 0;
      if (a === 'contraste') prefs.contraste = !prefs.contraste;
      aplicar(true);
    });
    aplicar(false);
    const pular = $('.pular-conteudo');
    if (pular) pular.insertAdjacentElement('afterend', barra); else document.body.prepend(barra);
  }

  /* ---------- Inicialização ---------- */
  barraAcessibilidade();
  menuMobile();
  seloAbertoFechado();
  voltarAoTopo();
  mascaras();
  cnpjCondicional();
  contadores();
  formularios();
  buscaAoVivo();
  faqSanfona();
  minhaLista();
  dicaDoDia();
  carrossel();
  revelarAoRolar();
})();
