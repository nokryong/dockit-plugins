# Dockit Plugins

Dockit용 플러그인을 폴더별로 관리하는 저장소입니다. 등록과 업데이트는 PR 검토 후 병합합니다.

## 설치

Dockit Open의 **플러그인 → 플러그인 설치**에 다음 주소를 입력합니다.

```text
https://github.com/nokryong/dockit-plugins
```

여러 항목이 있으면 설치할 플러그인을 선택합니다. 개별 폴더 주소도 사용할 수 있습니다.

| 플러그인 | 작성자 | 설치 주소 |
|---|---|---|
| 주사위 | nokryong | https://github.com/nokryong/dockit-plugins/tree/main/plugins/dice |
| 이미지 검색 | nokryong | https://github.com/nokryong/dockit-plugins/tree/main/plugins/image-search |
| 국어사전 | nokryong | https://github.com/nokryong/dockit-plugins/tree/main/plugins/dictionary |
| 공공데이터 | nokryong | https://github.com/nokryong/dockit-plugins/tree/main/plugins/data-portal |
| PRISM 연구보고서 | nokryong | https://github.com/nokryong/dockit-plugins/tree/main/plugins/prism |
| 위키백과 | nokryong | https://github.com/nokryong/dockit-plugins/tree/main/plugins/wikipedia |
| 달력 | nokryong | https://github.com/nokryong/dockit-plugins/tree/main/plugins/calendar |
| 음악 플레이어 | nokryong | https://github.com/nokryong/dockit-plugins/tree/main/plugins/music-player |
| GeoJSON 지도 | nokryong | https://github.com/nokryong/dockit-plugins/tree/main/plugins/geojson-map |

이미지 검색은 SDK v2를 지원하는 Dockit Open과 Dockit Web에서 사용할 수 있습니다. 툴킷의 열쇠 버튼에서 본인의 [Pixabay API Key](https://pixabay.com/api/docs/)를 등록하세요. 검색 결과는 24시간 캐시합니다.

국어사전, 공공데이터, PRISM 연구보고서는 Dockit 서버(`https://dockit.kr/api/...`)를 거쳐 조회하므로 API Key가 필요 없습니다. 위키백과는 한국어 위키백과 공개 API를 사용합니다. 달력은 일정을 플러그인 저장소에 보관합니다. 음악 플레이어와 GeoJSON 지도는 사용자가 직접 연 로컬 파일만 사용하며, 음악 재생목록은 창을 닫으면 사라집니다.

## 개발

```sh
npm ci
npm test
npm run build
npm run check
```

```text
plugins/
  dice/
    manifest.json
    source/
    dist/
    THIRD_PARTY_NOTICES.txt
```

새 플러그인과 업데이트는 [기여 안내](CONTRIBUTING.md)를 따라 PR로 제출하세요. 공통 API와 패키지 규격은 [Plugin SDK](https://github.com/nokryong/dockit-plugin-sdk)에서 관리합니다.
