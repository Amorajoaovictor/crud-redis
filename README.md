# Redis Studio - CRUD Tool for Redis

A complete CRUD (Create, Read, Update, Delete) tool for Redis with a beautiful web interface similar to Prisma Studio. Manage your Redis data structures with ease through an intuitive visual interface.

## Features

- 🎨 **Beautiful UI** - Clean, modern interface inspired by Prisma Studio
- 🔍 **View All Keys** - Browse all Redis keys with their types and values
- ✏️ **Full CRUD Operations** - Create, read, update, and delete Redis keys
- 📊 **Multiple Data Types** - Support for all Redis data types:
  - Strings
  - Hashes
  - Lists
  - Sets
  - Sorted Sets
- 🔄 **Real-time Updates** - Live connection status monitoring
- 🔎 **Search & Filter** - Quickly find keys by name
- ⏱️ **TTL Management** - View and set key expiration times
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Prerequisites

- Node.js (v14 or higher)
- Redis server running locally or remotely

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Amorajoaovictor/crud-redis.git
cd crud-redis
```

2. Install dependencies:
```bash
npm install
```

3. Make sure Redis is running on your system:
```bash
# On Linux/macOS
redis-server

# Or using Docker
docker run -d -p 6379:6379 redis
```

## Usage

1. Start the application:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. The interface will connect to Redis and display all available keys.

## Configuration

You can configure the Redis connection using environment variables:

```bash
# Redis host (default: localhost)
export REDIS_HOST=localhost

# Redis port (default: 6379)
export REDIS_PORT=6379

# Redis password (if required)
export REDIS_PASSWORD=your_password

# Server port (default: 3000)
export PORT=3000
```

Or create a `.env` file:
```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
PORT=3000
```

## API Endpoints

The application provides a RESTful API for Redis operations:

### Get all keys
```
GET /api/keys
GET /api/keys?pattern=user:*
```

### Get specific key
```
GET /api/keys/:key
```

### Create new key
```
POST /api/keys
Content-Type: application/json

{
  "key": "mykey",
  "type": "string",
  "value": "myvalue",
  "ttl": -1
}
```

### Update key
```
PUT /api/keys/:key
Content-Type: application/json

{
  "value": "newvalue",
  "ttl": 3600
}
```

### Delete key
```
DELETE /api/keys/:key
```

### Health check
```
GET /api/health
```

## Data Type Examples

### String
```json
{
  "key": "user:name",
  "type": "string",
  "value": "John Doe"
}
```

### Hash
```json
{
  "key": "user:1",
  "type": "hash",
  "value": {
    "name": "John Doe",
    "email": "john@example.com",
    "age": "30"
  }
}
```

### List
```json
{
  "key": "tasks",
  "type": "list",
  "value": ["task1", "task2", "task3"]
}
```

### Set
```json
{
  "key": "tags",
  "type": "set",
  "value": ["redis", "database", "nosql"]
}
```

### Sorted Set
```json
{
  "key": "leaderboard",
  "type": "zset",
  "value": [
    {"member": "player1", "score": 100},
    {"member": "player2", "score": 200}
  ]
}
```

## Screenshots

The interface provides:
- A sidebar with all Redis keys organized by type
- A main panel showing key details with formatted values
- Easy-to-use forms for creating and editing keys
- Visual indicators for key types and TTL

## Development

The project structure:
```
crud-redis/
├── server.js          # Express server with API routes
├── public/
│   ├── index.html     # Main HTML file
│   ├── styles.css     # CSS styling
│   └── app.js         # Frontend JavaScript
├── package.json       # Node.js dependencies
└── README.md          # This file
```

## Technologies Used

- **Backend**: Node.js, Express, ioredis
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Database**: Redis

## Security Considerations

⚠️ **Important**: This tool is designed for development and internal use. Before deploying to production or exposing to the internet, consider implementing:

- **Rate Limiting**: Add rate limiting middleware (e.g., `express-rate-limit`) to prevent abuse
- **Authentication**: Implement authentication and authorization to protect access
- **HTTPS**: Use HTTPS in production to encrypt data in transit
- **Network Security**: Run Redis and the application in a secure network, not exposed to the public internet
- **Input Validation**: Additional validation for user inputs
- **CORS Configuration**: Configure CORS appropriately for your deployment environment

This tool provides direct access to your Redis database. Use appropriate security measures based on your deployment environment.

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Amorajoaovictor