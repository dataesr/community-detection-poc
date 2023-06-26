import express from 'express';

import config from '../config';

const router = new express.Router();

router.route('/fetch')
  .get((req, res) => {
    const query = 'athlete';
    fetch(`${config.scanr.apiUrl}?q=${query}`, { method: 'POST', headers: { Authorization: config.scanr.apiToken } }).then((response) => {
      response.json().then((data) => {
        console.log(data);
        res.json({ hello: 'Bonjour doadify API' });
      });
    });
  });

export default router;
