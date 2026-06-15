document.addEventListener("DOMContentLoaded", function () {
    const dots = document.querySelectorAll('.global-dot');
    const sections = document.querySelectorAll('.scroll-section'); 

    // 1. 스크롤 감지 (Intersection Observer 수정)
    const observerOptions = {
        root: null,
        // 화면의 위아래 40%를 제외한 '가운데 20%' 영역에 섹션이 들어올 때만 감지합니다.
        // 이렇게 하면 화면에 두 섹션이 걸쳐 있어도, 무조건 중앙에 있는 섹션만 불이 켜집니다!
        rootMargin: '-40% 0px -40% 0px', 
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // HTML에 적어둔 data-section 숫자를 가져옵니다.
                const currentNum = entry.target.getAttribute('data-section');

                // 모든 닷의 불을 끄고, 현재 숫자에 맞는 닷만 켭니다.
                dots.forEach(dot => {
                    dot.classList.remove('active');
                    if (dot.getAttribute('data-target-section') === currentNum) {
                        dot.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    // 각 섹션을 observer에 등록
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