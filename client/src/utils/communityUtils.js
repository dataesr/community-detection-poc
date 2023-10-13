export function communityGetTopicsCount(community, publications, limit = 0) {
  const topics = {};

  // Count topics
  community.forEach((node) => {
    node.attributes.publications.forEach((publicationId) => {
      publications[publicationId]?.topics.forEach(({ label }) => { topics[label] = topics[label] + 1 || 1; });
    });
  });

  // Get max topics
  // @todo

  return Object.entries(topics);
}
