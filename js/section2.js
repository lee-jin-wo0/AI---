// 1. 카드 스크롤 진입 감지기
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active'); 
        }
    });
}, { threshold: 0.4, rootMargin: "0px 0px -10% 0px" });

document.querySelectorAll('.sc2-scroll-reveal').forEach(el => revealObserver.observe(el));


// 2. 섹션 2 GeoJSON 연동 지도 로직
async function initSection2Map() {
    const mapS2 = L.map('map-s2', { zoomControl: false, scrollWheelZoom: false }).setView([37.5759, 126.9850], 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '© OpenStreetMap' }).addTo(mapS2);
    
    try {
        const response = await fetch('./data/section2.geojson');
        const geojsonData = await response.json();
        
        const targetIds = ["43", "13", "70", "20", "37", "42", "40"];
        const locationsS2 = [];

        geojsonData.features.forEach(feature => {
            const featureId = String(feature.id); 
            
            if (targetIds.includes(featureId)) {
                let coords = null;
                if (feature.geometry.type === 'Point') {
                    coords = feature.geometry.coordinates;
                } else if (feature.geometry.type === 'GeometryCollection') {
                    const pointGeo = feature.geometry.geometries.find(g => g.type === 'Point');
                    if (pointGeo) coords = pointGeo.coordinates;
                }

                if (coords) {
                    locationsS2.push({
                        id: featureId,
                        pos: [coords[1], coords[0]],
                        label: feature.properties.CONTENTS_NAME
                    });
                }
            }
        });

        const visibleMarkersS2 = new Set();

        locationsS2.forEach(loc => {
            const stepNumber = targetIds.indexOf(loc.id) + 1;
            
            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `
                    <div class='sc2-marker-wrapper sc2-marker-hidden' id='map-marker-container-${loc.id}'>
                        <div class='sc2-marker-circle'>${stepNumber}</div>
                        <div class='sc2-marker-label'>${loc.label}</div>
                    </div>
                `,
                iconSize: [30, 42], iconAnchor: [15, 42]
            });
            L.marker(loc.pos, { icon }).addTo(mapS2);
        });

        // 카드가 화면 중간쯤 왔을 때 지도 이동 & 마커 애니메이션 실행
        const markerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = String(entry.target.getAttribute('data-marker'));
                    
                    if (id && !visibleMarkersS2.has(id)) {
                        visibleMarkersS2.add(id);
                        const container = document.getElementById(`map-marker-container-${id}`);
                        
                        if (container) {
                            container.classList.remove('sc2-marker-hidden');
                            container.classList.add('sc2-marker-visible', 'sc2-marker-animate');
                            
                            const loc = locationsS2.find(l => l.id === id);
                            // 카드가 좌측에 있으므로, 지도를 살짝 우측으로 치우치게 이동 (경도 보정)
                            // 지도 크기, 모바일/PC 여부에 따라 0.002 값을 조절하시면 됩니다.
                            if (loc) {
                                const offsetPos = [loc.pos[0], loc.pos[1] + 0.003]; 
                                mapS2.panTo(offsetPos, { animate: true, duration: 1.2 });
                            }
                        }
                    }
                }
            });
        }, { threshold: 0.5, rootMargin: "-20% 0px -20% 0px" });
        
        document.querySelectorAll('.sc2-timeline-item').forEach(item => markerObserver.observe(item));

    } catch (error) {
        console.error('GeoJSON 데이터 로드 에러:', error);
    }
}

initSection2Map();