const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const gis = require('g-i-s');
const GoogleImages = require('google-images');
const app = express()



app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
app.use(bodyParser.raw());


app.all('/search', (req,res) => {
	const {name} = req.body;
	gis(name, (error, results) => {
		res.send(results);
	});
})

app.get('/', (req, res) => {
    res.send('Hello')
})



app.listen(4000, () => {
    console.log('Server listening on 4000')
})