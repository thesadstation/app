const db = firebase.firestore();
const auth = firebase.auth();
const list = document.getElementById('wishlist-list');

// গান ক্লিক করলে ইনডেক্স ফাইলে প্লে করার সিস্টেম
function playSongFromWishlist(songId) {
    localStorage.setItem('pendingPlayId', songId);
    window.location.href = 'home.html';
}

async function renderWishlist(user) {
    list.innerHTML = "<p style='text-align:center;'>লোড হচ্ছে...</p>";
    
    // ১. ইউজারের প্রিয় গানগুলো আনুন
    const favSnapshot = await db.collection("user_favorites").where("user_id", "==", user.uid).get();
    
    if (favSnapshot.empty) {
        list.innerHTML = "<p style='text-align:center;'>আপনার উইশলিস্ট খালি।</p>";
        return;
    }

    list.innerHTML = "";
    
    // ২. প্রতিটি ফেভারিট এর জন্য গানটি খুঁজুন
    for (const favDoc of favSnapshot.docs) {
        const favData = favDoc.data();
        
        // এখানে আমরা String হিসেবে আইডি নিচ্ছি এবং songs কালেকশনে খুঁজছি
        const songSnapshot = await db.collection("songs")
                                     .where("id", "==", String(favData.song_id)) 
                                     .get();
        
        // যদি String হিসেবে না পায়, তাহলে Number হিসেবে চেক করবে (ব্যাকআপ অপশন)
        const songSnapshot2 = songSnapshot.empty ? 
                             await db.collection("songs").where("id", "==", Number(favData.song_id)).get() : 
                             songSnapshot;

        if (!songSnapshot2.empty) {
            const song = songSnapshot2.docs[0].data();
            const div = document.createElement('div');
            div.className = 'track-card';
            div.innerHTML = `
                <img src="${song.thumbnail || 'default.jpg'}" class="thumb" onclick="playSongFromWishlist('${favData.song_id}')">
                <div class="track-info" onclick="playSongFromWishlist('${favData.song_id}')" style="flex-grow: 1; padding-left: 10px;">${song.title}</div>
                <button class="action-btn" onclick="removeFromWishlist('${favDoc.id}')">🗑️</button>
            `;
            list.appendChild(div);
        }
    }
}

async function removeFromWishlist(docId) {
    if (confirm("এই গানটি উইশলিস্ট থেকে সরাতে চান?")) {
        await db.collection("user_favorites").doc(docId).delete();
        renderWishlist(auth.currentUser);
    }
}

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        list.innerHTML = "<p style='text-align:center;'>উইশলিস্ট দেখতে লগইন করুন।</p>";
        return;
    }
    renderWishlist(user);
});
