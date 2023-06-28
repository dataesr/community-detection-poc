import { Button, Container, TextInput, Title } from '@dataesr/react-dsfr';
import { useState } from 'react';

import Graph from '../layout/Graph';
import TagInput from '../layout/TagInput';

export default function Home() {
  const [clicked, setClicked] = useState(false);
  const [clicked2, setClicked2] = useState(false);
  const [clicked3, setClicked3] = useState(false);
  const [idref, setIdref] = useState('048743216');
  const [structure, setStructure] = useState('199712586Y');
  const [tags, setTags] = useState(['athlete']);

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
      {clicked && <Graph tags={tags} />}
      <TextInput
        label="Enter one or more idref separated by space"
        value={idref}
        onChange={(e) => setIdref(e.target.value)}
      />
      <Button onClick={() => setClicked2(true)}>
        Generate graph for an idref
      </Button>
      {clicked2 && <Graph idref={idref} />}
      <TextInput
        label="Enter one or more institution id separated by space"
        value={structure}
        onChange={(e) => setStructure(e.target.value)}
      />
      <Button onClick={() => setClicked3(true)}>
        Generate graph for an institution id
      </Button>
      {clicked3 && <Graph structure={structure} />}
    </Container>
  );
}
