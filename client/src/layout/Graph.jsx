import '@react-sigma/core/lib/react-sigma.min.css';
import { Badge, BadgeGroup, Col, Container, Row, Text, Title, Alert } from '@dataesr/react-dsfr';
import {
  ControlsContainer,
  FullScreenControl,
  SearchControl,
  SigmaContainer,
  useRegisterEvents,
  ZoomControl,
} from '@react-sigma/core';
import { LayoutForceAtlas2Control } from '@react-sigma/layout-forceatlas2';
import { UndirectedGraph } from 'graphology';
import { useState, useEffect } from 'react';

const DEFAULT_NODE_COLOR = '#7b7b7b';
const COMMUNTIY_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f',
  '#bcbd22', '#17becf', '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5', '#c49c94',
  '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5', '#b3e2cd', '#fddaec', '#c7e9c0', '#fdae6b',
  '#b5cf6b', '#ce6dbd', '#dadaeb', '#393b79', '#637939', '#8c6d31', '#843c39', '#ad494a',
  '#d6616b', '#e7ba52', '#e7cb94', '#843c39', '#ad494a', '#d6616b', '#e7969c', '#7b4173',
  '#a55194', '#ce6dbd', '#de9ed6', '#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#e6550d',
  '#fd8d3c', '#fdae6b', '#fdd0a2', '#31a354',
];

function GraphEvents({ onNodeClick, onStageClick }) {
  const registerEvents = useRegisterEvents();

  useEffect(() => {
    // Register the events
    registerEvents({
      // node events
      clickNode: (event) => { onNodeClick(event); },
      clickStage: (event) => { onStageClick(event); }
    });
  }, [onNodeClick, onStageClick, registerEvents]);

  return null;
}

const highlightGraph = (graph, selectedNode) => {
  console.log("Node selected :", selectedNode.id)
  graph.updateEachNodeAttributes((node, attr) => {
    return {
      ...attr,
      highlighted: (node === selectedNode.id) ? true : false,
      color: (node === selectedNode.id || graph.neighbors(selectedNode.id).includes(node)) ? attr.color : "#E2E2E2"
    };
  }, { attributes: ['highlighted', 'color'] });
  graph.updateEachEdgeAttributes((edge, attr) => {
    return {
      ...attr,
      hidden: (graph.extremities(edge).includes(selectedNode.id)) ? false : true,
    };
  }, { attributes: ['hidden'] });
  return graph;
}

const getThematicFromCluster = (cluster) => {
  const clusterTopics = {};
  cluster.forEach((node) => {
    Object.keys(node?.topics || []).forEach((topic) => {
      if (!(Object.keys(clusterTopics).includes(topic))) {
        clusterTopics[topic] = { code: topic, label: node.topics[topic].label, publicationIds: [] };
      }
      clusterTopics[topic].publicationIds.push([node.topics[topic].publicationId]);
    });
  });
  return Object.values(clusterTopics).map((clusterTopic) => {
    // eslint-disable-next-line no-param-reassign
    clusterTopic.publicationIds = [...new Set(clusterTopic.publicationIds)];
    return clusterTopic;
  }).sort((a, b) => b.publicationIds.length - a.publicationIds.length).slice(0, 5);
};

export default function Graph({ data }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const graph = UndirectedGraph.from(data);

  // Return alert if graph empty
  if (graph.order == 0) {
    return (
      <Alert title="No results found" description="Your query returned no results" type="warning" closable />
    )
  }

  // Fill communities
  const communities = graph.reduceNodes((acc, node, attr) => {
    const { label, size, community, topics, weight } = attr;
    if (!acc[community]) {
      acc[community] = [{ id: node, label, size, degree: graph.degree(node), topics, weight }];
    } else {
      acc[community] = [...acc[community], { id: node, label, size, degree: graph.degree(node), topics, weight }].sort((a, b) => b.size - a.size);
    }
    return acc;
  }, {});
  const clustersKeys = Object.keys(communities)
    .sort((a, b) => communities[b].length - communities[a].length).slice(0, 6);

  // Update community colors
  graph.updateEachNodeAttributes((node, attr) => {
    return {
      ...attr,
      color: COMMUNTIY_COLORS?.[attr.community] || DEFAULT_NODE_COLOR
    };
  }, { attributes: ['color'] });

  return (
    <>
      <Container fluid className="fr-my-3w">
        <Row gutters>
          <Col n="12">
            <SigmaContainer
              style={{ height: '500px' }}
              graph={selectedNode ? highlightGraph(graph, selectedNode) : graph}
            >
              <GraphEvents
                onNodeClick={(event) => { setSelectedNode({ id: event.node, degree: graph.degree(event.node), ...graph.getNodeAttributes(event.node) }); }}
                onStageClick={() => { setSelectedNode(null) }} />
              <ControlsContainer position="bottom-right">
                <ZoomControl />
                <FullScreenControl />
                <LayoutForceAtlas2Control settings={{ settings: { slowDown: 10 } }} />
              </ControlsContainer>
              <ControlsContainer position="top-right">
                <SearchControl style={{ width: '200px' }} />
              </ControlsContainer>
            </SigmaContainer>
          </Col>
          <Col n="12">
            {(selectedNode && graph.hasNode(selectedNode.id)) && (
              <div className="fr-card fr-card--shadow">
                <div className="fr-my-2w fr-card__body">
                  <Title look="h6" as="p" className="fr-mb-1v">
                    {selectedNode.label}
                  </Title>
                  <Text bold className="fr-mb-1v">
                    idRef:
                    {' '}
                    {selectedNode.id.split('idref')[1]}
                  </Text>
                  <Text bold className="fr-mb-1v">
                    Cluster wordcloud:
                    <BadgeGroup>
                      {getThematicFromCluster(communities[selectedNode.community]).map((topic) => (
                        <Badge type="info" text={`${topic.label} (${topic.publicationIds.length})`} />))}
                    </BadgeGroup>
                  </Text>
                  <Row gutters>
                    <Col n="12">
                      <Text bold className="fr-mb-1v">
                        Author wordcloud:
                      </Text>
                      <BadgeGroup>
                        {getThematicFromCluster([graph.getNodeAttributes(selectedNode.id)])?.map((topic) => (
                          <Badge type="info" text={`${topic.label} (${topic.publicationIds.length})`} />))}
                      </BadgeGroup>
                    </Col>
                    <Col n="12">
                      <BadgeGroup>
                        <Badge className="fr-ml-1w" text={`${selectedNode.degree} co-authors`} />
                      </BadgeGroup>
                      {graph
                        .mapNeighbors(selectedNode.id, (node, attr) => attr.label)
                        .join(', ')}
                    </Col>
                    <Col n="12">
                      <BadgeGroup>
                        <Badge colorFamily="purple-glycine" className="fr-ml-1w" text={`${selectedNode.weight} publications`} />
                      </BadgeGroup>
                      {graph.getNodeAttribute(selectedNode.id, 'publications')?.map((publication) => (<p>{publication}</p>))}
                    </Col>
                  </Row>
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Container>
      <Title as="h3">{clustersKeys.length} main clusters</Title>
      <Container fluid className="fr-my-3w">
        <Row gutters>
          {clustersKeys.map((community) => (
            <Col key={community} n="4">
              <div className="fr-card fr-card--shadow">
                <p style={{ backgroundColor: COMMUNTIY_COLORS[community] }}>
                  &nbsp;Community {community}
                </p>
                <div className="fr-card__body">
                  <Title as="h6">5 main topics</Title>
                  <ul>
                    {getThematicFromCluster(communities[community]).map((topic) => (
                      <li>
                        {topic.label}
                        {' '}
                        (
                        {topic.publicationIds.length}
                        )
                      </li>
                    ))}
                  </ul>
                  <Title as="h6">{Math.min(10, communities[community].length)} main authors</Title>
                  {communities[community].slice(0, 10).map((node) => (
                    <>
                      <Text bold className="fr-mb-1v" key={node.id}>
                        {node.label}
                      </Text>
                      <BadgeGroup>
                        <Badge colorFamily="purple-glycine" className="fr-ml-1w" text={`${node.degree} publications`} />
                        <Badge className="fr-ml-1w" text={`${node.degree} co-author(s)`} />
                      </BadgeGroup>
                    </>
                  ))}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
}
