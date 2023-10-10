
import '@react-sigma/core/lib/react-sigma.min.css';
import { Container, Title, Text, Col, Row, Badge, BadgeGroup } from '@dataesr/react-dsfr';
import { getThematicFromCluster } from '../utils/utils';
import { COMMUNTIY_COLORS } from '../styles/colors';
import { GetColorName } from 'hex-color-to-color-name';

export default function ClustersPanel({ clustersKeys, communities }) {
    if (!clustersKeys || !communities) return null

    return (
        <Container fluid className="fr-my-3w">
            <Title as="h3">{clustersKeys.length} main clusters</Title>
            <Row gutters>
                {clustersKeys.map((community) => (
                    <Col key={community} n="4">
                        <div className="fr-card fr-card--shadow">
                            <p style={{ backgroundColor: COMMUNTIY_COLORS[community] }}>
                                &nbsp;Community {GetColorName(COMMUNTIY_COLORS[community])}
                            </p>
                            <div className="fr-card__body">
                                <Title as="h6">5 main topics</Title>
                                <ul>
                                    {getThematicFromCluster(communities[community]).map((topic) => (
                                        <li key={topic.key} >
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
                                            <Badge colorFamily="purple-glycine" className="fr-ml-1w" text={`${node.weight} publications`} />
                                            <Badge className="fr-ml-1w" text={`${node.degree} co-author(s)`} />
                                        </BadgeGroup>
                                    </>
                                ))}
                            </div>
                        </div>
                    </Col>
                ))}
            </Row>
        </Container >
    )
}
