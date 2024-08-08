/*import express from 'express';
import router from './routes/index';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json()); // Middleware to parse JSON request bodies

app.use(router); // Use routes defined in 'routes/index'

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;*/
import express from 'express';
import controllerRouting from './routes/index';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

controllerRouting(app);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
