// 1. 카드 스크롤 진입/이탈 감지기
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        } else {
            entry.target.classList.remove('active');
        }
    });
}, { threshold: 0.4, rootMargin: "0px 0px -10% 0px" });

// 2. 섹션 2 GeoJSON 연동 및 통합 로직
async function initSection2Map() {
    const mapS2 = L.map('map-s2', { zoomControl: false, scrollWheelZoom: false }).setView([37.5759, 126.9850 - 0.01], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapS2);
    // L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    //     attribution: '© OpenStreetMap contributors'
    // }).addTo(mapS2);
    // L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    //     attribution: '© OpenStreetMap contributors'
    // }).addTo(mapS2);

    const pathLine = L.polyline([], {
        color: '#000000', weight: 3, dashArray: '8, 8', opacity: 1, lineJoin: 'round'
    }).addTo(mapS2);

    try {
        const response = await fetch('./data/section2.geojson');
        const geojsonData = await response.json();

        // 타임라인이 등장할 순서 지정
        const targetIds = ["43", "13", "70", "20", "37", "42", "40"];

        const timelineData = []; // GeoJSON에서 추출할 텍스트 데이터
        const locationsS2 = [];  // GeoJSON에서 추출할 좌표 데이터

        // 1. GeoJSON에서 타임라인 순서대로 데이터 추출
        targetIds.forEach(targetId => {
            const feature = geojsonData.features.find(f => String(f.id) === targetId);

            if (feature) {
                // [텍스트 추출] GeoJSON에 추가한 DATE, TITLE, DESC 속성을 불러옵니다.
                // (만약 아직 추가 안 하셨다면 우측의 기본값이 출력됩니다)
                timelineData.push({
                    id: targetId,
                    date: feature.properties.DATE || feature.properties.ADDR_OLD || "날짜 없음",
                    title: feature.properties.TITLE || feature.properties.CONTENTS_NAME || "위치 없음",
                    desc: feature.properties.DESC || feature.properties.VALUE_03 || "설명 정보가 없습니다."
                });

                // [좌표 추출]
                let coords = null;
                if (feature.geometry.type === 'Point') {
                    coords = feature.geometry.coordinates;
                } else if (feature.geometry.type === 'GeometryCollection') {
                    const pointGeo = feature.geometry.geometries.find(g => g.type === 'Point');
                    if (pointGeo) coords = pointGeo.coordinates;
                }

                if (coords) {
                    locationsS2.push({
                        id: targetId,
                        pos: [coords[1], coords[0]],
                        label: feature.properties.CONTENTS_NAME
                    });
                }
            }
        });

        // 2. 추출한 텍스트 데이터로 HTML 카드 동적 생성
        const timelineList = document.getElementById('sc2-timeline-list');
        timelineList.innerHTML = '';

        timelineData.forEach(item => {
            const cardHTML = `
                <div class="sc2-timeline-item sc2-scroll-reveal" data-marker="${item.id}">
                    <span class="sc2-item-date">${item.date}</span>
                    <h3 class="sc2-item-title">${item.title}</h3>
                    <p class="sc2-item-desc">${item.desc}</p>
                </div>
            `;
            timelineList.insertAdjacentHTML('beforeend', cardHTML);
        });

        // 카드 생성 완료 후 옵저버 연결
        document.querySelectorAll('.sc2-scroll-reveal').forEach(el => revealObserver.observe(el));

        const visibleMarkersS2 = new Set();

        // 3. 추출한 좌표 데이터로 지도 마커 세팅
        const markers = {}; // 마커 객체를 담을 변수 생성

        locationsS2.forEach(loc => {
            const stepNumber = targetIds.indexOf(loc.id) + 1;
            const feature = geojsonData.features.find(f => String(f.id) === loc.id);
            const address = feature.properties.COORD_DATA || "주소 정보 없음";

            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class='sc2-marker-wrapper sc2-marker-hidden' id='map-marker-container-${loc.id}'>
                <div class='sc2-marker-circle'>${stepNumber}</div>
                <div class='sc2-marker-label'>${loc.label}</div>
              </div>`,
                iconSize: [30, 42], iconAnchor: [15, 42]
            });

            const marker = L.marker(loc.pos, { icon }).addTo(mapS2);

            // 툴팁 생성 (처음에는 투명하게 설정)
            marker.bindTooltip(address, {
                permanent: true,
                direction: 'top',
                className: 'sc2-marker-tooltip sc2-tooltip-hidden', // 기본 hidden 클래스 추가
                offset: [0, -40]
            });

            markers[loc.id] = { marker, tooltip: marker.getTooltip() };
        });

        // 4. 스크롤 위치에 따른 마커/연결선 렌더링 로직 (완전 교체 - 오류 수정 버전)
        const markerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const activeId = String(entry.target.getAttribute('data-marker'));
                    const activeIndex = targetIds.indexOf(activeId); // 현재 카드가 몇 번째인지 파악

                    // 1. 툴팁 제어: 현재 카드의 툴팁만 켜고 나머지는 모두 숨김
                    Object.keys(markers).forEach(key => {
                        const tooltipEl = markers[key]?.tooltip?.getElement();
                        if (tooltipEl) {
                            if (key === activeId) {
                                tooltipEl.classList.remove('sc2-tooltip-hidden');
                            } else {
                                tooltipEl.classList.add('sc2-tooltip-hidden');
                            }
                        }
                    });

                    // 2. 마커 누적 제어: 현재 순서(activeIndex) 이하의 마커만 켜고, 나머지는 강제 숨김
                    targetIds.forEach((id, index) => {
                        const container = document.getElementById(`map-marker-container-${id}`);
                        if (container) {
                            if (index <= activeIndex) {
                                // 현재 순서보다 같거나 이전이면 보이기 (번호 누적 유지)
                                if (container.classList.contains('sc2-marker-hidden')) {
                                    container.classList.remove('sc2-marker-hidden');
                                    container.classList.add('sc2-marker-visible', 'sc2-marker-animate');
                                }
                            } else {
                                // 현재 순서보다 나중이면 강제 숨기기 (스크롤 올렸을 때 잔상 완벽 제거)
                                container.classList.remove('sc2-marker-visible', 'sc2-marker-animate');
                                container.classList.add('sc2-marker-hidden');
                            }
                        }
                    });

                    // 3. 연결선(점선) 업데이트: 활성화된 마커들끼리만 선 연결
                    const visibleCoords = targetIds
                        .filter((_, index) => index <= activeIndex)
                        .map(id => locationsS2.find(l => l.id === id)?.pos)
                        .filter(Boolean); // undefined 방지

                    pathLine.setLatLngs(visibleCoords);
                }
            });
        }, { threshold: 0.5, rootMargin: "-20% 0px -20% 0px" });

        // 이전에 등록된 옵저버가 있다면 해제하고 다시 연결할 수 있도록 요소를 다시 선택
        document.querySelectorAll('.sc2-timeline-item').forEach(item => markerObserver.observe(item));

    }
    catch (error) {
        console.error('GeoJSON 데이터를 불러오는 중 오류 발생:', error);
    }
}
initSection2Map();
