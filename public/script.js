document.addEventListener('DOMContentLoaded', function () {
    // Add burger menu to navbar (top-right)
    const navbar = document.querySelector('.navbar');
    if (navbar && !navbar.querySelector('.burger')) {
        const navLinks = navbar.querySelector('.nav-links');
        const burger = document.createElement('button');
        burger.className = 'burger';
        burger.setAttribute('aria-label', 'Menu');
        burger.setAttribute('aria-expanded', 'false');
        burger.type = 'button';
        burger.textContent = 'Menu';

        const panel = document.createElement('div');
        panel.className = 'menu-panel';

        const menuLinks = document.createElement('div');
        menuLinks.className = 'menu-links';

        if (navLinks) {
            const anchors = Array.from(navLinks.querySelectorAll('a'))
                .filter((a) => !a.classList.contains('logo'));
            anchors.forEach((a) => {
                const link = document.createElement('a');
                link.href = a.getAttribute('href') || '#';
                link.textContent = (a.textContent || '').trim() || link.href;
                menuLinks.appendChild(link);
            });
        }

        const menuAccount = document.createElement('div');
        menuAccount.className = 'menu-links';
        menuAccount.innerHTML = `
            <a href="hilfe.html">Hilfe</a>
            <a href="support.html">Support</a>
        `;

        const navSearch = navLinks ? navLinks.querySelector('#search-container') : null;
        const navSearchParent = navSearch ? navSearch.parentElement : null;
        let menuSearch = null;

        if (navSearch) {
            menuSearch = document.createElement('div');
            menuSearch.className = 'menu-search';
            panel.appendChild(menuSearch);
        }

        panel.appendChild(menuLinks);
        panel.appendChild(menuAccount);

        navbar.appendChild(burger);
        try { burger.textContent = String.fromCharCode(9776); } catch (e) { }
        navbar.appendChild(panel);

        function closePanel() {
            panel.classList.remove('open');
            burger.setAttribute('aria-expanded', 'false');
        }

        function syncMenuLayout() {
            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            if (navSearch && navSearchParent && menuSearch) {
                if (isMobile && navSearch.parentElement !== menuSearch) {
                    menuSearch.appendChild(navSearch);
                }
                if (!isMobile && navSearch.parentElement !== navSearchParent) {
                    navSearchParent.appendChild(navSearch);
                }
            }
            if (!isMobile) closePanel();
        }

        syncMenuLayout();
        window.addEventListener('resize', syncMenuLayout);

        burger.addEventListener('click', (e) => {
            e.stopPropagation();
            const willOpen = !panel.classList.contains('open');
            panel.classList.toggle('open');
            burger.setAttribute('aria-expanded', String(willOpen));
        });
        panel.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') closePanel();
        });
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && e.target !== burger) closePanel();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closePanel();
        });
    }
    // Overlay and navigation for enlarged cards
    const pageCards = Array.from(document.querySelectorAll('.cards-container .card'));
    let currentExpandedIndex = -1;

    const overlay = document.createElement('div');
    overlay.id = 'card-overlay';
    overlay.className = 'hidden';
    overlay.innerHTML = `
        <div class="overlay-backdrop"></div>
    `;
    document.body.appendChild(overlay);

    const controls = document.createElement('div');
    controls.id = 'card-controls';
    controls.className = 'hidden';
    controls.innerHTML = `
        <button class="overlay-close" aria-label="Schliessen">x</button>
        <button class="overlay-nav overlay-prev" aria-label="Vorherige Karte"><</button>
        <button class="overlay-nav overlay-next" aria-label="Naechste Karte">></button>
    `;
    document.body.appendChild(controls);

    const overlayBackdrop = overlay.querySelector('.overlay-backdrop');
    const btnClose = controls.querySelector('.overlay-close');
    const btnPrev = controls.querySelector('.overlay-prev');
    const btnNext = controls.querySelector('.overlay-next');
    try {
        btnClose.textContent = String.fromCharCode(215);
        btnPrev.textContent = String.fromCharCode(8249);
        btnNext.textContent = String.fromCharCode(8250);
    } catch (e) { }

    function closeExpanded() {
        const expanded = document.querySelector('.card.expanded');
        if (expanded) expanded.classList.remove('expanded');
    }

    function updateNavButtons() {
        btnPrev.style.display = currentExpandedIndex > 0 ? 'block' : 'none';
        btnNext.style.display = (currentExpandedIndex >= 0 && currentExpandedIndex < pageCards.length - 1) ? 'block' : 'none';
    }

    function openOverlayForIndex(index) {
        if (index < 0 || index >= pageCards.length) return;
        closeExpanded();
        currentExpandedIndex = index;
        const card = pageCards[currentExpandedIndex];
        card.classList.add('expanded');
        overlay.classList.remove('hidden');
        controls.classList.remove('hidden');
        updateNavButtons();
        const img = card.querySelector('img');
        if (img) img.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function openOverlayForCard(cardEl) {
        const idx = pageCards.indexOf(cardEl.closest('.card'));
        if (idx !== -1) openOverlayForIndex(idx);
    }

    function openOverlayForId(cardId) {
        const img = document.querySelector(`.card img[alt="${cardId}"]`);
        if (img) openOverlayForCard(img.closest('.card'));
    }

    function closeOverlay() {
        overlay.classList.add('hidden');
        controls.classList.add('hidden');
        currentExpandedIndex = -1;
        closeExpanded();
    }

    btnClose.addEventListener('click', closeOverlay);
    overlayBackdrop.addEventListener('click', closeOverlay);
    btnPrev.addEventListener('click', () => openOverlayForIndex(currentExpandedIndex - 1));
    btnNext.addEventListener('click', () => openOverlayForIndex(currentExpandedIndex + 1));

    pageCards.forEach(function (card) {
        card.addEventListener('click', function (e) {
            // Only applies on card listing pages; prevents accidental navigation if a card is an <a>
            if (card.tagName === 'A') e.preventDefault();
            openOverlayForCard(card);
        });
    });

    // Keyboard navigation while overlay is open
    document.addEventListener('keydown', function (event) {
        const expandedCard = document.querySelector('.card.expanded');
        if (!expandedCard) return;
        if (event.key === 'Escape') {
            closeOverlay();
        } else if (event.key === 'ArrowLeft') {
            openOverlayForIndex(currentExpandedIndex - 1);
        } else if (event.key === 'ArrowRight') {
            openOverlayForIndex(currentExpandedIndex + 1);
        }
    });

    // Card search functionality
    const searchInput = document.getElementById('card-search-input');
    const searchResults = document.getElementById('search-results');
    let cardsData = [];

    // Load card data from karten.json
    fetch('karten.json')
        .then(response => response.json())
        .then(data => {
            cardsData = data;
        })
        .catch(error => {
            console.error('Error loading card data:', error);
        });

    // Search function (ID-only)
    function searchCards(query) {
        if (!query) {
            searchResults.innerHTML = '';
            highlightCards('');
            return;
        }
        const q = query.trim().toLowerCase();
        const exact = q.match(/^(?:op)?(\d{2})-(\d{3})$/i);
        const onlyNum = q.match(/^(\d{3})$/);

        let results = [];
        if (exact) {
            const id = `OP${exact[1]}-${exact[2]}`;
            results = cardsData.filter(card => card.id.toLowerCase() === id.toLowerCase());
        } else if (onlyNum) {
            const number = onlyNum[1];
            // Only show cards that actually exist in karten.json
            results = cardsData.filter(card => card.id.endsWith(`-${number}`));
        } else {
            searchResults.innerHTML = '<p>Bitte Kartennummer eingeben (z.B. 123 oder OP01-123).</p>';
            return;
        }

        displayResults(results, onlyNum ? 'number' : 'exact');
        if (onlyNum) highlightCards(onlyNum[1]);
    }

    // Display search results
    function displayResults(results, mode = 'exact') {
        if (results.length === 0) {
            searchResults.innerHTML = '<p>No cards found.</p>';
            return;
        }
        if (mode === 'number') {
            // Render compact card tiles for all matching IDs across collections
            const tiles = results.map(card => {
                const id = card.id;
                const [collection, numStr] = id.split('-');
                const collectionLower = collection.toLowerCase();
                const num = parseInt(numStr, 10);
                const pageNum = Math.floor((num - 1) / 50) + 1;
                const pageUrl = pageNum === 1 ? `karten-${collectionLower}.html#${id}` : `karten-${collectionLower}-seite${pageNum}.html#${id}`;
                const imgSrc = `images/${id}.png`;
                return `<a class="card" href="${pageUrl}" title="${id}">
                            <img src="${imgSrc}" alt="${id}">
                            <p>${id}</p>
                        </a>`;
            }).join('');
            searchResults.innerHTML = `<div class="search-grid">${tiles}</div>`;
        } else {
            // Render simple links for exact result(s)
            const html = results.map(card => {
                const collection = card.id.split('-')[0].toLowerCase();
                const cardNumberStr = card.id.split('-')[1];
                const cardNumber = parseInt(cardNumberStr, 10);
                const pageNum = Math.floor((cardNumber - 1) / 50) + 1;
                const pageUrl = pageNum === 1 ? `karten-${collection}.html` : `karten-${collection}-seite${pageNum}.html`;
                const anchor = `#${card.id}`;
                return `<div class="search-result"><a href="${pageUrl}${anchor}">${card.id}</a></div>`;
            }).join('');
            searchResults.innerHTML = html;
        }
    }

    // Highlight matching cards on current page based on alt attribute
    function highlightCards(query) {
        const cards = document.querySelectorAll('.card img[alt]');
        const lowerQuery = query.trim().toLowerCase();
        cards.forEach(img => {
            const altText = img.getAttribute('alt').toLowerCase();
            if (altText.includes(lowerQuery)) {
                // Dark-mode friendly highlight
                img.parentElement.style.border = '1px solid #740404ff';
                img.parentElement.style.backgroundColor = 'rgba(1, 5, 10, 0.18)';
            } else {
                img.parentElement.style.border = '';
                img.parentElement.style.backgroundColor = '';
            }
        });
    }

    // If page opened with a hash like #OP01-051, open enlarged view directly
    function handleHashHighlight() {
        const rawHash = window.location.hash ? window.location.hash.substring(1) : '';
        const targetId = decodeURIComponent(rawHash).trim();
        if (!targetId) return;
        openOverlayForId(targetId);
    }

    // Listen for input events
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchCards(e.target.value);
        });

        // Listen for Enter key to trigger search / navigate
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = e.target.value;
                const q = value ? value.trim().toLowerCase() : '';
                const exact = q.match(/^(?:op)?(\d{2})-(\d{3})$/i);
                if (exact) {
                    const id = `OP${exact[1]}-${exact[2]}`;
                    const [collection, numStr] = id.split('-');
                    const num = parseInt(numStr, 10);
                    const pageNum = Math.floor((num - 1) / 50) + 1;
                    const collectionLower = collection.toLowerCase();
                    const url = pageNum === 1 ? `karten-${collectionLower}.html#${id}` : `karten-${collectionLower}-seite${pageNum}.html#${id}`;
                    window.location.href = url;
                } else {
                    searchCards(e.target.value);
                }
            }
        });
    }

    // Apply highlight if this page was opened via a search-result anchor
    handleHashHighlight();
    window.addEventListener('hashchange', handleHashHighlight);

    // Support inline onclick="toggleExpand(this)" in HTML (no-op wrapper)
    window.toggleExpand = function (el) {
        // Don't zoom on home page collection cards
        if (document.body.classList.contains('home')) {
            return;
        }
        const card = el && el.closest ? el.closest('.card') : null;
        if (card) {
            // Delegate to overlay-based enlarging
            openOverlayForCard(card);
        }
    };

    // ----- Basis-Seiten-Logik (Profil, Bestellungen, Support) -----
    const storage = {
        get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : (fallback ?? null); } catch { return fallback ?? null; } },
        set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { } }
    };

    // Profil: Daten laden/speichern
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        const nameInput = document.getElementById('profile-name');
        const emailInput = document.getElementById('profile-email');
        const statusEl = document.getElementById('profile-status');
        const profile = storage.get('profile', { name: '', email: '' });
        nameInput.value = profile.name || '';
        emailInput.value = profile.email || '';
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            storage.set('profile', { name: nameInput.value.trim(), email: emailInput.value.trim() });
            if (statusEl) { statusEl.textContent = 'Gespeichert'; setTimeout(() => statusEl.textContent = '', 2000); }
        });
    }

    // Passwort (Demo, nur lokal gespeichert)
    const pwdForm = document.getElementById('password-form');
    if (pwdForm) {
        const newEl = document.getElementById('pwd-new');
        const confirmEl = document.getElementById('pwd-confirm');
        const statusEl = document.getElementById('pwd-status');
        pwdForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (newEl.value !== confirmEl.value) { statusEl.textContent = 'PasswÃ¶rter stimmen nicht Ã¼berein.'; return; }
            if (newEl.value.length < 6) { statusEl.textContent = 'Mindestens 6 Zeichen.'; return; }
            storage.set('account.password', { setAt: Date.now() });
            statusEl.textContent = 'Passwort aktualisiert'; setTimeout(() => statusEl.textContent = '', 2000);
            newEl.value = ''; confirmEl.value = '';
        });
    }

    // Adressen verwalten
    function renderAddresses() {
        const list = document.getElementById('address-list');
        if (!list) return;
        const addrs = storage.get('addresses', []);
        list.innerHTML = addrs.length ? '' : '<p>Keine Adressen gespeichert.</p>';
        addrs.forEach((a, idx) => {
            const div = document.createElement('div');
            div.className = 'item';
            div.innerHTML = `<div class="meta">${a.name}, ${a.street}, ${a.zip} ${a.city}</div>
                             <div class="actions"><button class="btn" data-del="${idx}">LÃ¶schen</button></div>`;
            list.appendChild(div);
        });
        list.querySelectorAll('button[data-del]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-del'));
                const arr = storage.get('addresses', []);
                arr.splice(idx, 1);
                storage.set('addresses', arr);
                renderAddresses();
            });
        });
    }
    const addrForm = document.getElementById('address-form');
    if (addrForm) {
        renderAddresses();
        addrForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('addr-name').value.trim();
            const street = document.getElementById('addr-street').value.trim();
            const zip = document.getElementById('addr-zip').value.trim();
            const city = document.getElementById('addr-city').value.trim();
            const arr = storage.get('addresses', []);
            arr.push({ name, street, zip, city });
            storage.set('addresses', arr);
            addrForm.reset();
            renderAddresses();
        });
    }

    // Bestellungen anzeigen
    const ordersEl = document.getElementById('orders-list');
    if (ordersEl) {
        let orders = storage.get('orders');
        if (!orders) {
            orders = [
                { id: 'ORD-1001', date: '2025-01-12', status: 'Versandt', total: '49,90 CHF' },
                { id: 'ORD-1000', date: '2024-12-05', status: 'In Bearbeitung', total: '19,90 CHF' }
            ];
            storage.set('orders', orders);
        }
        const statusClass = (s) => {
            const t = s.toLowerCase();
            if (t.includes('versand')) return 'success';
            if (t.includes('bearbeit')) return 'pending';
            if (t.includes('storni')) return 'warn';
            return 'info';
        };
        const html = `<table class="orders-table">
            <thead><tr><th>Bestell-Nr.</th><th>Datum</th><th>Status</th><th>Summe</th></tr></thead>
            <tbody>
                ${orders.map(o => `<tr>
                    <td>${o.id}</td>
                    <td>${o.date}</td>
                    <td><span class="badge ${statusClass(o.status)}">${o.status}</span></td>
                    <td>${o.total}</td>
                </tr>`).join('')}
            </tbody>
        </table>`;
        ordersEl.innerHTML = html;
    }

    // Support-Formular (Server-Submit)
    const supportForm = document.getElementById('support-form');
    if (supportForm) {
        const status = document.getElementById('support-status');
        const params = new URLSearchParams(window.location.search);
        if (params.get('sent') === '1' && status) {
            status.textContent = 'Danke! Deine Nachricht wurde gesendet.';
            setTimeout(() => { status.textContent = ''; }, 4000);
        }
    }
});

