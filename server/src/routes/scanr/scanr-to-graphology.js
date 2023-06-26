import graphology from 'graphology';
import circular from 'graphology-layout/circular';
import forceAtlas2 from 'graphology-layout-forceatlas2';

export function scanrToGraphology(scanrData) {
  const graph = new graphology.UndirectedGraph();

  const nodes = scanrData.flatMap(({ authors }) => {
    if (!authors) return [];
    return authors.reduce((acc, { person }) => {
      if (!person?.id) return [...acc];
      const { id, fullName: name } = person;
      return [...acc, { id, attributes: { id, name } }];
    }, []);
  });
  const edges = scanrData.flatMap((publi) => {
    const { authors } = publi;
    if (!authors) return [];
    const knownAuthors = authors.filter(({ person }) => person?.id).map(({ person }) => person.id);
    const pairs = knownAuthors.flatMap(
      (v, i) => knownAuthors.slice(i + 1).map((w) => (w < v ? { source: w, target: v } : { source: v, target: w })),
    );
    return pairs;
  });
  nodes.forEach(({ id, attributes }) => graph.mergeNode(id, attributes));
  edges.forEach(({ source, target }) => graph.mergeEdge(source, target));
  circular.assign(graph);
  const settings = forceAtlas2.inferSettings(graph);
  forceAtlas2.assign(graph, { settings, iterations: 600 });
  return graph;
}