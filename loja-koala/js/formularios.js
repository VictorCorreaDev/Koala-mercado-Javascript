/* Formulários de contato, orçamento e trabalhe conosco.
   A validação é a nativa do HTML5 (required, pattern, type="email", type="tel", min/max):
   o navegador só dispara o "submit" quando todos os campos são válidos.
   Este arquivo só aplica as máscaras enquanto a pessoa digita e mostra a confirmação. */
(() => {
  const digitos = v => v.replace(/\D/g, "");

  function mascaraTelefone(v) {
    const d = digitos(v).slice(0, 11);
    if (d.length <= 2) return d ? "(" + d : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  function mascaraCnpj(v) {
    const d = digitos(v).slice(0, 14);
    return d
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  document.querySelectorAll('input[type="tel"]').forEach(campo =>
    campo.addEventListener("input", () => { campo.value = mascaraTelefone(campo.value); }));

  const cnpj = document.getElementById("cnpj");
  const tipo = document.getElementById("tipo-cliente");
  if (cnpj) cnpj.addEventListener("input", () => { cnpj.value = mascaraCnpj(cnpj.value); });
  if (cnpj && tipo) {
    // CNPJ passa a ser obrigatório só para pessoa jurídica
    const atualizar = () => { cnpj.required = tipo.value === "pessoa-juridica"; };
    tipo.addEventListener("change", atualizar);
    atualizar();
  }

  document.querySelectorAll("form[data-sucesso]").forEach(form => {
    const aviso = document.createElement("p");
    aviso.className = "aviso aviso--sucesso";
    aviso.setAttribute("role", "status");
    aviso.hidden = true;
    form.after(aviso);

    form.addEventListener("submit", e => {
      e.preventDefault(); // não há servidor: o envio é simulado
      form.reset();
      aviso.textContent = form.dataset.sucesso;
      aviso.hidden = false;
    });
    form.addEventListener("reset", () => { aviso.hidden = true; if (tipo) setTimeout(() => tipo.dispatchEvent(new Event("change"))); });
  });
})();
