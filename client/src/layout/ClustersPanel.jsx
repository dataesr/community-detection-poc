import '@react-sigma/core/lib/react-sigma.min.css';
import { Container, Title, Text, Col, Row, Badge, BadgeGroup } from '@dataesr/react-dsfr';
import { GetColorName } from 'hex-color-to-color-name';
import { getThematicFromCluster } from '../utils/utils';
import { COMMUNTIY_COLORS } from '../styles/colors';

export default function ClustersPanel({ graph, data }) {
  if (!graph.order) return null;

  const communities = Object.groupBy(data.graph.nodes, ({ attributes }) => attributes.community);
  console.log('communities', communities);

  return (
    <Container fluid className="fr-my-3w">
      <Title as="h3">
        {Object.keys(communities).length}
        {' '}
        main clusters
      </Title>
      <Row gutters>
        {Object.keys(communities).map((community) => (
          <Col key={community} n="4">
            <div className="fr-card fr-card--shadow">
              <p style={{ backgroundColor: COMMUNTIY_COLORS[community], color: '#f6f6f6' }}>
                &nbsp;&nbsp;Community
                {' '}
                {GetColorName(COMMUNTIY_COLORS[community])}
              </p>
              <div className="fr-card__body">
                <Title as="h6">5 main topics</Title>
                <ul>
                  {Object.entries(getThematicFromCluster(communities[community], data)).map((entry) => (
                    <li key={entry[0]}>
                      {entry[0]}
                      {' '}
                      (
                      {entry[1]}
                      )
                    </li>
                  ))}
                </ul>
                <Title as="h6">
                  {Math.min(10, communities[community].length)}
                  {' '}
                  main authors
                </Title>
                {Object.values(communities[community]).map((node) => (
                  <>
                    <Text bold className="fr-mb-1v" key={node.key}>
                      {node.attributes.name}
                    </Text>
                    <BadgeGroup>
                      <Badge
                        colorFamily="purple-glycine"
                        className="fr-ml-1w"
                        text={`${node.attributes.weight} publications`}
                      />
                      <Badge className="fr-ml-1w" text={`${node.attributes.size} co-author(s)`} />
                    </BadgeGroup>
                  </>
                ))}
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
