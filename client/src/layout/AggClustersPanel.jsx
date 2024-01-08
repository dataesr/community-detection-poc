import '@react-sigma/core/lib/react-sigma.min.css';
import { Container, SimpleTable } from '@dataesr/react-dsfr';
import { fillMainCommunities } from '../utils/communityAggUtils';

export default function AggClustersPanel({ graph, communities }) {
  if (!graph.order) return null;

  // Fill communities
  const filledCommunities = fillMainCommunities(communities, { domainsLimit: 5 });
  // console.log('filledCommunities', filledCommunities);

  // Sort communities
  const sortedCommunities = Object.entries(filledCommunities).sort((a, b) => b[1].Size - a[1].Size);

  // Fill table data
  const tableData = sortedCommunities.reduce((acc, [key, data]) => [...acc, data], []);

  return (
    <Container fluid className="fr-my-3w">
      <SimpleTable
        fixedLayout
        caption="Communities"
        data={tableData}
      />
    </Container>
  );
}
