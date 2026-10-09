(() => {
  const toggle = document.querySelector('.theme-toggle');
  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    toggle.textContent = theme === 'dark' ? 'Light' : 'Dark';
    toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  };
  let savedTheme;
  try { savedTheme = localStorage.getItem('researcher-theme'); } catch (_) {}
  applyTheme(savedTheme === 'dark' ? 'dark' : 'light');
  toggle.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    try { localStorage.setItem('researcher-theme', theme); } catch (_) {}
  });

  const clock = document.getElementById('brisbane-time');
  if (clock) {
    const updateClock = () => {
      const now = new Date();
      clock.textContent = new Intl.DateTimeFormat('en-AU', {
        timeZone: 'Australia/Brisbane', hour: '2-digit', minute: '2-digit', hour12: false
      }).format(now);
      clock.dateTime = now.toISOString();
    };
    updateClock();
    setInterval(updateClock, 60000);
  }

  const explorer = document.querySelector('.research-explorer');
  if (explorer) {
    const papers = [...explorer.querySelectorAll('.research-item')];
    const topics = [...explorer.querySelectorAll('.explorer-topics button')];
    const search = explorer.querySelector('#archive-search');
    const dialog = explorer.querySelector('.figure-dialog');
    const viewport = dialog.querySelector('.figure-dialog-image');
    const zoom = dialog.querySelector('.figure-zoom');
    let topic = 'all';
    let opener;
    const filter = () => {
      const query = search.value.trim().toLowerCase();
      papers.forEach(paper => {
        paper.hidden = !(topic === 'all' || paper.dataset.topic === topic) || !paper.dataset.search.toLowerCase().includes(query);
      });
      const visible = papers.filter(paper => !paper.hidden);
      const zh = document.documentElement.lang === 'zh';
      explorer.querySelector('.archive-count').textContent = zh ? `${visible.length} / ${papers.length} 篇论文` : `${visible.length} / ${papers.length} papers`;
      explorer.querySelector('.archive-empty').hidden = visible.length !== 0;
      explorer.querySelector('.further-research').hidden = !visible.some(paper => paper.classList.contains('research-item--text'));
      explorer.querySelector('.research-grid').hidden = !visible.some(paper => !paper.classList.contains('research-item--text'));
    };
    topics.forEach(button => button.addEventListener('click', () => {
      topic = button.dataset.topic;
      topics.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      filter();
    }));
    document.querySelectorAll('[data-explore]').forEach(link => link.addEventListener('click', () => {
      search.value = '';
      topics.find(button => button.dataset.topic === link.dataset.explore).click();
    }));
    search.addEventListener('input', filter);
    explorer.querySelectorAll('.research-image').forEach(button => button.addEventListener('click', () => {
      opener = button;
      const image = button.querySelector('img');
      dialog.querySelector('img').src = image.src;
      dialog.querySelector('img').alt = image.alt;
      dialog.querySelector('#figure-dialog-title').textContent = button.dataset.title;
      dialog.querySelector('.figure-position').textContent = button.dataset.caption;
      dialog.querySelector('.figure-source a').href = button.dataset.source;
      dialog.querySelector('.figure-paper-link').href = button.dataset.paper;
      viewport.classList.remove('is-zoomed');
      zoom.setAttribute('aria-pressed', 'false');
      dialog.showModal();
    }));
    dialog.querySelector('.figure-close').addEventListener('click', () => dialog.close());
    zoom.addEventListener('click', () => {
      zoom.setAttribute('aria-pressed', String(viewport.classList.toggle('is-zoomed')));
      viewport.scrollTo(0, 0);
    });
    dialog.addEventListener('close', () => { if (opener) opener.focus({ preventScroll: true }); });
    dialog.addEventListener('click', event => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
    });
    filter();
  }

  const search = document.getElementById('publication-search');
  if (!search) return;
  const year = document.getElementById('publication-year');
  const rows = [...document.querySelectorAll('.paper-row')];
  const filter = () => {
    const query = search.value.trim().toLowerCase();
    let count = 0;
    rows.forEach((row) => {
      row.hidden = !(row.textContent.toLowerCase().includes(query) && (!year.value || row.dataset.year === year.value));
      if (!row.hidden) count++;
    });
    document.getElementById('publication-count').textContent = `${count} / ${rows.length} publications`;
    document.getElementById('publication-empty').hidden = count !== 0;
  };
  search.addEventListener('input', filter);
  year.addEventListener('change', filter);
  document.getElementById('publication-reset').addEventListener('click', () => {
    search.value = ''; year.value = ''; filter(); search.focus();
  });
  document.querySelectorAll('.copy-citation').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.citation);
        button.textContent = 'Copied';
        setTimeout(() => { button.textContent = 'Copy citation'; }, 1800);
      } catch (_) { button.textContent = 'Copy unavailable'; }
    });
  });
})();
