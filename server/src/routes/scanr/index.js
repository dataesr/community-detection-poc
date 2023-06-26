import express from 'express';
import { scanrToGraphology } from './scanr-to-graphology';
import config from '../../config';

const router = new express.Router();

router.route('/scanr')
  .get(async (req, res) => {
    const query = 'athlete';
    const data = await fetch(`${config.scanr.apiUrl}?q=${query}`, { method: 'POST', headers: { Authorization: config.scanr.apiToken } })
      .then((response) => response.json())
      .then(({ hits }) => hits?.hits?.map(({ _source }) => _source));
    const graph = scanrToGraphology(data);
    res.json(graph.export());
  });

export default router;
