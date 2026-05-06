// Configuração
let allHinos = [];
let currentCategory = 'all';
let currentSearchTerm = '';

// Referências DOM
const sheetMusicGrid = document.getElementById('sheetMusicGrid');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const resultCountSpan = document.getElementById('resultCount');
const lastCommitDateSpan = document.getElementById('lastCommitDate');
const themeToggle = document.getElementById('themeToggle');

// Carregar dados do JSON
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

// Filtrar hinos
function filterHinos() {
    let filtered = allHinos;
    
    if (currentCategory !== 'all') {
        filtered = filtered.filter(hino => hino.categoria === currentCategory);
    }
    
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

// Renderizar hinos
function renderHinos() {
    if (!sheetMusicGrid) return;
    
    const filtered = filterHinos();
    
    if (filtered.length === 0) {
        sheetMusicGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>Nenhuma partitura encontrada</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">Tente buscar por outro número ou instrumento</p>
            </div>
        `;
        if (resultCountSpan) resultCountSpan.textContent = '0 resultados';
        return;
    }
    
    if (resultCountSpan) {
        resultCountSpan.textContent = `${filtered.length} ${filtered.length === 1 ? 'resultado' : 'resultados'}`;
    }
    
    sheetMusicGrid.innerHTML = filtered.map(hino => {
        const pdfPath = `pdfs/${hino.categoria}/${hino.arquivo}`;
        
        return `
            <div class="sheet-card" data-pdf="${pdfPath}" data-numero="${hino.numero}" data-instrumento="${hino.instrumento}">
                <div class="card-info">
                    <div class="card-number">${hino.numero.includes('Reino') ? hino.numero : 'Hino ' + hino.numero}</div>
                    <div class="card-details">
                        <span class="badge">${hino.parte}</span>
                        <span class="badge instrument-badge">${hino.instrumento}</span>
                        ${hino.atualizado ? '<span class="badge update-badge"><i class="fas fa-star"></i> Atualizado</span>' : ''}
                    </div>
                </div>
                <div class="card-action">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `;
    }).join('');
    
    // Adicionar eventos de clique nos cards
    document.querySelectorAll('.sheet-card').forEach(card => {
        card.addEventListener('click', () => {
            const pdfPath = card.dataset.pdf;
            if (pdfPath) window.open(pdfPath, '_blank');
        });
    });
}

// Obter data do último commit do GitHub
async function getLastCommitDate() {
    if (!lastCommitDateSpan) return;
    
    try {
        const response = await fetch('https://api.github.com/repos/zeeeefran/hinosIEB/commits?per_page=1');
        if (response.ok) {
            const commits = await response.json();
            if (commits.length > 0) {
                const lastCommit = new Date(commits[0].commit.committer.date);
                const formattedDate = lastCommit.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                });
                lastCommitDateSpan.innerHTML = `Última sincronização: ${formattedDate}`;
                return;
            }
        }
        throw new Error('Não foi possível obter a data');
    } catch (error) {
        console.error('Erro ao obter data do commit:', error);
        lastCommitDateSpan.innerHTML = 'Data da última sincronização não disponível';
    }
}

// Configurar busca instantânea
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value;
        if (clearSearchBtn) clearSearchBtn.style.display = currentSearchTerm ? 'block' : 'none';
        renderHinos();
    });
}

if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        currentSearchTerm = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        renderHinos();
    });
}

// Configurar abas de categoria
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        renderHinos();
    });
});

// Modo noturno
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

// Inicializar
initTheme();
loadHinos();
