export const graphEncodeToJson = (data) => {
  const items = [];
  const links = [];

  // Add nodes
  data.nodes.forEach((node) => {
    items.push({
      id: node.key,
      label: node.attributes?.label,
      cluster: (node.attributes?.community ?? 0) + 1,
      weights: { Works: node.attributes?.weight, Topics: node?.attributes?.topics.length },
      scores: { 'Topics/work ': (node.attributes?.topics.length ?? 0) / (node.attributes?.weight || 1) },
    });
  });

  // Add edges
  data.edges.forEach((edge) => {
    links.push({ source_id: edge?.source, target_id: edge?.target, strength: edge.attributes?.weight });
  });

  const network = { network: { items, links } };
  const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(network))}`;

  return jsonString;
};