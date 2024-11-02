export function getRandomName(length = 3) {
  function randomAccess(min, max) {
    return Math.floor(Math.random() * (min - max) + max);
  }

  let name = "";
  for (let i = 0; i < length; i++) {
    name += String.fromCharCode(randomAccess(0x4e00, 0x9fa5));
  }
  return name;
}
