const express = require('express');
const Redis = require('ioredis');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Get all keys with their types and values
app.get('/api/keys', async (req, res) => {
  try {
    const pattern = req.query.pattern || '*';
    const keys = await redis.keys(pattern);
    
    const keysWithData = await Promise.all(
      keys.map(async (key) => {
        const type = await redis.type(key);
        const ttl = await redis.ttl(key);
        let value;
        
        switch (type) {
          case 'string':
            value = await redis.get(key);
            break;
          case 'list':
            value = await redis.lrange(key, 0, -1);
            break;
          case 'set':
            value = await redis.smembers(key);
            break;
          case 'zset':
            value = await redis.zrange(key, 0, -1, 'WITHSCORES');
            break;
          case 'hash':
            value = await redis.hgetall(key);
            break;
          default:
            value = null;
        }
        
        return { key, type, value, ttl };
      })
    );
    
    res.json(keysWithData);
  } catch (error) {
    console.error('Error fetching keys:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific key
app.get('/api/keys/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const exists = await redis.exists(key);
    
    if (!exists) {
      return res.status(404).json({ error: 'Key not found' });
    }
    
    const type = await redis.type(key);
    const ttl = await redis.ttl(key);
    let value;
    
    switch (type) {
      case 'string':
        value = await redis.get(key);
        break;
      case 'list':
        value = await redis.lrange(key, 0, -1);
        break;
      case 'set':
        value = await redis.smembers(key);
        break;
      case 'zset':
        value = await redis.zrange(key, 0, -1, 'WITHSCORES');
        break;
      case 'hash':
        value = await redis.hgetall(key);
        break;
      default:
        value = null;
    }
    
    res.json({ key, type, value, ttl });
  } catch (error) {
    console.error('Error fetching key:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new key
app.post('/api/keys', async (req, res) => {
  try {
    const { key, type, value, ttl } = req.body;
    
    if (!key || !type) {
      return res.status(400).json({ error: 'Key and type are required' });
    }
    
    const exists = await redis.exists(key);
    if (exists) {
      return res.status(409).json({ error: 'Key already exists' });
    }
    
    switch (type) {
      case 'string':
        if (ttl && ttl > 0) {
          await redis.setex(key, ttl, value || '');
        } else {
          await redis.set(key, value || '');
        }
        break;
      case 'list':
        if (Array.isArray(value) && value.length > 0) {
          await redis.rpush(key, ...value);
        }
        break;
      case 'set':
        if (Array.isArray(value) && value.length > 0) {
          await redis.sadd(key, ...value);
        }
        break;
      case 'zset':
        if (Array.isArray(value) && value.length > 0) {
          const args = value.flatMap(item => [item.score, item.member]);
          await redis.zadd(key, ...args);
        }
        break;
      case 'hash':
        if (value && typeof value === 'object') {
          await redis.hmset(key, value);
        }
        break;
      default:
        return res.status(400).json({ error: 'Invalid type' });
    }
    
    if (ttl && ttl > 0 && type !== 'string') {
      await redis.expire(key, ttl);
    }
    
    res.status(201).json({ message: 'Key created successfully', key });
  } catch (error) {
    console.error('Error creating key:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update an existing key
app.put('/api/keys/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, ttl } = req.body;
    
    const exists = await redis.exists(key);
    if (!exists) {
      return res.status(404).json({ error: 'Key not found' });
    }
    
    const type = await redis.type(key);
    
    switch (type) {
      case 'string':
        await redis.set(key, value || '');
        break;
      case 'list':
        await redis.del(key);
        if (Array.isArray(value) && value.length > 0) {
          await redis.rpush(key, ...value);
        }
        break;
      case 'set':
        await redis.del(key);
        if (Array.isArray(value) && value.length > 0) {
          await redis.sadd(key, ...value);
        }
        break;
      case 'zset':
        await redis.del(key);
        if (Array.isArray(value) && value.length > 0) {
          const args = value.flatMap(item => [item.score, item.member]);
          await redis.zadd(key, ...args);
        }
        break;
      case 'hash':
        await redis.del(key);
        if (value && typeof value === 'object') {
          await redis.hmset(key, value);
        }
        break;
      default:
        return res.status(400).json({ error: 'Invalid type' });
    }
    
    if (ttl && ttl > 0) {
      await redis.expire(key, ttl);
    } else if (ttl === -1) {
      await redis.persist(key);
    }
    
    res.json({ message: 'Key updated successfully', key });
  } catch (error) {
    console.error('Error updating key:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a key
app.delete('/api/keys/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await redis.del(key);
    
    if (result === 0) {
      return res.status(404).json({ error: 'Key not found' });
    }
    
    res.json({ message: 'Key deleted successfully', key });
  } catch (error) {
    console.error('Error deleting key:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete multiple keys
app.post('/api/keys/delete-multiple', async (req, res) => {
  try {
    const { keys } = req.body;
    
    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ error: 'Keys array is required' });
    }
    
    const result = await redis.del(...keys);
    res.json({ message: `${result} key(s) deleted successfully`, deletedCount: result });
  } catch (error) {
    console.error('Error deleting keys:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Redis info
app.get('/api/info', async (req, res) => {
  try {
    const info = await redis.info();
    const dbsize = await redis.dbsize();
    res.json({ info, dbsize });
  } catch (error) {
    console.error('Error fetching info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await redis.ping();
    res.json({ status: 'ok', redis: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', redis: 'disconnected', error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  redis.quit();
  process.exit(0);
});
