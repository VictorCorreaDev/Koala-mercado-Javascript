(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const brl = n => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const LS = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  /* tema claro/escuro (lembrado entre visitas) */
  const salvo = LS.get("koala.tema", null);
  document.documentElement.dataset.tema = salvo || (matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro");
  function alternarTema() {
    const novo = document.documentElement.dataset.tema === "escuro" ? "claro" : "escuro";
    document.documentElement.dataset.tema = novo;
    LS.set("koala.tema", novo);
    syncTema();
  }
  function syncTema() {
    const b = $(".flutuante--tema");
    if (b) b.textContent = document.documentElement.dataset.tema === "escuro" ? "Tema claro" : "Tema escuro";
  }

  /* lista de compras. item: { id, qty, done, name?, custom? } */
  const List = {
    all() { return LS.get("koala.lista", []); },
    save(items) { LS.set("koala.lista", items); document.dispatchEvent(new CustomEvent("koala:lista")); },
    add(id) {
      const items = this.all(), it = items.find(i => i.id === id);
      if (it) it.qty++; else items.push({ id, qty: 1, done: false });
      this.save(items);
    },
    addCustom(name, qty) {
      const items = this.all();
      items.push({ id: "c-" + Date.now(), name, qty, done: false, custom: true });
      this.save(items);
    },
    count() { return this.all().reduce((n, i) => n + i.qty, 0); },
  };

  /* a região de aviso precisa existir antes da mensagem, senão leitores de tela não anunciam */
  function garantirToasts() {
    let box = $("#toasts");
    if (!box) { box = document.createElement("div"); box.id = "toasts"; box.setAttribute("role", "status"); document.body.appendChild(box); }
    return box;
  }
  function toast(msg) {
    const box = garantirToasts();
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), 5000);
  }

  function cardProduto(p) {
    const pct = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
    const el = document.createElement("article");
    el.className = "card card--vertical";
    el.innerHTML = `${pct ? `<span class="etiqueta"><span aria-hidden="true">-${pct}%</span><span class="sr-only">${pct}% de desconto</span></span>` : ""}
      <img src="${p.img}" alt="" loading="lazy">
      <div class="card__corpo"><h3></h3><div class="card__mudo">${p.unit}</div>
      <div class="preco">${p.old ? `<s><span class="sr-only">De </span>${brl(p.old)}<span class="sr-only"> por</span></s>` : ""}${brl(p.price)}</div>
      <button class="botao" type="button">Adicionar à lista</button></div>`;
    $("h3", el).textContent = p.name;
    $("button", el).setAttribute("aria-label", "Adicionar à lista: " + p.name);
    $("button", el).addEventListener("click", () => { List.add(p.id); toast(p.name + " adicionado à lista"); });
    return el;
  }

  /* cabeçalho e rodapé estão escritos no HTML de cada página; aqui só entram os comportamentos */
  function montarLayout() {
    const h = $(".cabecalho");
    if (h) {
      const menus = $$(".menu", h);
      const fechar = menu => { menu.classList.remove("aberto"); $("button", menu).setAttribute("aria-expanded", "false"); };
      menus.forEach(menu => {
        const mb = $("button", menu);
        mb.addEventListener("click", e => {
          e.stopPropagation();
          menus.filter(m => m !== menu).forEach(fechar);
          const o = menu.classList.toggle("aberto"); mb.setAttribute("aria-expanded", o);
        });
      });
      document.addEventListener("click", () => menus.forEach(fechar));
      document.addEventListener("keydown", e => {
        const aberto = menus.find(m => m.classList.contains("aberto"));
        if (e.key === "Escape" && aberto) { fechar(aberto); $("button", aberto).focus(); }
      });
      const burger = $(".menu-btn", h);
      burger.addEventListener("click", () => {
        const o = h.classList.toggle("aberto");
        burger.setAttribute("aria-expanded", o);
        burger.setAttribute("aria-label", o ? "Fechar menu" : "Abrir menu");
      });
    }
    const principal = $("main");
    if (principal) principal.tabIndex = -1; // destino do link "Pular para o conteúdo"
    garantirToasts();
    montarAcessibilidade();
    if (!$(".flutuante--ajuda")) {
      document.body.insertAdjacentHTML("beforeend",
        `<button class="flutuante flutuante--tema" type="button"></button><a class="flutuante flutuante--ajuda" href="sac.html">Posso ajudar?</a>`);
      $(".flutuante--tema").addEventListener("click", alternarTema);
    }
    syncTema();
    atualizarContador();
  }
  /* painel de acessibilidade: tamanho da letra e alto contraste (lembrado entre visitas) */
  function montarAcessibilidade() {
    if ($(".acess")) return;
    const raiz = document.documentElement;
    const prefs = LS.get("koala.acess", null) || { fonte: 0, contraste: matchMedia("(prefers-contrast: more)").matches };
    const caixa = document.createElement("div");
    caixa.className = "acess";
    caixa.innerHTML = `<div class="acess__painel" id="acess-painel" role="group" aria-label="Ferramentas de acessibilidade" hidden>
        <button type="button" data-a="menos" aria-label="Diminuir tamanho da letra">A−</button>
        <button type="button" data-a="normal" aria-label="Tamanho normal da letra">A</button>
        <button type="button" data-a="mais" aria-label="Aumentar tamanho da letra">A+</button>
        <button type="button" data-a="contraste" aria-pressed="false">Alto contraste</button>
        <p class="sr-only" role="status"></p>
      </div>
      <button class="acess__btn" type="button" aria-expanded="false" aria-controls="acess-painel">Acessibilidade</button>`;
    document.body.appendChild(caixa);
    const painel = $(".acess__painel", caixa), abrir = $(".acess__btn", caixa), aviso = $("p", caixa), bc = $("[data-a=contraste]", caixa);
    const aplicar = anunciar => {
      prefs.fonte = Math.max(0, Math.min(3, prefs.fonte));
      if (prefs.fonte) raiz.dataset.fonte = prefs.fonte; else delete raiz.dataset.fonte;
      if (prefs.contraste) raiz.dataset.contraste = "alto"; else delete raiz.dataset.contraste;
      bc.setAttribute("aria-pressed", prefs.contraste);
      LS.set("koala.acess", prefs);
      if (anunciar) aviso.textContent = `Letra em ${["100%", "112%", "125%", "150%"][prefs.fonte]}. Alto contraste ${prefs.contraste ? "ligado" : "desligado"}.`;
    };
    abrir.addEventListener("click", () => { painel.hidden = !painel.hidden; abrir.setAttribute("aria-expanded", !painel.hidden); });
    caixa.addEventListener("keydown", e => { if (e.key === "Escape" && !painel.hidden) { painel.hidden = true; abrir.setAttribute("aria-expanded", "false"); abrir.focus(); } });
    painel.addEventListener("click", e => {
      const b = e.target.closest("button[data-a]"); if (!b) return;
      const a = b.dataset.a;
      if (a === "mais") prefs.fonte++; if (a === "menos") prefs.fonte--; if (a === "normal") prefs.fonte = 0;
      if (a === "contraste") prefs.contraste = !prefs.contraste;
      aplicar(true);
    });
    aplicar(false);
  }
  /* o tamanho da letra e o contraste valem desde o primeiro desenho da página */
  (() => {
    const p = LS.get("koala.acess", null);
    if (p && p.fonte) document.documentElement.dataset.fonte = p.fonte;
    if ((p && p.contraste) || (!p && matchMedia("(prefers-contrast: more)").matches)) document.documentElement.dataset.contraste = "alto";
  })();

  function atualizarContador() {
    const b = $("#contador");
    if (!b) return;
    const n = List.count();
    b.textContent = n; b.hidden = n === 0;
  }
  document.addEventListener("koala:lista", atualizarContador);
  window.addEventListener("storage", atualizarContador);
  document.addEventListener("DOMContentLoaded", montarLayout);

  window.Koala = { $, $$, brl, LS, List, toast, cardProduto };
})();
