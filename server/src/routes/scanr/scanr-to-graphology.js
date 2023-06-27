import graphology from 'graphology';
import circular from 'graphology-layout/circular';
import forceAtlas2 from 'graphology-layout-forceatlas2';

const MAX_NUMBER_OF_AUTHORS = 50;
const MIN_NUMBER_OF_PUBLICATIONS = 5;
const MIN_NUMBER_OF_NEIGHBORS = 4;


export function scanrToGraphology(scanrData) {
  const graph = new graphology.UndirectedGraph();

  const scanrDataWithoutTooManyAuthors = scanrData.filter(({ authors = [] }) => authors.length < MAX_NUMBER_OF_AUTHORS);

  const nodes = scanrDataWithoutTooManyAuthors.flatMap(({ authors }) => {
    if (!authors) return [];
    return authors.reduce((acc, { person }) => {
      if (!person?.id) return [...acc];
      const { id, fullName: label } = person;
      return [...acc, { id, attributes: { id, label } }];
    }, []);
  });
  const edges = scanrDataWithoutTooManyAuthors.flatMap((publi) => {
    const { authors } = publi;
    if (!authors) return [];
    const knownAuthors = authors.filter(({ person }) => person?.id).map(({ person }) => person.id);
    const pairs = knownAuthors.flatMap(
      // Graphology undirected edges must be sorted, to avoid duplicates.
      (v, i) => knownAuthors.slice(i + 1).map((w) => (w < v ? { source: w, target: v } : { source: v, target: w })),
    );
    return pairs;
  });
  nodes.forEach(({ id, attributes }) => graph.updateNode(id, attr => ({ ...attributes, size: (attr?.size + 1) || 1 })));
  edges.forEach(({ source, target }) => graph.updateEdge(source, target, attr => ({ weight: (attr?.weight + 1) || 1, size: (attr?.size + 1) || 1, label: `${attr?.size || 1} copublis` })));
  graph.forEachNode((node) => {
    if (graph.degree(node) < MIN_NUMBER_OF_PUBLICATIONS) graph.dropNode(node)
    // if (graph.neighbors(node) < MIN_NUMBER_OF_NEIGHBORS) graph.dropNode(node)
  });
  circular.assign(graph);
  const settings = forceAtlas2.inferSettings(graph);
  forceAtlas2.assign(graph, { settings, iterations: 600 });
  console.log('NODES', graph.order);
  return graph;
}