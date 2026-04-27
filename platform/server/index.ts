import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import diarioRoutes from './routes/diario';
import antigravityRoutes from './routes/antigravity';
import orcamentistaRoutes from './routes/orcamentista';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/antigravity', antigravityRoutes);
app.use('/api/diario', diarioRoutes);
app.use('/api/orcamentista', orcamentistaRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 Servidor EVIS AI rodando em http://localhost:${port}`);
});
