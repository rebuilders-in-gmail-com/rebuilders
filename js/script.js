const WEB3FORMS_ACCESS_KEY = 'd522d1f2-3f7e-40f6-860e-a623723f9fdc';

// ══ SCROLL TO SECTION ══
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ══ HAMBURGER ══
function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
  document.getElementById('hamburger').classList.toggle('open');
}
function closeMenu() {
  document.getElementById('navLinks').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
}

// ══ SCROLL REVEAL ══
// ══ PERFORMANCE-OPTIMIZED SCROLL REVEAL ══
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target); // Stop observing once visible to free up CPU
    }
  });
}, { threshold: 0.08, rootMargin: '50px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// ══ NAV SCROLL ANIMATION (THROTTLED WITH RAF & CACHED OFFSETS) ══
const NAV_SECTIONS = ['hero','about','process','initiatives','events','gallery','prayer','join'];
const sectionLinks = Array.from(document.querySelectorAll('.nav-links a')).filter(a => {
  return !a.classList.contains('nav-cta') && !a.getAttribute('href');
});

let sectionOffsets = [];
let isNavTicking = false;
let lastIdx = -1;

function cacheSectionOffsets() {
  sectionOffsets = NAV_SECTIONS.map(id => {
    const el = document.getElementById(id);
    return el ? el.offsetTop : 0;
  });
}

function getActiveIndex() {
  const scrollY = window.scrollY + 140;
  let active = 0;
  for (let i = 0; i < sectionOffsets.length; i++) {
    if (sectionOffsets[i] <= scrollY) active = i;
  }
  return active;
}

function updateNav() {
  const activeIdx = getActiveIndex();
  if (activeIdx === lastIdx) return;
  lastIdx = activeIdx;

  sectionLinks.forEach((a, i) => {
    a.classList.remove('nav-active', 'nav-past');
    if (i === activeIdx) {
      a.classList.add('nav-active');
    } else if (i < activeIdx) {
      a.classList.add('nav-past');
    }
  });
}

function onScroll() {
  if (!isNavTicking) {
    requestAnimationFrame(() => {
      updateNav();
      isNavTicking = false;
    });
    isNavTicking = true;
  }
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', cacheSectionOffsets, { passive: true });
window.addEventListener('load', cacheSectionOffsets, { passive: true });
cacheSectionOffsets();
updateNav(); // run on load

// Donation feature disabled per client request

// ══ DYNAMIC GALLERY GENERATOR & LOAD MORE ══
const galleryFolders = [
  { folder: 'youth-camps', prefix: 'camp-', count: 27, category: 'camp', label: 'Youth Camp' },
  { folder: 'fellowship', prefix: 'fellowship-', count: 23, category: 'fellowship', label: 'Fellowship' },
  { folder: 'team', prefix: 'team-', count: 10, category: 'team', label: 'Rebuilders Team' },
  { folder: 'worship', prefix: 'worship-', count: 15, category: 'worship', label: 'Worship & Prayer' }
];

let galleryData = [];
let galleryLoadedCount = 0;
const ITEMS_PER_LOAD = 9;
let currentGalleryFilter = 'camp'; // Default category

// Manual alignments for specific photos where faces are cut off
const imageAlignments = {
  'camp-16': 'top',
  'camp-18': '50% 25%',
  'fellowship-7': 'top',
  'fellowship-9': '50% 25%',
  'team-4': '50% 25%',
  'team-6': '50% 25%',
  'worship-1': 'top',
  'worship-3': '50% 25%',
  'worship-9': '50% 25%'
};

window.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  // 1. Generate all photo data objects
  galleryFolders.forEach(grp => {
    for (let i = 1; i <= grp.count; i++) {
      galleryData.push({
        folder: grp.folder,
        prefix: grp.prefix,
        index: i,
        category: grp.category,
        label: grp.label
      });
    }
  });

  // Apply initial filter based on active HTML button
  const activeBtn = document.querySelector('.gallery-section .filter-btn.active');
  if (activeBtn) {
    const match = activeBtn.getAttribute('onclick').match(/'([^']+)'/);
    if (match) currentGalleryFilter = match[1];
  }

  // 2. Render first batch
  renderGalleryBatch();

  // 3. Automatically check and update event statuses (Upcoming vs Past)
  updateEventStatuses();
});

function renderGalleryBatch() {
  const grid = document.getElementById('galleryGrid');
  const btn = document.getElementById('loadMoreBtn');
  if (!grid || !btn) return;
  
  // Filter the data based on current selection
  const filteredData = galleryData.filter(item => currentGalleryFilter === 'all' || item.category === currentGalleryFilter);
  
  // Get the next batch of 9 items
  const batch = filteredData.slice(galleryLoadedCount, galleryLoadedCount + ITEMS_PER_LOAD);
  const fragment = document.createDocumentFragment();
  
  batch.forEach((item, idx) => {
    const delay = (idx % ITEMS_PER_LOAD) * 0.04;
    const height = 180 + (item.index % 3) * 40; // Masonry varied heights
    
    const div = document.createElement('div');
    div.className = 'gallery-item reveal visible';
    div.setAttribute('data-category', item.category);
    div.setAttribute('data-label', item.label);
    div.setAttribute('data-title', ''); // Empty title since user requested removal
    div.setAttribute('onclick', 'openLightbox(this)');
    div.style.transitionDelay = `${delay}s`;

    const imageName = `${item.prefix}${item.index}`;
    const alignment = imageAlignments[imageName] || 'center';

    div.innerHTML = `
      <img class="gallery-thumb" src="assets/gallery/${item.folder}/${item.prefix}${item.index}.jpeg" alt="${item.label}" style="height:${height}px; object-fit:cover; object-position:${alignment};" loading="lazy" decoding="async" />
      <div class="gallery-overlay"><span>${item.label}</span></div>
    `;
    fragment.appendChild(div);
  });
  
  grid.appendChild(fragment);
  
  galleryLoadedCount += batch.length;
  
  // Hide button if all items in current filter are loaded
  if (galleryLoadedCount >= filteredData.length) {
    btn.style.display = 'none';
  } else {
    btn.style.display = 'inline-block';
  }
  
  // Update Lightbox items array so new items can be navigated
  lbItems = Array.from(document.querySelectorAll('.gallery-item')).filter(i => i.style.display !== 'none');
  setTimeout(cacheSectionOffsets, 100);
}

function loadMoreGallery() {
  renderGalleryBatch();
}

// ══ AUTO EVENT STATUS (UPCOMING vs PAST) ══
function updateEventStatuses() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  document.querySelectorAll('.event-card').forEach(card => {
    const endDateStr = card.getAttribute('data-end-date');
    if (!endDateStr) return;

    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    const badge = card.querySelector('.event-badge');
    const footer = card.querySelector('.event-footer');
    let typeAttr = card.getAttribute('data-type') || '';

    if (today > endDate) {
      // Event has concluded -> Automatically move to past
      typeAttr = typeAttr.replace(/\bupcoming\b/g, '').trim() + ' past';
      card.setAttribute('data-type', typeAttr.trim());
      card.classList.add('event-past-card');
      if (badge) {
        badge.className = 'event-badge badge-past';
        badge.textContent = 'Completed';
      }
      if (footer && card.querySelector('a.btn-primary')) {
        footer.innerHTML = '<span class="btn-past" style="color:rgba(255,255,255,0.4);border-color:rgba(255,255,255,0.15);font-weight:500;text-align:center;">Event Concluded</span>';
      }
    } else {
      // Event is upcoming
      if (!typeAttr.includes('upcoming')) {
        typeAttr = typeAttr.replace(/\bpast\b/g, '').trim() + ' upcoming';
        card.setAttribute('data-type', typeAttr.trim());
      }
      if (badge) {
        badge.className = 'event-badge badge-upcoming';
        badge.textContent = 'Upcoming';
      }
    }
  });
}

// ══ EVENTS FILTER ══
function filterEvents(btn, type) {
  document.querySelectorAll('.events-section .filter-bar .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.event-card').forEach(card => {
    const types = card.getAttribute('data-type') || '';
    card.style.display = (type === 'all' || types.includes(type)) ? 'flex' : 'none';
  });
}

// ══ GALLERY FILTER ══
function filterGallery(btn, cat) {
  document.querySelectorAll('.gallery-section .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  currentGalleryFilter = cat;
  galleryLoadedCount = 0;
  
  // Clear the grid and load the first batch of the new filter
  const grid = document.getElementById('galleryGrid');
  if(grid) grid.innerHTML = '';
  
  renderGalleryBatch();
}

// ══ LIGHTBOX ══
let lbItems = [], lbIdx = 0;
function openLightbox(el) {
  lbItems = Array.from(document.querySelectorAll('.gallery-item')).filter(i => i.style.display !== 'none');
  lbIdx = lbItems.indexOf(el);
  renderLb();
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function renderLb() {
  const el = lbItems[lbIdx];
  const label = el.getAttribute('data-label') || '';
  const title = el.getAttribute('data-title') || '';
  const imgEl = el.querySelector('img');
  const lbMedia = document.getElementById('lbMedia');
  if (imgEl) {
    lbMedia.innerHTML = `<img src="${imgEl.src}" alt="${title}" style="max-width:88vw;max-height:76vh;border-radius:18px;object-fit:contain;box-shadow:0 30px 80px rgba(0,0,0,0.7);">`;
  }
  document.getElementById('lbLabel').textContent = label;
  document.getElementById('lbTitle').textContent = title;
  const inner = document.getElementById('lbInner');
  inner.style.opacity = '0';
  inner.style.transform = 'scale(0.88) translateY(20px)';
  setTimeout(() => { inner.style.opacity = '1'; inner.style.transform = 'scale(1) translateY(0)'; }, 20);
}
function lbNav(dir) {
  lbIdx = (lbIdx + dir + lbItems.length) % lbItems.length;
  const inner = document.getElementById('lbInner');
  inner.style.opacity = '0';
  inner.style.transform = `scale(0.88) translateX(${dir > 0 ? 50 : -50}px)`;
  setTimeout(renderLb, 200);
}
function closeLightbox() {
  const inner = document.getElementById('lbInner');
  inner.style.opacity = '0';
  inner.style.transform = 'scale(0.82) translateY(30px)';
  setTimeout(() => { document.getElementById('lightbox').classList.remove('active'); document.body.style.overflow = ''; }, 350);
}
function closeLightboxOutside(e) { if (e.target.id === 'lightbox') closeLightbox(); }
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') lbNav(1);
  if (e.key === 'ArrowLeft') lbNav(-1);
});

// ══ PRAYER FORM ══
async function submitPrayer() {
  const fname = document.getElementById('fname').value.trim();
  const lname = document.getElementById('lname').value.trim();
  const email = document.getElementById('email').value.trim();
  const category = document.getElementById('category').value;
  const urgency = document.getElementById('urgency').value;
  const request = document.getElementById('request').value.trim();
  const anon = document.getElementById('anonymous').checked;
  if (!anon && !fname) { alert('Please enter your first name, or tick anonymous.'); return; }
  if (!category) { alert('Please select a prayer category.'); return; }
  if (!request) { alert('Please share your prayer request.'); return; }
  
  const submitBtn = document.querySelector('.submit-btn');
  const originalBtnText = submitBtn.innerHTML;

  // Set loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '🙏 &nbsp;Sending Request...';

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `New Prayer Request (${category})`,
        from_name: 'Rebuilders Prayer Cell',
        name: anon ? 'Anonymous' : `${fname} ${lname}`.trim(),
        email: email || 'no-email@rebuilders.in',
        category: category,
        urgency: urgency,
        request: request,
        anonymous: anon ? 'Yes' : 'No'
      })
    });

    const result = await response.json();

    if (response.status === 200 && result.success) {
      document.getElementById('formSection').style.display = 'none';
      document.getElementById('successMsg').style.display = 'block';
    } else {
      throw new Error(result.message || 'Something went wrong while submitting.');
    }
  } catch (error) {
    alert(`Submission failed: ${error.message}\nPlease try again.`);
  } finally {
    // Revert loading state
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}
function resetPrayerForm() {
  document.getElementById('formSection').style.display = 'block';
  document.getElementById('successMsg').style.display = 'none';
  document.getElementById('fname').value = '';
  document.getElementById('lname').value = '';
  document.getElementById('email').value = '';
  document.getElementById('category').value = '';
  document.getElementById('urgency').value = 'Regular — please pray when you can';
  document.getElementById('request').value = '';
  document.getElementById('anonymous').checked = false;
}

// ══ HIDE STICKY SOCIAL SIDEBAR ON FOOTER REACH ══
window.addEventListener('DOMContentLoaded', () => {
  const footerEl = document.querySelector('footer');
  const stickyBarEl = document.querySelector('.sticky-social-bar');
  
  if (footerEl && stickyBarEl) {
    const observerOptions = {
      root: null, // viewport
      threshold: 0.05 // triggers when 5% of the footer is visible
    };
    
    const footerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          stickyBarEl.classList.add('sidebar-hidden');
        } else {
          stickyBarEl.classList.remove('sidebar-hidden');
        }
      });
    }, observerOptions);
    
    footerObserver.observe(footerEl);
  }
});

