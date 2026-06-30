import './section1.js';
import './section2.js';
import './section3.js';
import './section4.js';
import './section5.js';
import './section6.js';

document.addEventListener("DOMContentLoaded", function () {
    const dots = document.querySelectorAll('.global-dot');
    const sections = document.querySelectorAll('.scroll-section');

    // 1. 스크롤 감지 (화면 가운데 20% 영역 기준)
    const observerOptions = {
        root: null,
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentNum = entry.target.getAttribute('data-section');

                dots.forEach(dot => {
                    dot.classList.remove('active');
                    if (dot.getAttribute('data-target-section') === currentNum) {
                        dot.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // 2. 닷 클릭 시 해당 섹션으로 부드럽게 스크롤 이동
    dots.forEach(dot => {
        dot.addEventListener('click', function () {
            const targetNum = this.getAttribute('data-target-section');
            const targetSection = document.querySelector(`.scroll-section[data-section="${targetNum}"]`);

            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

/* =======================================================
   플로팅 TOP 버튼 로직 (스크롤 감지 및 부드러운 이동)
======================================================= */
document.addEventListener("DOMContentLoaded", () => {
    const backToTopBtn = document.getElementById('backToTopBtn');

    if (backToTopBtn) {
        // 1. 스크롤 위치 감지하여 버튼 보이기/숨기기
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) { // 화면을 300px 이상 내리면
                backToTopBtn.classList.add('show');
            } else { // 다시 맨 위로 올라가면
                backToTopBtn.classList.remove('show');
            }
        });

        // 2. 버튼 클릭 시 맨 위로 부드럽게 스크롤
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});