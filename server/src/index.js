import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { env, isProd } from './config/env.js';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/index.js';
import { openapiSpec } from './config/swagger.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initSockets } from './sockets/index.js';

// Connect to MongoDB
connectDB();

const app = express();

// Global middleware
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (!isProd) app.use(morgan('dev'));

// Root + interactive API docs (Swagger)
app.get('/', (req, res) =>
  res.json({ name: 'BookLeaf API', docs: '/api/docs', health: '/api/health' })
);
app.get('/api/docs.json', (req, res) => res.json(openapiSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
  customSiteTitle: 'BookLeaf API Docs',
}));

// API routes
app.use('/api', apiRoutes);

// 404 + central error handling (always last)
app.use(notFound);
app.use(errorHandler);

// Start the HTTP server. app.listen() returns the underlying http.Server,
// which Socket.IO attaches to for real-time ticket updates.
const server = app.listen(env.port, () =>
  console.log(`[server] listening on http://localhost:${env.port} (${env.nodeEnv})`)
);

initSockets(server);
