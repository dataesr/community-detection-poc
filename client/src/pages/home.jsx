import { Button, Container, TextInput, Title } from '@dataesr/react-dsfr';
import { useState } from 'react';

import Graph from '../layout/Graph';
import TagInput from '../layout/TagInput';

export default function Home() {
  const [clicked, setClicked] = useState(false);
  const [clicked2, setClicked2] = useState(false);
  const [tags, setTags] = useState(['athlete']);
  const [idref, setIdref] = useState('048743216');

  return (
    <Container className="fr-my-15w">
      <Title as="h1">
        Community Detection POC
      </Title>
      <TagInput
        label="Keywords"
        hint='Validate you add by pressing "Return" key'
        tags={tags}
        onTagsChange={(_tags) => setTags(_tags)}
      />
      <Button
        onClick={() => setClicked(true)}
      >
        Generate graph
      </Button>
      <div className="fr-card fr-card--shadow">
        {clicked && <Graph tags={tags} />}
      </div>
      <TextInput
        label="Enter one or more idref"
        value={idref}
        onChange={(e) => setIdref(e.target.value)}
      />
      <Button onClick={() => setClicked2(true)}>
        Generate graph for an idref
      </Button>
      {clicked2 && <Graph idref={idref} />}
    </Container>
  );
}
