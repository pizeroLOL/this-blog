const pad2 = (value: number) => String(value).padStart(2, "0");

export default (timestamp: Date) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};
