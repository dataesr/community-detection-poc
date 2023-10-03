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
        years: (attr?.years) ? [...attr?.years, attributes?.year] : [attributes?.year]
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

    // Add communities
    louvain.assign(graph);

    // Compute size range for visualization
    const node_max_degree = Math.max.apply(null, graph.mapNodes((n, atrr) => weightedDegree(graph, n)));
    const node_min_degree = Math.min.apply(null, graph.mapNodes((n, atrr) => weightedDegree(graph, n)));
    const edge_max_weight = Math.max.apply(null, graph.mapEdges((e, atrr) => atrr.weight));
    const edge_min_weight = Math.min.apply(null, graph.mapEdges((e, atrr) => atrr.weight));
    console.log('Node max degree :', node_max_degree);
    console.log('Node min degree :', node_min_degree);
    console.log('Edge max weight :', edge_max_weight);
    console.log('Edge min weight :', edge_min_weight);

    // Update node and edge size
    graph.updateEachNodeAttributes((node, attr) => {
        return {
            ...attr,
            size: nodeComputeDefaultDegree(weightedDegree(graph, node), node_min_degree, node_max_degree)
        };
    }, { attributes: ['size'] });
    graph.updateEachEdgeAttributes((edge, attr) => {
        return {
            ...attr,
            size: edgeComputeDefaultWeight(attr.weight, edge_min_weight, edge_max_weight)
        };
    }, { attributes: ['size'] });

    return graph;
}