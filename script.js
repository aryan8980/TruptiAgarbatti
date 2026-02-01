document.addEventListener('DOMContentLoaded', () => {
    // --- Mobile Menu Toggle ---
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            // Toggle icon
            const icon = menuToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // --- Render Products ---
    const productsContainer = document.querySelector('.products-grid');
    const filterBtns = document.querySelectorAll('.filter-btn');

    async function renderProducts(category = 'All') {
        if (!productsContainer) return;

        productsContainer.innerHTML = '<div style="text-align:center; width:100%; padding:20px;">Loading Products...</div>';

        // --- DYNAMIC DATA LOGIC ---
        let currentProducts = [];

        // 1. Try Firebase Firestore
        if (typeof db !== 'undefined') {
            try {
                const snapshot = await db.collection("products").get();
                snapshot.forEach(doc => {
                    currentProducts.push(doc.data());
                });
            } catch (e) {
                console.error("Firestore read error:", e);
            }
        }

        // 2. Fallback to Local Storage if Firebase didn't return anything (or not configured)
        if (currentProducts.length === 0) {
            let storedProducts = localStorage.getItem('products');
            if (storedProducts) {
                currentProducts = JSON.parse(storedProducts);
            } else {
                // 3. Fallback to default static file
                currentProducts = products;
            }
        }
        // ---------------------------

        productsContainer.innerHTML = '';

        const filteredProducts = category === 'All'
            ? currentProducts
            : currentProducts.filter(p => p.category === category);

        if (filteredProducts.length === 0) {
            productsContainer.innerHTML = '<p style="text-align:center; width:100%;">No products found in this category.</p>';
            return;
        }

        filteredProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
                </div>
                <div class="product-info">
                    <span class="category">${product.category}</span>
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <a href="#contact" onclick="prefillInquiry('${product.name}')" class="btn btn-primary" style="padding: 8px 20px; font-size: 0.9rem;">Refill Inquiry</a>
                </div>
            `;
            productsContainer.appendChild(card);
        });
    }

    // Initial Render
    renderProducts();

    // Filter Logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add to clicked
            btn.classList.add('active');

            renderProducts(btn.dataset.category);
        });
    });

    // --- Form Handling ---
    const inquiryForm = document.getElementById('inquiryForm');
    if (inquiryForm) {
        inquiryForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = new FormData(inquiryForm);
            const name = formData.get('name');
            const product = formData.get('product');
            const message = formData.get('message');

            // In a real app, this would verify with backend.
            // Here we construct a WhatsApp URL

            const phoneNumber = "918286724514"; // Updated to real business number
            const text = `Namaste, I am ${name}. I am interested in ${product}. ${message}`;
            const encodedText = encodeURIComponent(text);
            const waUrl = `https://wa.me/${phoneNumber}?text=${encodedText}`;

            window.open(waUrl, '_blank');

            // Visual feedback
            const btn = inquiryForm.querySelector('.submit-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Redirecting to WhatsApp...';
            btn.style.backgroundColor = '#25D366'; // WhatsApp Green

            setTimeout(() => {
                inquiryForm.reset();
                btn.innerHTML = originalText;
                btn.style.backgroundColor = '';
            }, 3000);
        });
    }

    // Smooth Scrolling for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Close mobile menu if open
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    menuToggle.querySelector('i').classList.remove('fa-times');
                    menuToggle.querySelector('i').classList.add('fa-bars');
                }

                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Helper to prefill form when clicking "Inquire" on a product
function prefillInquiry(productName) {
    const select = document.getElementById('product-select');
    if (select) {
        // Check if option exists, if not add it dynamically or just set value
        select.value = productName;
        // If exact match doesn't exist (e.g. because of simplified options), select "Other" or custom logic
        // For now, let's assume the user selects appropriately or we just scroll them there.
    }
}
