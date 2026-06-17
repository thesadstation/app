window.addEventListener('load', async () => {
    const logoImg = document.getElementById('app-logo');

    try {
        // এবার কালেকশন এবং ডকুমেন্ট উভয়ই 'site_branding'
        const doc = await window.db.collection("site_branding").doc("site_branding").get();
        
        if (doc.exists) {
            const data = doc.data();
            
            // ফিল্ডের নাম 'logo_url'
            if (data.logo_url) {
                logoImg.src = data.logo_url;
                console.log("Logo successfully loaded from site_branding -> site_branding");
            }
        }
    } catch (error) {
        console.error("Firebase load error (Check your Firestore Rules!):", error);
    }

    // ৩ সেকেন্ড পর মেইন পেজে রিডাইরেক্ট
    setTimeout(() => {
        window.location.href = "index.html";
    }, 3000);
});
