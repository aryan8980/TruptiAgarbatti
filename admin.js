document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the login page or dashboard
    const loginForm = document.getElementById('loginForm');
    const dashboard = document.getElementById('dashboard');

    // --- Login Logic ---
    if (loginForm) {
        // Clear previous session on load
        sessionStorage.removeItem('adminLoggedIn');

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const pin = document.getElementById('pin').value;
            // Updated PIN as requested
            if (pin === '1402') {
                sessionStorage.setItem('adminLoggedIn', 'true');
                window.location.href = 'admin-dashboard.html';
            } else {
                alert('Invalid PIN');
            }
        });
    }

    // --- Dashboard Logic ---
    if (dashboard) {
        // Protect Route
        if (!sessionStorage.getItem('adminLoggedIn')) {
            window.location.href = 'admin.html';
            return;
        }

        initializeData();
        renderAdminProducts();

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            sessionStorage.removeItem('adminLoggedIn');
            window.location.href = 'admin.html';
        });

        // Add Product Logic
        const addProductForm = document.getElementById('addProductForm');
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = document.getElementById('addBtn');
            const status = document.getElementById('uploadStatus');
            const name = document.getElementById('pName').value;
            const category = document.getElementById('pCategory').value;
            const description = document.getElementById('pDesc').value;
            // Get URL input OR File input
            const urlInput = document.getElementById('pImage').value;
            const fileInput = document.getElementById('pImageFile');
            const file = fileInput.files[0];

            let imageUrl = urlInput || 'https://via.placeholder.com/600'; // Default

            // Disable button during process
            btn.disabled = true;
            btn.innerText = "Processing...";

            try {
                // HANDLE FILE UPLOAD
                if (file) {
                    status.innerText = "Uploading image...";

                    // CHECK IF FIREBASE STORAGE IS AVAILABLE
                    if (typeof storage !== 'undefined') {
                        // Firebase Upload
                        const storageRef = storage.ref();
                        const imageRef = storageRef.child(`products/${Date.now()}_${file.name}`);

                        await imageRef.put(file);
                        imageUrl = await imageRef.getDownloadURL();
                        console.log("Uploaded to Firebase:", imageUrl);
                    } else {
                        // Fallback: Convert to Base64 (Local Storage)
                        console.log("Firebase Storage not active. Using Base64 fallback.");
                        imageUrl = await toBase64(file);
                    }
                }

                const newProduct = {
                    id: Date.now(),
                    name,
                    category,
                    description,
                    image: imageUrl
                };

                // SAVE DATA (Firestore OR LocalStorage)
                if (typeof db !== 'undefined') {
                    status.innerText = "Saving to Database...";
                    // Save to Firebase Firestore
                    // Note: We use 'add' allowing auto-generated ID, but we also store our 'id' field for compatibility
                    // Or we can just use set with Custom ID. Let's use simple add.
                    await db.collection("products").add(newProduct);
                    console.log("Saved to Firestore");
                } else {
                    // Save to Local Storage
                    const storedProducts = JSON.parse(localStorage.getItem('products')) || [];
                    storedProducts.push(newProduct);
                    localStorage.setItem('products', JSON.stringify(storedProducts));
                    console.log("Saved to LocalStorage");
                }

                addProductForm.reset();
                renderAdminProducts();
                status.innerText = "Success!";
                setTimeout(() => status.innerText = "", 3000);
                alert('Product Added Successfully!');

            } catch (error) {
                console.error("Error adding product:", error);
                status.innerText = "Error: " + error.message;
                alert("Failed to add product: " + error.message);
            } finally {
                btn.disabled = false;
                btn.innerText = "Add Product";
            }
        });
    }
});

// Helper: Convert File to Base64
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

function initializeData() {
    // Only used for LocalStorage fallback initialization
    if (!localStorage.getItem('products') && typeof db === 'undefined') {
        localStorage.setItem('products', JSON.stringify(products));
    }
}

async function renderAdminProducts() {
    const tableBody = document.getElementById('productTableBody');
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';

    let storedProducts = [];

    // Fetch from Firebase if available
    if (typeof db !== 'undefined') {
        try {
            const snapshot = await db.collection("products").get();
            snapshot.forEach(doc => {
                const data = doc.data();
                // Add firestore doc ID if needed for deletion
                data._firestoreId = doc.id;
                storedProducts.push(data);
            });
        } catch (e) {
            console.error("Error fetching from Firestore", e);
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Error loading data. Check console.</td></tr>';
            return;
        }
    } else {
        // Fallback to LocalStorage
        storedProducts = JSON.parse(localStorage.getItem('products')) || [];
    }

    // Sort by Newest (using id timestamp)
    storedProducts.sort((a, b) => b.id - a.id);

    tableBody.innerHTML = '';

    if (storedProducts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No products found.</td></tr>';
        return;
    }

    storedProducts.forEach(p => {
        const row = document.createElement('tr');
        // If p._firestoreId exists, pass it as string, else pass p.id (number)
        const deleteId = p._firestoreId ? `'${p._firestoreId}'` : p.id;

        row.innerHTML = `
            <td><img src="${p.image}" alt="img"></td>
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td>${p.description.substring(0, 50)}...</td>
            <td>
                <button onclick="deleteProduct(${deleteId})" class="action-btn btn-delete">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Global Delete Function
window.deleteProduct = async function (id) {
    if (confirm('Are you sure you want to delete this product?')) {
        const btn = document.activeElement;
        if (btn) btn.disabled = true;

        try {
            if (typeof db !== 'undefined' && typeof id === 'string') {
                // Delete from Firestore
                await db.collection("products").doc(id).delete();
                console.log("Deleted from Firestore");
            } else {
                // Delete from LocalStorage (id is number)
                let storedProducts = JSON.parse(localStorage.getItem('products')) || [];
                storedProducts = storedProducts.filter(p => p.id !== id);
                localStorage.setItem('products', JSON.stringify(storedProducts));
            }

            // Refresh
            renderAdminProducts();
        } catch (e) {
            alert("Delete failed: " + e.message);
            if (btn) btn.disabled = false;
        }
    }
};
