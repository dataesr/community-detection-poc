import graphology from 'graphology';
import random from 'graphology-layout/random';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import louvain from 'graphology-communities-louvain';
import subgraph from 'graphology-operators/subgraph';
import noverlap from 'graphology-layout-noverlap';
import metrics from 'graphology-metrics';
import { weightedDegree } from 'graphology-metrics/node/weighted-degree';

const DEFAULT_NODE_RANGE = [5, 20];
const DEFAULT_EDGE_RANGE = [0.5, 10];

const GRAPH_MAX_ORDER = 150;

const nodeComputeDefaultDegree = (degree, degreeMin, degreeMax) => {
  const defaultNodeRange = DEFAULT_NODE_RANGE[1] - DEFAULT_NODE_RANGE[0];
  if (degreeMax - degreeMin <= defaultNodeRange) return DEFAULT_NODE_RANGE[1] - (degreeMax - degree);
  return (degree / (degreeMax - degreeMin)) * defaultNodeRange + DEFAULT_NODE_RANGE[0];
};

const edgeComputeDefaultWeight = (weight, weightMin, weightMax) => {
  const defaultEdgeRange = DEFAULT_EDGE_RANGE[1] - DEFAULT_EDGE_RANGE[0];
  if (weightMax - weightMin <= defaultEdgeRange) return DEFAULT_EDGE_RANGE[0] + (weight - weightMin);
  return (weight / (weightMax - weightMin)) * defaultEdgeRange + DEFAULT_EDGE_RANGE[0];
};

export function dataToGraphology(nodes, edges) {
  // Create Graph object
  let graph = new graphology.UndirectedGraph();

  // Add nodes and compute weight
  nodes.forEach(({ id, attributes }) => graph.updateNode(id, (attr) => ({
    ...attributes,
    weight: (attr?.weight ?? 0) + 1,
    publications: attr?.publications
      ? [...attr.publications, attributes?.publicationId]
      : [attributes?.publicationId],
  })));

  // Add edges and compute weight
  edges.forEach(({ source, target }) => graph.updateUndirectedEdgeWithKey(`(${source}--${target})`, source, target, (attr) => ({
    weight: (attr?.weight ?? 0) + 1,
    label: `${attr?.weight || 1} copublications`,
  })));

  // Filter with minimal number of publications
  let publiMinThresh = 1;
  while (graph.order > GRAPH_MAX_ORDER) {
    publiMinThresh += 1;
    graph = subgraph(graph, (key, attr) => (attr?.weight >= publiMinThresh)); // eslint-disable-line no-loop-func
  }
  console.log('Publications min threshold :', publiMinThresh);
  console.log('Graph order :', graph.order);

  // Assign layouts
  random.assign(graph); // Needs a starting layout for forceAtlas to work
  const sensibleSettings = forceAtlas2.inferSettings(graph);
  forceAtlas2.assign(graph, { iterations: 100, settings: sensibleSettings });
  noverlap.assign(graph);
  console.log('forceAtlas2 :', sensibleSettings);

  // Metrics and attributs
  console.log('_density :', metrics.graph.density(graph));
  // console.log("_degreeCentrality :", metrics.centrality.degree(graph))

  // Add communities
  louvain.assign(graph);

  // Compute size range for visualization
  const nodeMaxDegree = Math.max.apply(null, graph.mapNodes((n) => weightedDegree(graph, n)));
  const nodeMinDegree = Math.min.apply(null, graph.mapNodes((n) => weightedDegree(graph, n)));
  const edgeMaxDegree = Math.max.apply(null, graph.mapEdges((e, attr) => attr.weight));
  const edgeMinDegree = Math.min.apply(null, graph.mapEdges((e, attr) => attr.weight));
  console.log('Node max degree :', nodeMaxDegree);
  console.log('Node min degree :', nodeMinDegree);
  console.log('Edge max weight :', edgeMaxDegree);
  console.log('Edge min weight :', edgeMinDegree);

  // Update node and edge size
  graph.updateEachNodeAttributes(
    (node, attr) => ({
      ...attr,
      size: nodeComputeDefaultDegree(weightedDegree(graph, node), nodeMinDegree, nodeMaxDegree),
    }),
    { attributes: ['size'] },
  );
  graph.updateEachEdgeAttributes(
    (edge, attr) => ({
      ...attr,
      size: edgeComputeDefaultWeight(attr.weight, edgeMinDegree, edgeMaxDegree),
    }),
    { attributes: ['size'] },
  );

  return graph;
}
