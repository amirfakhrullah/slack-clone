export const getMinuteDifferenceFromNow = (prevDate: Date) => {
  const currDate = new Date();
  const diffInMilliseconds = Math.abs(currDate.getTime() - prevDate.getTime());
  const diffInMinutes = Math.floor(diffInMilliseconds / 1000 / 60);
  return diffInMinutes;
};
