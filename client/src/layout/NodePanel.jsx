import '@react-sigma/core/lib/react-sigma.min.css';
import { Badge, BadgeGroup, Col, Row, Text, Title } from '@dataesr/react-dsfr';
import { getThematicFromCluster } from '../utils/utils';

export default function NodePanel({ selectedNode, graph, communities }) {
    if (!selectedNode || !graph.hasNode(selectedNode.id)) return null

    return (
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
                    Last publication: {Math.max(...graph.getNodeAttribute(selectedNode.id, 'years'))}
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
    )
}