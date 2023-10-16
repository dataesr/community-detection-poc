import '@react-sigma/core/lib/react-sigma.min.css';
import { Container, Title, Text, Col, Row, Badge, BadgeGroup } from '@dataesr/react-dsfr';
import { GetColorName } from 'hex-color-to-color-name';
import {
  communityGetUniquePublications,
  communityGetTopicsCount,
  communityGetTypesCount,
  communityGetBestAuthors,
} from '../utils/communityUtils';
import { COMMUNTIY_COLORS } from '../styles/colors';

export default function ClustersPanel({ graph, communities, publications }) {
  if (!graph.order) return null;

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
                <Badge className="fr-mb-2w" colorFamily="green-emeraude" text={`${communityGetUniquePublications(communities[community]).length} publications`} />
                <Title as="h6">5 main topics</Title>
                <BadgeGroup className="fr-mb-2w">
                  {communityGetTopicsCount(communities[community], publications, 5).map((topic) => (
                    <Badge type="info" text={`${topic[0]} (${topic[1]})`} />
                  ))}
                </BadgeGroup>
                <Title as="h6">
                  {Math.min(10, communities[community].length)}
                  {' '}
                  main authors
                </Title>
                <BadgeGroup className="fr-mb-2w">
                  {communityGetBestAuthors(communities[community], 10).map((node) => (
                    <Badge
                      colorFamily="purple-glycine"
                      text={`${node.attributes.name} (${node.attributes.weight})`}
                    />
                  ))}
                </BadgeGroup>
                <Title as="h6">
                  {Math.min(3, communityGetTypesCount(communities[community], publications).length)}
                  {' '}
                  main types
                </Title>
                <BadgeGroup className="fr-mb-2w">
                  {communityGetTypesCount(communities[community], publications, 3).map((type) => (
                    <Badge
                      colorFamily="yellow-tournesol"
                      text={`${type[0]} (${type[1]})`}
                    />
                  ))}
                </BadgeGroup>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
