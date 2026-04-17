// =============================================================
// 1. CẤU HÌNH & BIẾN TOÀN CỤC (GLOBAL VARIABLES)
// =============================================================
mapboxgl.accessToken = "MAPBOX_TOKEN";

let map;
let currentMarkers = [];
let currentPlacesData = [];

// =============================================================
// 2. CÁC HÀM XỬ LÝ CHAT AI
// =============================================================

window.resetChat = function () {
    const chatMessages = document.getElementById("chat-messages");
    const welcomeScreen = document.getElementById("welcome-screen");
    const suggestionWrapper = document.getElementById("suggestion-wrapper");
    const chatInput = document.getElementById("chat-input");

    if (chatMessages) {
        chatMessages.innerHTML = "";
        chatMessages.style.display = "none";
    }
    if (welcomeScreen) welcomeScreen.style.display = "block";
    if (suggestionWrapper) suggestionWrapper.style.display = "flex";
    if (chatInput) chatInput.value = "";
};

window.sendMessage = async function (text) {
    const welcomeScreen = document.getElementById("welcome-screen");
    const chatMessages = document.getElementById("chat-messages");
    const suggestionWrapper = document.getElementById("suggestion-wrapper");

    if (welcomeScreen) welcomeScreen.style.display = "none";
    if (chatMessages) chatMessages.style.display = "flex";
    if (suggestionWrapper) suggestionWrapper.style.display = "none";

    appendBubble("user", text);

    const loadingId = "loading-" + Date.now();
    appendBubble("ai", "<i class='bx bx-loader-alt bx-spin'></i> Đang suy nghĩ...", loadingId);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch("http://127.0.0.1:5000/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text }),
        });
        const data = await response.json();
        document.getElementById(loadingId).innerHTML = data.response.replace(/\n/g, "<br>");
    } catch (err) {
        document.getElementById(loadingId).innerText = "Lỗi kết nối tới Backend AI!";
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

window.triggerSend = function () {
    const input = document.getElementById("chat-input");
    const val = input.value.trim();
    if (val !== "") {
        window.sendMessage(val);
        input.value = "";
    }
};

function appendBubble(sender, text, id = "") {
    const chatMessages = document.getElementById("chat-messages");
    const isUser = sender === "user";
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = isUser ? "flex-end" : "flex-start";

    const bubble = document.createElement("div");
    if (id) bubble.id = id;
    bubble.style.cssText = "max-width: 85%; padding: 12px 18px; border-radius: 18px; line-height: 1.6; font-size: 15px;";

    if (isUser) {
        bubble.style.backgroundColor = "#f4f4f4";
        bubble.style.color = "#111";
        bubble.style.borderBottomRightRadius = "4px";
        bubble.innerHTML = text;
    } else {
        bubble.style.backgroundColor = "transparent";
        bubble.style.color = "#111";
        bubble.innerHTML = `<strong><i class='bx bx-bot'></i> TravelAI</strong><br><br>${text}`;
    }

    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
}

// =============================================================
// 3. XỬ LÝ KHÁM PHÁ (MAP & PLACES)
// =============================================================

function renderData(data, keyword) {
    if (!data || !data.places) return;
    currentPlacesData = data.places;

    const container = document.getElementById("places-grid-container");
    const exploreTitle = document.getElementById("explore-title");
    if (!container) return;

    container.innerHTML = "";
    currentMarkers.forEach((m) => m.remove());
    currentMarkers = [];

    if (data.center) {
        map.flyTo({ center: data.center, zoom: 13.5, pitch: 45, speed: 1.2 });
    }

    data.places.forEach((p, index) => {
        const imgId = `img-place-${index}`;
        const savedPlaces = JSON.parse(localStorage.getItem("travelai_saved") || "[]");
        const isSaved = savedPlaces.some((item) => item.name === p.name);
        
        container.innerHTML += `
            <div class="place-card-grid" onclick="openPlaceDetail(${index})">
                <div class="card-img-box">
                    <img id="${imgId}" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="${p.name}">
                    <div class="top-right-actions">
                        <button onclick="toggleSavePlace(event, ${index}, '${imgId}')">
                            <i class='${isSaved ? "bx bxs-heart" : "bx bx-heart"}' style='${isSaved ? "color: #FF385C;" : "color: #333;"}'></i>
                        </button>
                        <button><i class='bx bx-plus'></i></button>
                    </div>
                </div>
                <div class="card-info-box">
                    <div class="title-rating"><h3>${p.name}</h3><span>★ ${p.rating}</span></div>
                    <p class="c-type"><i class='bx bx-map-pin'></i> ${p.type}</p>
                    <p class="c-loc">${p.location}</p>
                </div>
            </div>`;

        const marker = new mapboxgl.Marker({ color: "#111" })
            .setLngLat([parseFloat(p.lng), parseFloat(p.lat)])
            .addTo(map);
        currentMarkers.push(marker);

        // Load ảnh Wikipedia dự phòng
        const bulletproofFallback = `https://placehold.co/600x600/eeeeee/333333?text=${encodeURIComponent(p.name.substring(0, 18))}`;
        fetch(`https://vi.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(p.name)}&gsrlimit=1&prop=pageimages&pithumbsize=800&format=json&origin=*`)
            .then(res => res.json())
            .then(wiki => {
                const pages = wiki?.query?.pages;
                const imgUrl = pages ? pages[Object.keys(pages)[0]]?.thumbnail?.source : null;
                document.getElementById(imgId).src = imgUrl || bulletproofFallback;
            })
            .catch(() => { document.getElementById(imgId).src = bulletproofFallback; });
    });
    
    if (exploreTitle) exploreTitle.innerHTML = `Khám phá <i class='bx bx-chevron-down'></i>`;
}

window.openPlaceDetail = function (index) {
    const p = currentPlacesData[index];
    if (!p) return;

    const overlay = document.getElementById("wiki-overlay");
    const wikiContent = document.getElementById("wiki-content");
    const mapEl = document.getElementById("map");

    if (mapEl) {
        overlay.style.width = mapEl.offsetWidth + "px";
        overlay.style.left = mapEl.getBoundingClientRect().left + "px";
    }
    overlay.style.display = "flex";

    wikiContent.innerHTML = `<h1>${p.name}</h1><div style="text-align: center; padding: 50px;"><i class='bx bx-loader-alt bx-spin' style="font-size: 45px; color: #FF385C;"></i><p>Đang soạn cẩm nang AI...</p></div>`;

    fetch("http://127.0.0.1:5000/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place_name: p.name, location: p.location }),
    })
    .then(res => res.json())
    .then(data => { wikiContent.innerHTML = `<h1>${p.name}</h1>` + data.guide; })
    .catch(() => { wikiContent.innerHTML = `<h1>${p.name}</h1><p>Lỗi kết nối Backend!</p>`; });

    map.flyTo({ center: [parseFloat(p.lng), parseFloat(p.lat)], zoom: 16, pitch: 60, speed: 1.5 });
};

window.closeWiki = () => { document.getElementById("wiki-overlay").style.display = "none"; };

// =============================================================
// 4. HỆ THỐNG LƯU TRỮ (SAVED PLACES)
// =============================================================

window.toggleSavePlace = function (event, index, imgId) {
    event.stopPropagation();
    if (!currentPlacesData[index]) return;

    const p = currentPlacesData[index];
    const imgSrc = document.getElementById(imgId)?.src || "";
    let saved = JSON.parse(localStorage.getItem("travelai_saved") || "[]");
    const idx = saved.findIndex(item => item.name === p.name);
    const icon = event.currentTarget.querySelector("i");

    if (idx > -1) {
        saved.splice(idx, 1);
        icon.className = "bx bx-heart";
        icon.style.color = "#333";
    } else {
        saved.push({ name: p.name, location: p.location, imgSrc: imgSrc });
        icon.className = "bx bxs-heart";
        icon.style.color = "#FF385C";
    }
    localStorage.setItem("travelai_saved", JSON.stringify(saved));
    renderSavedPage();
};

window.renderSavedPage = function () {
    const container = document.getElementById("saved-container");
    if (!container) return;
    const grid = container.querySelector(".saved-grid");
    const empty = container.querySelector(".empty-state");
    const saved = JSON.parse(localStorage.getItem("travelai_saved") || "[]");

    if (saved.length === 0) {
        empty.style.display = "flex";
        grid.style.display = "none";
    } else {
        empty.style.display = "none";
        
        // Đoạn này cực kỳ quan trọng: ép hiển thị dạng lưới
        grid.style.display = "grid"; 
        
        grid.innerHTML = saved.map(p => `
            <div class="saved-item">
                <img src="${p.imgSrc}" alt="${p.name}">
                
                <button class="heart-btn" onclick="removeSavedPlace(\`${p.name}\`)">
                    <i class='bx bxs-heart'></i>
                </button>
                
                <div class="item-desc">
                    <h3>${p.name}</h3>
                    <p>${p.location}</p>
                </div>
            </div>`).join('');
    }
};

window.removeSavedPlace = function (name) {
    let saved = JSON.parse(localStorage.getItem("travelai_saved") || "[]");
    saved = saved.filter(item => item.name !== name);
    localStorage.setItem("travelai_saved", JSON.stringify(saved));
    renderSavedPage();
};

// =============================================================
// 5. KHỞI TẠO HỆ THỐNG (DOM LOADED)
// =============================================================

document.addEventListener("DOMContentLoaded", async function () {
// 1. Gọi API để lấy Key từ Backend
    try {
        const configRes = await fetch("http://127.0.0.1:5000/api/config");
        const configData = await configRes.json();
        mapboxgl.accessToken = configData.mapbox_token; // Nạp key xịn từ .env vào đây
    } catch (err) {
        console.error("Không lấy được Mapbox Token từ Backend!");
    }

    // 2. Sau khi có Key rồi mới khởi tạo Map
    map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [108.2022, 16.0544],
        zoom: 12,
        pitch: 45,
    });

    // Chuyển Tab
    const menuItems = document.querySelectorAll(".nav-menu li");
    menuItems.forEach((item) => {
        item.addEventListener("click", () => {
            menuItems.forEach((li) => li.classList.remove("active"));
            item.classList.add("active");
            const targetId = item.dataset.target;
            document.querySelectorAll(".view-section").forEach(v => v.style.display = "none");
            const targetView = document.getElementById(targetId);
            if (targetView) {
                targetView.style.display = "flex";
                if (targetId === "view-explore") setTimeout(() => map.resize(), 100);
            }
        });
    });

    // Search Input Explore
    const searchInput = document.getElementById("map-search-input");
    if (searchInput) {
        searchInput.addEventListener("keypress", async (e) => {
            if (e.key === "Enter") {
                const keyword = e.target.value.trim();
                if (!keyword) return;
                document.getElementById("explore-title").innerHTML = `Đang hỏi AI... <i class='bx bx-loader bx-spin'></i>`;
                try {
                    const res = await fetch("http://127.0.0.1:5000/api/search", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ keyword })
                    });
                    const data = await res.json();
                    renderData(data, keyword);
                } catch (err) { alert("Lỗi kết nối Backend!"); }
            }
        });
    }

    // Chat Input Enter
    const chatInput = document.getElementById("chat-input");
    if (chatInput) {
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") window.triggerSend();
        });
    }

    renderSavedPage();
});
