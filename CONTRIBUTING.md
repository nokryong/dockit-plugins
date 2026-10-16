# 플러그인 등록 및 수정

1. 이 저장소를 포크하고 `plugins/<이름>/`에 플러그인을 추가하거나 수정합니다.
2. `manifest.json`의 작성자·버전·아이콘·권한을 작성합니다. 기존 플러그인의 ID는 유지합니다.
3. `source/`에 소스코드를, `dist/`에 빌드 결과를 둡니다. 실행 파일은 `manifest.json`의 `widgets[].entry`에서 `dist/index.html`처럼 지정합니다.
4. `npm ci`, `npm run build`, `npm run check` 후 Dockit에서 설치·실행을 확인합니다.
5. 소스코드와 빌드 결과, 필요한 라이선스 고지를 함께 PR로 제출합니다.

관리자 `nokryong`이 코드·권한·소스와 빌드 결과의 일치·실제 동작을 검토한 뒤 병합합니다. 업데이트도 같은 절차를 거칩니다. 실행 코드를 외부 주소에서 추가로 불러오는 플러그인은 등록하지 않습니다.

플러그인 API와 파일 규격은 [Dockit Plugin SDK](https://github.com/nokryong/dockit-plugin-sdk)를 참고하세요.
