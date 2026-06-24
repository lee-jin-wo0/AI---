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