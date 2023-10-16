export function publicationsGetTopicsCount(publications, publicationsIds, limit = 0) {
  const topics = {};

  // Count topics
  publicationsIds.forEach((publicationId) => (
    publications[publicationId]?.topics.forEach(({ label }) => {
      topics[label] = topics[label] + 1 || 1;
    })));

  const numberOfTopics = Object.keys(topics).length;
  // console.log('numberOfTopics', numberOfTopics);

  if (numberOfTopics === 0) return [];

  console.log('topics: ', topics);

  // Get max topics
  const endSlice = limit > 0 ? limit : numberOfTopics;
  const topTopics = Object.assign(
    ...Object
      .entries(topics)
      .sort(({ 1: a }, { 1: b }) => b - a)
      .slice(0, endSlice)
      .map(([k, v]) => ({ [k]: v })),
  );

  return Object.entries(topTopics);
}
