import graphology from 'graphology';
import random from 'graphology-layout/random';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import louvain from 'graphology-communities-louvain';
import subgraph from 'graphology-operators/subgraph';
import noverlap from 'graphology-layout-noverlap';
import metrics from 'graphology-metrics';
import { connectedComponents } from 'graphology-components';
import { weightedDegree } from 'graphology-metrics/node/weighted-degree';

const DEFAULT_NODE_RANGE = [5, 20];
const DEFAULT_EDGE_RANGE = [0.5, 5];

const GRAPH_MAX_ORDER = 300;
const GRAPH_MAX_RATIO = 5; // between number of edges and nodes

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
    label: attr.name,
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

const bucketToYears = (bucket) => bucket.reduce((acc, item) => ({ ...acc, [item.key]: item.doc_count }), {});
const bucketToDomains = (bucket) => bucket.reduce((acc, item) => {
  item.key.split('---').forEach((codomain) => {
    const label = codomain.split('###')[1];
    acc[label] = (acc[label]) ? acc[label] + item.doc_count : item.doc_count;
  });
  return acc;
}, {});

export function aggToGraphology(aggregation) {
  if (!aggregation) return {};

  // Create Graph object
  let graph = new graphology.UndirectedGraph();

  aggregation.forEach((item) => {
    const { key } = item;
    const count = item.doc_count;
    const bucketYears = item?.agg_year && ((item.agg_year.buckets.length) ? item.agg_year.buckets : undefined);
    const bucketDomains = item?.agg_domains && ((item.agg_domains.buckets.length) ? item.agg_domains.buckets : undefined);
    const nodes = key.split('---');

    // Add nodes and compute weight
    nodes.forEach((id) => graph.updateNode(id.split('###')[0], (attr) => ({
      label: id.split('###')[1],
      name: attr.label,
      weight: (attr?.weight ?? 0) + count,
      type: 'border',
      ...(bucketYears) && { years: bucketToYears(bucketYears) },
      ...(bucketDomains) && { domains: bucketToDomains(bucketDomains) },
    })));

    // Add edges and compute weight
    graph.updateUndirectedEdgeWithKey(key, nodes[0].split('###')[0], nodes[1].split('###')[0], (attr) => ({
      weight: (attr?.weight ?? 0) + count,
      label: `${attr?.weight || 1} links`,
    }));
  });

  // Keep only top 3 largests components
  const sortedComponents = connectedComponents(graph).sort((a, b) => b.length - a.length);
  graph = subgraph(graph, sortedComponents.slice(0, 3).flat());

  // Filter with minimal number of nodes
  let nodeWeightThresh = 1;
  while (graph.order > GRAPH_MAX_ORDER) {
    nodeWeightThresh += 1;
    graph = subgraph(graph, (node, attr) => (attr?.weight >= nodeWeightThresh)); // eslint-disable-line no-loop-func
  }
  console.log('Node weight threshold :', nodeWeightThresh);

  // Filter with minimal number of edges
  let edgeWeightThresh = 1;
  while (graph.size / graph.order > GRAPH_MAX_RATIO) {
    edgeWeightThresh += 1;
    graph.filterEdges((edge, attr) => (attr?.weight < edgeWeightThresh)).forEach((edge) => graph.dropEdge(edge)); // eslint-disable-line no-loop-func
    graph = subgraph(graph, (node) => (graph.degree(node) > 0)); // eslint-disable-line no-loop-func
  }
  console.log('Edge weight threshold :', edgeWeightThresh);

  console.log('Number of nodes', graph.order);
  console.log('Number of edges', graph.size);

  // Assign layouts
  random.assign(graph); // Needs a starting layout for forceAtlas to work
  const sensibleSettings = forceAtlas2.inferSettings(graph);
  forceAtlas2.assign(graph, { iterations: 100, settings: sensibleSettings });
  console.log('forceAtlas2 :', sensibleSettings);
  noverlap.assign(graph);

  // Metrics and attributs
  // console.log('_density :', metrics.graph.density(graph));
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
