// Group by function
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = key(item);
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
}

// Merge function
export const objectMerge = (obj1, obj2) => Object.entries(obj2).reduce((acc, [key, value]) => ({ ...acc, [key]: (acc[key] || 0) + value }), { ...obj1 });

// Print object entries
export const objEntriesToString = (obj, slice = 0) => {
  let sorted = Object.entries(obj).sort((a, b) => b[1] - a[1]);
  if (slice !== 0) sorted = sorted.slice(0, slice);
  return sorted.reduce((acc, item) => acc.concat(`${item[0]} (${item[1]}), `), '');
};
