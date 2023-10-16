export const communityGetUniquePublications = (community) => (
  community.reduce((acc, node) => [...acc, ...node.attributes.publications.flatMap((id) => (!acc.includes(id) ? id : []))], [])
);

export function communityGetTopicsCount(community, publications, limit = 0) {
  const topics = {};

  // Count topics from unique publication ids
  community.reduce((acc, node) => [...acc, ...node.attributes.publications.flatMap((id) => (!acc.includes(id) ? id : []))], []).forEach((id) => {
    publications[id]?.topics.forEach(({ label }) => { topics[label] = topics[label] + 1 || 1; });
  });

  const numberOfTopics = Object.keys(topics).length;
  if (numberOfTopics === 0) return [];

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

export function communityGetTypesCount(community, publications, limit = 0) {
  const types = {};

  // Count types from unique publication ids
  community.reduce((acc, node) => [...acc, ...node.attributes.publications.flatMap((id) => (!acc.includes(id) ? id : []))], []).forEach((id) => {
    types[publications[id].type] = types[publications[id].type] + 1 || 1;
  });

  const numberOfTypes = Object.keys(types).length;
  // console.log('numberOfTopics', numberOfTopics);

  if (numberOfTypes === 0) return [];

  // Get max types
  const endSlice = limit > 0 ? limit : numberOfTypes;
  const topTypes = Object.assign(
    ...Object
      .entries(types)
      .sort(({ 1: a }, { 1: b }) => b - a)
      .slice(0, endSlice)
      .map(([k, v]) => ({ [k]: v })),
  );

  return Object.entries(topTypes);
}

export function communityGetBestAuthors(community, limit = 0) {
  const endSlice = limit > 0 ? limit : community.length;
  // Count and sort coauthors
  return community.sort((a, b) => b.attributes.publications.length - a.attributes.publications.length).slice(0, endSlice);
}
