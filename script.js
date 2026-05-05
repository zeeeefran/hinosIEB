let allHinos = [];
let currentCategory = 'all';
let currentSearchTerm = '';

const sheetMusicGrid = document.getElementById('sheetMusicGrid');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const resultCountSpan = document.getElementById('resultCount');
const lastCommitDateSpan = document.getElementById('lastCommitDate');
const themeToggle = document.getElementById('themeToggle');

async function loadHinos() {
    try {
        const response = await fetch('hinos.json');
        if (!response.ok) throw new Error('Erro ao carregar hinos.json');
        allHinos = await response.json();
        renderHinos();
        getLastCommitDate();
    } catch (error) {
        console.error('Erro:', error);
        sheetMusicGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar as partituras</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">Verifique se o arquivo hinos.json existe</p>
            </div>
        `;
    }
}

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

function renderHinos() {
    const filtered = filterHinos();
    
    if (filtered.length === 0) {
        sheetMusicGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>Nenhuma partitura encontrada</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">Tente buscar por outro número ou instrumento</p>
            </div>
        `;
        resultCountSpan.textContent = '0 resultados';
        return;
    }
    
    resultCountSpan.textContent = `${filtered.length} ${filtered.length === 1 ? 'resultado' : 'resultados'}`;
    
    sheetMusicGrid.innerHTML = filtered.map(hino => {
        const pdfPath = `pdfs/${hino.categoria}/${hino.arquivo}`;
        
        return `
            <div class="sheet-card" data-pdf="${pdfPath}" data-numero="${hino.numero}" data-instrumento="${hino.instrumento}">
                <div class="card-info">
                    <div class="card-number">Hino ${hino.numero}</div>
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
    
    document.querySelectorAll('.sheet-card').forEach(card => {
        card.addEventListener('click', () => {
            const pdfPath = card.dataset.pdf;
            window.open(pdfPath, '_blank');
        });
    });
}

async function getLastCommitDate() {
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

searchInput.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value;
    clearSearchBtn.style.display = currentSearchTerm ? 'block' : 'none';
    renderHinos();
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearchTerm = '';
    clearSearchBtn.style.display = 'none';
    renderHinos();
});

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        renderHinos();
    });
});

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

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

initTheme();
loadHinos();
