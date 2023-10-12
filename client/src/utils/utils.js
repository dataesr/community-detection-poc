export const getPublicationAttributes = (data, publicationId, attribute) => data.publications?.find((publication) => publication.id === publicationId)?.attributes?.[attribute];

export const getStructuresAttributes = (data, structureId, attribute) => data.structures?.find((structure) => structure.id === structureId)?.attributes?.[attribute];

export const getThematicFromCluster = (cluster, data) => {
  const clusterTopics = {};
  cluster.forEach((author) => {
    author.attributes.publications.forEach((id) => {
      Object.values(getPublicationAttributes(data, id, 'topics')).forEach((topic) => {
        clusterTopics[topic.label] = clusterTopics?.[topic.label] + 1 || 1;
      });
    });
  });

  console.log(clusterTopics);

  return clusterTopics;
};

export const graphEncodeToJson = (data) => {
  const items = [];
  const links = [];

  // Add nodes
  data.nodes.forEach((node) => {
    items.push({
      id: node?.key,
      label: node?.attributes?.label,
      cluster: node?.attributes?.community + 1,
      weights: { Works: node?.attributes?.weight, Topics: node?.attributes?.topics.length },
      scores: { 'Topics/work ': node?.attributes?.topics.length / (node?.attributes?.weight || 1) },
    });
  });

  // Add edges
  data.edges.forEach((edge) => {
    links.push({ source_id: edge?.source, target_id: edge?.target, strength: edge?.attributes?.weight });
  });

  const network = { network: { items, links } };
  const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(network))}`;

  return jsonString;
};
