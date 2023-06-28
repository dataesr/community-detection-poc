import { Button, Container, Title } from '@dataesr/react-dsfr';
import { useState } from 'react';

import Graph from '../layout/Graph';
import TagInput from '../layout/tag_input'

export default function Home() {
  const [clicked, setClicked] = useState(false);
  const [tags, setTags] = useState(['athlete']);

  return (
    <Container className="fr-my-15w">
      <Title as="h1">
        Community Detection POC
      </Title>
      
      <TagInput
        label="Thèmes"
        hint='Valider votre ajout avec la touche "Entrée"'
        tags={tags}
        onTagsChange={(tags) => setTags(tags)}
      />
    
      <Button
        onClick={() => setClicked(true)}
      >
        Generate graph
      </Button>
      {clicked && <Graph tags={tags} />}
    </Container>
  );
}
