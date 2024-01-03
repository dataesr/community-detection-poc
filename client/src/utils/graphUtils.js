export const graphEncodeToJson = (data) => {
  const items = [];
  const links = [];

  // Add nodes
  data.nodes.forEach((node) => {
    items.push({
      id: node.key,
      label: node.attributes?.label,
      cluster: (node.attributes?.community ?? 0) + 1,
      weights: { Weight: node.attributes?.weight, Degree: node.attributes?.degree },
      scores: { 'Last year': Math.max(Object.keys(node.attributes?.years ?? {})) ?? 0 },
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

export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = key(item);
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
}
