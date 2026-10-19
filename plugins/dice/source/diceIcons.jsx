// 주사위 면 (dockit/app/LIB/constant/dice.js)
const ICONS = {
  DiceOne: (
    <g>
      <circle cx="25" cy="25" r="5" />
    </g>
  ),
  DiceTwo: (
    <g>
      <circle cx="35.6066017" cy="14.3933983" r="5" />
      <circle cx="14.3933983" cy="35.6066017" r="5" />
    </g>
  ),
  DiceThree: (
    <g>
      <circle cx="35.6066017" cy="14.3933983" r="5" />
      <circle cx="25" cy="25" r="5" />
      <circle cx="14.3933983" cy="35.6066017" r="5" />
    </g>
  ),
  DiceFour: (
    <g>
      <g>
        <circle cx="35.6066017" cy="14.3933983" r="5" />
        <circle cx="14.3933983" cy="35.6066017" r="5" />
        <circle cx="35.6066017" cy="35.6066017" r="5" />
        <circle cx="14.3933983" cy="14.3933983" r="5" />
      </g>
    </g>
  ),
  DiceFive: (
    <g>
      <circle cx="35.6066017" cy="14.3933983" r="5" />
      <circle cx="25" cy="25" r="5" />
      <circle cx="14.3933983" cy="35.6066017" r="5" />
      <circle cx="35.6066017" cy="35.6066017" r="5" />
      <circle cx="14.3933983" cy="14.3933983" r="5" />
    </g>
  ),
  DiceSix: (
    <g>
      <circle cx="15" cy="10" r="5" />
      <circle cx="15" cy="25" r="5" />
      <circle cx="15" cy="40" r="5" />
      <circle cx="35" cy="10" r="5" />
      <circle cx="35" cy="25" r="5" />
      <circle cx="35" cy="40" r="5" />
    </g>
  )
};

function icon(name) {
  const Component = ({ size = 24, color, style = {}, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" preserveAspectRatio="xMidYMid meet" width={size} height={size} fill={color || "currentColor"} style={style} {...props}>
      {ICONS[name]}
    </svg>
  );
  Component.displayName = name;
  return Component;
}

export const DiceOne = icon("DiceOne");
export const DiceTwo = icon("DiceTwo");
export const DiceThree = icon("DiceThree");
export const DiceFour = icon("DiceFour");
export const DiceFive = icon("DiceFive");
export const DiceSix = icon("DiceSix");
