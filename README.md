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

## 개발

```sh
npm ci
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

