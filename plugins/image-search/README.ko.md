# 이미지 검색

[English](README.md) · 한국어

Pixabay의 사진·일러스트·벡터를 검색하고, 크게 보거나 내려받습니다.

- ID: `dockit.image-search`
- 작성자: nokryong

## 사용 방법

1. 제목의 열쇠 버튼에서 본인의 [Pixabay API Key](https://pixabay.com/api/docs/)를 등록합니다.
2. 검색어를 입력해 검색합니다. 결과를 누르면 큰 미리보기가 열리고, 내려받기·복사·출처 페이지 열기를 할 수 있습니다.

## 통신과 권한

| 권한 | 용도 |
|---|---|
| `credentials` | 사용자의 Pixabay API Key를 호스트가 보관하고 요청에 붙입니다. 플러그인은 키 원문을 받지 않습니다. |
| `network` | `https://pixabay.com/api/`로 검색합니다. |
| `images` | `pixabay.com`, `cdn.pixabay.com`의 이미지를 불러옵니다. |
| `external` | Pixabay 출처·작성자 페이지를 기본 브라우저로 엽니다. |
| `storage` | 검색 결과를 24시간 캐시합니다. |

API Key는 기기마다 따로 저장합니다(데스크톱은 OS 암호화 저장소, 웹은 현재 브라우저에 암호화). 계정에 동기화하지 않으므로 다른 브라우저에서는 다시 등록합니다.

## 제한

Pixabay의 이용 약관과 요청 한도를 따릅니다.
