import { Button, Container, Title } from '@dataesr/react-dsfr';
import { useState } from 'react';

import Graph from '../layout/Graph';
import TagInput from '../layout/TagInput';

export default function Home() {
  const [clicked, setClicked] = useState(false);
  const [clicked2, setClicked2] = useState(false);
  const [clicked3, setClicked3] = useState(false);
  const [idrefs, setIdrefs] = useState(['048743216']);
  const [structures, setStructures] = useState(['199712586Y']);
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
      <TagInput
        label="Idref"
        hint='Validate you add by pressing "Return" key'
        tags={idrefs}
        onTagsChange={(_tags) => setIdrefs(_tags)}
      />
      <Button onClick={() => setClicked2(true)}>
        Generate graph for an idref
      </Button>
      {clicked2 && <Graph idrefs={idrefs} />}
      <TagInput
        label="Institution id"
        hint='Validate you add by pressing "Return" key'
        tags={structures}
        onTagsChange={(_tags) => setStructures(_tags)}
      />
      <Button onClick={() => setClicked3(true)}>
        Generate graph for an institution id
      </Button>
      {clicked3 && <Graph structures={structures} />}
    </Container>
  );
}
