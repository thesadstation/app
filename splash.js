window.addEventListener('load', async () => {
    const logoImg = document.getElementById('app-logo');

    try {
        // ফায়ারবেস থেকে ডাটা ফেচ করা
        const doc = await window.db.collection("site_branding").doc("site_branding").get();
        
        if (doc.exists) {
            const data = doc.data();
            
            if (data.logo_url) {
                logoImg.src = data.logo_url;
                console.log("Logo loaded successfully!");
            }
        }
    } catch (error) {
        console.error("Firebase load error:", error);
    }

    // ৩ সেকেন্ড পর 'get-started.html' এ রিডাইরেক্ট হবে
    setTimeout(() => {
        // এখানে আপনার গেট স্টার্টিং ফাইলের নাম দিন
        window.location.href = "get-started.html"; 
    }, 3000);
});
        
