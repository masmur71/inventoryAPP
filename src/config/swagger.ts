import type { Application, Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { OpenAPIV3 } from 'openapi-types';
import pkg from '../../package.json' with { type: 'json' };
const { version } = pkg;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Enterprise Inventory API Docs',
      version: version || '1.0.0',
      description: 'Dokumentasi lengkap untuk Backend Inventory System',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: [// Saat dev: baca src/**/*.ts
    './src/modules/**/*.routes.ts', 
    './src/modules/**/*.schema.ts',
    // Saat di Docker/Production: baca dist/**/*.js
    './dist/modules/**/*.routes.js',
    './dist/modules/**/*.schema.js'], 
};

const swaggerSpec: OpenAPIV3.Document = swaggerJsdoc(options) as OpenAPIV3.Document;


export const setupSwagger = (app: Application, port: number) => {
  // 1. Setup UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // 2. Setup JSON Endpoint
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // --- DEBUGGING (Cek Terminal) ---
  console.log('🔍 SWAGGER DEBUGGING:');
  const pathCount = Object.keys(swaggerSpec.paths || {}).length;
  console.log(`   - Jumlah Endpoint ditemukan: ${pathCount}`);
  
  if (pathCount === 0) {
    console.log('   ⚠️ WARNING: Tidak ada endpoint yang terdeteksi!');
    console.log('   - Cek apakah file routes ada isinya.');
    console.log('   - Cek apakah komentar @openapi ditulis dengan benar.');
  } else {
    console.log('   ✅ SUKSES: Endpoint terdeteksi.');
    // List endpoint yang ketemu
    Object.keys(swaggerSpec.paths).forEach(path => {
      console.log(`     -> ${path}`);
    });
  }

  console.log(`📄 Docs available at http://localhost:${port}/api-docs`);
};