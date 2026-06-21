const db = firebase.firestore();
const blogList = document.getElementById('blog-list');
const nextBtn = document.getElementById('next-btn');
const paginationContainer = document.getElementById('pagination-container');

let lastVisible = null;
const PAGE_SIZE = 10;

async function loadBlogs(searchTerm = "") {
    blogList.innerHTML = "<p style='text-align:center;'>ব্লগ লোড হচ্ছে...</p>";
    
    let query = db.collection("posts").limit(PAGE_SIZE);
    
    try {
        const snapshot = await query.get();
        blogList.innerHTML = "";
        lastVisible = snapshot.docs[snapshot.docs.length - 1];

        renderBlogs(snapshot, searchTerm);
        paginationContainer.style.display = snapshot.size === PAGE_SIZE ? 'block' : 'none';
    } catch (error) { console.error("এরর:", error); }
}

function renderBlogs(snapshot, searchTerm) {
    snapshot.forEach(doc => {
        const post = doc.data();
        if (searchTerm && post.metaDesc && !post.metaDesc.toLowerCase().includes(searchTerm.toLowerCase())) return;

        const div = document.createElement('div');
        div.className = 'blog-card';
        div.innerHTML = `
            <img src="${post.thumbnail || 'default.jpg'}" onclick="openModal('${post.thumbnail}')" style="width:100%; border-radius:10px; cursor:pointer;">
            <div class="blog-title" style="margin-top:10px;">${post.metaDesc || 'শিরোনামহীন'}</div>
            <div class="blog-content">${post.content ? post.content.substring(0, 100) : ''}...</div>
            <br>
            <a href="blog-details.html?slug=${post.slug}" style="color: #d81b60; font-weight: 600; text-decoration: none;">পুরো পড়ুন →</a>
        `;
        blogList.appendChild(div);
    });
}

// নেক্সট বাটন লজিক
nextBtn.addEventListener('click', async () => {
    const snapshot = await db.collection("posts").startAfter(lastVisible).limit(PAGE_SIZE).get();
    if (!snapshot.empty) {
        lastVisible = snapshot.docs[snapshot.docs.length - 1];
        renderBlogs(snapshot, "");
        if (snapshot.size < PAGE_SIZE) paginationContainer.style.display = 'none';
    }
});

// সার্চ লজিক
document.getElementById('search-bar').addEventListener('input', (e) => loadBlogs(e.target.value));

function openModal(imgUrl) {
    const modal = document.createElement('div');
    modal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); display:flex; align-items:center; justify-content:center; z-index:2000;";
    modal.innerHTML = `<img src="${imgUrl}" style="max-width:90%; max-height:80%; border-radius:10px;">`;
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
}

loadBlogs();
          
