//durstenfeld shuffle: https://stackoverflow.com/a/12646864
export const shuffleArray = (array: Array<any>): void => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};
