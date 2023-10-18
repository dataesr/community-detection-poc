import '@react-sigma/core/lib/react-sigma.min.css';
import { Container, Title, Col, Row, Badge, BadgeGroup } from '@dataesr/react-dsfr';
import { GetColorName } from 'hex-color-to-color-name';
import { fillAndSortCommunities } from '../utils/communityUtils';
import { COMMUNTIY_COLORS } from '../styles/colors';

export default function ClustersPanel({ graph, communities, publications, structures }) {
  if (!graph.order) return null;

  // Fill communities
  const filledCommunities = fillAndSortCommunities(communities, publications, structures, { communitiesLimit: 6, authorsLimit: 10, institutionsLimit: 5, topicsLimit: 5, typesLimit: 3 });
  console.log('filledCommunities', filledCommunities);

  return (
    <Container fluid className="fr-my-3w">
      <Title as="h3">
        {Object.keys(filledCommunities).length}
        {' '}
        main clusters
      </Title>
      <Row gutters>
        {Object.entries(filledCommunities).map(([key, community]) => (
          <Col key={key} n="4">
            <div className="fr-card fr-card--shadow">
              <p style={{ backgroundColor: COMMUNTIY_COLORS[key], color: '#f6f6f6' }}>
                &nbsp;&nbsp;Community
                {' '}
                {GetColorName(COMMUNTIY_COLORS[key])}
              </p>
              <div className="fr-card__body">
                <BadgeGroup className="fr-mb-2w">
                  <Badge colorFamily="green-emeraude" text={`${community.publications.length} publications`} />
                  <Badge colorFamily="green-bourgeon" text={`${community.nodes.length} authors`} />
                </BadgeGroup>
                <Title as="h6">
                  {community.topics.length}
                  {' '}
                  main topics
                </Title>
                <BadgeGroup className="fr-mb-2w">
                  {community.topics.map(([topic, count]) => (
                    <Badge type="info" text={`${topic} (${count})`} />
                  ))}
                </BadgeGroup>
                <Title as="h6">
                  {community.authors.length}
                  {' '}
                  main authors
                </Title>
                <BadgeGroup className="fr-mb-2w">
                  {community.authors.map((node) => (
                    <Badge
                      colorFamily="purple-glycine"
                      text={`${node.attributes.name} (${node.attributes.weight})`}
                    />
                  ))}
                </BadgeGroup>
                <Title as="h6">
                  {community.types.length}
                  {' '}
                  main types
                </Title>
                <BadgeGroup className="fr-mb-2w">
                  {community.types.map(([type, count]) => (
                    <Badge
                      colorFamily="yellow-tournesol"
                      text={`${type} (${count})`}
                    />
                  ))}
                </BadgeGroup>
                <Title as="h6">
                  {community.affiliations.length}
                  {' '}
                  main affiliations
                </Title>
                <BadgeGroup className="fr-mb-2w">
                  {community.affiliations.map(([structure, count]) => (
                    <Badge
                      colorFamily="pink-tuile"
                      text={`${structure} (${count})`}
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
