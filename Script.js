// Configuração do Firebase - substitua com sua configuração real
const firebaseConfig = {
    apiKey: "AIzaSyAA4UWNsba88bnAfLmVC_50e30XaqI7T6I",
    authDomain: "controleestoque-be411.firebaseapp.com",
    projectId: "controleestoque-be411",
    storageBucket: "controleestoque-be411.appspot.com",
    messagingSenderId: "2805034353",
    appId: "1:2805034353:web:270e9c605939eb94da9ad0",
    measurementId: "G-DJSMT9V1QG"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(div => div.classList.add('d-none'));
    document.getElementById(tabId).classList.remove('d-none');
    document.querySelectorAll('#tabMenu .nav-link').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    if (tabId === 'relatorios') {
        carregarVendas();
    }
}

function adicionarProduto() {
    const validadeInput = document.getElementById('validade').value;
    const validade = validadeInput ? new Date(validadeInput).toISOString() : null;

    const produto = {
        nome: document.getElementById('nome').value.trim(),
        codigo: document.getElementById('codigo').value.trim(),
        preco: parseFloat(document.getElementById('preco').value),
        quantidade: parseInt(document.getElementById('quantidade').value),
        estoqueMinimo: parseInt(document.getElementById('estoqueMinimo').value) || 0,
        marca: document.getElementById('marca').value,
        validade: validade,
        obs: document.getElementById('obsProduto').value.trim()
    };

    if (!produto.nome || !produto.codigo || isNaN(produto.preco) || isNaN(produto.quantidade)) {
        return alert("Preencha os campos obrigatórios corretamente.");
    }

    db.collection("produtos").doc(produto.codigo).set(produto)
        .then(() => {
            alert("Produto salvo com sucesso!");
            carregarProdutos();
            limparCamposProduto();
        })
        .catch((error) => {
            alert("Erro ao salvar produto: " + error.message);
        });
}

function limparCamposProduto() {
    document.getElementById('nome').value = "";
    document.getElementById('codigo').value = "";
    document.getElementById('preco').value = "";
    document.getElementById('quantidade').value = "";
    document.getElementById('estoqueMinimo').value = "";
    document.getElementById('marca').value = "Avon";
    document.getElementById('validade').value = "";
    document.getElementById('obsProduto').value = "";
}
async function carregarProdutos(ordenarPorValidade = false) {
    const busca = document.getElementById('filtroBusca').value.toLowerCase();
    const marcaFiltro = document.getElementById('filtroMarca').value;
    const container = document.getElementById("tabelaEstoque");
    let query = db.collection("produtos");

    const snapshot = await query.get();
    container.innerHTML = "";
    let listaFiltrada = [];

    snapshot.forEach(doc => {
        const p = doc.data();
        const hoje = new Date();
        let mostrar = true;

        // Aplicar filtros
        if ((busca && !p.nome.toLowerCase().includes(busca) && !p.codigo.includes(busca))) {
            mostrar = false;
        }

        if (marcaFiltro && p.marca !== marcaFiltro) {
            mostrar = false;
        }

        if (mostrar) {
            // Adiciona a validade como Date para ordenação
            p._dataValidade = p.validade ? new Date(p.validade) : new Date(8640000000000000); // data futura para quem não tem validade
            listaFiltrada.push(p);
        }
    });

    // Se o botão foi clicado para ordenar por validade
    if (ordenarPorValidade) {
        listaFiltrada.sort((a, b) => a._dataValidade - b._dataValidade);
    }

    // Renderiza os produtos
    const hoje = new Date();
    listaFiltrada.forEach(p => {
        const alerta = p.quantidade <= p.estoqueMinimo ? '<span class="badge bg-danger">Baixo estoque</span>' : '';
        let validadeInfo = '';

        if (p.validade) {
            const dataValidade = new Date(p.validade);
            const diffTime = dataValidade - hoje;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                validadeInfo = `<span class="badge bg-danger">Vencido há ${Math.abs(diffDays)} dias</span>`;
            } else if (diffDays <= 30) {
                validadeInfo = `<span class="badge bg-warning text-dark">Vence em ${diffDays} dias</span>`;
            } else {
                validadeInfo = `<span class="badge bg-success">Válido até ${dataValidade.toLocaleDateString('pt-BR')}</span>`;
            }
        }

        container.innerHTML += `
            <div class="col-12 col-sm-6 col-md-4">
                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${p.nome}</h5>
                        <p class="card-text">
                            Marca: ${p.marca}<br>
                            Preço: R$ ${p.preco.toFixed(2)}<br>
                            Qtd: ${p.quantidade} ${alerta}<br>
                            Descrição: ${p.obs || "Sem descrição"}<br>
                            ${validadeInfo}
                        </p>
                        <button class="btn btn-sm btn-warning" onclick="editarProduto('${p.nome}')">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="deletarProduto('${p.nome}')">Excluir</button>
                    </div>
                </div>
            </div>`;
    });
}


function filtrarPorValidade() {
    const btn = event.target;
    const estaOrdenado = btn.classList.contains('btn-primary');

    if (estaOrdenado) {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-info');
        carregarProdutos(false); // ordem padrão
    } else {
        btn.classList.remove('btn-info');
        btn.classList.add('btn-primary');
        carregarProdutos(true); // ordenar por validade
    }
}


function buscarProdutoVenda() {
    const termo = document.getElementById('buscaVenda').value.toLowerCase();
    const select = document.getElementById("produtoVenda");
    db.collection("produtos").get().then(snapshot => {
        select.innerHTML = "";
        snapshot.forEach(doc => {
            const p = doc.data();
            if (p.nome.toLowerCase().includes(termo)) {
                select.innerHTML += `<option value="${p.codigo}">${p.nome} (Qtd: ${p.quantidade})</option>`;
            }
        });
    });
}

function buscarProdutoAjuste() {
    const termo = document.getElementById("ajusteBusca").value.toLowerCase();
    const select = document.getElementById("produtoAjuste");
    db.collection("produtos").get().then(snapshot => {
        select.innerHTML = "";
        snapshot.forEach(doc => {
            const p = doc.data();
            if (p.nome.toLowerCase().includes(termo)) {
                select.innerHTML += `<option value="${p.codigo}">${p.nome} (Qtd atual: ${p.quantidade})</option>`;
            }
        });
    });
}
function preencherDadosProduto() {
    const codigo = document.getElementById("produtoAjuste").value;
    if (!codigo) return;
    db.collection("produtos").doc(codigo).get().then(doc => {
        if (doc.exists) {
            const p = doc.data();
            document.getElementById("quantidadeNova").value = p.quantidade;
            document.getElementById("precoNovo").value = p.preco;
        }
    });
}

function ajustarEstoque() {
    const codigo = document.getElementById("produtoAjuste").value;
    const novaQtd = parseInt(document.getElementById("quantidadeNova").value);
    const novoPreco = parseFloat(document.getElementById("precoNovo").value);

    if (!codigo || isNaN(novaQtd)) {
        return alert("Preencha corretamente os campos.");
    }

    const atualizacoes = { quantidade: novaQtd };

    if (!isNaN(novoPreco)) {
        atualizacoes.preco = novoPreco;
    }

    db.collection("produtos").doc(codigo).update(atualizacoes).then(() => {
        alert("Ajustes salvos com sucesso.");
        document.getElementById("quantidadeNova").value = "";
        document.getElementById("precoNovo").value = "";
        buscarProdutoAjuste();
        carregarProdutos();
    });
}
async function registrarVenda() {
    const codigo = document.getElementById("produtoVenda").value;
    const qtd = parseInt(document.getElementById("quantidadeVenda").value);
    const clienteNome = document.getElementById("cliente").value.trim();
    const forma = document.getElementById("formaPagamento").value;
    const descontoVal = document.getElementById("desconto").value.trim();
    const obs = document.getElementById("obsVenda").value.trim();

    if (!clienteNome || isNaN(qtd) || qtd <= 0) {
        return alert("Preencha os campos corretamente.");
    }

    const docRef = db.collection("produtos").doc(codigo);
    const doc = await docRef.get();
    const produto = doc.data();

    if (!produto || produto.quantidade < qtd) {
        return alert("Estoque insuficiente.");
    }

    let total = produto.preco * qtd;
    if (descontoVal.includes("%")) {
        const perc = parseFloat(descontoVal.replace("%", ""));
        if (!isNaN(perc)) total -= total * (perc / 100);
    } else if (!isNaN(parseFloat(descontoVal))) {
        total -= parseFloat(descontoVal);
    }

    await docRef.update({ quantidade: produto.quantidade - qtd });
    await db.collection("vendas").add({
        codigo: produto.codigo,
        nome: produto.nome,
        quantidade: qtd,
        total: total,
        cliente: clienteNome,
        forma: forma,
        obs: obs,
        data: new Date().toISOString()
    });

    alert("Venda registrada!");
    document.getElementById("quantidadeVenda").value = 1;
    document.getElementById("cliente").value = "";
    document.getElementById("desconto").value = "";
    document.getElementById("obsVenda").value = "";
    buscarProdutoVenda();
    carregarProdutos();
}

async function carregarVendas() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    const filtroDescricao = document.getElementById('filtroDescricao').value.toLowerCase();
    const listaVendas = document.getElementById('listaVendas');
    const totalVendas = document.getElementById('totalVendas');

    let query = db.collection("vendas").orderBy("data", "desc");

    if (dataInicio) {
        query = query.where("data", ">=", new Date(dataInicio).toISOString());
    }

    if (dataFim) {
        // Adiciona 1 dia para incluir o dia final
        const fim = new Date(dataFim);
        fim.setDate(fim.getDate() + 1);
        query = query.where("data", "<", fim.toISOString());
    }

    const snapshot = await query.get();
    listaVendas.innerHTML = '';
    let total = 0;

    if (snapshot.empty) {
        listaVendas.innerHTML = '<tr><td colspan="7" class="text-center">Nenhuma venda encontrada</td></tr>';
        totalVendas.textContent = '0,00';
        return;
    }

    snapshot.forEach(doc => {
        const v = doc.data();
        const data = new Date(v.data).toLocaleDateString('pt-BR');

        // Aplicar filtro de descrição
        if (filtroDescricao &&
            !v.nome.toLowerCase().includes(filtroDescricao) &&
            !v.obs.toLowerCase().includes(filtroDescricao)) {
            return;
        }

        total += v.total;

                listaVendas.innerHTML += `
            <tr>
                <td>
                    <input type="checkbox" class="venda-checkbox" data-id="${doc.id}" onclick="atualizarBotaoApagar()">
                </td>
                <td>${data}</td>
                <td>${v.nome}</td>
                <td>${v.quantidade}</td>
                <td>R$ ${v.total.toFixed(2)}</td>
                <td>${v.cliente}</td>
                <td>${v.forma}</td>
                <td>${v.obs || '-'}</td>
            </tr>
        `;
    });

    totalVendas.textContent = total.toFixed(2);

    // Desmarca o "Selecionar Todos"
    document.getElementById('selecionarTodos').checked = false;
    atualizarBotaoApagar();
}


let produtoEditando = null;

function editarProduto(nomeProduto) {
    db.collection("produtos").where("nome", "==", nomeProduto).get().then(snapshot => {
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            produtoEditando = doc.id;
            const p = doc.data();

            document.getElementById('nome').value = p.nome;
            document.getElementById('codigo').value = p.codigo;
            document.getElementById('preco').value = p.preco;
            document.getElementById('quantidade').value = p.quantidade;
            document.getElementById('estoqueMinimo').value = p.estoqueMinimo || 0;
            document.getElementById('marca').value = p.marca;
            document.getElementById('obsProduto').value = p.obs || '';

            showTab('produtos');

            const btn = document.querySelector('#produtos button');
            btn.textContent = 'Atualizar Produto';
            btn.onclick = atualizarProduto;
        }
    });
}

function atualizarProduto() {
    if (!produtoEditando) return;

    const produto = {
        nome: document.getElementById('nome').value.trim(),
        codigo: document.getElementById('codigo').value.trim(),
        preco: parseFloat(document.getElementById('preco').value),
        quantidade: parseInt(document.getElementById('quantidade').value),
        estoqueMinimo: parseInt(document.getElementById('estoqueMinimo').value) || 0,
        marca: document.getElementById('marca').value,
        obs: document.getElementById('obsProduto').value.trim()
    };

    if (!produto.nome || !produto.codigo || isNaN(produto.preco)) {
        return alert("Preencha os campos obrigatórios.");
    }

    db.collection("produtos").doc(produtoEditando).update(produto).then(() => {
        alert("Produto atualizado com sucesso!");
        produtoEditando = null;
        carregarProdutos();
        limparCamposProduto();

        const btn = document.querySelector('#produtos button');
        btn.textContent = 'Salvar Produto';
        btn.onclick = adicionarProduto;
    });
}

async function deletarProduto(nomeProduto) {
    const produtosSnapshot = await db.collection("produtos")
        .where("nome", "==", nomeProduto)
        .get();

    if (produtosSnapshot.empty) {
        return alert("Produto não encontrado!");
    }

    const produtoDoc = produtosSnapshot.docs[0];
    const codigo = produtoDoc.id;
    const produtoData = produtoDoc.data();

    const vendasSnapshot = await db.collection("vendas")
        .where("codigo", "==", codigo)
        .get();

    if (!vendasSnapshot.empty) {
        const resposta = confirm(`O produto "${nomeProduto}" possui ${vendasSnapshot.size} venda(s) associada(s).\n\n` +
            `Deseja desativá-lo em vez de excluir?\n\n` +
            `✅ Sim - para desativar\n` +
            `❌ Não - para excluir mesmo assim`);

        if (resposta) {
            await db.collection("produtos").doc(codigo).update({
                ativo: false,
                dataDesativacao: new Date().toISOString()
            });
            alert(`"${nomeProduto}" foi desativado com sucesso!`);
        } else {
            if (confirm(`⚠️ ATENÇÃO: Esta ação é irreversível!\n\n` +
                `Tem certeza que deseja excluir permanentemente "${nomeProduto}"?\n` +
                `Isso afetará ${vendasSnapshot.size} registro(s) de venda.`)) {
                await db.collection("produtos").doc(codigo).delete();
                alert(`"${nomeProduto}" foi excluído permanentemente`);
            } else {
                return;
            }
        }
    } else {
        if (confirm(`Deseja excluir o produto "${nomeProduto}"?`)) {
            await db.collection("produtos").doc(codigo).delete();
            alert(`"${nomeProduto}" foi excluído com sucesso`);
        } else {
            return;
        }
    }

    carregarProdutos();
}// Habilita/Desabilita botão com base nos checkboxes
function atualizarBotaoApagar() {
    const checkboxes = document.querySelectorAll('.venda-checkbox:checked');
    document.getElementById('btnApagarSelecionadas').disabled = checkboxes.length === 0;
}

// Marcar/Desmarcar todos os checkboxes
function toggleSelecionarTodos() {
    const checkTodos = document.getElementById('selecionarTodos').checked;
    const checkboxes = document.querySelectorAll('.venda-checkbox');

    checkboxes.forEach(cb => {
        cb.checked = checkTodos;
    });

    atualizarBotaoApagar();
}

// Função para apagar apenas os selecionados
async function apagarVendasSelecionadas() {
    const confirmacao = confirm("Tem certeza que deseja apagar as vendas selecionadas?");
    if (!confirmacao) return;

    const checkboxes = document.querySelectorAll('.venda-checkbox:checked');
    if (checkboxes.length === 0) return;

    const batch = db.batch();

    checkboxes.forEach(cb => {
        const vendaId = cb.dataset.id;
        const ref = db.collection("vendas").doc(vendaId);
        batch.delete(ref);
    });

    try {
        await batch.commit();
        alert("Vendas selecionadas apagadas com sucesso!");
        carregarVendas(); // Atualiza a lista
    } catch (error) {
        console.error("Erro ao apagar vendas:", error);
        alert("Erro ao apagar vendas: " + error.message);
    }
}
// Inicializações
document.addEventListener('DOMContentLoaded', function () {
    // Configurar datas padrão (últimos 30 dias)
    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);

    document.getElementById('dataFim').valueAsDate = hoje;
    document.getElementById('dataInicio').valueAsDate = trintaDiasAtras;

    carregarProdutos();
    buscarProdutoVenda();
    buscarProdutoAjuste();
});

