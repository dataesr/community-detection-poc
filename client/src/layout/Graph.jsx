import '@react-sigma/core/lib/react-sigma.min.css';
import { useState, useEffect } from 'react';
import { Badge, BadgeGroup, Col, Container, Row, Text, Title } from '@dataesr/react-dsfr';
import { SigmaContainer, useRegisterEvents } from '@react-sigma/core';
import { useQuery } from '@tanstack/react-query';
import { UndirectedGraph } from 'graphology';

const GraphEvents = ({ onNodeClick }) => {
  const registerEvents = useRegisterEvents();
  useEffect(() => {
    // Register the events
    registerEvents({
      // node events
      clickNode: (event) => onNodeClick(event),
    });
  }, [registerEvents]);
  return null;
};

async function getScanr({ query, type }) {
  return fetch(`/api/scanr?query=${query.join(',')}&type=${type}`).then((response) => {
    if (response.ok) return response.json();
    return "Oops... La requête à l'API n'a pas fonctionné";
  });
}

export default function Graph({ counter, query, type }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const { data, isLoading } = useQuery(
    [counter],
    () => getScanr({ query, type }),
    { staleTime: Infinity, cacheTime: Infinity },
  );
  if (isLoading) return <div>Loading data...</div>;
  const graph = UndirectedGraph.from(data);
  const communities = graph.reduceNodes((acc, node, attr) => {
    const { label, size, color } = attr;
    if (!acc[color]) {
      acc[color] = [{ id: node, label, size, degree: graph.degree(node) }];
    } else {
      acc[color] = [...acc[color], { id: node, label, size, degree: graph.degree(node) }].sort((a, b) => b.size - a.size);
    }
    return acc;
  }, {});
  const clustersKeys = Object.keys(communities).sort((a, b) => communities[b].length - communities[a].length).slice(0, 6);
  return (
    <>
      <Container fluid className="fr-my-3w">
        <Row gutters>
          <Col n={selectedNode ? "8" : "12"}>
            <SigmaContainer
              style={{ height: '500px' }}
              graph={graph}
            >
              <GraphEvents onNodeClick={(event) => setSelectedNode({ id: event.node, degree: graph.degree(event.node), ...graph.getNodeAttributes(event.node) })} />
            </SigmaContainer>
          </Col>
          <Col n={selectedNode ? "4" : "0"}>
            {selectedNode && (
              <div className="fr-card fr-card--shadow">
                <div className="fr-card__body">
                  <Text bold className="fr-mb-1v">
                    {selectedNode.label}
                  </Text>
                  <Text bold className="fr-mb-1v">
                    Cluster: {selectedNode.color}
                  </Text>
                  <BadgeGroup>
                    <Badge colorFamily="purple-glycine" className="fr-ml-1w" text={`${selectedNode.weight} publications`} />
                    {graph.getNodeAttribute(selectedNode.id, 'publications')?.map((publication) => (<p>{publication}</p>))}
                    <Badge className="fr-ml-1w" text={`${selectedNode.degree} co-autheurs`} />
                    {graph.mapNeighbors(selectedNode.id, (node, attr) => (<p>{attr.label}</p>))}
                    {graph.getNodeAttribute(selectedNode.id, 'keywords')?.map((keyword) => (<p>{keyword}</p>))}
                  </BadgeGroup>
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Container>
      <Title as="h3">Principaux clusters</Title>
      <Container fluid className="fr-my-3w">
        <Row gutters>
          {clustersKeys.map((cluster) => (
            <Col key={cluster} n="4">
              <div className="fr-card fr-card--shadow">
                <p style={{ backgroundColor: cluster }}>
                  {cluster}
                </p>
                <div className="fr-card__body">
                  {communities[cluster].slice(0, 10).map((node) => (
                    <>
                      <Text bold className="fr-mb-1v" key={node.id}>
                        {node.label}
                      </Text>
                      <BadgeGroup>
                        <Badge colorFamily="purple-glycine" className="fr-ml-1w" text={`${node.weight} publications`} />
                        <Badge className="fr-ml-1w" text={`${node.degree} co-autheurs`} />
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
