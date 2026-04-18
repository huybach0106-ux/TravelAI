document.addEventListener('DOMContentLoaded', () => {
    // --- 1. HIỆU ỨNG ĐỔI CHỮ ---
    const initWordRotation = () => {
        const words = document.querySelectorAll('.word');
        if (words.length === 0) return;

        let currentIndex = 0;
        setInterval(() => {
            const currentWord = words[currentIndex];
            currentIndex = (currentIndex + 1) % words.length;
            const nextWord = words[currentIndex];

            currentWord.classList.replace('active', 'exit');
            nextWord.classList.add('active');
            nextWord.classList.remove('exit');

            setTimeout(() => currentWord.classList.remove('exit'), 600);
        }, 3000);
    };

    // --- 2. LOGIC MODAL ---
    const initModal = () => {
        const modal = document.getElementById('loginModal');
        const openBtn = document.getElementById('openLogin');
        const closeBtn = document.getElementById('closeLogin');

        if (!modal || !openBtn) return;

        openBtn.onclick = () => modal.style.display = "block";
        if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
        
        window.onclick = (e) => {
            if (e.target === modal) modal.style.display = "none";
        };
    };

    // --- 3. LOGIC ĐĂNG NHẬP & BẢO MẬT ---
    const initAuth = () => {
        const loginBtn = document.getElementById('loginBtn');
        const emailInput = document.getElementById('emailInput');
        const isChatPage = window.location.pathname.includes('frontend/chatai.html');
        const currentUser = localStorage.getItem('userEmail');

       
        if (isChatPage && !currentUser) {
            window.location.href = 'index.html';
            return;
        }

       
        if (loginBtn && emailInput) {
            loginBtn.onclick = (e) => {
                e.preventDefault();
                const email = emailInput.value.trim();
                
                if (email) {
                    localStorage.setItem('userEmail', email);
                    window.location.href = 'frontend/chatai.html';
                } else {
                    alert("Cậu chưa nhập email kìa!");
                }
            };
        }
    };

    initWordRotation();
    initModal();
    initAuth();
});
