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

const GRAPH_MAX_ORDER = 150

const nodeComputeDefaultDegree = (degree, min_degree, max_degree) => {
    const default_node_range = DEFAULT_NODE_RANGE[1] - DEFAULT_NODE_RANGE[0];
    if ((max_degree - min_degree) <= default_node_range)
        return DEFAULT_NODE_RANGE[1] - (max_degree - degree);
    else
        return (((degree / (max_degree - min_degree)) * default_node_range) + DEFAULT_NODE_RANGE[0]);
}

const edgeComputeDefaultWeight = (weight, min_weight, max_weight) => {
    const default_edge_range = DEFAULT_EDGE_RANGE[1] - DEFAULT_EDGE_RANGE[0];
    if ((max_weight - min_weight) <= default_edge_range)
        return DEFAULT_EDGE_RANGE[0] + (weight - min_weight)
    else
        return (((weight / (max_weight - min_weight)) * default_edge_range) + DEFAULT_EDGE_RANGE[0]);
}

export function dataToGraphology(nodes, edges) {

    // Create Graph object
    let graph = new graphology.UndirectedGraph();

    // Add nodes and compute weight
    nodes.forEach(({ id, attributes }) => graph.updateNode(id, (attr) => ({
        ...attributes,
        weight: (attr?.weight + 1) || 1,
        publications: (attr?.publications) ? [...attr?.publications, attributes?.publication] : [attributes?.publication],
    })));

    // Add edges and compute weight
    edges.forEach(({ source, target }) => graph.updateUndirectedEdgeWithKey(
        `(${source}--${target})`,
        source,
        target,
        (attr) => ({
            weight: (attr?.weight + 1) || 1,
            label: `${attr?.weight || 1} copublications`,
        }),
    ));

    // Filter with minimal number of publications
    let publiMinThresh = 1;
    while (graph.order > GRAPH_MAX_ORDER) {
        publiMinThresh += 1;
        graph = subgraph(graph, (_, attr) => attr?.weight >= publiMinThresh);
    }
    console.log('Publications min threshold :', publiMinThresh);
    console.log('Graph order :', graph.order);

    // Assign layouts
    random.assign(graph);   // Needs a starting layout for forceAtlas to work
    let sensibleSettings = forceAtlas2.inferSettings(graph);
    forceAtlas2.assign(graph, { iterations: 100, settings: sensibleSettings });
    noverlap.assign(graph);
    console.log('forceAtlas2 :', sensibleSettings);

    // Metrics and attributs
    console.log("_density :", metrics.graph.density(graph));
    // console.log("_degreeCentrality :", metrics.centrality.degree(graph))

    // Compute size range for visualization
    const node_max_degree = Math.max.apply(null, graph.mapNodes((n, atrr) => weightedDegree(graph, n)));
    const node_min_degree = Math.min.apply(null, graph.mapNodes((n, atrr) => weightedDegree(graph, n)));
    const edge_max_weight = Math.max.apply(null, graph.mapEdges((e, atrr) => atrr.weight));
    const edge_min_weight = Math.min.apply(null, graph.mapEdges((e, atrr) => atrr.weight));
    console.log('Node max degree :', node_max_degree);
    console.log('Node min degree :', node_min_degree);
    console.log('Edge max weight :', edge_max_weight);
    console.log('Edge min weight :', edge_min_weight);

    // Apply default range
    graph.forEachNode((n, attr) => {
        graph.setNodeAttribute(n, 'size', nodeComputeDefaultDegree(weightedDegree(graph, n), node_min_degree, node_max_degree));
    })
    graph.forEachEdge((e, attr) => {
        graph.setEdgeAttribute(e, 'size', edgeComputeDefaultWeight(attr.weight, edge_min_weight, edge_max_weight));
    })

    // Add communities and colors
    louvain.assign(graph);
    graph.forEachNode((node, attr) => {
        const { community } = attr;
        const color = COLORS?.[community] || DEFAULT_NODE_COLOR;
        graph.setNodeAttribute(node, 'color', color);
    });

    return graph;
}