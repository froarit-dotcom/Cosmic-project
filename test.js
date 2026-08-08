const axios = require('axios');
axios.post('http://localhost:5000/api/locations', { name: 'Test Node', type: 'GODOWN' })
    .then(res => console.log('SUCCESS:', res.data))
    .catch(err => console.log('ERROR:', err.response?.data || err.message));
