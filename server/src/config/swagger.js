/**
 * OpenAPI 3.0 spec for the BookLeaf API, served as interactive docs at
 * GET /api/docs (Swagger UI). Hand-authored so every endpoint, auth rule,
 * request body and response is documented in one place.
 */
import { CATEGORIES, PRIORITIES, TICKET_STATUSES } from '../constants.js';

const bearer = [{ bearerAuth: [] }];

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'BookLeaf — Author Support & Communication Portal API',
    version: '1.0.0',
    description:
      'REST API for the BookLeaf support portal. JWT auth with role-based access ' +
      '(author vs admin). AI (classification, priority, draft replies) is handled ' +
      'server-side with a graceful rules-based fallback.',
  },
  servers: [{ url: '/api', description: 'API root' }],
  tags: [
    { name: 'Auth' },
    { name: 'Author', description: 'Author-only (role: author)' },
    { name: 'Admin', description: 'Ops team (role: admin)' },
    { name: 'Health' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: { message: { type: 'string' }, details: {} },
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'priya.sharma@email.com' },
          password: { type: 'string', example: 'Password123!' },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['author', 'admin'] },
          authorId: { type: 'string' },
          city: { type: 'string' },
        },
      },
      Book: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          bookId: { type: 'string' },
          title: { type: 'string' },
          isbn: { type: 'string' },
          genre: { type: 'string' },
          status: { type: 'string' },
          mrp: { type: 'number', nullable: true },
          totalCopiesSold: { type: 'number' },
          totalRoyaltyEarned: { type: 'number' },
          royaltyPaid: { type: 'number' },
          royaltyPending: { type: 'number' },
          lastRoyaltyPayoutDate: { type: 'string', nullable: true },
          availableOn: { type: 'array', items: { type: 'string' } },
        },
      },
      CreateTicketRequest: {
        type: 'object',
        required: ['subject', 'description'],
        properties: {
          subject: { type: 'string', example: 'No royalty for 6 months' },
          description: { type: 'string', example: "I haven't received any royalty..." },
          bookId: { type: 'string', nullable: true, description: 'Book _id, or null for General/Account' },
          attachmentName: { type: 'string', nullable: true },
        },
      },
      Ticket: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          ticketId: { type: 'string' },
          subject: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string', enum: [...CATEGORIES] },
          priority: { type: 'string', enum: [...PRIORITIES] },
          status: { type: 'string', enum: [...TICKET_STATUSES] },
          categoryOverridden: { type: 'boolean' },
          priorityOverridden: { type: 'boolean' },
          createdAt: { type: 'string' },
        },
      },
      UpdateTicketRequest: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: [...TICKET_STATUSES] },
          category: { type: 'string', enum: [...CATEGORIES] },
          priority: { type: 'string', enum: [...PRIORITIES] },
          assignToMe: { type: 'boolean' },
        },
      },
      ReplyRequest: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string' },
          isAiAssisted: { type: 'boolean' },
        },
      },
      NoteRequest: {
        type: 'object',
        required: ['text'],
        properties: { text: { type: 'string' } },
      },
      AiDraftResponse: {
        type: 'object',
        properties: {
          draft: { type: 'string' },
          model: { type: 'string', example: 'gemini-flash-latest' },
          error: { type: 'string', nullable: true },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: { tags: ['Health'], summary: 'Liveness check', responses: { 200: { description: 'OK' } } },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and receive a JWT',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: {
          200: { description: 'Token + user', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/me': {
      get: { tags: ['Auth'], summary: 'Current user', security: bearer, responses: { 200: { description: 'User', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } }, 401: { description: 'Unauthorized' } } },
    },
    '/books': {
      get: { tags: ['Author'], summary: "The author's books", security: bearer, responses: { 200: { description: 'Books', content: { 'application/json': { schema: { type: 'object', properties: { count: { type: 'number' }, books: { type: 'array', items: { $ref: '#/components/schemas/Book' } } } } } } }, 403: { description: 'Forbidden' } } },
    },
    '/tickets': {
      post: { tags: ['Author'], summary: 'Raise a support ticket (AI classifies it)', security: bearer, requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateTicketRequest' } } } }, responses: { 201: { description: 'Created ticket', content: { 'application/json': { schema: { type: 'object', properties: { ticket: { $ref: '#/components/schemas/Ticket' } } } } } }, 400: { description: 'Validation error' } } },
      get: { tags: ['Author'], summary: "The author's tickets", security: bearer, responses: { 200: { description: 'Tickets' } } },
    },
    '/tickets/{id}': {
      get: { tags: ['Author'], summary: 'One ticket + public messages', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Ticket' }, 404: { description: 'Not found' } } },
    },
    '/admin/tickets': {
      get: {
        tags: ['Admin'],
        summary: 'Ticket queue (urgent + oldest first)',
        security: bearer,
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: [...TICKET_STATUSES] } },
          { name: 'category', in: 'query', schema: { type: 'string', enum: [...CATEGORIES] } },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: [...PRIORITIES] } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'Tickets' }, 403: { description: 'Forbidden' } },
      },
    },
    '/admin/tickets/{id}': {
      get: { tags: ['Admin'], summary: 'Full ticket (incl. internal notes)', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Ticket' }, 404: { description: 'Not found' } } },
      patch: { tags: ['Admin'], summary: 'Update status / override category or priority / assign', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateTicketRequest' } } } }, responses: { 200: { description: 'Updated' }, 400: { description: 'Validation error' } } },
    },
    '/admin/tickets/{id}/messages': {
      post: { tags: ['Admin'], summary: 'Send a public reply to the author', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ReplyRequest' } } } }, responses: { 201: { description: 'Sent' } } },
    },
    '/admin/tickets/{id}/notes': {
      post: { tags: ['Admin'], summary: 'Add an internal note (hidden from author)', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/NoteRequest' } } } }, responses: { 201: { description: 'Added' } } },
    },
    '/admin/tickets/{id}/ai-draft': {
      post: { tags: ['Admin'], summary: 'Generate an AI draft reply', security: bearer, parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Draft', content: { 'application/json': { schema: { $ref: '#/components/schemas/AiDraftResponse' } } } } } },
    },
  },
};
