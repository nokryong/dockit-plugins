# Dockit Plugins

[English](README.md) · 한국어

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
| 우리말 사전 | nokryong | https://github.com/nokryong/dockit-plugins/tree/main/plugins/dictionary |
| 달력 | nokryong | https://github.com/nokryong/dockit-plugins/tree/main/plugins/calendar |
| 음악 플레이어 | nokryong | https://github.com/nokryong/dockit-plugins/tree/main/plugins/music-player |

각 플러그인의 기능, 사용하는 서비스와 권한, 데이터 저장 위치는 플러그인 폴더의 `README.md`에 있습니다.

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

새 플러그인과 업데이트는 [기여 안내](CONTRIBUTING.ko.md)를 따라 PR로 제출하세요. 공통 API와 패키지 규격은 [Plugin SDK](https://github.com/nokryong/dockit-plugin-sdk)에서 관리합니다.
