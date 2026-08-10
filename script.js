// =========================================================
// IEB — Biblioteca de Partituras
// script.js — versão com filtro por instrumento e seção MuseScore
// =========================================================

// --- Estado global ---
let allHinos = [];
let currentCategory   = 'all';
let currentSearchTerm = '';
let currentInstrument = 'all'; // NOVO: filtro de instrumento

// --- Referências DOM ---
const sheetMusicGrid   = document.getElementById('sheetMusicGrid');
const searchInput      = document.getElementById('searchInput');
const clearSearchBtn   = document.getElementById('clearSearch');
const resultCountSpan  = document.getElementById('resultCount');
const lastCommitDateSpan = document.getElementById('lastCommitDate');
const themeToggle      = document.getElementById('themeToggle');

// =========================================================
// Carregar hinos do JSON
// =========================================================
async function loadHinos() {
    try {
        const response = await fetch('hinos.json');
        if (!response.ok) throw new Error('Erro ao carregar hinos.json');
        allHinos = await response.json();
        renderHinos();
        getLastCommitDate();
    } catch (error) {
        console.error('Erro:', error);
        if (sheetMusicGrid) {
            sheetMusicGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao carregar as partituras</p>
                    <p style="font-size: 0.875rem; margin-top: 0.5rem;">Verifique se o arquivo hinos.json existe</p>
                </div>
            `;
        }
    }
}

// =========================================================
// Filtrar hinos (categoria + instrumento + texto)
// =========================================================
function filterHinos() {
    let filtered = allHinos;

    // Filtro por categoria (1ª parte, 2ª parte, etc.)
    if (currentCategory !== 'all') {
        filtered = filtered.filter(hino => hino.categoria === currentCategory);
    }

    // NOVO: Filtro por instrumento
    if (currentInstrument !== 'all') {
        filtered = filtered.filter(hino =>
            hino.instrumento.toLowerCase() === currentInstrument.toLowerCase()
        );
    }

    // Filtro por texto de busca
    if (currentSearchTerm.trim() !== '') {
        const term = currentSearchTerm.toLowerCase();
        filtered = filtered.filter(hino =>
            hino.numero.toLowerCase().includes(term) ||
            hino.instrumento.toLowerCase().includes(term) ||
            hino.parte.toLowerCase().includes(term)
        );
    }

    return filtered;
}

// =========================================================
// Auxiliar: título de exibição do hino (número ou nome)
// =========================================================
function hinoDisplayTitle(numero) {
    // Números puramente numéricos (ex.: "143") viram "Hino 143".
    // Nomes (avulsos/cânticos sem número, ex.: "O Senhor é Meu Pastor") ficam como estão.
    return /^\d+$/.test(numero.trim()) ? `Hino ${numero}` : numero;
}

// =========================================================
// Agrupar hinos filtrados por número (ou nome, quando não numérico)
// =========================================================
function groupHinosByNumero(filtered) {
    const groups = [];
    const groupIndex = new Map();

    filtered.forEach(hino => {
        const key = hino.numero;
        if (!groupIndex.has(key)) {
            const group = { numero: hino.numero, parte: hino.parte, itens: [] };
            groupIndex.set(key, group);
            groups.push(group);
        }
        groupIndex.get(key).itens.push(hino);
    });

    return groups;
}

// =========================================================
// Renderizar cards de partituras (agrupados por hino)
// =========================================================
function renderHinos() {
    if (!sheetMusicGrid) return;

    const filtered = filterHinos();

    if (filtered.length === 0) {
        sheetMusicGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>Nenhuma partitura encontrada</p>
                <p>Tente outro número, instrumento ou parte</p>
            </div>
        `;
        if (resultCountSpan) resultCountSpan.textContent = '0 hinos encontrados';
        return;
    }

    const groups = groupHinosByNumero(filtered);

    if (resultCountSpan) {
        resultCountSpan.textContent = `${groups.length} ${groups.length === 1 ? 'hino encontrado' : 'hinos encontrados'}`;
    }

    sheetMusicGrid.innerHTML = groups.map(group => {
        const cards = group.itens.map(hino => {
            const pdfPath = `pdfs/${hino.categoria}/${hino.arquivo}`;
            return `
                <div class="sheet-card" data-pdf="${pdfPath}" data-numero="${hino.numero}" data-instrumento="${hino.instrumento}">
                    <div class="card-info">
                        <div class="card-details">
                            <span class="instrument-name">${hino.instrumento}</span>
                            ${hino.atualizado ? '<span class="badge update-badge"><i class="fas fa-star"></i> Atualizado</span>' : ''}
                        </div>
                    </div>
                    <div class="card-action">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="hino-group">
                <div class="hino-group-header">
                    <span class="hino-group-number">${hinoDisplayTitle(group.numero)}</span>
                    <span class="hino-group-part badge">${group.parte}</span>
                </div>
                <div class="hino-group-grid">
                    ${cards}
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.sheet-card').forEach(card => {
        card.addEventListener('click', () => {
            const pdfPath = card.dataset.pdf;
            if (pdfPath) window.open(pdfPath, '_blank');
        });
    });
}

// =========================================================
// Data do último commit (GitHub API)
// =========================================================
async function getLastCommitDate() {
    if (!lastCommitDateSpan) return;
    try {
        const response = await fetch('https://api.github.com/repos/zeeeefran/hinosIEB/commits?per_page=1');
        if (response.ok) {
            const commits = await response.json();
            if (commits.length > 0) {
                const lastCommit = new Date(commits[0].commit.committer.date);
                const formattedDate = lastCommit.toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'long', year: 'numeric'
                });
                lastCommitDateSpan.innerHTML = `Última sincronização: ${formattedDate}`;
                return;
            }
        }
        throw new Error('Não foi possível obter a data');
    } catch (error) {
        console.error('Erro ao obter data do commit:', error);
        lastCommitDateSpan.innerHTML = 'Data não disponível';
    }
}

// =========================================================
// Busca instantânea
// =========================================================
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value;
        if (clearSearchBtn) clearSearchBtn.style.display = currentSearchTerm ? 'flex' : 'none';
        renderHinos();
    });
}

if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        currentSearchTerm = '';
        clearSearchBtn.style.display = 'none';
        renderHinos();
    });
}

// =========================================================
// Abas de categoria
// =========================================================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        currentCategory = btn.dataset.category;
        renderHinos();
    });
});

// =========================================================
// NOVO: Abas de instrumento
// =========================================================
document.querySelectorAll('.instrument-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.instrument-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        currentInstrument = btn.dataset.instrument;
        renderHinos();
    });
});

// =========================================================
// Modo noturno
// =========================================================
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    });
}

// =========================================================
// Avisos — mostrar/ocultar e contador
// =========================================================
function updateNoticesCount() {
    const noticesList  = document.getElementById('noticesList');
    const noticesCount = document.getElementById('noticesCount');
    if (!noticesList || !noticesCount) return;

    const visibleNotices = document.querySelectorAll('#noticesList .notice-card:not(.hidden)');
    const count = visibleNotices.length;
    noticesCount.textContent = count;
    noticesCount.style.opacity = count === 0 ? '0.5' : '1';
}

function toggleNotices() {
    const noticesList = document.getElementById('noticesList');
    const toggleBtn   = document.getElementById('noticesToggleBtn');
    if (!noticesList || !toggleBtn) return;

    if (noticesList.classList.contains('hidden')) {
        noticesList.classList.remove('hidden');
        toggleBtn.textContent = 'Ocultar';
        localStorage.setItem('noticesVisible', 'true');
    } else {
        noticesList.classList.add('hidden');
        toggleBtn.textContent = 'Mostrar';
        localStorage.setItem('noticesVisible', 'false');
    }
}

function loadNoticesState() {
    const noticesList = document.getElementById('noticesList');
    const toggleBtn   = document.getElementById('noticesToggleBtn');
    if (!noticesList || !toggleBtn) return;

    const savedState = localStorage.getItem('noticesVisible');
    if (savedState === 'false') {
        noticesList.classList.add('hidden');
        toggleBtn.textContent = 'Mostrar';
    } else {
        noticesList.classList.remove('hidden');
        toggleBtn.textContent = 'Ocultar';
    }
}

function initNotices() {
    updateNoticesCount();
    loadNoticesState();

    const header    = document.getElementById('noticesHeader');
    const toggleBtn = document.getElementById('noticesToggleBtn');

    if (header) {
        header.addEventListener('click', function (e) {
            if (e.target === toggleBtn || (toggleBtn && toggleBtn.contains(e.target))) return;
            toggleNotices();
        });
    }
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleNotices();
        });
    }
}

// =========================================================
// NOVO: MuseScore — mostrar/ocultar e contador
// =========================================================
function updateMusescoreCount() {
    const musescoreList  = document.getElementById('musescoreList');
    const musescoreCount = document.getElementById('musescoreCount');
    if (!musescoreList || !musescoreCount) return;

    // Conta quantos itens .musescore-item existem dentro da lista
    const count = musescoreList.querySelectorAll('.musescore-item').length;
    musescoreCount.textContent = count;
    musescoreCount.style.opacity = count === 0 ? '0.5' : '1';
}

function toggleMusescore() {
    const musescoreList = document.getElementById('musescoreList');
    const toggleBtn     = document.getElementById('musescoreToggleBtn');
    if (!musescoreList || !toggleBtn) return;

    if (musescoreList.classList.contains('hidden')) {
        musescoreList.classList.remove('hidden');
        toggleBtn.textContent = 'Ocultar';
        localStorage.setItem('musescoreVisible', 'true');
    } else {
        musescoreList.classList.add('hidden');
        toggleBtn.textContent = 'Mostrar';
        localStorage.setItem('musescoreVisible', 'false');
    }
}

function loadMusescoreState() {
    const musescoreList = document.getElementById('musescoreList');
    const toggleBtn     = document.getElementById('musescoreToggleBtn');
    if (!musescoreList || !toggleBtn) return;

    // Padrão: oculto (mostrar só quando o usuário clicar)
    const savedState = localStorage.getItem('musescoreVisible');
    if (savedState === 'true') {
        musescoreList.classList.remove('hidden');
        toggleBtn.textContent = 'Ocultar';
    } else {
        musescoreList.classList.add('hidden');
        toggleBtn.textContent = 'Mostrar';
    }
}

function initMusescore() {
    updateMusescoreCount();
    loadMusescoreState();

    const header    = document.getElementById('musescoreHeader');
    const toggleBtn = document.getElementById('musescoreToggleBtn');

    if (header) {
        header.addEventListener('click', function (e) {
            if (e.target === toggleBtn || (toggleBtn && toggleBtn.contains(e.target))) return;
            toggleMusescore();
        });
    }
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleMusescore();
        });
    }
}

// =========================================================
// Inicializar tudo
// =========================================================
initTheme();
loadHinos();
initNotices();
initMusescore();
