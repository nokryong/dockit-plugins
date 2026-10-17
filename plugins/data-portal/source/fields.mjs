import { plainText, mountainImage, imageUrl } from './data.mjs';

const RECORD_FIELDS = {
  HEALTH_FOOD_INFO: [['ENTRPS', '제조업체'], ['REGIST_DT', '등록일'], ['STTEMNT_NO', '신고번호'], ['SUNGSANG', '성상'], ['SRV_USE', '섭취방법'], ['BASE_STANDARD', '기준규격'], ['MAIN_FNCTN', '주된 기능성'], ['INTAKE_HINT1', '섭취 시 주의사항'], ['DISTB_PD', '소비·유통'], ['PRSRV_PD', '보관방법']],
  TOUR_PHOTO: [['galPhotographyLocation', '촬영 장소'], ['galPhotographer', '촬영자'], ['galPhotographyMonth', '촬영월'], ['galSearchKeyword', '키워드'], ['galCreatedtime', '등록일']],
  MOUNTAIN_INFO: [['mntidetails', '산 소개'], ['mntiadd', '소재지'], ['mntihigh', '높이 (m)'], ['mntiadmin', '관리기관'], ['mntiadminnum', '관리기관 전화']],
  HACCP_PRODUCT_INFO: [['prdkind', '식품 종류'], ['manufacture', '제조원'], ['seller', '판매원'], ['prdlstReportNo', '품목보고번호'], ['nutrient', '영양성분'], ['rawmtrl', '원재료'], ['allergy', '알레르기 유발물질']],
  NK_TV_SCHEDULE: [['frmtn_time', '편성시간'], ['bgng_ymd', '방송일']],
  CULTURE_INFO: [['eventSite', '공연장'], ['eventPeriod', '공연기간'], ['period', '기간'], ['contactPoint', '문의'], ['description', '소개']],
  FESTIVAL_INFO: [['subjectCategory', '분류'], ['eventSite', '행사장'], ['spatialCoverage', '지역'], ['eventPeriod', '축제기간'], ['period', '기간'], ['temporalCoverage', '개최기간'], ['contactPoint', '문의'], ['description', '소개']],
  SOCIAL_ENTERPRISE_INFO: [['busiAreaNm', '사업분야'], ['busiContV', '사업내용'], ['addr', '주소'], ['baseD', '개업일'], ['ceoNmV', '대표자'], ['telNo', '전화'], ['faxNo', '팩스'], ['certiEvalResult', '인증 여부'], ['certiIssuD', '인증일'], ['certiNumV', '인증번호']],
};
const TITLES = { HEALTH_FOOD_INFO: 'PRDUCT', TOUR_PHOTO: 'galTitle', MOUNTAIN_INFO: 'mntiname', HACCP_PRODUCT_INFO: 'prdlstNm', NK_TV_SCHEDULE: 'sj', CULTURE_INFO: 'title', FESTIVAL_INFO: 'title', SOCIAL_ENTERPRISE_INFO: 'entNmV' };
export function recordView(type, item) {
  const fields = (RECORD_FIELDS[type] ?? []).map(([key, label]) => {
    let value = plainText(item[key]);
    if (key === 'frmtn_time' && /^\d{1,4}$/.test(value)) {
      const time = value.padStart(4, '0'); value = `${time.slice(0, 2)}:${time.slice(2)}`;
    }
    return { label, value };
  }).filter(field => field.value);
  return {
    title: plainText(item[TITLES[type]]) || '제목 없음', fields,
    image: type === 'TOUR_PHOTO' ? imageUrl(item.galWebImageUrl) : type === 'MOUNTAIN_INFO' ? mountainImage(item) : '',
  };
}

const COUNTRY_FIELDS = {
  general: ['일반사항', [['capital', '수도'], ['population', '인구'], ['population_desc', '인구 설명'], ['area', '면적 (km²)'], ['area_desc', '면적 설명'], ['lang', '언어'], ['religion', '종교'], ['ethnic', '민족'], ['climate', '기후'], ['establish', '건국']]],
  economic: ['경제 현황', [['gdp', 'GDP (USD)'], ['gdp_desc', 'GDP 설명'], ['gdp_per_capita', '1인당 GDP (USD)'], ['gdp_growth_rate', '경제성장률 (%)'], ['gdp_growth_rate_desc', '경제성장률 설명'], ['inflation_rate', '물가상승률 (%)'], ['unemployment_rate', '실업률 (%)'], ['unemployment_desc', '실업률 설명'], ['currency_unit', '화폐 단위'], ['main_resource', '주요 자원'], ['main_industry', '주요 산업'], ['export_amount', '수출액 (USD)'], ['import_amount', '수입액 (USD)']]],
  security: ['치안 환경', [['current_travel_alarm', '현재 여행경보'], ['suicide_death_rate', '자살 사망률'], ['suicide_death_rate_year', '자살 사망률 기준연도']]],
  medical: ['의료 환경', [['clean_water_use_rate', '깨끗한 음용수 사용 비율 (%)'], ['clean_water_use_rate_year', '음용수 기준연도'], ['tuber_pr_hndrd_thsnd_ppl_outbreak_rate', '결핵 10만 명당 발병률'], ['tuber_pr_hndrd_thsnd_ppl_outbreak_rate_year', '결핵 기준연도']]],
  relation: ['우리나라와의 관계', [['diplomatic_relations', '외교 관계'], ['mission_status', '공관 현황'], ['investment_status', '투자 현황'], ['oks_status', '교민 현황'], ['oda_status', 'ODA 현황'], ['export_amount', '수출액'], ['import_amount', '수입액']]],
};
export function countrySections(country) {
  return Object.entries(COUNTRY_FIELDS).map(([key, [title, fields]]) => ({
    key, title, fields: fields.map(([field, label]) => ({ label, value: plainText(country[key]?.[field]) })).filter(field => field.value),
  }));
}
