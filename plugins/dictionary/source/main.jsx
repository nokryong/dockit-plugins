// Port of dockit/app/LIB/components/panel/Dictionary.js.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Div, Input, Skeleton, Tag, Typography } from 'sud-ui';
import { PluginRoot, inputProps, sdk, shadowSm, useDockitTheme } from '../../../shared/dockit.jsx';
import { PAGE_SIZE, searchDictionary } from './dictionary.mjs';
import '../../../shared/base.css';

function Dictionary() {
  const theme = useDockitTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const handleAPI = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setHasSearched(true);
    setError(null);
    setResult(null);
    setVisibleCount(PAGE_SIZE);
    try {
      setResult(await searchDictionary(sdk, searchTerm));
    } catch (failure) {
      setError(failure?.message || '사전 검색에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PluginRoot theme={theme}>
      <div className="w-full flex flex-col gap-2 max-h-[350px] overflow-y-auto p-0.5">
        <div className="flex justify-between">
          <Input
            {...inputProps}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="검색할 단어를 입력하세요"
            onEnter={handleAPI}
            background={`${theme.name}-1`}
          />
        </div>
        <div className="flex justify-center items-center w-full">
          {loading ? (
            <div className="flex justify-center items-center w-full">
              <Skeleton active ariaLabel="사전 검색 중" className="w-full" baseColor="cool-gray-2" highlightColor="cool-gray-1" />
            </div>
          ) : error ? (
            <div className="flex flex-col gap-2 items-center mb-2.5">
              <Typography color="red-7" size="sm">{error}</Typography>
              <Button size="sm" onClick={handleAPI} ariaLabel="사전 검색 다시 시도" border={false} {...shadowSm} color="white-1" background="white-10">
                다시 시도
              </Button>
            </div>
          ) : !hasSearched ? (
            <Typography color="cool-gray-7" size="sm">검색어를 입력하고 Enter를 눌러 주세요.</Typography>
          ) : !result || !result.items.length ? (
            <Typography color="cool-gray-7" size="sm">검색결과가 없습니다.</Typography>
          ) : (
            <div className="w-full flex flex-col gap-2">
              <Typography as="div" className="flex justify-end" color="cool-gray-7" size="sm">총 {result.total}건</Typography>
              <div className="flex flex-col gap-8">
                {result.items.slice(0, visibleCount).map((item, index) => (
                  <Div key={index} className="flex flex-col gap-2 p-2.5 rounded-xl" background="cool-gray-1">
                    <Typography pretendard="SB" size="lg" color="white-1">{item.word}</Typography>
                    {item.senses.map((sense, i) => (
                      <div key={i} className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          {sense.pos && <Tag color="white-2"><Typography size="xs">{sense.pos}</Typography></Tag>}
                          {sense.origin && <Typography size="sm" color="white-3">[{sense.origin}]</Typography>}
                        </div>
                        <Typography color="white-1" className="whitespace-pre-wrap">{sense.definition}</Typography>
                      </div>
                    ))}
                  </Div>
                ))}
              </div>
              {result.items.length > visibleCount && (
                <div className="flex flex-col p-2.5">
                  <Button onClick={() => setVisibleCount(count => count + PAGE_SIZE)} size="sm" border={false} {...shadowSm} color="white-1" background="white-10">
                    더보기
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PluginRoot>
  );
}

sdk.ready.then(() => createRoot(document.getElementById('root')).render(<Dictionary />));
