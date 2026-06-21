const db = firebase.firestore();
const auth = firebase.auth();

// প্রোফাইল পেজ ইনশিয়াল করার ফাংশন
async function initProfile() {
    // ইউজার অথেনটিকেশন চেক করা
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = "signin.html";
            return;
        }

        // ইউজারের ডাটা লোড করা
        try {
            const userDoc = await db.collection("users").doc(user.uid).get();
            
            const nameEl = document.getElementById('user-name');
            const emailEl = document.getElementById('user-email');
            const avatarEl = document.getElementById('user-avatar');

            if (userDoc.exists) {
                const userData = userDoc.data();
                nameEl.innerText = userData.name || "নাম নেই";
                emailEl.innerText = userData.email || user.email;
                
                if (userData.name) {
                    avatarEl.innerText = userData.name.charAt(0).toUpperCase();
                }
            } else {
                nameEl.innerText = user.displayName || "ব্যবহারকারী";
                emailEl.innerText = user.email;
                if (user.displayName) avatarEl.innerText = user.displayName.charAt(0).toUpperCase();
            }
        } catch (e) {
            console.error("ইউজার ডাটা এরর:", e);
        }

        // উইশলিস্ট গণনা করা
        try {
            const wishlistSnapshot = await db.collection("user_favorites")
                .where("user_id", "==", user.uid)
                .get();
            
            const countEl = document.getElementById('wishlist-count');
            if (countEl) {
                countEl.innerText = wishlistSnapshot.size;
            }
        } catch (e) {
            console.error("উইশলিস্ট কাউন্ট এরর:", e);
        }
    });
}

// লগআউট ফাংশন
function logout() {
    // লোডিং ইফেক্ট বাটনকে দেওয়া যায় চাইলে
    auth.signOut().then(() => {
        window.location.href = "signin.html";
    }).catch((error) => {
        console.error("লগআউট এরর:", error);
        alert("লগআউট করতে সমস্যা হয়েছে!");
    });
}

// ফাংশনটি চালু করা
initProfile();
