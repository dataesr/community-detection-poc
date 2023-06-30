import '@react-sigma/core/lib/react-sigma.min.css';
import { useState, useEffect } from 'react';
import { Badge, BadgeGroup, Col, Container, Row, Text, Title } from '@dataesr/react-dsfr';
import {
  SigmaContainer, useRegisterEvents, ControlsContainer,
  ZoomControl,
  SearchControl,
  FullScreenControl,
  useSigma,
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
  }, [registerEvents]);
  return null;
}

const getThematicFromCluster = (cluster) => {
  const dict = {};
  cluster.forEach((node) => {
    node.wikis.forEach((wiki) => {
      const wikiId = wiki.toLowerCase();
      if (!(wikiId in dict)) dict[wikiId] = { id: wikiId, label: wiki, count: 0 };
      dict[wikiId].count += 1;
    });
  });
  return Object.values(dict).sort((a, b) => b.count - a.count).slice(0, 5);
};

export default function Graph({ data }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const graph = UndirectedGraph.from(data);
  const communities = graph.reduceNodes((acc, node, attr) => {
    const { label, size, color, wikis } = attr;
    if (!acc[color]) {
      acc[color] = [{ id: node, label, size, degree: graph.degree(node), wikis }];
    } else {
      acc[color] = [...acc[color], { id: node, label, size, degree: graph.degree(node), wikis }].sort((a, b) => b.size - a.size);
    }
    return acc;
  }, {});
  const clustersKeys = Object.keys(communities).sort((a, b) => communities[b].length - communities[a].length).slice(0, 6);
  return (
    <>
      <Container fluid className="fr-my-3w">
        <Row gutters>
          <Col n="12">
            <SigmaContainer
              style={{ height: '500px' }}
              graph={graph}
            >
              <GraphEvents onNodeClick={(event) => setSelectedNode({ id: event.node, degree: graph.degree(event.node), ...graph.getNodeAttributes(event.node) })} />
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
            {selectedNode && (
              <div className="fr-card fr-card--shadow">
                <div className="fr-my-2w fr-card__body">
                  <Title look="h6" as="p" className="fr-mb-1v">
                    {selectedNode.label}
                  </Title>
                  <Text bold className="fr-mb-1v">
                    Cluster:
                    {' '}
                    {selectedNode.color}
                  </Text>
                  <Text bold className="fr-mb-1v">
                    idRef:
                    {' '}
                    {selectedNode.id.split('idref')[1]}
                  </Text>
                  <Row gutters>
                    <Col n="4">
                      <BadgeGroup>
                        <Badge colorFamily="purple-glycine" className="fr-ml-1w" text={`${selectedNode.weight} publications`} />
                      </BadgeGroup>
                      {graph.getNodeAttribute(selectedNode.id, 'publications')?.map((publication) => (<p>{publication}</p>))}
                    </Col>
                    <Col n="4">
                      <BadgeGroup>
                        <Badge className="fr-ml-1w" text={`${selectedNode.degree} co-authors`} />
                      </BadgeGroup>
                      {graph.mapNeighbors(selectedNode.id, (node, attr) => (<p>{attr.label}</p>))}
                    </Col>
                    <Col n="4">
                      <BadgeGroup>
                        <Badge colorFamily="blue-cumulus" className="fr-ml-1w" text="Mot clés" />
                      </BadgeGroup>
                      {graph.getNodeAttribute(selectedNode.id, 'wikis')?.map((keyword) => (<p>{keyword}</p>))}
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
                    {getThematicFromCluster(communities[cluster]).map((wiki) => (
                      <li>
                        {wiki.label}
                        {' '}
                        (
                        {wiki.count}
                        )
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
