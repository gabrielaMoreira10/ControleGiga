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
    } else if (tabId === 'estoque') {
        carregarProdutos();
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

async function carregarProdutos(filtroValidade = false) {
    const busca = document.getElementById('filtroBusca').value.toLowerCase();
    const marcaFiltro = document.getElementById('filtroMarca').value;
    const container = document.getElementById("tabelaEstoque");
    let query = db.collection("produtos");
    
    const snapshot = await query.get();
    container.innerHTML = "";

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
        
        if (filtroValidade && p.validade) {
            const dataValidade = new Date(p.validade);
            if (dataValidade > hoje) {
                mostrar = false;
            }
        }
        
        if (mostrar) {
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
                                ${validadeInfo}
                            </p>
                            <button class="btn btn-sm btn-warning" onclick="editarProduto('${p.nome}')">Editar</button>
                            <button class="btn btn-sm btn-danger" onclick="deletarProduto('${p.nome}')">Excluir</button>
                        </div>
                    </div>
                </div>`;
        }
    });
}

function filtrarPorValidade() {
    const btn = event.target;
    const estaFiltrado = btn.classList.contains('btn-primary');
    
    if (estaFiltrado) {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-info');
        carregarProdutos(false);
    } else {
        btn.classList.remove('btn-info');
        btn.classList.add('btn-primary');
        carregarProdutos(true);
    }
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
}
async function confirmarApagarVendas() {
    const confirmacao = confirm("⚠️ ATENÇÃO: Isso apagará TODOS os registros de vendas permanentemente!\n\nTem certeza que deseja continuar?");

    if (confirmacao) {
        await apagarTodasVendas();
    }
}

async function apagarTodasVendas() {
    try {
        // Primeiro obtemos todas as vendas
        const snapshot = await db.collection("vendas").get();

        // Criamos um batch (lote) para deletar tudo de uma vez
        const batch = db.batch();

        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        alert("Todas as vendas foram apagadas com sucesso!");
        carregarVendas(); // Atualiza a lista
    } catch (error) {
        console.error("Erro ao apagar vendas:", error);
        alert("Ocorreu um erro ao apagar as vendas: " + error.message);
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

try {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
} catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
    alert("Erro ao conectar com o banco de dados. Recarregue a página.");
}