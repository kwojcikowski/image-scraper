const express = require('express');
const cors = require('cors');
const mysql = require('mysql')

const SELECT_PRODUCTS = "SELECT * FROM product";
const SELECT_SECTIONS = "SELECT * FROM lidl_section";
const SELECT_CART = "SELECT cart.uid, cart.unit, cart.quantity, cart.productId, lidl_section.id AS sectionId, lidl_section.name AS sectionName, product.name AS productName FROM cart LEFT JOIN (lidl_section, product) ON cart.productId = product.id AND product.section = lidl_section.id;";

const app = express()
const connection = mysql.createConnection({
    host: 'anton.bounceme.net',
    user: 'databases',
    password: 'databases',
    database: 'shopping_list'
})
connection.connect(err => {
    if(err) {
        return err
    }
});

app.use(cors())

app.get('/', (req, res) => {
    res.send('Hello')
})

app.get('/products', (req, res) => {
    connection.query(SELECT_PRODUCTS, (err, results) => {
        if(err){
            return res.send(err)
        }else{
            return res.json(results)
        }
    })
})

app.get('/sections', (req, res) => {
    connection.query(SELECT_SECTIONS, (err, results) => {
        if(err){
            return res.send(err)
        }else{
            return res.json(results)
        }
    })
})

app.get('/cart', (req, res) => {
    connection.query(SELECT_CART, (err, results) => {
        if(err){
            return res.send(err)
        }else{
            return res.json(results)
        }
    })
})

app.get('/products/add', (req,res) => {
    const {name, default_unit, section} = req.query;
    const INSERT_PRODUCT = `INSERT INTO product(name, default_unit, section) 
    VALUES ('${name.replace('_', ' ')}', '${default_unit}', ${section});`
    connection.query(INSERT_PRODUCT, (err, results) => {
        if (err){
            return res.send(err)
        }else{
            return res.json({id: results.insertId, ...req.query});
        }
    })
    connection.commit()
})

app.get('/cart/add', (req,res) => {
    const {productId, unit, quantity} = req.query;
    const INSERT_PRODUCT = `INSERT INTO cart(productId, unit, quantity) 
    VALUES (${productId}, '${unit}', ${quantity});`
    connection.query(INSERT_PRODUCT, (err, results) => {
        if (err){
            return res.send(err)
        }else{
            return res.json(req.query);
        }
    })
    connection.commit();
})

app.get('/cart/update', (req,res) => {
    const {uid, productId, unit, quantity} = req.query;
    const UPDATE_PRODUCT = `UPDATE cart SET quantity=${quantity}, unit='${unit}', productId=${productId}
    WHERE uid=${uid};`
    connection.query(UPDATE_PRODUCT, (err, results) => {
        if (err){
            return res.send(err)
        }else{
            return res.json(req.query);
        }
    })
    connection.commit()
})

app.listen(4000, () => {
    console.log('Server listening on 4000')
})