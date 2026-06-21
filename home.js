const db = firebase.firestore();
const auth = firebase.auth();

const list = document.getElementById('music-list');
const playerContainer = document.getElementById('player-container');
const audio = document.getElementById('audio-player');
const playingTitle = document.getElementById('playing-title');
const searchBar = document.getElementById('search-bar');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const totalDurationEl = document.getElementById('total-duration');

let playlist = []; 
let currentIdx = 0;

// ডাউনলোড বাটনের নতুন লজিক
function confirmDownload() {
    const confirmation = confirm("গানটি ডাউনলোড করতে আমাদের অফিসিয়াল সাইট (thesadstation.com) ভিজিট করতে হবে। আপনি কি যেতে চান?");
    if (confirmation) {
        window.open("https://thesadstation.com", "_blank");
    }
}

// লোগো লজিক মুছে দেওয়া হয়েছে, শুধুমাত্র ব্যানার লোড হবে (যদি থাকে)
async function loadBrandBranding() {
    try {
        const doc = await db.collection("site_branding").doc("site_branding").get();
        if (doc.exists) {
            const data = doc.data();
            const banner = document.getElementById('main-banner');
            if (data.banner_url && banner) { banner.src = data.banner_url; banner.style.display = "block"; }
        }
    } catch (error) { console.error("ব্র্যান্ডিং লোড সমস্যা:", error); }
}

async function loadSongs() {
    // অফলাইন চেক সিস্টেম
    if (!navigator.onLine) {
        list.innerHTML = `
            <div style="text-align:center; padding:50px; color:white; font-family:sans-serif;">
                <h3 style="margin-bottom:10px;">আপনি এখন অফলাইনে আছেন</h3>
                <p>দয়া করে ইন্টারনেট কানেকশন চালু করুন</p>
                <button onclick="location.reload()" style="margin-top:15px; padding:10px 20px; border-radius:20px; border:none; background:#ffeb3b; color:#333; font-weight:bold; cursor:pointer;">আবার চেষ্টা করুন</button>
            </div>
        `;
        return;
    }

    list.innerHTML = "<p>গান লোড হচ্ছে...</p>";
    const snapshot = await db.collection("songs").get();
    list.innerHTML = "";
    playlist = []; 

    snapshot.forEach(doc => {
        const songData = doc.data();
        const songId = String(songData.id || doc.id); 
        const song = { id: songId, ...songData };
        playlist.push(song);

        const div = document.createElement('div');
        div.className = 'track-card';
        div.innerHTML = `
            <img src="${songData.thumbnail || 'default.jpg'}" class="thumb" onclick="playSong(${playlist.length - 1})">
            <div class="track-info" onclick="playSong(${playlist.length - 1})">
                <div class="track-title">${songData.title}</div>
            </div>
            <div class="card-actions">
                <button id="heart-${songId}" class="action-btn" onclick="toggleWishlist('${songId}')">🤍</button>
                <button class="action-btn" onclick="confirmDownload()">⬇️</button>
                <button class="action-btn" onclick="shareSong('${songData.title}')">🔗</button>
            </div>
        `;
        list.appendChild(div);
        
        if (auth.currentUser) updateHeartIcon(songId, auth.currentUser.uid);
    });
}

async function updateHeartIcon(songId, uid) {
    const stringId = String(songId);
    const query = await db.collection("user_favorites")
        .where("user_id", "==", uid)
        .where("song_id", "==", stringId)
        .get();
    const btn = document.getElementById(`heart-${stringId}`);
    if (btn) btn.innerText = query.empty ? "🤍" : "❤️";
}

async function toggleWishlist(songId) {
    const user = auth.currentUser;
    if (!user) { alert("লগইন করুন।"); window.location.href = "login.html"; return; }
    
    const stringId = String(songId);
    const ref = db.collection("user_favorites");
    const query = await ref.where("user_id", "==", user.uid).where("song_id", "==", stringId).get();
    const btn = document.getElementById(`heart-${stringId}`);

    if (query.empty) {
        await ref.add({ 
            user_id: user.uid, 
            song_id: stringId, 
            timestamp: firebase.firestore.FieldValue.serverTimestamp() 
        });
        btn.innerText = "❤️";
    } else {
        await query.docs[0].ref.delete();
        btn.innerText = "🤍";
    }
}

function playSong(index) {
    currentIdx = index;
    const song = playlist[index];
    audio.src = song.audio; 
    playingTitle.innerText = song.title;
    playerContainer.style.display = "block";
    const playBtn = document.getElementById('play-pause-btn');
    if(playBtn) playBtn.innerText = "⏸️";
    audio.load(); audio.play();
}

function closePlayer() { audio.pause(); playerContainer.style.display = "none"; }
audio.addEventListener('timeupdate', () => {
    const { currentTime, duration } = audio;
    if (duration) {
        progressBar.value = (currentTime / duration) * 100;
        let curMin = Math.floor(currentTime / 60); let curSec = Math.floor(currentTime % 60);
        currentTimeEl.innerText = `${curMin}:${curSec < 10 ? '0' : ''}${curSec}`;
        let durMin = Math.floor(duration / 60); let durSec = Math.floor(duration % 60);
        totalDurationEl.innerText = `${durMin}:${durSec < 10 ? '0' : ''}${durSec}`;
    }
});
progressBar.oninput = () => { audio.currentTime = (progressBar.value * audio.duration) / 100; };
function togglePlayPause() {
    const btn = document.getElementById('play-pause-btn');
    if (audio.paused) { audio.play(); btn.innerText = "⏸️"; } else { audio.pause(); btn.innerText = "▶️"; }
}
function nextSong() { if (currentIdx < playlist.length - 1) playSong(currentIdx + 1); }
function prevSong() { if (currentIdx > 0) playSong(currentIdx - 1); }
audio.onended = () => nextSong();
function togglePlayerSize() {
    const player = document.getElementById('player-container');
    const btn = document.querySelector('.expand-btn');
    player.classList.toggle('mini-mode'); player.classList.toggle('full-mode');
    btn.innerText = player.classList.contains('full-mode') ? "⬇️" : "⬆️";
}
function shareSong(title) {
    if (navigator.share) navigator.share({ title: 'Sad Station', text: 'শুনুন: ' + title, url: window.location.href });
    else alert("লিঙ্ক কপি করা হয়েছে!");
}
searchBar.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.track-card').forEach(card => {
        const title = card.querySelector('.track-title').innerText.toLowerCase();
        card.style.display = title.includes(term) ? 'flex' : 'none';
    });
});

loadSongs();
loadBrandBranding();

window.addEventListener('load', () => {
    const pendingId = localStorage.getItem('pendingPlayId');
    if (pendingId) {
        setTimeout(() => {
            const index = playlist.findIndex(s => String(s.id) === String(pendingId));
            if (index !== -1) {
                currentIdx = index;
                const song = playlist[index];
                audio.src = song.audio; 
                playingTitle.innerText = song.title;
                playerContainer.style.display = "block";
                
                const playBtn = document.getElementById('play-pause-btn');
                if(playBtn) playBtn.innerText = "▶️";
                
                localStorage.removeItem('pendingPlayId');
            }
        }, 2000);
    }
});
        
