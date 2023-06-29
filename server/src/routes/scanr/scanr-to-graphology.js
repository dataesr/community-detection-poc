import graphology from 'graphology';
import random from 'graphology-layout/random';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import louvain from 'graphology-communities-louvain';
import subgraph from 'graphology-operators/subgraph';

const MAX_NUMBER_OF_AUTHORS = 20;
const MIN_NUMBER_OF_PUBLICATIONS = 1;
const DEFAULT_NODE_COLOR = '#7b7b7b';
const COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f',
  '#bcbd22', '#17becf', '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5', '#c49c94',
  '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5', '#b3e2cd', '#fddaec', '#c7e9c0', '#fdae6b',
  '#b5cf6b', '#ce6dbd', '#dadaeb', '#393b79', '#637939', '#8c6d31', '#843c39', '#ad494a',
  '#d6616b', '#e7ba52', '#e7cb94', '#843c39', '#ad494a', '#d6616b', '#e7969c', '#7b4173',
  '#a55194', '#ce6dbd', '#de9ed6', '#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#e6550d',
  '#fd8d3c', '#fdae6b', '#fdd0a2', '#31a354',
];

function getNodesFromPublicationList(publicationList) {
  return publicationList.flatMap(({ authors }) => {
    if (!authors) return [];
    return authors.reduce((acc, { person }) => {
      if (!person?.id) return [...acc];
      const { id, fullName: label } = person;
      return [...acc, { id, attributes: { id, label } }];
    }, []);
  });
}

function getEdgesFromPublicationList(publicationList) {
  return publicationList.flatMap(({ authors }) => {
    if (!authors) return [];
    const knownAuthors = authors.filter(({ person }) => person?.id).map(({ person }) => person.id);
    const coAuthorships = knownAuthors.flatMap(
      // Graphology undirected edges must be sorted, to avoid duplicated edges.
      (v, i) => knownAuthors.slice(i + 1).map((w) => (w < v ? { source: w, target: v } : { source: v, target: w })),
    );
    return coAuthorships;
  });
}

export function scanrToGraphology(publicationList) {
  const graph = new graphology.UndirectedGraph();
  const publicationListWithoutTooManyAuthors = publicationList.filter(({ authors = [] }) => authors.length <= MAX_NUMBER_OF_AUTHORS);
  const nodes = getNodesFromPublicationList(publicationListWithoutTooManyAuthors);
  const edges = getEdgesFromPublicationList(publicationListWithoutTooManyAuthors);
  nodes.forEach(({ id, attributes }) => graph.updateNode(id, (attr) => ({ ...attributes, size: (attr?.size + 1) || 1 })));
  edges.forEach(({ source, target }) => graph.updateUndirectedEdgeWithKey(
    `(${source}--${target})`,
    source,
    target,
    (attr) => ({
      weight: (attr?.weight + 1) || 1,
      size: (attr?.size + 1) || 1,
      label: `${attr?.size || 1} copublis`,
    }),
  ));
  const filteredGraph = subgraph(graph, (key, attr) => attr?.size >= MIN_NUMBER_OF_PUBLICATIONS);
  filteredGraph.updateEachNodeAttributes((node, attr) => {
    return {
      ...attr,
      size: 8 * Math.log(attr.size + 1)
    };
  });
  random.assign(filteredGraph);
  const settings = forceAtlas2.inferSettings(filteredGraph);
  console.log('SETTINGS', settings);
  let linLogMode = false;
  const gravity = 1.0 / graph.order;
  if (graph.order > 100) {
    linLogMode = true;
  }
  forceAtlas2.assign(filteredGraph, { settings: { ...settings, adjustSize: true, slowDown: 1, linLogMode, gravity, strongGravityMode: false, edgeWeightInfluence: 1 }, iterations: 600 });
  louvain.assign(filteredGraph, { settings: { resolution: 1.0 } });
  filteredGraph.forEachNode((node, attr) => {
    const { community } = attr;
    const color = COLORS?.[community] || DEFAULT_NODE_COLOR;
    filteredGraph.setNodeAttribute(node, 'color', color);
  });

  return filteredGraph;
}
