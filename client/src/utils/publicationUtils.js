export function publicationGetTopicsCount(publications, id, limit = 0) {
  const topics = {};

  // Count topics
  publications[id]?.topics.forEach(({ label }) => {
    topics[label] = topics[label] + 1 || 1;
  });

  // Get max topics
  // @todo

  return Object.entries(topics);
}
