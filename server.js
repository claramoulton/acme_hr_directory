const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_directory');
const express = require('express');
const app = express();
app.use(express.json());

app.get('/api/employees', async(req, res, next)=> {
    try {
        const SQL = `
            SELECT *
            FROM employees
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
        
    }
    catch(ex){
        next(ex);
    }
});

app.delete('/api/employees/:id', async(req, res, next)=> {
    try {
        const SQL = `
            DELETE FROM employees
            WHERE id = $1
        `;
        await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
        
    }
    catch(ex){
        next(ex);
    }
});

app.post('/api/employees', async(req, res, next)=> {
    try {
        const SQL = `
            INSERT INTO employees(txt, department_id)
            VALUES($1, $2)
            RETURNING *
        `;
        const response = await client.query(SQL, [req.body.txt, req.body.department_id]);
        res.status(201).send(response.rows[0]);
        
    }
    catch(ex){
        next(ex);
    }
});

app.put('/api/employees/:id', async(req, res, next)=> {
    try {
        const SQL = `
            UPDATE employees
            SET txt=$1, department_id=$2
            WHERE id = $3
            RETURNING *
        `;
        const response = await client.query(SQL, [req.body.txt, req.body.department_id, req.params.id]);
        res.send(response.rows[0]);
    }
    catch(ex){
        next(ex);
    }
});

app.get('/api/departments', async(req, res, next)=> {
    try {
        const SQL = `
            SELECT *
            FROM departments
        `;
        const response = await client.query(SQL);
        res.send(response.rows);
        
    }
    catch(ex){
        next(ex);
    }
});

app.use((err, req, res, next)=> {
    console.log(err);
    res.status(err.status || 500).send({error: err.message || err});
    
});

const init = async()=> {
    await client.connect();
    console.log('connected to database');
    let SQL = `
        DROP TABLE IF EXISTS employees;
        DROP TABLE IF EXISTS departments;
        CREATE TABLE departments(
            id SERIAL PRIMARY KEY,
            name VARCHAR(20)
        );
        CREATE TABLE employees(
            id SERIAL PRIMARY KEY,
            txt VARCHAR(200),
            ranking INTEGER DEFAULT 5,
            department_id INTEGER REFERENCES departments(id) NOT NULL
        );
    `;
    await client.query(SQL);
    console.log('tables created');
    SQL = `
        INSERT INTO departments(name) VALUES('leadership');
        INSERT INTO departments(name) VALUES('hr');
        INSERT INTO departments(name) VALUES('accounting');
        INSERT INTO employees(txt, department_id) VALUES('write some queries', (
            SELECT id FROM departments WHERE name = 'SQL'
        ));
        INSERT INTO employees(txt, department_id) VALUES('create a foreign key', (
            SELECT id FROM departments WHERE name = 'SQL'
        ));
        INSERT INTO employees(txt, department_id) VALUES('understanding primary keys', (
            SELECT id FROM departments WHERE name = 'SQL'
        ));
    `;
    await client.query(SQL);
    console.log('data seeded');
    const port = process.env.PORT || 3000;
    app.listen(port, ()=> {
    console.log(`listening on port ${port}`)
    console.log('some curl commands to test');
    console.log('curl localhost:8080/api/employees');
    console.log('curl localhost:8080/api/departments');
    console.log('curl localhost:8080/api/employees/1 -X DELETE');
    console.log(`curl localhost:8080/api/employees -X POST -d '{"txt": "nu employee", "department_id": 1}' -H 'Content-Type:application/json'`);
    console.log(`curl localhost:8080/api/employees/1 -X PUT -d '{"txt": "updated employee", "department_id": 1}' -H 'Content-Type:application/json'`);
    });
    
    
};

init();