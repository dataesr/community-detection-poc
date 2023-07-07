import '@react-sigma/core/lib/react-sigma.min.css';
import { useState, useEffect } from 'react';
import { Badge, BadgeGroup, Col, Container, Row, Text, Title } from '@dataesr/react-dsfr';
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

function GraphEvents({ onNodeClick }) {
  const registerEvents = useRegisterEvents();
  useEffect(() => {
    // Register the events
    registerEvents({
      // node events
      clickNode: (event) => onNodeClick(event),
    });
  }, [onNodeClick, registerEvents]);
  return null;
}

const getThematicFromCluster = (cluster) => {
  const clusterTopics = {};
  cluster.forEach((node) => {
    Object.keys(node?.topics || []).forEach((topic) => {
      if (!(Object.keys(clusterTopics).includes(topic))){
        clusterTopics[topic] = {code: topic, label: node.topics[topic].label, publicationIds: []};
      };
      clusterTopics[topic].publicationIds.push([node.topics[topic].publicationId]);
    });
  });
  return Object.values(clusterTopics).map((clusterTopic) => {
    clusterTopic.publicationIds = [... new Set(clusterTopic.publicationIds)]; 
    return clusterTopic;
  }).sort((a, b) => b.publicationIds.length - a.publicationIds.length).slice(0, 5);
};

export default function Graph({ data }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const graph = UndirectedGraph.from(data);
  const communities = graph.reduceNodes((acc, node, attr) => {
    const { label, size, color, topics, weight } = attr;
    if (!acc[color]) {
      acc[color] = [{ id: node, label, size, degree: graph.degree(node), topics, weight }];
    } else {
      acc[color] = [...acc[color], { id: node, label, size, degree: graph.degree(node), topics, weight }].sort((a, b) => b.size - a.size);
    }
    return acc;
  }, {});
  const clustersKeys = Object.keys(communities)
    .sort((a, b) => communities[b].length - communities[a].length).slice(0, 6);
  return (
    <>
      <Container fluid className="fr-my-3w">
        <Row gutters>
          <Col n="12">
            <SigmaContainer
              style={{ height: '500px' }}
              graph={graph}
            >
              <GraphEvents onNodeClick={(event) => { setSelectedNode({ id: event.node, degree: graph.degree(event.node), ...graph.getNodeAttributes(event.node) }); }} />
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
                      {getThematicFromCluster(communities[selectedNode.color]).map((topic) => (
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
      <Title as="h3">6 main clusters</Title>
      <Container fluid className="fr-my-3w">
        <Row gutters>
          {clustersKeys.map((cluster) => (
            <Col key={cluster} n="4">
              <div className="fr-card fr-card--shadow">
                <p style={{ backgroundColor: cluster }}>
                  {cluster}
                </p>
                <div className="fr-card__body">
                  <Title as="h6">5 main topics</Title>
                  <ul>
                    {getThematicFromCluster(communities[cluster]).map((topic) => (
                      <li>
                        {topic.label} ({topic.publicationIds.length})
                      </li>
                    ))}
                  </ul>
                  <Title as="h6">10 main authors</Title>
                  {communities[cluster].slice(0, 10).map((node) => (
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
