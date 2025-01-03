export const concat = <
  const TLeft extends unknown[],
  const TRight extends unknown[]
>(
  left: TLeft,
  right: TRight
) => [...left, ...right] as [...TLeft, ...TRight]
