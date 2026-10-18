// Port of dockit/app/LIB/components/panel/Dice.js. The dice count is kept in plugin storage.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Typography } from 'sud-ui';
import { PluginRoot, report, sdk, shadowSm, useActions, useDockitTheme } from '../../../shared/dockit.jsx';
import { DiceFive, DiceFour, DiceOne, DiceSix, DiceThree, DiceTwo } from './diceIcons.jsx';
import '../../../shared/base.css';

const diceIcons = [
  <DiceOne size={30} key={1} />,
  <DiceTwo size={30} key={2} />,
  <DiceThree size={30} key={3} />,
  <DiceFour size={30} key={4} />,
  <DiceFive size={30} key={5} />,
  <DiceSix size={30} key={6} />,
];

function Dice() {
  const theme = useDockitTheme();
  const [count, setCount] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [diceValues, setDiceValues] = useState([1]);
  const [isRolling, setIsRolling] = useState([]);
  const [hasRolled, setHasRolled] = useState([]);
  const timers = useRef(new Set());

  useEffect(() => {
    let alive = true;
    sdk.storage.get('count').then(value => {
      if (!alive) return;
      if (Number.isInteger(value) && value >= 0 && value <= 10) setCount(value);
      setLoaded(true);
    }).catch(error => { if (alive) { setLoaded(true); report(error); } });
    const active = timers.current;
    return () => { alive = false; for (const timer of active) { clearInterval(timer); clearTimeout(timer); } };
  }, []);

  useEffect(() => { if (loaded) sdk.storage.set('count', count).catch(report); }, [count, loaded]);

  // 주사위 갯수가 변경될 때 배열 크기 조절
  useEffect(() => {
    const resize = (current, fill) => Array.from({ length: count }, (_, i) => (i < current.length ? current[i] : fill));
    setDiceValues(current => resize(current, 1));
    setIsRolling(current => resize(current, false));
    setHasRolled(current => resize(current, false));
  }, [count]);

  const onAction = useCallback(id => {
    if (id === 'add') setCount(prev => (prev < 10 ? prev + 1 : prev));
    if (id === 'remove') setCount(prev => (prev > 0 ? prev - 1 : prev));
  }, []);
  const actions = useMemo(() => [
    ...(count < 10 ? [{ id: 'add', label: '주사위 추가', icon: 'plus', disabled: !loaded }] : []),
    ...(count > 0 ? [{ id: 'remove', label: '주사위 줄이기', icon: 'minus', disabled: !loaded }] : []),
  ], [count, loaded]);
  useActions(actions, onAction);

  const handleDiceClick = index => {
    // 이미 굴리고 있는 주사위는 다시 클릭 안되도록 함
    if (isRolling.some(rolling => rolling)) return;
    const newIsRolling = [...isRolling];
    newIsRolling[index] = true;
    setIsRolling(newIsRolling);
    const newHasRolled = [...hasRolled];
    newHasRolled[index] = true;
    setHasRolled(newHasRolled);

    const rollInterval = setInterval(() => {
      setDiceValues(current => { const next = [...current]; next[index] = Math.floor(Math.random() * 6) + 1; return next; });
    }, 130);
    timers.current.add(rollInterval);

    const stop = setTimeout(() => {
      clearInterval(rollInterval);
      timers.current.delete(rollInterval);
      timers.current.delete(stop);
      const finalValue = Math.floor(Math.random() * 6) + 1;
      setDiceValues(current => { const next = [...current]; next[index] = finalValue; return next; });
      setIsRolling(current => { const next = [...current]; next[index] = false; return next; });
    }, 1500);
    timers.current.add(stop);
  };

  const getBackgroundColor = i => {
    if (isRolling[i]) return { bg: `${theme.name}-3`, text: `${theme.name}-8` }; // 돌리는 중
    if (hasRolled[i]) return { bg: theme.name, text: `${theme.name}-1` }; // 돌린 후
    return { bg: `${theme.name}-1`, text: `${theme.name}-9` }; // 돌리기 전
  };

  return (
    <PluginRoot theme={theme}>
      <div className="w-full flex flex-col gap-2 p-0.5">
        {count === 0 ? (
          <div className="flex justify-center text-center">
            <Typography color="cool-gray-7" size="sm">주사위를 추가해서 사용하세요.</Typography>
          </div>
        ) : (
          <div className="flex flex-wrap justify-start gap-2">
            {Array.from({ length: count }).map((_, i) => (
              <Button
                key={i}
                ariaLabel={`주사위 ${i + 1} 굴리기`}
                background={getBackgroundColor(i).bg}
                color={getBackgroundColor(i).text}
                border={false}
                {...shadowSm}
                icon={diceIcons[(diceValues[i] || 1) - 1]}
                onClick={() => handleDiceClick(i)}
                disabled={isRolling[i]}
              />
            ))}
          </div>
        )}
      </div>
    </PluginRoot>
  );
}

sdk.ready.then(() => createRoot(document.getElementById('root')).render(<Dice />));
