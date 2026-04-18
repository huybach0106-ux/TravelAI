
// 1. CẤU HÌNH & BIẾN TOÀN CỤC 

const BASE_URL = "http://127.0.0.1:5000"; 
mapboxgl.accessToken = "MAPBOX_TOKEN";

let map;
let currentMarkers = [];
let currentPlacesData = [];

const getSavedPlaces = () => JSON.parse(localStorage.getItem("travelai_saved") || "[]");
const setSavedPlaces = (data) => localStorage.setItem("travelai_saved", JSON.stringify(data));

// 2. CÁC HÀM XỬ LÝ CHAT AI

window.resetChat = function () {
    const chatMessages = document.getElementById("chat-messages");
    if (chatMessages) {
        chatMessages.innerHTML = "";
        chatMessages.style.display = "none";
    }
    document.getElementById("welcome-screen").style.display = "block";
    
    const suggestionWrapper = document.getElementById("suggestion-wrapper");
    if(suggestionWrapper) suggestionWrapper.style.display = "flex";
    
    document.getElementById("chat-input").value = "";
};

window.sendMessage = async function (text) {
    // 1. CHUYỂN NGAY VỀ TAB CHAT 
    document.querySelectorAll(".view-section").forEach(v => v.style.display = "none");
    const viewChat = document.getElementById("view-chat");
    if (viewChat) viewChat.style.display = "flex";

    document.querySelectorAll(".nav-menu li").forEach(li => li.classList.remove("active"));
    const chatTabBtn = document.querySelector(".nav-menu li[data-target='view-chat']");
    if (chatTabBtn) chatTabBtn.classList.add("active");

    // 2. XỬ LÝ LOGIC CHAT
    const chatMessages = document.getElementById("chat-messages");
    document.getElementById("welcome-screen").style.display = "none";
    
    const suggestionWrapper = document.getElementById("suggestion-wrapper");
    if(suggestionWrapper) suggestionWrapper.style.display = "none";
    chatMessages.style.display = "flex";
    appendBubble("user", text);
    const loadingId = "loading-" + Date.now();
    appendBubble("ai", "<i class='bx bx-loader-alt bx-spin'></i> Đang suy nghĩ...", loadingId);
    setTimeout(() => chatMessages.scrollTop = chatMessages.scrollHeight, 50);

    try {
        const response = await fetch(`${BASE_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text }),
        });
        const data = await response.json();
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) {
            loadingEl.innerHTML = data.response.replace(/\n/g, "<br>");
        }
    } catch (err) {
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) {
            loadingEl.innerText = "Lỗi kết nối tới AI! (Lưu ý: Server chưa bật hoặc bị sập)";
        }
    }
    setTimeout(() => chatMessages.scrollTop = chatMessages.scrollHeight, 50);
};

window.triggerSend = function () {
    const input = document.getElementById("chat-input");
    const val = input.value.trim();
    if (val) {
        window.sendMessage(val);
        input.value = "";
    }
};

function appendBubble(sender, text, id = "") {
    const chatMessages = document.getElementById("chat-messages");
    if (!chatMessages) return; // Chống lỗi nếu không tìm thấy DOM
    
    const isUser = sender === "user";
    
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = isUser ? "flex-end" : "flex-start";

    const bubble = document.createElement("div");
    if (id) bubble.id = id;
    bubble.style.cssText = "max-width: 85%; padding: 12px 18px; border-radius: 18px; line-height: 1.6; font-size: 15px; margin-bottom: 10px;";

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

// 3. XỬ LÝ KHÁM PHÁ (MAP & PLACES)

window.triggerExploreSearch = async function () {
    const input = document.getElementById("map-search-input");
    const keyword = input.value.trim();
    if (!keyword) return;
    
    const exploreTitle = document.getElementById("explore-title");
    if (exploreTitle) exploreTitle.innerHTML = `AI đang tìm... <i class='bx bx-loader bx-spin'></i>`;
    
    try {
        const res = await fetch(`${BASE_URL}/api/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keyword })
        });
        renderData(await res.json(), keyword);
    } catch (err) { 
        alert("Server đang bận hoặc đang khởi động lại!"); 
        if (exploreTitle) exploreTitle.innerHTML = `Khám phá <i class='bx bx-chevron-down'></i>`;
    }
};

function renderData(data, keyword) {
    if (!data || !data.places) return;
    currentPlacesData = data.places;

    const container = document.getElementById("places-grid-container");
    if (!container) return;

    container.innerHTML = "";
    currentMarkers.forEach((m) => m.remove());
    currentMarkers = [];

    if (data.center && map) {
        map.flyTo({ center: data.center, zoom: 13.5, pitch: 45, speed: 1.2 });
    }

    const savedPlaces = getSavedPlaces();

    data.places.forEach((p, index) => {
        const imgId = `img-place-${index}`;
        const isSaved = savedPlaces.some((item) => item.name === p.name);
        container.innerHTML += `
            <div class="place-card-grid" onclick="openPlaceDetail(${index})">
                <div class="card-img-box">
                    <img id="${imgId}" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="${p.name}">
                    <div class="top-right-actions">
                        <button onclick="toggleSavePlace(event, ${index}, '${imgId}')">
                            <i class='${isSaved ? "bx bxs-heart" : "bx bx-heart"}' style='${isSaved ? "color: #FF385C;" : "color: #333;"}'></i>
                        </button>
                    </div>
                </div>
                <div class="card-info-box">
                    <div class="title-rating"><h3>${p.name}</h3></div>
                    <p class="c-type"><i class='bx bx-map-pin'></i> ${p.type}</p>
                    <p class="c-loc">${p.location}</p>
                </div>
            </div>`;

        if (map) {
            const marker = new mapboxgl.Marker({ color: "#111" })
                .setLngLat([parseFloat(p.lng), parseFloat(p.lat)])
                .addTo(map);
            currentMarkers.push(marker);
        }

        const bulletproofFallback = `https://placehold.co/600x600/eeeeee/333333?text=${encodeURIComponent(p.name.substring(0, 18))}`;
        fetch(`https://vi.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(p.name)}&gsrlimit=1&prop=pageimages&pithumbsize=800&format=json&origin=*`)
            .then(res => res.json())
            .then(wiki => {
                const pages = wiki?.query?.pages;
                const imgUrl = pages ? pages[Object.keys(pages)[0]]?.thumbnail?.source : null;
                const imgEl = document.getElementById(imgId);
                if(imgEl) imgEl.src = imgUrl || bulletproofFallback;
            })
            .catch(() => { 
                const imgEl = document.getElementById(imgId);
                if(imgEl) imgEl.src = bulletproofFallback; 
            });
    });
    
    const exploreTitle = document.getElementById("explore-title");
    if (exploreTitle) exploreTitle.innerHTML = `Khám phá <i class='bx bx-chevron-down'></i>`;
}

window.openPlaceDetail = function (index) {
    const p = currentPlacesData[index];
    if (!p) return;

    const overlay = document.getElementById("wiki-overlay");
    const wikiContent = document.getElementById("wiki-content");
    const mapEl = document.getElementById("map");

    if (overlay && mapEl) {
        overlay.style.width = mapEl.offsetWidth + "px";
        overlay.style.left = mapEl.getBoundingClientRect().left + "px";
        overlay.style.display = "flex";
    }

    if (wikiContent) {
        wikiContent.innerHTML = `<h1>${p.name}</h1><div style="text-align: center; padding: 50px;"><i class='bx bx-loader-alt bx-spin' style="font-size: 45px; color: #FF385C;"></i><p>AI đang viết cẩm nang...</p></div>`;
    }

    fetch(`${BASE_URL}/api/guide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place_name: p.name, location: p.location }),
    })
    .then(res => res.json())
    .then(data => { if(wikiContent) wikiContent.innerHTML = `<h1>${p.name}</h1>` + data.guide; })
    .catch(() => { if(wikiContent) wikiContent.innerHTML = `<h1>${p.name}</h1><p>Không kết nối được server!</p>`; });

    if (map) {
        map.flyTo({ center: [parseFloat(p.lng), parseFloat(p.lat)], zoom: 16, pitch: 60, speed: 1.5 });
    }
};

window.closeWiki = () => { 
    const overlay = document.getElementById("wiki-overlay");
    if(overlay) overlay.style.display = "none"; 
};

// 4. HỆ THỐNG LƯU TRỮ (SAVED PLACES)

window.toggleSavePlace = function (event, index, imgId) {
    event.stopPropagation();
    if (!currentPlacesData[index]) return;

    const p = currentPlacesData[index];
    const imgSrc = document.getElementById(imgId)?.src || "";
    let saved = getSavedPlaces();
    const idx = saved.findIndex(item => item.name === p.name);
    const icon = event.currentTarget.querySelector("i");

    if (idx > -1) {
        saved.splice(idx, 1);
        if(icon) {
            icon.className = "bx bx-heart";
            icon.style.color = "#333";
        }
    } else {
        saved.push({ name: p.name, location: p.location, imgSrc: imgSrc });
        if(icon) {
            icon.className = "bx bxs-heart";
            icon.style.color = "#FF385C";
        }
    }
    setSavedPlaces(saved);
    renderSavedPage();
};

window.renderSavedPage = function () {
    const container = document.getElementById("saved-container");
    if (!container) return;
    
    const grid = container.querySelector(".saved-grid");
    const empty = container.querySelector(".empty-state");
    if (!grid || !empty) return;

    const saved = getSavedPlaces();

    if (saved.length === 0) {
        empty.style.display = "flex";
        grid.style.display = "none";
    } else {
        empty.style.display = "none";
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
    let saved = getSavedPlaces().filter(item => item.name !== name);
    setSavedPlaces(saved);
    renderSavedPage();
};


// 5. KHỞI TẠO HỆ THỐNG GỘP CHUNG (DOM LOADED)

document.addEventListener("DOMContentLoaded", async function () {
    // --- 5.1 Khởi tạo Map & Lấy Config ---
    try {
        const configRes = await fetch(`${BASE_URL}/api/config`);
        const configData = await configRes.json();
        mapboxgl.accessToken = configData.mapbox_token; 
    } catch (err) {
        console.error("Lỗi lấy Token từ server!");
    }

    try {
        map = new mapboxgl.Map({
            container: "map",
            style: "mapbox://styles/mapbox/satellite-streets-v12",
            center: [108.2022, 16.0544],
            zoom: 12,
            pitch: 45,
        });
    } catch (e) {
        console.log("Map chưa sẵn sàng");
    }

    // --- 5.2 Xử lý Chuyển Tab ---
    const menuItems = document.querySelectorAll(".nav-menu li");
    menuItems.forEach((item) => {
        item.addEventListener("click", () => {
            if (item.id === "btn-show-noti") return;

            menuItems.forEach((li) => li.classList.remove("active"));
            item.classList.add("active");
            
            document.querySelectorAll(".view-section").forEach(v => v.style.display = "none");
            
            const targetId = item.dataset.target;
            if(targetId) {
                const targetView = document.getElementById(targetId);
                if (targetView) {
                    targetView.style.display = "flex";
                    if (targetId === "view-explore" && map) {
                        setTimeout(() => map.resize(), 100);
                    }
                }
            }
        });
    });

    // --- 5.3 Xử Lý Panel Thông Báo---
    const notiBtn = document.getElementById('btn-show-noti');
    const notiPanel = document.getElementById('view-notifications-panel');

    if (notiBtn && notiPanel) {
        notiBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); 
            
            const isShowing = notiPanel.style.display === 'flex';
            notiPanel.style.display = isShowing ? 'none' : 'flex';
            
            if(!isShowing) {
                document.querySelectorAll(".nav-menu li").forEach((li) => li.classList.remove("active"));
                notiBtn.classList.add('active');
            } else {
                notiBtn.classList.remove('active');
            }
        });

        document.addEventListener('click', function(event) {
            if (notiPanel.style.display === 'flex' && !notiPanel.contains(event.target) && !notiBtn.contains(event.target)) {
                notiPanel.style.display = 'none';
                notiBtn.classList.remove('active');
            }
        });
    }

    // --- 5.4 Xử lý Ô Tìm Kiếm & Nhập Chat ---
    const searchInput = document.getElementById("map-search-input");
    if (searchInput) {
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault(); 
                window.triggerExploreSearch();
            }
        });
    }

    const chatInput = document.getElementById("chat-input");
    if (chatInput) {
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") window.triggerSend();
        });
    }

    renderSavedPage();
});
