import { Button, Container, Title, TextInput} from '@dataesr/react-dsfr';
import { useState } from 'react';

import Graph from '../layout/Graph';
import TagInput from '../layout/tag_input'

export default function Home() {
  const [clicked, setClicked] = useState(false);
  const [clicked2, setClicked2] = useState(false);
  const [tags, setTags] = useState(['athlete']);
  const [idref, setIdref] = useState('');

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
      <div className='fr-card fr-card--shadow'>
        {clicked && <Graph tags={tags} />}
      </div>
      <Title as="h1">
        Community Detection POC
      </Title>
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
